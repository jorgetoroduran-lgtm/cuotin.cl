import React, { useState } from 'react';
import {
  AlertCircle,
  Building2,
  Calendar,
  CheckCircle2,
  Coins,
  DollarSign,
  Download,
  Eye,
  FileCheck,
  FileSpreadsheet,
  FileText,
  Filter,
  GraduationCap,
  Info,
  Layers,
  Printer,
  Receipt,
  Sparkles,
  User,
  UserCheck,
  Wallet,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { MONTHS_LIST, MonthKey } from '../types';
import { formatCLP, formatDate } from '../utils/formatters';
import {
  downloadPDFDocument,
  generateAnnualFinancialReportPDF,
  generateMonthlyFinancialReportPDF,
} from '../utils/pdfGenerator';

interface FinancialPdfReportModalProps {
  initialMonthKey?: MonthKey;
  onClose: () => void;
}

export const FinancialPdfReportModal: React.FC<FinancialPdfReportModalProps> = ({
  initialMonthKey = 'mar',
  onClose,
}) => {
  const { currentCourse, currentInstitution, courseStudents, courseExpenses, currentUser } = useApp();

  const [reportType, setReportType] = useState<'monthly' | 'annual'>('monthly');
  const [selectedMonth, setSelectedMonth] = useState<MonthKey>(initialMonthKey);
  const [treasurerName, setTreasurerName] = useState(
    currentCourse?.treasurer?.fullName || currentUser?.fullName || 'Tesorero/a del Curso'
  );
  const [presidentName, setPresidentName] = useState('Presidente/a Centro de Padres');
  const [customNotes, setCustomNotes] = useState(
    'Rendición de cuentas presentada para la asamblea ordinaria de apoderados. Comprobantes disponibles para revisión.'
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSuccess, setGeneratedSuccess] = useState(false);

  if (!currentCourse) return null;

  const monthlyFee = currentCourse.monthlyFee || 5000;
  const currentMonthObj = MONTHS_LIST.find((m) => m.key === selectedMonth) || MONTHS_LIST[0];

  // Month stats for preview
  let monthCollected = 0;
  let paidStudentsCount = 0;
  courseStudents.forEach((s) => {
    const p = s.payments[selectedMonth];
    if (p && p.isPaid) {
      paidStudentsCount++;
      monthCollected += p.amount || monthlyFee;
    }
  });

  const monthExpenses = courseExpenses.filter((e) => {
    if (!e.date) return false;
    return new Date(e.date).getMonth() + 1 === currentMonthObj.monthNumber;
  });
  const monthSpent = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const monthNet = monthCollected - monthSpent;

  // Annual stats
  let totalAnnualCollected = 0;
  courseStudents.forEach((s) => {
    MONTHS_LIST.forEach((m) => {
      const p = s.payments[m.key];
      if (p && p.isPaid) {
        totalAnnualCollected += p.amount || monthlyFee;
      }
    });
  });
  const totalAnnualSpent = courseExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalAnnualBalance = totalAnnualCollected - totalAnnualSpent;

  const handleDownloadPDF = () => {
    setIsGenerating(true);
    setGeneratedSuccess(false);

    try {
      if (reportType === 'monthly') {
        const doc = generateMonthlyFinancialReportPDF({
          course: currentCourse,
          institution: currentInstitution,
          students: courseStudents,
          expenses: courseExpenses,
          monthKey: selectedMonth,
          notes: customNotes,
          treasurerName,
          presidentName,
        });

        const safeCourseName = currentCourse.name.replace(/[^a-zA-Z0-9]/g, '_');
        const filename = `Balance_Mensual_${currentMonthObj.label}_${currentCourse.year}_${safeCourseName}.pdf`;
        downloadPDFDocument(doc, filename);
      } else {
        const doc = generateAnnualFinancialReportPDF({
          course: currentCourse,
          institution: currentInstitution,
          students: courseStudents,
          expenses: courseExpenses,
          notes: customNotes,
          treasurerName,
          presidentName,
        });

        const safeCourseName = currentCourse.name.replace(/[^a-zA-Z0-9]/g, '_');
        const filename = `Balance_Anual_Consolidado_${currentCourse.year}_${safeCourseName}.pdf`;
        downloadPDFDocument(doc, filename);
      }

      setGeneratedSuccess(true);
      setTimeout(() => setGeneratedSuccess(false), 4000);
    } catch (err) {
      console.error('Error generating PDF report:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div
      id="modal-financial-pdf-report"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-fade-in"
    >
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-8 flex flex-col">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white p-5 sm:p-6 flex items-center justify-between border-b border-indigo-900/60">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-md">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold bg-amber-400/20 text-amber-300 px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-amber-400/30">
                  Documento Oficial
                </span>
                <span className="text-xs text-indigo-200">
                  {currentCourse.name} ({currentCourse.year})
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-white mt-0.5">
                Generador de Balances en PDF
              </h3>
            </div>
          </div>

          <button
            type="button"
            id="btn-close-pdf-modal"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-6 overflow-y-auto max-h-[calc(85vh-160px)]">
          {/* Report Type Selector Tabs */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              1. Seleccione el Tipo de Reporte a Descargar:
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                id="btn-report-type-monthly"
                onClick={() => setReportType('monthly')}
                className={`p-3.5 rounded-2xl border text-left transition-all flex items-start gap-3 ${
                  reportType === 'monthly'
                    ? 'bg-blue-50/80 border-blue-500 ring-2 ring-blue-500/20 text-blue-950 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-white hover:border-slate-300'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    reportType === 'monthly' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-xs sm:text-sm">Balance Mensual Oficial</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Rendición de un mes específico con cuotas y boletas.
                  </div>
                </div>
              </button>

              <button
                type="button"
                id="btn-report-type-annual"
                onClick={() => setReportType('annual')}
                className={`p-3.5 rounded-2xl border text-left transition-all flex items-start gap-3 ${
                  reportType === 'annual'
                    ? 'bg-blue-50/80 border-blue-500 ring-2 ring-blue-500/20 text-blue-950 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-white hover:border-slate-300'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    reportType === 'annual' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-xs sm:text-sm">Balance Anual Consolidado</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Resumen acumulado del año escolar (Marzo-Diciembre).
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Month Selector (if monthly) */}
          {reportType === 'monthly' && (
            <div className="space-y-2 p-4 bg-slate-50 border border-slate-200 rounded-2xl animate-fade-in">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span>Mes a Rendir:</span>
                </label>
                <span className="text-xs text-blue-700 font-semibold">
                  Cuota oficial: {formatCLP(monthlyFee)}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
                {MONTHS_LIST.map((m) => {
                  const isSelected = selectedMonth === m.key;
                  return (
                    <button
                      key={m.key}
                      type="button"
                      onClick={() => setSelectedMonth(m.key)}
                      className={`p-2 rounded-xl text-xs font-bold border transition-all text-center ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs scale-102'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {m.label}
                    </button>
                  );
                })}
              </div>

              {/* Month Quick Summary Preview */}
              <div className="mt-3 pt-3 border-t border-slate-200 grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 block">Recaudado {currentMonthObj.label}</span>
                  <span className="font-bold text-emerald-700">{formatCLP(monthCollected)}</span>
                  <span className="text-[10px] text-slate-400 block">({paidStudentsCount} alumnos)</span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 block">Gastos {currentMonthObj.label}</span>
                  <span className="font-bold text-rose-700">{formatCLP(monthSpent)}</span>
                  <span className="text-[10px] text-slate-400 block">({monthExpenses.length} boletas)</span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 block">Flujo Neto Mes</span>
                  <span className={`font-bold ${monthNet >= 0 ? 'text-blue-700' : 'text-rose-700'}`}>
                    {(monthNet >= 0 ? '+' : '') + formatCLP(monthNet)}
                  </span>
                  <span className="text-[10px] text-slate-400 block">{monthNet >= 0 ? 'Superávit' : 'Déficit'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Annual Quick Summary Preview (if annual) */}
          {reportType === 'annual' && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 animate-fade-in">
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-indigo-600" />
                <span>Resumen del Periodo Anual {currentCourse.year}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 block">Total Recaudado</span>
                  <span className="font-bold text-emerald-700">{formatCLP(totalAnnualCollected)}</span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 block">Total Gastado</span>
                  <span className="font-bold text-rose-700">{formatCLP(totalAnnualSpent)}</span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 block">Saldo en Caja</span>
                  <span className="font-bold text-blue-700">{formatCLP(totalAnnualBalance)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Signatures & Custom Notes */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              2. Datos para el Pie de Firma del Documento:
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-medium text-slate-600 block mb-1">
                  Nombre Tesorero/a Responsable:
                </label>
                <input
                  type="text"
                  value={treasurerName}
                  onChange={(e) => setTreasurerName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
                  placeholder="Ej: María José Morales"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-600 block mb-1">
                  Nombre Presidente/a Centro de Padres:
                </label>
                <input
                  type="text"
                  value={presidentName}
                  onChange={(e) => setPresidentName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
                  placeholder="Ej: Carolina Tapia"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-medium text-slate-600 block mb-1">
                Observaciones / Nota al pie para la asamblea (opcional):
              </label>
              <textarea
                rows={2}
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none resize-none"
                placeholder="Observaciones adicionales para los apoderados..."
              />
            </div>
          </div>

          {/* Success Notification Banner */}
          {generatedSuccess && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center gap-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                ¡El reporte PDF oficial se ha generado y descargado exitosamente en tu dispositivo!
              </span>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Formato vectorial A4 oficial con tablas y firmas.</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-colors"
            >
              Cerrar
            </button>

            <button
              type="button"
              id="btn-confirm-download-pdf"
              onClick={handleDownloadPDF}
              disabled={isGenerating}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs sm:text-sm font-black shadow-md shadow-blue-500/20 transition-all cursor-pointer hover:scale-102 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isGenerating ? 'Generando PDF...' : 'Descargar Balance en PDF'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
