import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  Check,
  CheckCheck,
  CheckCircle2,
  Clock,
  Cloud,
  CloudCheck,
  CloudOff,
  Coins,
  DollarSign,
  Download,
  Edit2,
  FileSpreadsheet,
  HelpCircle,
  Lock,
  MessageCircle,
  Plus,
  Receipt,
  RefreshCw,
  Search,
  Settings,
  Sparkles,
  Trash2,
  UserPlus,
  X,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useApp } from '../context/AppContext';
import { MONTHS_LIST, MonthKey, Student } from '../types';
import {
  downloadExcelTemplate,
  exportPaymentsToExcel,
  formatCLP,
  generateWhatsAppLink,
  getStudentPaymentSummary,
} from '../utils/formatters';
import { CourseFeeModal } from './CourseFeeModal';

interface PaymentMatrixProps {
  onOpenExcelUpload: () => void;
  onOpenAddStudent: () => void;
  onOpenEditStudent: (student: Student) => void;
  onOpenStudentHistory: (student: Student) => void;
  onOpenPaymentModal: (student: Student, month: MonthKey) => void;
}

export const PaymentMatrix: React.FC<PaymentMatrixProps> = ({
  onOpenExcelUpload,
  onOpenAddStudent,
  onOpenEditStudent,
  onOpenStudentHistory,
  onOpenPaymentModal,
}) => {
  const {
    currentCourse,
    courseStudents,
    courseExpenses,
    togglePayment,
    deleteStudent,
    batchPayStudent,
    isCloudSyncing,
    cloudSyncStatus,
    lastCloudSync,
    syncAllToCloud,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'al_dia' | 'con_deuda' | 'morosos'>('all');
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [quickPayConfirm, setQuickPayConfirm] = useState<{ student: Student; months: MonthKey[] } | null>(null);
  const [showFeeModal, setShowFeeModal] = useState<boolean>(false);
  const [saveSuccessToast, setSaveSuccessToast] = useState<string | null>(null);

  const monthlyFee = currentCourse?.monthlyFee || 5000;

  // Filtered students
  const filteredStudents = useMemo(() => {
    return courseStudents.filter((student) => {
      // Search
      const query = searchQuery.toLowerCase().trim();
      const matchSearch =
        !query ||
        student.studentFullName.toLowerCase().includes(query) ||
        student.parentFullName.toLowerCase().includes(query) ||
        (student.studentRut && student.studentRut.toLowerCase().includes(query)) ||
        (student.parentPhone && student.parentPhone.toLowerCase().includes(query));

      if (!matchSearch) return false;

      // Status
      const summary = getStudentPaymentSummary(student, monthlyFee);
      if (statusFilter === 'al_dia') {
        return summary.isFullyPaid;
      }
      if (statusFilter === 'con_deuda') {
        return !summary.isFullyPaid;
      }
      if (statusFilter === 'morosos') {
        return summary.pendingMonths.length >= 2;
      }
      return true;
    });
  }, [courseStudents, searchQuery, statusFilter, monthlyFee]);

  // Overall statistics
  const stats = useMemo(() => {
    const totalExpected = courseStudents.length * 10 * monthlyFee;
    let totalCollected = 0;
    let fullyPaidCount = 0;
    let withDebtCount = 0;

    courseStudents.forEach((student) => {
      const summary = getStudentPaymentSummary(student, monthlyFee);
      totalCollected += summary.paidAmount;
      if (summary.isFullyPaid) fullyPaidCount++;
      else withDebtCount++;
    });

    const totalSpent = courseExpenses.reduce((acc, e) => acc + e.amount, 0);
    const balance = totalCollected - totalSpent;
    const percent = totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0;

    return {
      totalExpected,
      totalCollected,
      totalSpent,
      balance,
      pendingTotal: totalExpected - totalCollected,
      fullyPaidCount,
      withDebtCount,
      percent,
    };
  }, [courseStudents, courseExpenses, monthlyFee]);

  // Trigger celebration confetti
  const triggerCelebration = () => {
    confetti({
      particleCount: 70,
      spread: 55,
      origin: { y: 0.6 },
    });
  };

  const handleCheckboxClick = (e: React.MouseEvent, student: Student, monthKey: MonthKey) => {
    e.stopPropagation();
    const isCurrentlyPaid = student.payments[monthKey]?.isPaid;
    togglePayment(student.id, monthKey);

    const monthName = MONTHS_LIST.find((m) => m.key === monthKey)?.label || monthKey;
    const actionText = !isCurrentlyPaid ? 'marcada como Pagada' : 'marcada como Pendiente';
    setSaveSuccessToast(`Cuota de ${monthName} para ${student.studentFullName} ${actionText}. (Guardado automático)`);
    setTimeout(() => setSaveSuccessToast(null), 3000);

    if (!isCurrentlyPaid) {
      // Check if this made them fully paid
      const summary = getStudentPaymentSummary(student, monthlyFee);
      if (summary.paidCount + 1 === 10) {
        triggerCelebration();
      }
    }
  };

  const handleManualSaveAll = async () => {
    const success = await syncAllToCloud();
    if (success) {
      setSaveSuccessToast('¡Planilla y todas las cuotas guardadas exitosamente en la Nube!');
      setTimeout(() => setSaveSuccessToast(null), 3500);
    }
  };

  const handleQuickBatchPay = (student: Student) => {
    const summary = getStudentPaymentSummary(student, monthlyFee);
    if (summary.pendingMonths.length === 0) return;
    setQuickPayConfirm({ student, months: summary.pendingMonths });
  };

  const confirmBatchPay = () => {
    if (quickPayConfirm) {
      batchPayStudent(quickPayConfirm.student.id, quickPayConfirm.months);
      triggerCelebration();
      setSaveSuccessToast(`¡Se registraron ${quickPayConfirm.months.length} cuotas para ${quickPayConfirm.student.studentFullName}!`);
      setTimeout(() => setSaveSuccessToast(null), 3000);
      setQuickPayConfirm(null);
    }
  };

  return (
    <div id="payment-matrix-section" className="space-y-6">
      {/* Toast de notificación de guardado */}
      {saveSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs sm:text-sm font-medium">{saveSuccessToast}</span>
        </div>
      )}

      {/* Treasurer Course Fee Banner (Always visible & interactive) */}
      {currentCourse && (
        <div
          id="course-fee-setup-banner"
          className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white rounded-2xl p-4 sm:p-5 shadow-lg border border-indigo-900/80 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in relative overflow-hidden"
        >
          <div className="flex items-start sm:items-center gap-3.5 relative z-10">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 text-slate-950 font-black flex items-center justify-center shrink-0 shadow-md">
              <Coins className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-amber-400/20 text-amber-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-amber-400/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  {currentCourse.feeConfigured ? 'Cuota Oficial Establecida' : 'Paso Inicial: Definir Cuota'}
                </span>
                <span className="text-xs text-indigo-200 font-medium">
                  {currentCourse.name} ({currentCourse.year})
                </span>
              </div>
              
              <div className="flex flex-wrap items-baseline gap-2 mt-1">
                <h3 className="text-base sm:text-lg font-black text-white">
                  Valor de Cuota Mensual: <span className="text-amber-300 font-mono font-black">{formatCLP(monthlyFee)}</span>
                </h3>
                <span className="text-xs text-slate-300 font-medium">
                  ({formatCLP(monthlyFee * 10)} anual por alumno &bull; 10 cuotas Mar-Dic)
                </span>
              </div>

              <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                {currentCourse.feeConfigured
                  ? `Monto oficial del curso aplicado a la planilla. Total alumnos: ${courseStudents.length} • Meta esperada anual: ${formatCLP(courseStudents.length * 10 * monthlyFee)}.`
                  : 'Como directiva o tesorería puedes ajustar el valor mensual oficial ($5.000 a $50.000 CLP en rangos de $5.000). Haz clic para definirlo o ajustarlo.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 relative z-10 self-end md:self-center">
            <button
              id="btn-open-fee-modal-banner"
              type="button"
              onClick={() => setShowFeeModal(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-md transition-all shrink-0 hover:scale-105 cursor-pointer"
            >
              <Coins className="w-4 h-4 text-slate-950" />
              <span>{currentCourse.feeConfigured ? 'Ver / Modificar Valor' : 'Ingresar Valor de Cuota'}</span>
            </button>
          </div>
        </div>
      )}

      {/* 4-Column KPI Stats Strip (Professional Polish style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Recaudado */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Recaudado
          </p>
          <div className="mt-2">
            <h3 className="text-2xl font-black text-slate-900 font-mono tracking-tight">
              {formatCLP(stats.totalCollected)}
            </h3>
            <div className="flex items-center gap-1 mt-1 text-xs text-blue-700 font-medium">
              <span>{stats.percent}% de la meta anual</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Gastos Realizados */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Gastos Realizados
          </p>
          <div className="mt-2">
            <h3 className="text-2xl font-black text-rose-700 font-mono tracking-tight">
              {formatCLP(stats.totalSpent)}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {courseExpenses.length} compras y eventos
            </p>
          </div>
        </div>

        {/* KPI 3: Saldo Disponible */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Saldo Disponible
          </p>
          <div className="mt-2">
            <h3
              className={`text-2xl font-black font-mono tracking-tight ${
                stats.balance >= 0 ? 'text-emerald-700' : 'text-rose-700'
              }`}
            >
              {formatCLP(stats.balance)}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {stats.balance >= 0 ? 'En caja para actividades' : 'Déficit acumulado'}
            </p>
          </div>
        </div>

        {/* KPI 4: Participación de Apoderados */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Apoderados al Día
          </p>
          <div className="mt-2">
            <h3 className="text-2xl font-black text-slate-900 font-mono tracking-tight">
              {stats.fullyPaidCount} <span className="text-sm font-normal text-slate-500">/ {courseStudents.length}</span>
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-blue-600 h-1.5 rounded-full"
                  style={{
                    width: `${
                      courseStudents.length > 0
                        ? Math.round((stats.fullyPaidCount / courseStudents.length) * 100)
                        : 0
                    }%`,
                  }}
                />
              </div>
              <span className="text-[11px] font-bold text-slate-700">
                {courseStudents.length > 0
                  ? Math.round((stats.fullyPaidCount / courseStudents.length) * 100)
                  : 0}
                %
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
        {/* Table Card Header Toolbar */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Planilla de Cobro de Cuotas (Marzo a Diciembre)
              </h2>
              <span className="bg-blue-50 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded-md border border-blue-200">
                {formatCLP(monthlyFee)} CLP / mes
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Haz clic en cualquier casilla para registrar pago de inmediato o usa el botón para guardar todo en la nube.
            </p>
          </div>

          {/* Action Buttons Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Direct Save to Cloud Button */}
            <button
              id="btn-matrix-save-cloud"
              type="button"
              onClick={handleManualSaveAll}
              disabled={isCloudSyncing}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all shadow-xs cursor-pointer ${
                cloudSyncStatus === 'synced'
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : cloudSyncStatus === 'error'
                  ? 'bg-rose-600 hover:bg-rose-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
              title="Guardar y respaldar todos los cambios en la Nube Firestore"
            >
              {isCloudSyncing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : cloudSyncStatus === 'synced' ? (
                <>
                  <CloudCheck className="w-4 h-4" />
                  <span>Guardar Cambios</span>
                </>
              ) : cloudSyncStatus === 'error' ? (
                <>
                  <CloudOff className="w-4 h-4" />
                  <span>Reintentar Guardado</span>
                </>
              ) : (
                <>
                  <Cloud className="w-4 h-4" />
                  <span>Guardar en Nube</span>
                </>
              )}
            </button>

            <button
              id="btn-add-student"
              onClick={onOpenAddStudent}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs sm:text-sm font-semibold transition-colors shadow-xs"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Nuevo Alumno</span>
            </button>

            <button
              id="btn-upload-excel"
              onClick={onOpenExcelUpload}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-800 rounded-lg text-xs sm:text-sm font-medium transition-colors border border-slate-300 shadow-2xs"
              title="Cargar lista masiva desde archivo Excel"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Cargar Excel</span>
            </button>

            <button
              id="btn-export-excel"
              onClick={() => {
                if (currentCourse && courseStudents.length > 0) {
                  exportPaymentsToExcel(courseStudents, currentCourse);
                }
              }}
              disabled={courseStudents.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs sm:text-sm font-medium transition-colors border border-slate-200 disabled:opacity-50"
              title="Exportar planilla completa a Excel"
            >
              <Download className="w-4 h-4 text-slate-600" />
              <span className="hidden sm:inline">Exportar</span>
            </button>

            <button
              id="btn-download-template"
              onClick={() => downloadExcelTemplate(currentCourse?.name || 'Curso')}
              className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-900 text-xs px-2 py-1.5 hover:underline"
              title="Descargar formato modelo para rellenar"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Plantilla</span>
            </button>
          </div>
        </div>

        {/* Auto-Save & Cloud Status Banner Strip */}
        <div className="px-4 sm:px-5 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-slate-700 font-medium">
              <strong>Guardado Automático Activo:</strong> Cada casilla que marcas se guarda al instante.
            </span>
            {lastCloudSync && (
              <span className="text-slate-400 hidden md:inline">
                • Última sincronización: {lastCloudSync}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleManualSaveAll}
              className="text-blue-700 hover:text-blue-900 font-semibold underline text-xs"
            >
              Forzar guardado completo ahora
            </button>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="px-4 sm:px-5 py-3 bg-white border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="input-search-student"
              type="text"
              placeholder="Buscar por alumno, apoderado, RUT o teléfono..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-1.5 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
            <button
              id="filter-btn-all"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
                statusFilter === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Todos ({courseStudents.length})
            </button>

            <button
              id="filter-btn-aldia"
              onClick={() => setStatusFilter('al_dia')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
                statusFilter === 'al_dia'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white text-emerald-700 hover:bg-emerald-50 border border-emerald-200'
              }`}
            >
              Al Día ({stats.fullyPaidCount})
            </button>

            <button
              id="filter-btn-con-deuda"
              onClick={() => setStatusFilter('con_deuda')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
                statusFilter === 'con_deuda'
                  ? 'bg-amber-600 text-white'
                  : 'bg-white text-amber-700 hover:bg-amber-50 border border-amber-200'
              }`}
            >
              Con Deuda ({stats.withDebtCount})
            </button>

            <button
              id="filter-btn-morosos"
              onClick={() => setStatusFilter('morosos')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
                statusFilter === 'morosos'
                  ? 'bg-rose-600 text-white'
                  : 'bg-white text-rose-700 hover:bg-rose-50 border border-rose-200'
              }`}
            >
              Morosos
            </button>
          </div>
        </div>

        {/* Legend strip */}
        <div className="px-5 py-2 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-blue-600 flex items-center justify-center text-white">
                <Check className="w-2.5 h-2.5 stroke-[3]" />
              </span>
              <span className="font-medium text-slate-700">Pagado ({formatCLP(monthlyFee)})</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-white border border-slate-300" />
              <span>Pendiente</span>
            </span>
          </div>
          <div className="text-[11px] text-slate-500 hidden sm:block">
            💡 <strong>Clic en casilla:</strong> Marcar pagado/pendiente • <strong>Clic derecho / Botón recibo:</strong> Editar detalle y comprobante
          </div>
        </div>

        {/* Table Component */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-slate-900 text-white text-xs uppercase tracking-wider font-semibold">
                <th className="py-3 px-3 w-10 text-center">#</th>
                <th className="py-3 px-3 min-w-[180px]">Alumno / Estudiante</th>
                <th className="py-3 px-3 min-w-[180px]">Apoderado & Contacto</th>
                {MONTHS_LIST.map((m) => (
                  <th
                    key={m.key}
                    className="py-3 px-1 text-center min-w-[46px] border-l border-slate-800"
                    title={`Mes de ${m.label} (${formatCLP(monthlyFee)})`}
                  >
                    <span className="block text-[11px] font-bold text-slate-200">{m.shortLabel}</span>
                  </th>
                ))}
                <th className="py-3 px-3 text-center min-w-[110px] border-l border-slate-800">
                  Total Pagado
                </th>
                <th className="py-3 px-3 text-center min-w-[90px]">Estado</th>
                <th className="py-3 px-3 text-center min-w-[120px]">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={16} className="py-12 text-center text-slate-500">
                    <div className="max-w-md mx-auto space-y-3">
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                        <UserPlus className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-medium text-slate-700">
                        {courseStudents.length === 0
                          ? 'No hay alumnos registrados en este curso todavía.'
                          : 'No se encontraron alumnos con los filtros seleccionados.'}
                      </p>
                      {courseStudents.length === 0 && (
                        <div className="flex justify-center gap-2 pt-2">
                          <button
                            onClick={onOpenAddStudent}
                            className="px-3.5 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 shadow-xs"
                          >
                            + Agregar Primer Alumno
                          </button>
                          <button
                            onClick={onOpenExcelUpload}
                            className="px-3.5 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 shadow-xs"
                          >
                            📥 Cargar desde Excel
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student, idx) => {
                  const summary = getStudentPaymentSummary(student, monthlyFee);
                  const waLink = currentCourse
                    ? generateWhatsAppLink(student, currentCourse)
                    : '';

                  // Find first pending month for quick modal
                  const nextPendingMonth = summary.pendingMonths[0] || 'mar';

                  return (
                    <tr
                      key={student.id}
                      className="hover:bg-blue-50/30 transition-colors group"
                    >
                      {/* Row Index */}
                      <td className="py-2.5 px-3 text-center text-slate-400 font-mono text-xs">
                        {idx + 1}
                      </td>

                      {/* Student Info */}
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-900">
                          {student.studentFullName}
                        </div>
                        {student.studentRut && (
                          <div className="text-[11px] text-slate-400 font-mono">
                            RUT: {student.studentRut}
                          </div>
                        )}
                      </td>

                      {/* Parent Info & Contact */}
                      <td className="py-2.5 px-3">
                        <div className="text-slate-800 font-medium">
                          {student.parentFullName}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                          {student.parentPhone && (
                            <span className="font-mono">{student.parentPhone}</span>
                          )}
                          {student.parentEmail && (
                            <span className="truncate max-w-[120px] text-slate-400" title={student.parentEmail}>
                              • {student.parentEmail}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Month Checkboxes (Mar to Dic) */}
                      {MONTHS_LIST.map((m) => {
                        const payment = student.payments[m.key];
                        const isPaid = payment?.isPaid;

                        return (
                          <td
                            key={m.key}
                            className="py-2 px-1 text-center border-l border-slate-100"
                          >
                            <div className="flex items-center justify-center">
                              <button
                                id={`chk-${student.id}-${m.key}`}
                                type="button"
                                onClick={(e) => handleCheckboxClick(e, student, m.key)}
                                onContextMenu={(e) => {
                                  e.preventDefault();
                                  onOpenPaymentModal(student, m.key);
                                }}
                                className={`w-7 h-7 rounded-md flex items-center justify-center transition-all cursor-pointer ${
                                  isPaid
                                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs scale-100 ring-2 ring-blue-500/20'
                                    : 'bg-white hover:bg-slate-100 text-transparent border border-slate-300 hover:border-blue-400'
                                }`}
                                title={
                                  isPaid
                                    ? `✓ Pagado: ${formatCLP(payment.amount || monthlyFee)} (${payment.paidAt || 'Sin fecha'})\nClic para desmarcar • Clic derecho para ver detalle o editar monto`
                                    : `✗ Pendiente: ${m.label} (${formatCLP(monthlyFee)})\nClic para marcar como pagado • Clic derecho para ingresar detalle`
                                }
                              >
                                {isPaid && <Check className="w-4 h-4 stroke-[3]" />}
                              </button>
                            </div>
                          </td>
                        );
                      })}

                      {/* Total Paid */}
                      <td className="py-2.5 px-3 text-center border-l border-slate-100">
                        <div className="font-bold text-slate-900 font-mono">
                          {formatCLP(summary.paidAmount)}
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium">
                          {summary.paidCount} / 10 cuotas
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="py-2.5 px-3 text-center">
                        {summary.isFullyPaid ? (
                          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[11px] font-semibold px-2 py-0.5 rounded-full border border-emerald-200">
                            <CheckCheck className="w-3 h-3" />
                            Al Día
                          </span>
                        ) : summary.paidCount >= 5 ? (
                          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 text-[11px] font-semibold px-2 py-0.5 rounded-full border border-amber-200">
                            <Clock className="w-3 h-3" />
                            {summary.pendingMonths.length} pend.
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 text-[11px] font-semibold px-2 py-0.5 rounded-full border border-rose-200">
                            {summary.pendingMonths.length} cuotas
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {/* Student Payment Modal / Edit Payment */}
                          <button
                            id={`btn-pay-modal-${student.id}`}
                            onClick={() => onOpenPaymentModal(student, nextPendingMonth)}
                            className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                            title={`Registrar o editar pago de cuota con comprobante (${nextPendingMonth.toUpperCase()})`}
                          >
                            <DollarSign className="w-4 h-4" />
                          </button>

                          {/* Student Payment History modal */}
                          <button
                            id={`btn-history-${student.id}`}
                            onClick={() => onOpenStudentHistory(student)}
                            className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                            title="Ver historial de pagos y comprobante"
                          >
                            <Receipt className="w-4 h-4" />
                          </button>

                          {/* WhatsApp Reminder */}
                          {student.parentPhone && waLink && (
                            <a
                              id={`wa-link-${student.id}`}
                              href={waLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-md transition-colors"
                              title="Enviar recordatorio de cuotas por WhatsApp"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </a>
                          )}

                          {/* Quick Pay Remaining if not fully paid */}
                          {!summary.isFullyPaid && (
                            <button
                              id={`btn-batch-pay-${student.id}`}
                              onClick={() => handleQuickBatchPay(student)}
                              className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors text-[11px] font-medium"
                              title="Pagar todas las cuotas pendientes restantes en lote"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          )}

                          {/* Edit Student */}
                          <button
                            id={`btn-edit-${student.id}`}
                            onClick={() => onOpenEditStudent(student)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                            title="Editar datos del alumno"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Student */}
                          <button
                            id={`btn-delete-${student.id}`}
                            onClick={() => setStudentToDelete(student)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                            title="Eliminar alumno del curso"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {studentToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-5 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900">
              ¿Eliminar Alumno?
            </h3>
            <p className="text-xs text-slate-600 mt-2">
              Se eliminará a <strong>{studentToDelete.studentFullName}</strong> y su historial de pagos del curso.
            </p>
            <div className="flex justify-end gap-2 mt-5">
              <button
                type="button"
                onClick={() => setStudentToDelete(null)}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                id="btn-confirm-delete-student"
                type="button"
                onClick={() => {
                  deleteStudent(studentToDelete.id);
                  setStudentToDelete(null);
                }}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs"
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Pay Confirmation Dialog */}
      {quickPayConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-5 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900">
              Registrar Pago Total de Cuotas
            </h3>
            <p className="text-xs text-slate-600 mt-2">
              Se marcarán como pagadas las <strong>{quickPayConfirm.months.length} cuotas pendientes</strong> de <strong>{quickPayConfirm.student.studentFullName}</strong> por un total de <strong>{formatCLP(quickPayConfirm.months.length * monthlyFee)}</strong>.
            </p>
            <div className="flex justify-end gap-2 mt-5">
              <button
                type="button"
                onClick={() => setQuickPayConfirm(null)}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                id="btn-confirm-batch-pay"
                type="button"
                onClick={confirmBatchPay}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
              >
                Confirmar Pago ({formatCLP(quickPayConfirm.months.length * monthlyFee)})
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Course Monthly Fee Modal */}
      {showFeeModal && currentCourse && (
        <CourseFeeModal
          course={currentCourse}
          onClose={() => setShowFeeModal(false)}
        />
      )}
    </div>
  );
};
