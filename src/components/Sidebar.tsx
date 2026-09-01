import React from 'react';
import {
  Building2,
  Calendar,
  CheckCircle2,
  Coins,
  Eye,
  FileSpreadsheet,
  GraduationCap,
  HandCoins,
  Landmark,
  Layers,
  LayoutDashboard,
  Lock,
  LogOut,
  MessageCircle,
  Receipt,
  RotateCcw,
  Shield,
  ShieldCheck,
  UserCheck,
  UserPlus,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCLP } from '../utils/formatters';

interface SidebarProps {
  activeTab: 'cuotas' | 'gastos-deuda' | 'gastos' | 'resumen' | 'admin';
  setActiveTab: (tab: 'cuotas' | 'gastos-deuda' | 'gastos' | 'resumen' | 'admin') => void;
  onOpenBankInfo: () => void;
  onOpenCourseFee: () => void;
  onOpenCourseTreasurers: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  onOpenBankInfo,
  onOpenCourseFee,
  onOpenCourseTreasurers,
  isOpenMobile,
  onCloseMobile,
}) => {
  const {
    currentUser,
    logout,
    institutions,
    courses,
    currentCourseId,
    setCurrentCourseId,
    currentInstitutionId,
    setCurrentInstitutionId,
    currentCourse,
    currentInstitution,
    currentRole,
    courseStudents,
    courseExpenses,
  } = useApp();

  const isTreasurer = currentUser?.role === 'TESORERO_CURSO';
  const isAdminGeneral = currentUser?.role === 'ADMIN_GENERAL';

  const availableCourses = courses.filter(
    (c) => c.institutionId === currentInstitutionId
  );

  const handleTabClick = (tab: 'cuotas' | 'gastos-deuda' | 'gastos' | 'resumen' | 'admin') => {
    setActiveTab(tab);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        id="app-sidebar"
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 border-r border-slate-800 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white shadow-md shadow-blue-900/30">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-bold text-white tracking-tight">
                  Cuotin
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider bg-blue-500/20 text-blue-300 px-1.5 py-0.2 rounded border border-blue-500/30">
                  CLP
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                Tesorería Digital para Instituciones
              </p>
            </div>
          </div>

          {/* Close button on mobile */}
          <button
            onClick={onCloseMobile}
            className="lg:hidden text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Institution & Course Selector Widget */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-950/40 space-y-2.5">
          {isTreasurer ? (
            /* Locked View for Course Treasurer */
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3 space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                <span className="flex items-center gap-1">
                  <GraduationCap className="w-3.5 h-3.5" />
                  Tu Grupo Asignado
                </span>
                <span className="flex items-center gap-0.5 text-slate-400">
                  <Lock className="w-3 h-3" />
                  Bloqueado
                </span>
              </div>
              <div className="font-bold text-white text-xs truncate">
                {currentCourse?.name || 'Grupo / Curso Asignado'}
              </div>
              <div className="text-[11px] text-slate-400 truncate">
                {currentInstitution?.name}
              </div>
              <div className="text-[10px] text-emerald-300 font-mono pt-1 border-t border-slate-700/50 flex justify-between">
                <span>Cuota: {formatCLP(currentCourse?.monthlyFee || 5000)}/mes</span>
                <span>{currentCourse?.year || 2026}</span>
              </div>
            </div>
          ) : (
            /* Full Selector for Admin General */
            <>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-slate-400" />
                    Institución / Organización
                  </span>
                  <span className="text-[9px] text-blue-400 font-semibold uppercase">Global</span>
                </label>
                <select
                  id="sidebar-select-institution"
                  value={currentInstitutionId}
                  onChange={(e) => {
                    const newInstId = e.target.value;
                    setCurrentInstitutionId(newInstId);
                    const firstCourse = courses.find((c) => c.institutionId === newInstId);
                    if (firstCourse) {
                      setCurrentCourseId(firstCourse.id);
                    }
                  }}
                  className="w-full bg-slate-800 text-slate-100 text-xs font-medium rounded-lg px-2.5 py-2 border border-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  {institutions.map((inst) => (
                    <option key={inst.id} value={inst.id} className="bg-slate-900 text-white">
                      {inst.name} ({inst.city})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1 flex items-center gap-1">
                  <GraduationCap className="w-3 h-3 text-blue-400" />
                  Grupo / Rama / Curso Activo
                </label>
                <select
                  id="sidebar-select-course"
                  value={currentCourseId}
                  onChange={(e) => setCurrentCourseId(e.target.value)}
                  className="w-full bg-slate-800 text-blue-300 text-xs font-semibold rounded-lg px-2.5 py-2 border border-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  {availableCourses.map((crs) => (
                    <option key={crs.id} value={crs.id} className="bg-slate-900 text-white">
                      {crs.name} - {crs.year} ({formatCLP(crs.monthlyFee)}/mes)
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>

        {/* Main Navigation Items */}
        <div className="flex-1 px-3 py-4 overflow-y-auto space-y-1">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Navegación Principal
          </div>

          {/* Cobro de Cuotas */}
          <button
            id="sidebar-tab-cuotas"
            onClick={() => handleTabClick('cuotas')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'cuotas'
                ? 'bg-blue-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <LayoutDashboard className="w-4 h-4" />
              <span>Cobro de Cuotas</span>
            </div>
            <span
              className={`text-[11px] font-mono px-2 py-0.5 rounded-full ${
                activeTab === 'cuotas'
                  ? 'bg-blue-700 text-white'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {courseStudents.length}
            </span>
          </button>

          {/* Ingreso y Registro de Gastos (Nombre y Monto) */}
          <button
            id="sidebar-tab-gastos"
            onClick={() => handleTabClick('gastos')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'gastos'
                ? 'bg-blue-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Receipt className="w-4 h-4" />
              <span>Ingreso de Gastos</span>
            </div>
            <span
              className={`text-[11px] font-mono px-2 py-0.5 rounded-full ${
                activeTab === 'gastos'
                  ? 'bg-blue-700 text-white'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {courseExpenses.length}
            </span>
          </button>

          {/* Gastos con Deuda (Nuevo Formato) */}
          <button
            id="sidebar-tab-gastos-deuda"
            onClick={() => handleTabClick('gastos-deuda')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'gastos-deuda'
                ? 'bg-rose-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <HandCoins className="w-4 h-4 text-amber-400" />
              <span>Gastos (Con Deuda)</span>
            </div>
            {courseExpenses.filter(
              (e) =>
                (e.debtAmount !== undefined ? e.debtAmount > 0 : false) ||
                e.paymentStatus === 'CON_DEUDA' ||
                e.paymentStatus === 'PARCIAL'
            ).length > 0 ? (
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                  activeTab === 'gastos-deuda'
                    ? 'bg-rose-700 text-white'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                }`}
              >
                {
                  courseExpenses.filter(
                    (e) =>
                      (e.debtAmount !== undefined ? e.debtAmount > 0 : false) ||
                      e.paymentStatus === 'CON_DEUDA' ||
                      e.paymentStatus === 'PARCIAL'
                  ).length
                }{' '}
                deuda
              </span>
            ) : (
              <span
                className={`text-[11px] font-mono px-2 py-0.5 rounded-full ${
                  activeTab === 'gastos-deuda'
                    ? 'bg-rose-700 text-white'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {courseExpenses.length}
              </span>
            )}
          </button>

          {/* Resumen Financiero */}
          <button
            id="sidebar-tab-resumen"
            onClick={() => handleTabClick('resumen')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'resumen'
                ? 'bg-blue-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Resumen & Balance</span>
          </button>

          {/* Admin Panel Link (Only if Admin General) */}
          {isAdminGeneral ? (
            <div className="pt-4 pb-1">
              <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                <span>Administración</span>
                <span className="text-indigo-400 text-[9px] font-semibold">Exclusivo</span>
              </div>

              <button
                id="sidebar-tab-admin"
                onClick={() => handleTabClick('admin')}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  activeTab === 'admin'
                    ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                <span>Instituciones & Cursos</span>
              </button>
            </div>
          ) : (
            <div className="pt-3 pb-1">
              <div className="px-3 py-2 bg-slate-950/40 rounded-lg border border-slate-800/60 text-[11px] text-slate-500 flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                <span>Gestión institucional reservada al Admin General</span>
              </div>
            </div>
          )}

          {/* Herramientas de Tesorería Actions */}
          <div className="pt-3 space-y-1.5 border-t border-slate-800/80 mt-2">
            <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Herramientas de Tesorería
            </div>

            {/* Manage Treasurers & Read-Only Observer */}
            <button
              id="sidebar-btn-course-treasurers"
              onClick={() => {
                onOpenCourseTreasurers();
                onCloseMobile();
              }}
              className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/40 hover:bg-slate-800 border border-slate-700/60 rounded-lg transition-colors group"
            >
              <div className="flex items-center gap-2 truncate">
                <Users className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span className="truncate">Equipo Tesoreros</span>
              </div>
              <span className="text-[10px] bg-blue-900/60 text-blue-300 border border-blue-700/50 px-1.5 py-0.5 rounded">
                + Observador
              </span>
            </button>

            {/* Course Monthly Fee */}
            <button
              id="sidebar-btn-course-fee"
              onClick={() => {
                onOpenCourseFee();
                onCloseMobile();
              }}
              className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/40 hover:bg-slate-800 border border-slate-700/60 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-2 truncate">
                <Coins className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="truncate">Valor de Cuota</span>
              </div>
              <span className="text-[10px] font-mono font-bold text-emerald-400">
                {formatCLP(currentCourse?.monthlyFee || 5000)}
              </span>
            </button>

            {/* Bank Account Quick Action */}
            <button
              id="sidebar-btn-bank-info"
              onClick={() => {
                onOpenBankInfo();
                onCloseMobile();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-amber-300 hover:text-amber-200 bg-amber-950/30 hover:bg-amber-900/40 border border-amber-800/50 rounded-lg transition-colors"
            >
              <Landmark className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="truncate">
                {currentCourse?.bankInfo ? 'Datos de Transferencia' : '+ Configurar Cuenta'}
              </span>
            </button>
          </div>

          {/* Direct WhatsApp Support */}
          <div className="mt-3">
            <a
              id="sidebar-btn-whatsapp-support"
              href="https://wa.me/56942788044?text=Hola%20Cuotin%2C%20necesito%20soporte%20o%20tengo%20una%20consulta%20sobre%20mi%20cuenta."
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-emerald-300 hover:text-emerald-200 bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-800/50 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Soporte WhatsApp</span>
              </div>
              <span className="text-[10px] text-emerald-400/90 font-mono">+569 4278 8044</span>
            </a>
          </div>

          {/* Read Only Status Notice */}
          {currentUser?.isReadOnly && (
            <div className="mt-3 p-2.5 bg-indigo-950/60 border border-indigo-800/60 rounded-lg">
              <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs">
                <Eye className="w-3.5 h-3.5 shrink-0 text-indigo-400" />
                <span>Modo Observador</span>
              </div>
              <p className="text-[10px] text-indigo-200/80 mt-0.5">
                Privilegios de solo lectura habilitados para visualizar balances y resúmenes.
              </p>
            </div>
          )}
        </div>

        {/* Sidebar Footer: Active Profile & Role with Logout */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/70 mt-auto">
          <div className="flex items-center justify-between gap-2 p-1.5 rounded-lg">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-slate-800 text-white flex items-center justify-center font-bold text-xs shrink-0 border border-slate-700">
                {isAdminGeneral
                  ? '👑'
                  : currentUser?.avatar || currentUser?.name.substring(0, 2).toUpperCase() || 'AP'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-white truncate">
                  {currentUser?.name || 'Usuario'}
                </p>
                <p className="text-[10px] text-slate-400 truncate">
                  {isAdminGeneral
                    ? '👑 Admin General'
                    : `🎓 Tesorero (${currentCourse?.name || 'Curso'})`}
                </p>
              </div>
            </div>

            <button
              id="sidebar-btn-logout"
              type="button"
              onClick={logout}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-md transition-colors"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
