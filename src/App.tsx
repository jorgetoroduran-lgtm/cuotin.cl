import React, { useEffect, useState } from 'react';
import { AdminPanel } from './components/AdminPanel';
import { BankInfoModal } from './components/BankInfoModal';
import { CourseFeeModal } from './components/CourseFeeModal';
import { CourseTreasurersModal } from './components/CourseTreasurersModal';
import { ExcelUploadModal } from './components/ExcelUploadModal';
import { ExpensesDebtDetail } from './components/ExpensesDebtDetail';
import { ExpensesManager } from './components/ExpensesManager';
import { FinancialSummary } from './components/FinancialSummary';
import { FirstLoginPasswordModal } from './components/FirstLoginPasswordModal';
import { Header } from './components/Header';
import { LoginScreen } from './components/LoginScreen';
import { PaymentMatrix } from './components/PaymentMatrix';
import { PaymentModal } from './components/PaymentModal';
import { Sidebar } from './components/Sidebar';
import { StudentFormModal } from './components/StudentFormModal';
import { StudentHistoryModal } from './components/StudentHistoryModal';
import { AppProvider, useApp } from './context/AppContext';
import { MonthKey, Student } from './types';

const MainAppContent: React.FC = () => {
  const { currentUser, isAuthenticated, currentRole, currentCourse, setCurrentCourseId } = useApp();

  const [activeTab, setActiveTab] = useState<'cuotas' | 'gastos-deuda' | 'gastos' | 'resumen' | 'admin'>('cuotas');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Modals state
  const [showBankInfoModal, setShowBankInfoModal] = useState(false);
  const [showCourseFeeModal, setShowCourseFeeModal] = useState(false);
  const [showCourseTreasurersModal, setShowCourseTreasurersModal] = useState(false);
  const [showExcelUploadModal, setShowExcelUploadModal] = useState(false);
  const [showStudentFormModal, setShowStudentFormModal] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);
  const [studentForHistory, setStudentForHistory] = useState<Student | null>(null);
  const [paymentModalState, setPaymentModalState] = useState<{
    student: Student;
    month: MonthKey;
  } | null>(null);

  // Auto-protect admin tab if logged in as course treasurer
  useEffect(() => {
    if (currentUser?.role === 'TESORERO_CURSO' && activeTab === 'admin') {
      setActiveTab('cuotas');
    }
  }, [currentUser, activeTab]);

  // If not logged in, render the Login Screen
  if (!isAuthenticated || !currentUser) {
    return <LoginScreen />;
  }

  const handleOpenAddStudent = () => {
    setStudentToEdit(null);
    setShowStudentFormModal(true);
  };

  const handleOpenEditStudent = (student: Student) => {
    setStudentToEdit(student);
    setShowStudentFormModal(true);
  };

  const handleOpenStudentHistory = (student: Student) => {
    setStudentForHistory(student);
  };

  const handleOpenPaymentModal = (student: Student, month: MonthKey) => {
    setPaymentModalState({ student, month });
  };

  const handleSelectCourseFromAdmin = (courseId: string) => {
    setCurrentCourseId(courseId);
    setActiveTab('cuotas');
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 text-slate-900 font-sans overflow-hidden antialiased">
      {/* Sidebar Navigation (Dark, Professional Theme) */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenBankInfo={() => setShowBankInfoModal(true)}
        onOpenCourseFee={() => setShowCourseFeeModal(true)}
        onOpenCourseTreasurers={() => setShowCourseTreasurersModal(true)}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main App Workspace */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header Bar */}
        <Header
          onOpenBankInfo={() => setShowBankInfoModal(true)}
          onOpenCourseFee={() => setShowCourseFeeModal(true)}
          onOpenCourseTreasurers={() => setShowCourseTreasurersModal(true)}
          onOpenMobileMenu={() => setIsMobileSidebarOpen(true)}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />

        {/* Scrollable Main Content Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto bg-slate-50 space-y-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {activeTab === 'cuotas' && (
              <PaymentMatrix
                onOpenExcelUpload={() => setShowExcelUploadModal(true)}
                onOpenAddStudent={handleOpenAddStudent}
                onOpenEditStudent={handleOpenEditStudent}
                onOpenStudentHistory={handleOpenStudentHistory}
                onOpenPaymentModal={handleOpenPaymentModal}
              />
            )}

            {activeTab === 'gastos-deuda' && <ExpensesDebtDetail />}

            {activeTab === 'gastos' && <ExpensesManager />}

            {activeTab === 'resumen' && <FinancialSummary />}

            {activeTab === 'admin' && currentUser.role === 'ADMIN_GENERAL' && (
              <AdminPanel onSelectCourseToManage={handleSelectCourseFromAdmin} />
            )}
          </div>
        </main>
      </div>

      {/* Mandatory First-Login Password Change Modal */}
      {currentUser.mustChangePassword && (
        <FirstLoginPasswordModal
          user={currentUser}
          onSuccess={() => {
            // Updated in context
          }}
        />
      )}

      {/* Global Modals */}
      {showBankInfoModal && (
        <BankInfoModal onClose={() => setShowBankInfoModal(false)} />
      )}

      {showCourseFeeModal && currentCourse && (
        <CourseFeeModal
          course={currentCourse}
          onClose={() => setShowCourseFeeModal(false)}
        />
      )}

      {showCourseTreasurersModal && currentCourse && (
        <CourseTreasurersModal
          course={currentCourse}
          onClose={() => setShowCourseTreasurersModal(false)}
        />
      )}

      {showExcelUploadModal && (
        <ExcelUploadModal onClose={() => setShowExcelUploadModal(false)} />
      )}

      {showStudentFormModal && (
        <StudentFormModal
          studentToEdit={studentToEdit}
          onClose={() => {
            setShowStudentFormModal(false);
            setStudentToEdit(null);
          }}
        />
      )}

      {studentForHistory && (
        <StudentHistoryModal
          student={studentForHistory}
          onClose={() => setStudentForHistory(null)}
          onOpenPaymentEdit={(s, m) => {
            setPaymentModalState({ student: s, month: m });
          }}
        />
      )}

      {paymentModalState && (
        <PaymentModal
          student={paymentModalState.student}
          month={paymentModalState.month}
          onClose={() => setPaymentModalState(null)}
        />
      )}
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}
