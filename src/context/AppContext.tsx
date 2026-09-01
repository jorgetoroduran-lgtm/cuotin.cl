import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  INITIAL_ACCOUNTS,
  INITIAL_COURSES,
  INITIAL_EXPENSES,
  INITIAL_INSTITUTIONS,
  INITIAL_STUDENTS,
} from '../data/initialData';
import {
  AccessRequest,
  BankAccountDetails,
  Course,
  CourseExpense,
  ExpenseAbono,
  CourseTreasurer,
  Institution,
  MONTHS_LIST,
  MonthKey,
  PaymentMethod,
  PaymentRecord,
  Student,
  UserAccount,
  UserRole,
} from '../types';
import {
  deleteAccountFromCloud,
  deleteCourseFromCloud,
  deleteExpenseFromCloud,
  deleteStudentFromCloud,
  fetchAllDataFromFirestore,
  saveAccessRequestToCloud,
  saveAccountToCloud,
  saveCourseToCloud,
  saveExpenseToCloud,
  saveInstitutionToCloud,
  saveStudentToCloud,
  syncAllToFirestore,
} from '../services/firestoreSync';

export type CloudSyncStatus = 'synced' | 'syncing' | 'offline' | 'error';

interface AppContextType {
  // Cloud Database Sync
  isCloudSyncing: boolean;
  cloudSyncStatus: CloudSyncStatus;
  lastCloudSync: string | null;
  syncAllToCloud: () => Promise<boolean>;
  reloadFromCloud: () => Promise<boolean>;

  // Auth State
  currentUser: UserAccount | null;
  userAccounts: UserAccount[];
  isAuthenticated: boolean;
  login: (email: string, password?: string) => { success: boolean; message?: string; user?: UserAccount };
  loginAsUser: (account: UserAccount) => void;
  logout: () => void;
  addUserAccount: (account: Omit<UserAccount, 'id'>) => UserAccount;
  deleteUserAccount: (userId: string) => void;
  changeUserPassword: (userId: string, newPassword: string) => { success: boolean; message?: string };
  requestPasswordRecovery: (email: string) => { success: boolean; message: string; tempPassword?: string; user?: UserAccount };
  addReadOnlyTreasurer: (courseId: string, treasurerData: { fullName: string; email: string; phone?: string; rut?: string; initialPassword?: string }) => UserAccount;

  // Access Requests
  accessRequests: AccessRequest[];
  submitAccessRequest: (data: Omit<AccessRequest, 'id' | 'createdAt' | 'status'>) => AccessRequest;
  updateAccessRequestStatus: (id: string, status: 'PENDING' | 'APPROVED' | 'REJECTED', adminNotes?: string) => void;
  deleteAccessRequest: (id: string) => void;

  // Data State
  institutions: Institution[];
  courses: Course[];
  students: Student[];
  expenses: CourseExpense[];
  currentRole: UserRole;
  currentInstitutionId: string;
  currentCourseId: string;

  // Derived active items
  currentInstitution?: Institution;
  currentCourse?: Course;
  courseStudents: Student[];
  courseExpenses: CourseExpense[];

  // Role & Navigation
  setCurrentRole: (role: UserRole) => void;
  setCurrentInstitutionId: (id: string) => void;
  setCurrentCourseId: (id: string) => void;

  // Payments
  togglePayment: (studentId: string, month: MonthKey) => void;
  updatePaymentDetails: (
    studentId: string,
    month: MonthKey,
    details: {
      isPaid: boolean;
      amount?: number;
      paidAt?: string;
      paymentMethod?: PaymentMethod;
      receiptNumber?: string;
      notes?: string;
    }
  ) => void;
  batchPayStudent: (studentId: string, monthsToPay: MonthKey[]) => void;

  // Students
  addStudent: (studentData: Omit<Student, 'id' | 'createdAt' | 'payments'>) => void;
  updateStudent: (studentId: string, studentData: Partial<Student>) => void;
  deleteStudent: (studentId: string) => void;
  importStudentsBulk: (importedStudents: Array<{
    studentFullName: string;
    studentRut?: string;
    parentFullName: string;
    parentEmail?: string;
    parentPhone?: string;
    parentRut?: string;
    notes?: string;
  }>) => { count: number };

  // Expenses
  addExpense: (expenseData: Omit<CourseExpense, 'id'>) => void;
  updateExpense: (expenseId: string, expenseData: Partial<CourseExpense>) => void;
  deleteExpense: (expenseId: string) => void;
  addExpenseAbono: (
    expenseId: string,
    abono: {
      amount: number;
      date?: string;
      paymentMethod?: PaymentMethod;
      referenceNumber?: string;
      notes?: string;
    }
  ) => void;
  settleExpenseDebt: (
    expenseId: string,
    details?: {
      paymentMethod?: PaymentMethod;
      referenceNumber?: string;
      notes?: string;
      date?: string;
    }
  ) => void;

  // Admin: Institutions & Courses & Treasurers
  addInstitution: (data: Omit<Institution, 'id' | 'createdAt'>) => Institution;
  updateInstitution: (id: string, data: Partial<Institution>) => void;
  deleteInstitution: (id: string) => void;

  addCourse: (data: Omit<Course, 'id' | 'createdAt'>) => Course;
  updateCourse: (id: string, data: Partial<Course>) => void;
  deleteCourse: (id: string) => void;
  setCourseMonthlyFee: (courseId: string, feeAmount: number, configuredBy?: string) => void;
  assignTreasurerToCourse: (courseId: string, treasurer: Omit<CourseTreasurer, 'id' | 'courseId' | 'assignedAt' | 'isActive'>) => void;
  removeTreasurerFromCourse: (courseId: string) => void;
  updateBankInfo: (courseId: string, bankInfo: BankAccountDetails) => void;

