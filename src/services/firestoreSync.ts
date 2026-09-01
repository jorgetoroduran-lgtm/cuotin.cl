import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  writeBatch,
  onSnapshot,
} from 'firebase/firestore';
import { firestoreDb, testFirestoreConnection } from '../firebase';
import {
  AccessRequest,
  Course,
  CourseExpense,
  Institution,
  Student,
  UserAccount,
} from '../types';
import {
  INITIAL_ACCOUNTS,
  INITIAL_COURSES,
  INITIAL_EXPENSES,
  INITIAL_INSTITUTIONS,
  INITIAL_STUDENTS,
} from '../data/initialData';

// Firestore collection names
export const FS_COLLECTIONS = {
  INSTITUTIONS: 'institutions',
  COURSES: 'courses',
  STUDENTS: 'students',
  EXPENSES: 'expenses',
  ACCOUNTS: 'accounts',
  ACCESS_REQUESTS: 'accessRequests',
} as const;

// Helper to remove undefined properties before saving to Firestore
export function sanitizeForFirestore<T extends Record<string, any>>(obj: T): T {
  const clean: any = Array.isArray(obj) ? [] : {};
  for (const key of Object.keys(obj)) {
    const value = obj[key];
    if (value !== undefined) {
      if (value !== null && typeof value === 'object' && !(value instanceof Date)) {
        clean[key] = sanitizeForFirestore(value);
      } else {
        clean[key] = value;
      }
    }
  }
  return clean;
}

/**
 * Initializes Firestore with default seed data if collections are completely empty.
 */
export async function initializeFirestoreSeed(): Promise<void> {
  try {
    const coursesSnapshot = await getDocs(collection(firestoreDb, FS_COLLECTIONS.COURSES));
    if (!coursesSnapshot.empty) {
      return; // Already initialized
    }

    console.log('Seeding initial data into Firestore cloud database...');
    const batch = writeBatch(firestoreDb);

    // Institutions
    INITIAL_INSTITUTIONS.forEach((inst) => {
      batch.set(doc(firestoreDb, FS_COLLECTIONS.INSTITUTIONS, inst.id), sanitizeForFirestore(inst));
    });

    // Courses
    INITIAL_COURSES.forEach((course) => {
      batch.set(doc(firestoreDb, FS_COLLECTIONS.COURSES, course.id), sanitizeForFirestore(course));
    });

    // Students
    INITIAL_STUDENTS.forEach((student) => {
      batch.set(doc(firestoreDb, FS_COLLECTIONS.STUDENTS, student.id), sanitizeForFirestore(student));
    });

    // Expenses
    INITIAL_EXPENSES.forEach((exp) => {
      batch.set(doc(firestoreDb, FS_COLLECTIONS.EXPENSES, exp.id), sanitizeForFirestore(exp));
    });

    // Accounts
    INITIAL_ACCOUNTS.forEach((acc) => {
      batch.set(doc(firestoreDb, FS_COLLECTIONS.ACCOUNTS, acc.id), sanitizeForFirestore(acc));
    });

    await batch.commit();
    console.log('Firestore seed completed successfully.');
  } catch (error) {
    console.warn('Error during Firestore initial seed (will fallback to local):', error);
  }
}

/**
 * Loads all collections from Firestore.
 */
export async function fetchAllDataFromFirestore(): Promise<{
  institutions: Institution[];
  courses: Course[];
  students: Student[];
  expenses: CourseExpense[];
  accounts: UserAccount[];
  accessRequests: AccessRequest[];
}> {
  try {
    // Check connection first
    const isConnected = await testFirestoreConnection();
    if (!isConnected) {
      console.info('Firestore is operating in offline mode. Using local cache.');
    }

    const [instSnap, courseSnap, studentSnap, expenseSnap, accountSnap, reqSnap] = await Promise.all([
      getDocs(collection(firestoreDb, FS_COLLECTIONS.INSTITUTIONS)),
      getDocs(collection(firestoreDb, FS_COLLECTIONS.COURSES)),
      getDocs(collection(firestoreDb, FS_COLLECTIONS.STUDENTS)),
      getDocs(collection(firestoreDb, FS_COLLECTIONS.EXPENSES)),
      getDocs(collection(firestoreDb, FS_COLLECTIONS.ACCOUNTS)),
      getDocs(collection(firestoreDb, FS_COLLECTIONS.ACCESS_REQUESTS)),
    ]);

    // If courses is empty, run seed and re-fetch once
    if (courseSnap.empty) {
      await initializeFirestoreSeed();
      const [seededCourses, seededStudents, seededExpenses, seededAccounts, seededInst] = await Promise.all([
        getDocs(collection(firestoreDb, FS_COLLECTIONS.COURSES)),
        getDocs(collection(firestoreDb, FS_COLLECTIONS.STUDENTS)),
        getDocs(collection(firestoreDb, FS_COLLECTIONS.EXPENSES)),
        getDocs(collection(firestoreDb, FS_COLLECTIONS.ACCOUNTS)),
        getDocs(collection(firestoreDb, FS_COLLECTIONS.INSTITUTIONS)),
      ]);

      return {
        institutions: seededInst.docs.map((d) => d.data() as Institution),
        courses: seededCourses.docs.map((d) => d.data() as Course),
        students: seededStudents.docs.map((d) => d.data() as Student),
        expenses: seededExpenses.docs.map((d) => d.data() as CourseExpense),
        accounts: seededAccounts.docs.map((d) => d.data() as UserAccount),
        accessRequests: [],
      };
    }

    return {
      institutions: instSnap.docs.map((d) => d.data() as Institution),
      courses: courseSnap.docs.map((d) => d.data() as Course),
      students: studentSnap.docs.map((d) => d.data() as Student),
      expenses: expenseSnap.docs.map((d) => d.data() as CourseExpense),
      accounts: accountSnap.docs.map((d) => d.data() as UserAccount),
      accessRequests: reqSnap.docs.map((d) => d.data() as AccessRequest),
    };
  } catch (error) {
    console.warn('Unable to reach Firestore backend directly, app will operate with local storage cache:', error);
    throw error;
  }
}

