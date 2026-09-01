import React, { useState } from 'react';
import {
  Building2,
  CheckCircle2,
  ChevronDown,
  Cloud,
  CloudCheck,
  CloudOff,
  Coins,
  Eye,
  GraduationCap,
  Landmark,
  LogOut,
  Menu,
  RefreshCw,
  RotateCcw,
  Shield,
  ShieldCheck,
  User,
  UserCheck,
  Users,
  Wallet,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCLP } from '../utils/formatters';

interface HeaderProps {
  onOpenBankInfo: () => void;
  onOpenMobileMenu: () => void;
  onOpenCourseFee?: () => void;
  onOpenCourseTreasurers?: () => void;
  activeTab: 'cuotas' | 'gastos-deuda' | 'gastos' | 'resumen' | 'admin';
  setActiveTab: (tab: 'cuotas' | 'gastos-deuda' | 'gastos' | 'resumen' | 'admin') => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenBankInfo,
  onOpenMobileMenu,
  onOpenCourseFee,
  onOpenCourseTreasurers,
  activeTab,
  setActiveTab,
}) => {
  const {
    currentUser,
    logout,
    currentCourse,
    currentInstitution,
    currentRole,
    resetToSampleData,
    courseStudents,
    courseExpenses,
    isCloudSyncing,
    cloudSyncStatus,
    lastCloudSync,
    syncAllToCloud,
  } = useApp();

  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showSyncSuccessToast, setShowSyncSuccessToast] = useState(false);

  const handleManualSync = async () => {
    const ok = await syncAllToCloud();
    if (ok) {
      setShowSyncSuccessToast(true);
      setTimeout(() => setShowSyncSuccessToast(false), 3000);
    }
  };

  // Quick cash balance
  const totalCollected = courseStudents.reduce((acc, s) => {
    const records = Object.values(s.payments) as (typeof s.payments[keyof typeof s.payments])[];
    return (
      acc +
      records.reduce((sum, p) => (p && p.isPaid ? sum + (p.amount || 5000) : sum), 0)
    );
  }, 0);

  const totalSpent = courseExpenses.reduce((acc, e) => acc + e.amount, 0);
  const balance = totalCollected - totalSpent;

  return (
    <header
      id="main-topbar"
      className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 lg:px-8 shadow-xs shrink-0 sticky top-0 z-30"
    >
      {/* Left Area: Mobile Menu + Course Title */}
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger Menu Toggle */}
        <button
          id="btn-open-mobile-sidebar"
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          title="Abrir menú de navegación"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Current Active Context Title */}
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>{currentCourse?.name || 'Curso Escolar'}</span>
            </h1>
            <span className="bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-blue-200 hidden sm:inline-block">
              Año {currentCourse?.year || 2026}
            </span>
            {onOpenCourseFee && (
              <button
                id="header-btn-course-fee"
                type="button"
                onClick={onOpenCourseFee}
                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-md border border-emerald-200 hidden md:inline-flex items-center gap-1 transition-colors cursor-pointer"
                title="Configurar o ver valor de cuota del curso"
              >
                <Coins className="w-3 h-3 text-emerald-600" />
                <span>Cuota: {formatCLP(currentCourse?.monthlyFee || 5000)}</span>
              </button>
            )}
            {onOpenCourseTreasurers && (
              <button
                id="header-btn-course-treasurers"
                type="button"
                onClick={onOpenCourseTreasurers}
                className="bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-md border border-blue-200 hidden lg:inline-flex items-center gap-1 transition-colors cursor-pointer"
                title="Ver equipo de tesorería y agregar tesorero observador"
              >
                <Users className="w-3 h-3 text-blue-600" />
                <span>Tesoreros</span>
              </button>
            )}
          </div>
          <p className="text-xs text-slate-500 hidden sm:block truncate max-w-md">
            {currentInstitution?.name} ({currentInstitution?.city})
          </p>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Cloud Sync Status & Manual Save Button */}
        <div className="flex items-center">
          <button
            id="btn-header-cloud-sync"
            type="button"
            onClick={handleManualSync}
            disabled={isCloudSyncing}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
              cloudSyncStatus === 'synced'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                : cloudSyncStatus === 'syncing'
                ? 'bg-blue-50 text-blue-700 border-blue-200 animate-pulse'
                : cloudSyncStatus === 'error'
                ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
            }`}
            title={
              lastCloudSync
                ? `Guardado en la Nube (Último respaldo: ${lastCloudSync}). Haz clic para forzar guardado.`
                : 'Guardar datos en la Nube'
            }
          >
            {isCloudSyncing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
                <span className="hidden sm:inline">Guardando...</span>
              </>
            ) : cloudSyncStatus === 'synced' ? (
              <>
                <CloudCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">Guardado en Nube</span>
              </>
            ) : cloudSyncStatus === 'error' ? (
              <>
                <CloudOff className="w-3.5 h-3.5 text-rose-600" />
                <span className="hidden sm:inline">Reintentar Guardar</span>
              </>
            ) : (
              <>
                <Cloud className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">Guardar</span>
              </>
            )}
          </button>

          {/* Toast Notification on Manual Save Success */}
          {showSyncSuccessToast && (
            <div className="absolute top-16 right-6 bg-slate-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg border border-slate-800 flex items-center gap-2 z-50 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>¡Datos guardados exitosamente en la Nube!</span>
            </div>
          )}
        </div>

        {/* Read Only Mode Badge if applicable */}
        {currentUser?.isReadOnly && (
          <div className="hidden sm:flex items-center gap-1.5 bg-indigo-50 border border-indigo-200 text-indigo-800 px-2.5 py-1 rounded-lg text-xs font-semibold">
            <Eye className="w-3.5 h-3.5 text-indigo-600" />
            <span>Solo Lectura</span>
          </div>
        )}

        {/* Quick Balance Preview Chip */}
        <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-50 border border-slate-200 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs">
          <span className="text-slate-500 hidden sm:inline">Saldo en Caja:</span>
          <span
            className={`font-bold font-mono ${
              balance >= 0 ? 'text-blue-700' : 'text-rose-700'
            }`}
          >
            {formatCLP(balance)}
          </span>
        </div>

        {/* User Session Profile Badge & Logout */}
        <div className="relative">
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <div className="text-right hidden md:block">
              <div className="text-xs font-bold text-slate-900 leading-tight">
                {currentUser?.name || 'Usuario'}
              </div>
              <div className="text-[10px] text-slate-500 font-medium">
                {currentUser?.role === 'ADMIN_GENERAL' ? (
                  <span className="text-blue-700 font-bold">👑 Admin General</span>
                ) : (
                  <span className="text-emerald-700 font-semibold">🎓 Tesorero/a de Curso</span>
                )}
              </div>
            </div>

            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              {currentUser?.role === 'ADMIN_GENERAL'
                ? '👑'
                : currentUser?.avatar || currentUser?.name.substring(0, 2).toUpperCase() || 'AP'}
            </div>

            {/* Logout Button */}
            <button
              id="btn-header-logout"
              type="button"
              onClick={logout}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              title="Cerrar sesión e ir al Login"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Reset Demo Data Button */}
        <div className="relative">
          {showResetConfirm ? (
            <div className="flex items-center gap-1 bg-rose-50 border border-rose-200 p-1 rounded-lg">
              <span className="text-[11px] text-rose-800 px-1 font-medium">¿Reiniciar?</span>
              <button
                id="btn-confirm-reset"
                onClick={() => {
                  resetToSampleData();
                  setShowResetConfirm(false);
                }}
                className="bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-semibold px-2 py-0.5 rounded shadow-xs"
              >
                Sí
              </button>
              <button
                onClick={() => setShowResetConfirm(false)}
                className="bg-slate-200 text-slate-700 hover:bg-slate-300 text-[11px] px-1.5 py-0.5 rounded"
              >
                No
              </button>
            </div>
          ) : (
            <button
              id="btn-reset-demo"
              onClick={() => setShowResetConfirm(true)}
              className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              title="Restablecer datos de ejemplo"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