  // Reset
  resetToSampleData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  INSTITUTIONS: 'cuotas_escolar_institutions_v1',
  COURSES: 'cuotas_escolar_courses_v1',
  STUDENTS: 'cuotas_escolar_students_v1',
  EXPENSES: 'cuotas_escolar_expenses_v1',
  ROLE: 'cuotas_escolar_role_v1',
  ACTIVE_COURSE: 'cuotas_escolar_active_course_v1',
  ACTIVE_INST: 'cuotas_escolar_active_inst_v1',
  CURRENT_USER: 'cuotas_escolar_current_user_v1',
  USER_ACCOUNTS: 'cuotas_escolar_accounts_v1',
  ACCESS_REQUESTS: 'cuotas_escolar_access_requests_v1',
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ACCESS_REQUESTS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [userAccounts, setUserAccounts] = useState<UserAccount[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USER_ACCOUNTS);
      return saved ? JSON.parse(saved) : INITIAL_ACCOUNTS;
    } catch {
      return INITIAL_ACCOUNTS;
    }
  });

  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    try {
      // Clear legacy localStorage login if present
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      const saved = sessionStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (saved) return JSON.parse(saved);
      return null;
    } catch {
      return null;
    }
  });

  const [institutions, setInstitutions] = useState<Institution[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.INSTITUTIONS);
      return saved ? JSON.parse(saved) : INITIAL_INSTITUTIONS;
    } catch {
      return INITIAL_INSTITUTIONS;
    }
  });

  const [courses, setCourses] = useState<Course[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.COURSES);
      return saved ? JSON.parse(saved) : INITIAL_COURSES;
    } catch {
      return INITIAL_COURSES;
    }
  });

  const [students, setStudents] = useState<Student[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.STUDENTS);
      return saved ? JSON.parse(saved) : INITIAL_STUDENTS;
    } catch {
      return INITIAL_STUDENTS;
    }
  });

  const [expenses, setExpenses] = useState<CourseExpense[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.EXPENSES);
      return saved ? JSON.parse(saved) : INITIAL_EXPENSES;
    } catch {
      return INITIAL_EXPENSES;
    }
  });

  const [currentRole, setCurrentRole] = useState<UserRole>(() => {
    try {
      if (currentUser) return currentUser.role;
      const saved = localStorage.getItem(STORAGE_KEYS.ROLE);
      return saved === 'ADMIN_GENERAL' ? 'ADMIN_GENERAL' : 'TESORERO_CURSO';
    } catch {
      return 'ADMIN_GENERAL';
    }
  });

  const [currentInstitutionId, setCurrentInstitutionId] = useState<string>(() => {
    try {
      if (currentUser?.assignedInstitutionId) return currentUser.assignedInstitutionId;
      const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_INST);
      return saved || (INITIAL_INSTITUTIONS[0]?.id ?? 'inst-1');
    } catch {
      return 'inst-1';
    }
  });

  const [currentCourseId, setCurrentCourseId] = useState<string>(() => {
    try {
      if (currentUser?.assignedCourseId) return currentUser.assignedCourseId;
      const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_COURSE);
      return saved || (INITIAL_COURSES[0]?.id ?? 'course-1');
    } catch {
      return 'course-1';
    }
  });

  // Cloud Sync State
  const [isCloudSyncing, setIsCloudSyncing] = useState<boolean>(false);
  const [cloudSyncStatus, setCloudSyncStatus] = useState<CloudSyncStatus>('syncing');
  const [lastCloudSync, setLastCloudSync] = useState<string | null>(null);

  // Initial Load from Firestore (on app mount)
  useEffect(() => {
    let isMounted = true;
    const loadFromCloud = async () => {
      try {
        setIsCloudSyncing(true);
        setCloudSyncStatus('syncing');
        const cloudData = await fetchAllDataFromFirestore();
        if (!isMounted) return;

        if (cloudData.courses && cloudData.courses.length > 0) {
          setCourses(cloudData.courses);
        }
        if (cloudData.students && cloudData.students.length > 0) {
          setStudents(cloudData.students);
        }
        if (cloudData.expenses && cloudData.expenses.length > 0) {
          setExpenses(cloudData.expenses);
        }
        if (cloudData.institutions && cloudData.institutions.length > 0) {
          setInstitutions(cloudData.institutions);
        }
        if (cloudData.accounts && cloudData.accounts.length > 0) {
          setUserAccounts(cloudData.accounts);
        }
        if (cloudData.accessRequests) {
          setAccessRequests(cloudData.accessRequests);
        }

        setCloudSyncStatus('synced');
        setLastCloudSync(new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      } catch (err) {
        console.warn('Error loading initial data from cloud, using local storage state:', err);
        if (isMounted) {
          setCloudSyncStatus('offline');
        }
      } finally {
        if (isMounted) {
          setIsCloudSyncing(false);
        }
      }
    };

    loadFromCloud();

    return () => {
      isMounted = false;
    };
  }, []);

  // Manual trigger to force reload fresh data from cloud
  const reloadFromCloud = useCallback(async (): Promise<boolean> => {
    setIsCloudSyncing(true);
    setCloudSyncStatus('syncing');
    try {
      const cloudData = await fetchAllDataFromFirestore();
      if (cloudData.courses && cloudData.courses.length > 0) {
        setCourses(cloudData.courses);
      }
      if (cloudData.students && cloudData.students.length > 0) {
        setStudents(cloudData.students);
      }
      if (cloudData.expenses && cloudData.expenses.length > 0) {
        setExpenses(cloudData.expenses);
      }
      if (cloudData.institutions && cloudData.institutions.length > 0) {
        setInstitutions(cloudData.institutions);
      }
      if (cloudData.accounts && cloudData.accounts.length > 0) {
        setUserAccounts(cloudData.accounts);
      }
      if (cloudData.accessRequests) {
        setAccessRequests(cloudData.accessRequests);
      }
      setCloudSyncStatus('synced');
      setLastCloudSync(new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      return true;
    } catch (error) {
      console.error('Error reloading from cloud:', error);
      setCloudSyncStatus('error');
      return false;
    } finally {
      setIsCloudSyncing(false);
    }
  }, []);

  // Manual trigger to save/push all current data to Firestore
  const syncAllToCloud = useCallback(async (): Promise<boolean> => {
    setIsCloudSyncing(true);
    setCloudSyncStatus('syncing');
    try {
      await syncAllToFirestore({
        institutions,
        courses,
        students,
        expenses,
        accounts: userAccounts,
        accessRequests,
      });
      setCloudSyncStatus('synced');
      setLastCloudSync(new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      return true;
    } catch (error) {
      console.error('Error syncing all to cloud:', error);
      setCloudSyncStatus('error');
      return false;
    } finally {
      setIsCloudSyncing(false);
    }
  }, [institutions, courses, students, expenses, userAccounts, accessRequests]);

  // Save changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.USER_ACCOUNTS, JSON.stringify(userAccounts));
    } catch (e) {
      console.warn('Storage save error', e);
    }
  }, [userAccounts]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ACCESS_REQUESTS, JSON.stringify(accessRequests));
    } catch (e) {
      console.warn('Storage save error', e);
    }
  }, [accessRequests]);

  useEffect(() => {
    try {
      if (currentUser) {
        sessionStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentUser));
      } else {
        sessionStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      }
    } catch (e) {
      console.warn('Storage save error', e);
    }
  }, [currentUser]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.INSTITUTIONS, JSON.stringify(institutions));
    } catch (e) {
      console.warn('Storage save error', e);
    }
  }, [institutions]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.COURSES, JSON.stringify(courses));
    } catch (e) {
      console.warn('Storage save error', e);
    }
  }, [courses]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
    } catch (e) {
      console.warn('Storage save error', e);
    }
  }, [students]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
    } catch (e) {
      console.warn('Storage save error', e);
    }
  }, [expenses]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ROLE, currentRole);
    } catch (e) {
      console.warn('Storage save error', e);
    }
  }, [currentRole]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_COURSE, currentCourseId);
    } catch (e) {
      console.warn('Storage save error', e);
    }
  }, [currentCourseId]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_INST, currentInstitutionId);
    } catch (e) {
      console.warn('Storage save error', e);
    }
  }, [currentInstitutionId]);

  // Auth Operations
  const login = (email: string, password?: string): { success: boolean; message?: string; user?: UserAccount } => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password ? password.trim() : '';

    // Direct super admin safeguard
    if (
      cleanEmail === 'admin@cuotaapp.cl' ||
      cleanEmail === 'admin@cuotin.cl' ||
      cleanEmail === 'admin' ||
      cleanEmail === 'superadmin'
    ) {
      const existingAdmin = userAccounts.find(
        (u) =>
          u.role === 'ADMIN_GENERAL' ||
          u.email.toLowerCase() === 'admin@cuotaapp.cl' ||
          u.email.toLowerCase() === 'admin@cuotin.cl'
      );

      const targetAdmin: UserAccount = existingAdmin || {
        id: 'user-admin',
        name: 'Administrador General del Sitio',
        email: cleanEmail.includes('@') ? cleanEmail : 'admin@cuotaapp.cl',
        password: 'admin',
        role: 'ADMIN_GENERAL',
        rut: '12.345.678-9',
        phone: '+56 9 8888 7777',
        avatar: '👑',
      };

      // If user typed wrong password and admin has a password set (other than default)
      if (cleanPassword && targetAdmin.password && targetAdmin.password !== 'admin' && targetAdmin.password !== cleanPassword) {
        return {
          success: false,
          message: 'Contraseña incorrecta para el Administrador General.',
        };
      }

      loginAsUser(targetAdmin);
      return { success: true, user: targetAdmin };
    }

    // Standard user search (by email or name)
    const foundUser = userAccounts.find(
      (u) =>
        u.email.toLowerCase() === cleanEmail ||
        (u.rut && u.rut.replace(/[^0-9kK]/g, '').toLowerCase() === cleanEmail.replace(/[^0-9kK]/g, '').toLowerCase())
    );

    if (!foundUser) {
      return {
        success: false,
        message: 'No existe una cuenta registrada con este correo electrónico o RUT.',
      };
    }

    if (cleanPassword && foundUser.password && foundUser.password !== cleanPassword) {
      return {
        success: false,
        message: 'Contraseña incorrecta. Revisa tus credenciales o utiliza la recuperación de clave.',
      };
    }

    loginAsUser(foundUser);
    return { success: true, user: foundUser };
  };

  const loginAsUser = (account: UserAccount) => {
    setCurrentUser(account);
    setCurrentRole(account.role);

    if (account.role === 'TESORERO_CURSO' && account.assignedCourseId) {
      setCurrentCourseId(account.assignedCourseId);
      const targetCourse = courses.find((c) => c.id === account.assignedCourseId);
      if (targetCourse) {
        setCurrentInstitutionId(targetCourse.institutionId);
      }
    } else if (account.role === 'ADMIN_GENERAL') {
      // Keep or default to first
      if (!courses.some((c) => c.id === currentCourseId)) {
        if (courses.length > 0) setCurrentCourseId(courses[0].id);
      }
    }
  };

  const logout = () => {
    try {
      sessionStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    } catch (e) {
      console.warn('Logout storage error', e);
    }
    setCurrentUser(null);
  };

  const addUserAccount = (accountData: Omit<UserAccount, 'id'>): UserAccount => {
    const newAcc: UserAccount = {
      ...accountData,
      id: `usr-${Date.now()}`,
    };
    setUserAccounts((prev) => [...prev, newAcc]);
    saveAccountToCloud(newAcc);
    return newAcc;
  };

  // Derived values
  const currentCourse = courses.find((c) => c.id === currentCourseId) || courses[0];
  const currentInstitution =
    institutions.find((i) => i.id === (currentCourse?.institutionId || currentInstitutionId)) ||
    institutions[0];

  const courseStudents = students.filter((s) => s.courseId === currentCourse?.id);
  const courseExpenses = expenses.filter((e) => e.courseId === currentCourse?.id);

  // Helper to initialize empty student payments
  const createFreshPayments = (monthlyFee = 5000): Record<MonthKey, PaymentRecord> => {
    const res = {} as Record<MonthKey, PaymentRecord>;
    MONTHS_LIST.forEach((m) => {
      res[m.key] = {
        month: m.key,
        isPaid: false,
        amount: monthlyFee,
      };
    });
    return res;
  };

  // Toggle payment for student + month
  const togglePayment = (studentId: string, month: MonthKey) => {
    const today = new Date().toISOString().split('T')[0];
    const registeredByName = currentUser?.name || currentCourse?.treasurer?.fullName || 'Tesorero/a del Curso';

    setStudents((prev) =>
      prev.map((student) => {
        if (student.id !== studentId) return student;

        const currentRec = student.payments[month] || {
          month,
          isPaid: false,
          amount: currentCourse?.monthlyFee || 5000,
        };

        const newIsPaid = !currentRec.isPaid;
        const updatedRecord: PaymentRecord = {
          ...currentRec,
          isPaid: newIsPaid,
          amount: currentRec.amount || currentCourse?.monthlyFee || 5000,
          paidAt: newIsPaid ? today : undefined,
          paymentMethod: newIsPaid ? (currentRec.paymentMethod || 'Transferencia') : undefined,
          registeredBy: newIsPaid ? registeredByName : undefined,
        };

        const updatedStudent: Student = {
          ...student,
          payments: {
            ...student.payments,
            [month]: updatedRecord,
          },
        };
        saveStudentToCloud(updatedStudent);
        return updatedStudent;
      })
    );
  };

  const updatePaymentDetails = (
    studentId: string,
    month: MonthKey,
    details: {
      isPaid: boolean;
      amount?: number;
      paidAt?: string;
      paymentMethod?: PaymentMethod;
      receiptNumber?: string;
      notes?: string;
    }
  ) => {
    const registeredByName = currentUser?.name || currentCourse?.treasurer?.fullName || 'Tesorero/a del Curso';

    setStudents((prev) =>
      prev.map((student) => {
        if (student.id !== studentId) return student;

        const existing = student.payments[month] || {
          month,
          isPaid: false,
          amount: currentCourse?.monthlyFee || 5000,
        };

        const updated: PaymentRecord = {
          ...existing,
          isPaid: details.isPaid,
          amount: details.amount !== undefined ? details.amount : existing.amount || 5000,
          paidAt: details.isPaid ? details.paidAt || new Date().toISOString().split('T')[0] : undefined,
          paymentMethod: details.isPaid ? details.paymentMethod || 'Transferencia' : undefined,
          receiptNumber: details.isPaid ? details.receiptNumber : undefined,
          registeredBy: details.isPaid ? registeredByName : undefined,
          notes: details.notes,
        };

        const updatedStudent: Student = {
          ...student,
          payments: {
            ...student.payments,
            [month]: updated,
          },
        };
        saveStudentToCloud(updatedStudent);
        return updatedStudent;
      })
    );
  };

  const batchPayStudent = (studentId: string, monthsToPay: MonthKey[]) => {
    const today = new Date().toISOString().split('T')[0];
    const registeredBy = currentUser?.name || currentCourse?.treasurer?.fullName || 'Tesorero/a del Curso';
    const amount = currentCourse?.monthlyFee || 5000;

    setStudents((prev) =>
      prev.map((student) => {
        if (student.id !== studentId) return student;

        const newPayments = { ...student.payments };
        monthsToPay.forEach((m) => {
          newPayments[m] = {
            month: m,
            isPaid: true,
            amount,
            paidAt: today,
            paymentMethod: 'Transferencia',
            registeredBy,
            notes: 'Pago registrado en lote',
          };
        });

        const updatedStudent: Student = {
          ...student,
          payments: newPayments,
        };
        saveStudentToCloud(updatedStudent);
        return updatedStudent;
      })
    );
  };

  // Student CRUD
  const addStudent = (studentData: Omit<Student, 'id' | 'createdAt' | 'payments'>) => {
    const newStudent: Student = {
      ...studentData,
      id: `std-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString().split('T')[0],
      payments: createFreshPayments(currentCourse?.monthlyFee || 5000),
    };
    setStudents((prev) => [...prev, newStudent]);
    saveStudentToCloud(newStudent);
  };

  const updateStudent = (studentId: string, studentData: Partial<Student>) => {
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id === studentId) {
          const updated = { ...s, ...studentData };
          saveStudentToCloud(updated);
          return updated;
        }
        return s;
      })
    );
  };

  const deleteStudent = (studentId: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== studentId));
    deleteStudentFromCloud(studentId);
  };

  const importStudentsBulk = (
    importedStudents: Array<{
      studentFullName: string;
      studentRut?: string;
      parentFullName: string;
      parentEmail?: string;
      parentPhone?: string;
      parentRut?: string;
      notes?: string;
    }>
  ) => {
    const activeCourseId = currentCourseId;
    const monthlyFee = currentCourse?.monthlyFee || 5000;
    const now = new Date().toISOString().split('T')[0];

    const newStudentList: Student[] = importedStudents.map((item, idx) => ({
      id: `std-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
      courseId: activeCourseId,
      studentFullName: item.studentFullName.trim(),
      studentRut: item.studentRut?.trim() || undefined,
      parentFullName: item.parentFullName.trim(),
      parentEmail: item.parentEmail?.trim() || undefined,
      parentPhone: item.parentPhone?.trim() || undefined,
      parentRut: item.parentRut?.trim() || undefined,
      notes: item.notes?.trim() || undefined,
      createdAt: now,
      payments: createFreshPayments(monthlyFee),
    }));

    setStudents((prev) => [...prev, ...newStudentList]);
    newStudentList.forEach((st) => saveStudentToCloud(st));
    return { count: newStudentList.length };
  };

  // Expenses CRUD with full "Con Deuda" support
  const addExpense = (expenseData: Omit<CourseExpense, 'id'>) => {
    const totalAmount = Number(expenseData.amount) || 0;
    const paidAmount =
      expenseData.paidAmount !== undefined
        ? Math.min(totalAmount, Math.max(0, Number(expenseData.paidAmount)))
        : totalAmount;
    const debtAmount =
      expenseData.debtAmount !== undefined
        ? Number(expenseData.debtAmount)
        : Math.max(0, totalAmount - paidAmount);

    let paymentStatus = expenseData.paymentStatus;
    if (!paymentStatus) {
      if (paidAmount >= totalAmount) {
        paymentStatus = 'PAGADO';
      } else if (paidAmount > 0) {
        paymentStatus = 'PARCIAL';
      } else {
        paymentStatus = 'CON_DEUDA';
      }
    }

    const today = new Date().toISOString().split('T')[0];
    const initialAbonos = expenseData.abonos || [];
    if (paidAmount > 0 && initialAbonos.length === 0) {
      initialAbonos.push({
        id: `abn-${Date.now()}-init`,
        date: expenseData.date || today,
        amount: paidAmount,
        paymentMethod: 'Transferencia',
        referenceNumber: expenseData.receiptNumber,
        notes: paidAmount === totalAmount ? 'Pago inicial total' : 'Abono / Pago inicial parcial',
        registeredBy: currentUser?.name || expenseData.registeredBy || 'Tesorero/a del Curso',
      });
    }

    const newExpense: CourseExpense = {
      ...expenseData,
      amount: totalAmount,
      paidAmount,
      debtAmount,
      paymentStatus,
      abonos: initialAbonos,
      settledDate: paymentStatus === 'PAGADO' ? expenseData.settledDate || expenseData.date || today : undefined,
      registeredBy: currentUser?.name || expenseData.registeredBy || 'Tesorero/a del Curso',
      id: `exp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    setExpenses((prev) => [newExpense, ...prev]);
    saveExpenseToCloud(newExpense);
  };

  const updateExpense = (expenseId: string, expenseData: Partial<CourseExpense>) => {
    setExpenses((prev) =>
      prev.map((e) => {
        if (e.id !== expenseId) return e;

        const totalAmount = expenseData.amount !== undefined ? Number(expenseData.amount) : e.amount;
        const currentPaid = expenseData.paidAmount !== undefined ? Number(expenseData.paidAmount) : (e.paidAmount !== undefined ? e.paidAmount : e.amount);
        const paidAmount = Math.min(totalAmount, Math.max(0, currentPaid));
        const debtAmount = Math.max(0, totalAmount - paidAmount);

        let paymentStatus = expenseData.paymentStatus;
        if (!paymentStatus) {
          if (paidAmount >= totalAmount) {
            paymentStatus = 'PAGADO';
          } else if (paidAmount > 0) {
            paymentStatus = 'PARCIAL';
          } else {
            paymentStatus = 'CON_DEUDA';
          }
        }

        const today = new Date().toISOString().split('T')[0];

        const updatedExpense: CourseExpense = {
          ...e,
          ...expenseData,
          amount: totalAmount,
          paidAmount,
          debtAmount,
          paymentStatus,
          settledDate: paymentStatus === 'PAGADO' ? (e.settledDate || today) : undefined,
        };
        saveExpenseToCloud(updatedExpense);
        return updatedExpense;
      })
    );
  };

  const deleteExpense = (expenseId: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== expenseId));
    deleteExpenseFromCloud(expenseId);
  };

  const addExpenseAbono = (
    expenseId: string,
    abonoData: {
      amount: number;
      date?: string;
      paymentMethod?: PaymentMethod;
      referenceNumber?: string;
      notes?: string;
    }
  ) => {
    const today = new Date().toISOString().split('T')[0];
    const registeredByName = currentUser?.name || currentCourse?.treasurer?.fullName || 'Tesorero/a del Curso';

    setExpenses((prev) =>
      prev.map((e) => {
        if (e.id !== expenseId) return e;

        const abonoAmount = Math.max(0, Number(abonoData.amount) || 0);
        if (abonoAmount <= 0) return e;

        const currentPaid = e.paidAmount !== undefined ? e.paidAmount : (e.paymentStatus === 'CON_DEUDA' ? 0 : e.amount);
        const newPaidAmount = Math.min(e.amount, currentPaid + abonoAmount);
        const newDebtAmount = Math.max(0, e.amount - newPaidAmount);
        const newPaymentStatus = newPaidAmount >= e.amount ? 'PAGADO' : 'PARCIAL';

        const newAbono: ExpenseAbono = {
          id: `abn-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          date: abonoData.date || today,
          amount: abonoAmount,
          paymentMethod: abonoData.paymentMethod || 'Transferencia',
          referenceNumber: abonoData.referenceNumber?.trim() || undefined,
          notes: abonoData.notes?.trim() || undefined,
          registeredBy: registeredByName,
        };

        const updatedExpense: CourseExpense = {
          ...e,
          paidAmount: newPaidAmount,
          debtAmount: newDebtAmount,
          paymentStatus: newPaymentStatus,
          settledDate: newPaymentStatus === 'PAGADO' ? today : undefined,
          abonos: [...(e.abonos || []), newAbono],
        };
        saveExpenseToCloud(updatedExpense);
        return updatedExpense;
      })
    );
  };

  const settleExpenseDebt = (
    expenseId: string,
    details?: {
      paymentMethod?: PaymentMethod;
      referenceNumber?: string;
      notes?: string;
      date?: string;
    }
  ) => {
    const today = new Date().toISOString().split('T')[0];
    const registeredByName = currentUser?.name || currentCourse?.treasurer?.fullName || 'Tesorero/a del Curso';

    setExpenses((prev) =>
      prev.map((e) => {
        if (e.id !== expenseId) return e;

        const currentPaid = e.paidAmount !== undefined ? e.paidAmount : 0;
        const remainingDebt = Math.max(0, e.amount - currentPaid);
        if (remainingDebt <= 0) return e;

        const settlementAbono: ExpenseAbono = {
          id: `abn-${Date.now()}-settle`,
          date: details?.date || today,
          amount: remainingDebt,
          paymentMethod: details?.paymentMethod || 'Transferencia',
          referenceNumber: details?.referenceNumber?.trim() || undefined,
          notes: details?.notes?.trim() || 'Liquidación total de deuda pendiente',
          registeredBy: registeredByName,
        };

        const updatedExpense: CourseExpense = {
          ...e,
          paidAmount: e.amount,
          debtAmount: 0,
          paymentStatus: 'PAGADO',
          settledDate: details?.date || today,
          abonos: [...(e.abonos || []), settlementAbono],
        };
        saveExpenseToCloud(updatedExpense);
        return updatedExpense;
      })
    );
  };

  // Institutions
  const addInstitution = (data: Omit<Institution, 'id' | 'createdAt'>): Institution => {
    const newInst: Institution = {
      ...data,
      id: `inst-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setInstitutions((prev) => [...prev, newInst]);
    saveInstitutionToCloud(newInst);
    return newInst;
  };

  const updateInstitution = (id: string, data: Partial<Institution>) => {
    setInstitutions((prev) =>
      prev.map((i) => {
        if (i.id === id) {
          const updated = { ...i, ...data };
          saveInstitutionToCloud(updated);
          return updated;
        }
        return i;
      })
    );
  };

  const deleteInstitution = (id: string) => {
    setInstitutions((prev) => prev.filter((i) => i.id !== id));
  };

  // Courses
  const addCourse = (data: Omit<Course, 'id' | 'createdAt'>): Course => {
    const newCourse: Course = {
      ...data,
      id: `course-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setCourses((prev) => [...prev, newCourse]);
    setCurrentCourseId(newCourse.id);
    saveCourseToCloud(newCourse);
    return newCourse;
  };

  const updateCourse = (id: string, data: Partial<Course>) => {
    setCourses((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const updated = { ...c, ...data };
          saveCourseToCloud(updated);
          return updated;
        }
        return c;
      })
    );
  };

  const deleteCourse = (id: string) => {
    setCourses((prev) => prev.filter((c) => c.id !== id));
    deleteCourseFromCloud(id);
    if (currentCourseId === id) {
      const remaining = courses.filter((c) => c.id !== id);
      if (remaining.length > 0) {
        setCurrentCourseId(remaining[0].id);
      }
    }
  };

  const setCourseMonthlyFee = (courseId: string, feeAmount: number, configuredBy?: string) => {
    const today = new Date().toISOString().split('T')[0];
    const actorName = configuredBy || currentUser?.name || 'Tesorera del Curso';

    // 1. Update the course definition
    setCourses((prev) =>
      prev.map((c) => {
        if (c.id === courseId) {
          const updatedCourse: Course = {
            ...c,
            monthlyFee: feeAmount,
            feeConfigured: true,
            feeConfiguredAt: today,
            feeConfiguredBy: actorName,
          };
          saveCourseToCloud(updatedCourse);
          return updatedCourse;
        }
        return c;
      })
    );

    // 2. Also update all unpaid student records in this course
    setStudents((prev) =>
      prev.map((s) => {
        if (s.courseId !== courseId) return s;

        const updatedPayments = { ...s.payments };
        let hasChanges = false;

        MONTHS_LIST.forEach((m) => {
          const rec = updatedPayments[m.key];
          if (rec && !rec.isPaid) {
            updatedPayments[m.key] = {
              ...rec,
              amount: feeAmount,
            };
            hasChanges = true;
          }
        });

        if (hasChanges) {
          const updatedStudent: Student = { ...s, payments: updatedPayments };
          saveStudentToCloud(updatedStudent);
          return updatedStudent;
        }
        return s;
      })
    );
  };

  const changeUserPassword = (userId: string, newPassword: string): { success: boolean; message?: string } => {
    if (!newPassword || newPassword.trim().length < 4) {
      return { success: false, message: 'La contraseña debe tener al menos 4 caracteres.' };
    }

    const trimmedPassword = newPassword.trim();

    setUserAccounts((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const updated: UserAccount = {
            ...u,
            password: trimmedPassword,
            mustChangePassword: false,
          };
          saveAccountToCloud(updated);
          return updated;
        }
        return u;
      })
    );

    if (currentUser?.id === userId) {
      setCurrentUser((prev) =>
        prev
          ? {
              ...prev,
              password: trimmedPassword,
              mustChangePassword: false,
            }
          : null
      );
    }

    return { success: true, message: 'Contraseña actualizada con éxito.' };
  };

  const requestPasswordRecovery = (
    email: string
  ): { success: boolean; message: string; tempPassword?: string; user?: UserAccount } => {
    const cleanEmail = email.trim().toLowerCase();
    const foundUser = userAccounts.find((u) => u.email.toLowerCase() === cleanEmail);

    if (!foundUser) {
      return {
        success: false,
        message: 'No existe una cuenta registrada con el correo ingresado.',
      };
    }

    // Generate clean 6-character temp password
    const randomCode = Math.floor(100000 + Math.random() * 900000).toString();
    const tempPassword = `CUOTA-${randomCode}`;

    setUserAccounts((prev) =>
      prev.map((u) => {
        if (u.id === foundUser.id) {
          const updated: UserAccount = {
            ...u,
            password: tempPassword,
            mustChangePassword: true,
          };
          saveAccountToCloud(updated);
          return updated;
        }
        return u;
      })
    );

    return {
      success: true,
      message: `Hemos enviado las instrucciones y clave temporal a ${cleanEmail}.`,
      tempPassword,
      user: foundUser,
    };
  };

  const addReadOnlyTreasurer = (
    courseId: string,
    treasurerData: {
      fullName: string;
      email: string;
      phone?: string;
      rut?: string;
      initialPassword?: string;
    }
  ): UserAccount => {
    const targetCourse = courses.find((c) => c.id === courseId);
    const instId = targetCourse?.institutionId || currentInstitutionId;
    const initialPwd = treasurerData.initialPassword?.trim() || Math.floor(100000 + Math.random() * 900000).toString();

    const newAcc: UserAccount = {
      id: `usr-reader-${Date.now()}`,
      name: treasurerData.fullName.trim(),
      email: treasurerData.email.trim(),
      password: initialPwd,
      role: 'TESORERO_CURSO',
      isReadOnly: true,
      mustChangePassword: true,
      rut: treasurerData.rut?.trim(),
      phone: treasurerData.phone?.trim(),
      assignedCourseId: courseId,
      assignedInstitutionId: instId,
      avatar: treasurerData.fullName.substring(0, 2).toUpperCase(),
      createdAt: new Date().toISOString(),
    };

    setUserAccounts((prev) => [...prev, newAcc]);
    saveAccountToCloud(newAcc);
    return newAcc;
  };

  const assignTreasurerToCourse = (
    courseId: string,
    treasurerData: Omit<CourseTreasurer, 'id' | 'courseId' | 'assignedAt' | 'isActive'> & {
      initialPassword?: string;
      mustChangePassword?: boolean;
    }
  ) => {
    const treasurer: CourseTreasurer = {
      fullName: treasurerData.fullName,
      email: treasurerData.email,
      phone: treasurerData.phone,
      rut: treasurerData.rut,
      id: `tres-${Date.now()}`,
      courseId,
      assignedAt: new Date().toISOString().split('T')[0],
      isActive: true,
    };

    setCourses((prev) =>
      prev.map((c) => {
        if (c.id === courseId) {
          const updatedCourse: Course = { ...c, treasurer };
          saveCourseToCloud(updatedCourse);
          return updatedCourse;
        }
        return c;
      })
    );

    // Also create or update a UserAccount for this treasurer so they can log in
    const targetCourse = courses.find((c) => c.id === courseId);
    const instId = targetCourse?.institutionId || currentInstitutionId;
    const initialPwd = treasurerData.initialPassword?.trim() || '123456';
    const requireChange = treasurerData.mustChangePassword ?? true;

    setUserAccounts((prev) => {
      const existingIdx = prev.findIndex(
        (u) => u.email.toLowerCase() === treasurerData.email.toLowerCase() || u.assignedCourseId === courseId
      );

      const updatedAccount: UserAccount = {
        id: existingIdx >= 0 ? prev[existingIdx].id : `usr-${Date.now()}`,
        name: treasurerData.fullName,
        email: treasurerData.email,
        password: initialPwd,
        role: 'TESORERO_CURSO',
        rut: treasurerData.rut,
        phone: treasurerData.phone,
        assignedCourseId: courseId,
        assignedInstitutionId: instId,
        avatar: treasurerData.fullName.substring(0, 2).toUpperCase(),
        mustChangePassword: requireChange,
        isReadOnly: false,
      };

      saveAccountToCloud(updatedAccount);

      if (existingIdx >= 0) {
        const copy = [...prev];
        copy[existingIdx] = updatedAccount;
        return copy;
      } else {
        return [...prev, updatedAccount];
      }
    });
  };

  const removeTreasurerFromCourse = (courseId: string) => {
    setCourses((prev) =>
      prev.map((c) => {
        if (c.id === courseId) {
          const updated = { ...c, treasurer: undefined };
          saveCourseToCloud(updated);
          return updated;
        }
        return c;
      })
    );

    setUserAccounts((prev) =>
      prev.filter((u) => {
        if (u.role === 'TESORERO_CURSO' && u.assignedCourseId === courseId) {
          deleteAccountFromCloud(u.id);
          return false;
        }
        return true;
      })
    );

    if (currentUser?.role === 'TESORERO_CURSO' && currentUser?.assignedCourseId === courseId) {
      const adminUser = userAccounts.find((u) => u.role === 'ADMIN_GENERAL') || null;
      setCurrentUser(adminUser);
      if (adminUser) setCurrentRole(adminUser.role);
    }
  };

  const deleteUserAccount = (userId: string) => {
    const userToDelete = userAccounts.find((u) => u.id === userId);

    setUserAccounts((prev) => prev.filter((u) => u.id !== userId));
    deleteAccountFromCloud(userId);

    if (userToDelete?.assignedCourseId) {
      setCourses((prev) =>
        prev.map((c) => {
          if (c.id === userToDelete.assignedCourseId || (userToDelete.email && c.treasurer?.email.toLowerCase() === userToDelete.email.toLowerCase())) {
            const updated = { ...c, treasurer: undefined };
            saveCourseToCloud(updated);
            return updated;
          }
          return c;
        })
      );
    } else if (userToDelete?.email) {
      setCourses((prev) =>
        prev.map((c) => {
          if (c.treasurer?.email.toLowerCase() === userToDelete.email.toLowerCase()) {
            const updated = { ...c, treasurer: undefined };
            saveCourseToCloud(updated);
            return updated;
          }
          return c;
        })
      );
    }

    if (currentUser?.id === userId) {
      const remainingAdmin = userAccounts.find((u) => u.id !== userId && u.role === 'ADMIN_GENERAL') || null;
      setCurrentUser(remainingAdmin);
      if (remainingAdmin) setCurrentRole(remainingAdmin.role);
    }
  };

  const updateBankInfo = (courseId: string, bankInfo: BankAccountDetails) => {
    setCourses((prev) =>
      prev.map((c) => {
        if (c.id === courseId) {
          const updated = { ...c, bankInfo };
          saveCourseToCloud(updated);
          return updated;
        }
        return c;
      })
    );
  };

  // Access Requests management
  const submitAccessRequest = (data: Omit<AccessRequest, 'id' | 'createdAt' | 'status'>): AccessRequest => {
    const newReq: AccessRequest = {
      ...data,
      id: `req-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
      status: 'PENDING',
    };
    setAccessRequests((prev) => [newReq, ...prev]);
    saveAccessRequestToCloud(newReq);
    return newReq;
  };

  const updateAccessRequestStatus = (
    id: string,
    status: 'PENDING' | 'APPROVED' | 'REJECTED',
    adminNotes?: string
  ) => {
    setAccessRequests((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const updated = { ...r, status, adminNotes: adminNotes ?? r.adminNotes };
          saveAccessRequestToCloud(updated);
          return updated;
        }
        return r;
      })
    );
  };

  const deleteAccessRequest = (id: string) => {
    setAccessRequests((prev) => prev.filter((r) => r.id !== id));
  };

  const resetToSampleData = () => {
    setInstitutions(INITIAL_INSTITUTIONS);
    setCourses(INITIAL_COURSES);
    setStudents(INITIAL_STUDENTS);
    setExpenses(INITIAL_EXPENSES);
    setUserAccounts(INITIAL_ACCOUNTS);
    setAccessRequests([]);
    setCurrentUser(INITIAL_ACCOUNTS[0]);
    setCurrentInstitutionId('inst-1');
    setCurrentCourseId('course-1');
    setCurrentRole('ADMIN_GENERAL');
    localStorage.clear();
    syncAllToFirestore({
      institutions: INITIAL_INSTITUTIONS,
      courses: INITIAL_COURSES,
      students: INITIAL_STUDENTS,
      expenses: INITIAL_EXPENSES,
      accounts: INITIAL_ACCOUNTS,
      accessRequests: [],
    }).catch(console.warn);
  };

  return (
    <AppContext.Provider
      value={{
        isCloudSyncing,
        cloudSyncStatus,
        lastCloudSync,
        syncAllToCloud,
        reloadFromCloud,
        currentUser,
        userAccounts,
        isAuthenticated: !!currentUser,
        login,
        loginAsUser,
        logout,
        addUserAccount,
        deleteUserAccount,
        changeUserPassword,
        requestPasswordRecovery,
        addReadOnlyTreasurer,
        accessRequests,
        submitAccessRequest,
        updateAccessRequestStatus,
        deleteAccessRequest,
        institutions,
        courses,
        students,
        expenses,
        currentRole,
        currentInstitutionId,
        currentCourseId,
        currentInstitution,
        currentCourse,
        courseStudents,
        courseExpenses,
        setCurrentRole,
        setCurrentInstitutionId,
        setCurrentCourseId,
        togglePayment,
        updatePaymentDetails,
        batchPayStudent,
        addStudent,
        updateStudent,
        deleteStudent,
        importStudentsBulk,
        addExpense,
        updateExpense,
        deleteExpense,
        addExpenseAbono,
        settleExpenseDebt,
        addInstitution,
        updateInstitution,
        deleteInstitution,
        addCourse,
        updateCourse,
        deleteCourse,
        setCourseMonthlyFee,
        assignTreasurerToCourse,
        removeTreasurerFromCourse,
        updateBankInfo,
        resetToSampleData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