// -------------------------------------------------------------
// Granular Firestore Mutation Operations (Fast & Resilient)
// -------------------------------------------------------------

export async function saveCourseToCloud(course: Course): Promise<void> {
  try {
    await setDoc(
      doc(firestoreDb, FS_COLLECTIONS.COURSES, course.id),
      sanitizeForFirestore(course),
      { merge: true }
    );
  } catch (error) {
    console.error(`Error saving course ${course.id} to Firestore:`, error);
  }
}

export async function deleteCourseFromCloud(courseId: string): Promise<void> {
  try {
    await deleteDoc(doc(firestoreDb, FS_COLLECTIONS.COURSES, courseId));
  } catch (error) {
    console.error(`Error deleting course ${courseId} from Firestore:`, error);
  }
}

export async function saveStudentToCloud(student: Student): Promise<void> {
  try {
    await setDoc(
      doc(firestoreDb, FS_COLLECTIONS.STUDENTS, student.id),
      sanitizeForFirestore(student),
      { merge: true }
    );
  } catch (error) {
    console.error(`Error saving student ${student.id} to Firestore:`, error);
  }
}

export async function deleteStudentFromCloud(studentId: string): Promise<void> {
  try {
    await deleteDoc(doc(firestoreDb, FS_COLLECTIONS.STUDENTS, studentId));
  } catch (error) {
    console.error(`Error deleting student ${studentId} from Firestore:`, error);
  }
}

export async function saveExpenseToCloud(expense: CourseExpense): Promise<void> {
  try {
    await setDoc(
      doc(firestoreDb, FS_COLLECTIONS.EXPENSES, expense.id),
      sanitizeForFirestore(expense),
      { merge: true }
    );
  } catch (error) {
    console.error(`Error saving expense ${expense.id} to Firestore:`, error);
  }
}

export async function deleteExpenseFromCloud(expenseId: string): Promise<void> {
  try {
    await deleteDoc(doc(firestoreDb, FS_COLLECTIONS.EXPENSES, expenseId));
  } catch (error) {
    console.error(`Error deleting expense ${expenseId} from Firestore:`, error);
  }
}

export async function saveInstitutionToCloud(inst: Institution): Promise<void> {
  try {
    await setDoc(
      doc(firestoreDb, FS_COLLECTIONS.INSTITUTIONS, inst.id),
      sanitizeForFirestore(inst),
      { merge: true }
    );
  } catch (error) {
    console.error(`Error saving institution ${inst.id} to Firestore:`, error);
  }
}

export async function saveAccountToCloud(account: UserAccount): Promise<void> {
  try {
    await setDoc(
      doc(firestoreDb, FS_COLLECTIONS.ACCOUNTS, account.id),
      sanitizeForFirestore(account),
      { merge: true }
    );
  } catch (error) {
    console.error(`Error saving account ${account.id} to Firestore:`, error);
  }
}

export async function deleteAccountFromCloud(accountId: string): Promise<void> {
  try {
    await deleteDoc(doc(firestoreDb, FS_COLLECTIONS.ACCOUNTS, accountId));
  } catch (error) {
    console.error(`Error deleting account ${accountId} from Firestore:`, error);
  }
}

export async function saveAccessRequestToCloud(req: AccessRequest): Promise<void> {
  try {
    await setDoc(
      doc(firestoreDb, FS_COLLECTIONS.ACCESS_REQUESTS, req.id),
      sanitizeForFirestore(req),
      { merge: true }
    );
  } catch (error) {
    console.error(`Error saving access request ${req.id} to Firestore:`, error);
  }
}

/**
 * Bulk save / push entire state to Firestore (useful for manual "Guardar Todo en la Nube" button)
 */
export async function syncAllToFirestore(data: {
  institutions: Institution[];
  courses: Course[];
  students: Student[];
  expenses: CourseExpense[];
  accounts: UserAccount[];
  accessRequests: AccessRequest[];
}): Promise<void> {
  const batch = writeBatch(firestoreDb);

  data.institutions.forEach((item) => {
    batch.set(doc(firestoreDb, FS_COLLECTIONS.INSTITUTIONS, item.id), sanitizeForFirestore(item), { merge: true });
  });

  data.courses.forEach((item) => {
    batch.set(doc(firestoreDb, FS_COLLECTIONS.COURSES, item.id), sanitizeForFirestore(item), { merge: true });
  });

  data.students.forEach((item) => {
    batch.set(doc(firestoreDb, FS_COLLECTIONS.STUDENTS, item.id), sanitizeForFirestore(item), { merge: true });
  });

  data.expenses.forEach((item) => {
    batch.set(doc(firestoreDb, FS_COLLECTIONS.EXPENSES, item.id), sanitizeForFirestore(item), { merge: true });
  });

  data.accounts.forEach((item) => {
    batch.set(doc(firestoreDb, FS_COLLECTIONS.ACCOUNTS, item.id), sanitizeForFirestore(item), { merge: true });
  });

  data.accessRequests.forEach((item) => {
    batch.set(doc(firestoreDb, FS_COLLECTIONS.ACCESS_REQUESTS, item.id), sanitizeForFirestore(item), { merge: true });
  });

  await batch.commit();
}
