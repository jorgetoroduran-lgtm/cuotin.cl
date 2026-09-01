import React, { useRef, useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Copy,
  Check,
  Download,
  Mail,
  MessageCircle,
  Phone,
  Printer,
  Receipt,
  User,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { MONTHS_LIST, MonthKey, Student } from '../types';
import {
  formatCLP,
  formatDate,
  generateGmailComposeLink,
  generateStudentEmailData,
  generateWhatsAppLink,
  getMonthLabel,
  getStudentPaymentSummary,
} from '../utils/formatters';

interface StudentHistoryModalProps {
  student: Student;
  onClose: () => void;
  onOpenPaymentEdit: (student: Student, month: MonthKey) => void;
}

export const StudentHistoryModal: React.FC<StudentHistoryModalProps> = ({
  student,
  onClose,
  onOpenPaymentEdit,
}) => {
  const { currentCourse, currentInstitution } = useApp();
  const monthlyFee = currentCourse?.monthlyFee || 5000;
  const summary = getStudentPaymentSummary(student, monthlyFee);
  const printRef = useRef<HTMLDivElement>(null);

  const waLink = currentCourse ? generateWhatsAppLink(student, currentCourse) : '';
  const [copiedWa, setCopiedWa] = useState(false);

  const getWaRawMessage = () => {
    if (!currentCourse) return '';
    const pendingNames = summary.pendingMonths.map(getMonthLabel).join(', ');
    const bank = currentCourse.bankInfo;
    const bankDetails = bank
      ? `\n\n📌 *Datos de Transferencia:*\n- Banco: ${bank.bankName}\n- Tipo de Cuenta: ${bank.accountType}\n- N° Cuenta: ${bank.accountNumber}\n- Titular: ${bank.holderName}\n- RUT: ${bank.holderRut}\n- Correo: ${bank.email}`
      : '';

    return `Estimado/a ${student.parentFullName || 'Apoderado/a'},\n\nLe saluda la Tesorería del curso *${currentCourse.name}* (${currentCourse.year}).\n\nInformamos el estado de cuotas de su alumno/a *${student.studentFullName}*:\n- Cuotas Pagadas: ${summary.paidCount} de 10 (${formatCLP(summary.paidAmount)})\n- Cuotas Pendientes: ${summary.pendingMonths.length} (${pendingNames || 'Ninguna'})\n- Total Adeudado: *${formatCLP(summary.debtAmount)}*${bankDetails}\n\nAgradecemos enviar el comprobante de pago a este medio. ¡Muchas gracias por su compromiso con las actividades del curso!`;
  };

  const handleCopyWa = async () => {
    try {
      await navigator.clipboard.writeText(getWaRawMessage());
      setCopiedWa(true);
      setTimeout(() => setCopiedWa(false), 2500);
    } catch {
      // fallback
    }
  };

  const emailData = currentCourse && student.parentEmail
    ? generateStudentEmailData(student, currentCourse)
    : null;
  const gmailLink = emailData && student.parentEmail
    ? generateGmailComposeLink(student.parentEmail, emailData.subject, emailData.body)
    : '';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden my-auto max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-400 block">
                Historial de Pagos & Estado de Cuenta
              </span>
              <h2 className="text-lg font-bold text-slate-100">
                {student.studentFullName}
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors hidden sm:inline-flex items-center gap-1 text-xs"
              title="Imprimir comprobante de estado de cuenta"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div ref={printRef} className="p-5 overflow-y-auto space-y-5 text-xs sm:text-sm">
          {/* Printable School Header Banner */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                {currentInstitution?.name} — {currentCourse?.name} ({currentCourse?.year})
              </div>
              <div className="text-sm font-bold text-slate-900 mt-0.5">
                Comprobante de Control de Cuotas del Curso
              </div>
              <div className="text-xs text-slate-500">
                Cuota Mensual: {formatCLP(monthlyFee)} CLP (10 meses escolares: Marzo a Diciembre)
              </div>
            </div>

            {/* Quick Status Pill */}
            <div className="text-right sm:self-center">
              {summary.isFullyPaid ? (
                <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded-full text-xs border border-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Al Día (10/10 Cuotas)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-800 font-bold px-3 py-1 rounded-full text-xs border border-amber-300">
                  <Clock className="w-4 h-4 text-amber-600" />
                  {summary.pendingMonths.length} Cuota(s) Pendiente(s)
                </span>
              )}
            </div>
          </div>

          {/* Student & Parent Info Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-3.5 rounded-lg border border-slate-200">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-semibold text-slate-700">Estudiante:</span>
                <span className="text-slate-900 font-medium">{student.studentFullName}</span>
              </div>
              {student.studentRut && (
                <div className="text-xs text-slate-500 pl-5">
                  RUT: <span className="font-mono text-slate-700">{student.studentRut}</span>
                </div>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-semibold text-slate-700">Apoderado:</span>
                <span className="text-slate-900 font-medium">{student.parentFullName}</span>
              </div>
              <div className="flex items-center gap-3 pl-5 text-xs text-slate-600">
                {student.parentPhone && (
                  <span className="flex items-center gap-1 font-mono">
                    <Phone className="w-3 h-3 text-slate-400" />
                    {student.parentPhone}
                  </span>
                )}
                {student.parentEmail && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-3 h-3 text-slate-400" />
                    {student.parentEmail}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Financial Summary Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white p-3 rounded-lg border border-slate-200 text-center shadow-xs">
              <span className="text-[11px] font-medium text-slate-500 block">Total Cancelado</span>
              <span className="text-base sm:text-lg font-bold text-slate-900">
                {formatCLP(summary.paidAmount)}
              </span>
              <span className="text-[10px] text-blue-600 font-medium block mt-0.5">
                {summary.paidCount} de 10 cuotas
              </span>
            </div>

            <div className="bg-white p-3 rounded-lg border border-slate-200 text-center shadow-xs">
              <span className="text-[11px] font-medium text-slate-500 block">Saldo Pendiente</span>
              <span className="text-base sm:text-lg font-bold text-slate-900">
                {formatCLP(summary.debtAmount)}
              </span>
              <span className="text-[10px] text-amber-600 font-medium block mt-0.5">
                {summary.pendingMonths.length} cuotas restantes
              </span>
            </div>

            <div className="bg-white p-3 rounded-lg border border-slate-200 text-center shadow-xs">
              <span className="text-[11px] font-medium text-slate-500 block">Cumplimiento Anual</span>
              <span className="text-base sm:text-lg font-bold text-slate-900">
                {summary.percent}%
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                Total anual {formatCLP(summary.totalExpected)}
              </span>
            </div>
          </div>

          {/* Detailed Monthly Breakdown Table */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
              Detalle Mes a Mes (Marzo a Diciembre)
            </h4>
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Mes</th>
                    <th className="py-2.5 px-3 text-center">Estado</th>
                    <th className="py-2.5 px-3 text-right">Monto</th>
                    <th className="py-2.5 px-3">Fecha de Pago</th>
                    <th className="py-2.5 px-3">Medio de Pago</th>
                    <th className="py-2.5 px-3">N° Comprobante</th>
                    <th className="py-2.5 px-3 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {MONTHS_LIST.map((m) => {
                    const record = student.payments[m.key];
                    const isPaid = record && record.isPaid;

                    return (
                      <tr
                        key={m.key}
                        className={isPaid ? 'bg-white hover:bg-slate-50' : 'bg-slate-50/60 hover:bg-slate-100/50'}
                      >
                        <td className="py-2 px-3 font-semibold text-slate-800">
                          {m.label}
                        </td>
                        <td className="py-2 px-3 text-center">
                          {isPaid ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-[11px] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              ✓ Pagado
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-slate-500 font-medium text-[11px] bg-slate-200/70 px-2 py-0.5 rounded-full">
                              Pendiente
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-medium text-slate-900">
                          {formatCLP(record?.amount || monthlyFee)}
                        </td>
                        <td className="py-2 px-3 text-slate-600">
                          {isPaid ? formatDate(record?.paidAt) : '-'}
                        </td>
                        <td className="py-2 px-3 text-slate-600">
                          {isPaid ? record?.paymentMethod || 'Transferencia' : '-'}
                        </td>
                        <td className="py-2 px-3 font-mono text-slate-600">
                          {isPaid ? record?.receiptNumber || 'S/N' : '-'}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <button
                            onClick={() => onOpenPaymentEdit(student, m.key)}
                            className="text-blue-600 hover:text-blue-800 font-medium hover:underline text-[11px]"
                          >
                            {isPaid ? 'Modificar' : 'Registrar'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Notes if any */}
          {student.notes && (
            <div className="bg-amber-50/50 border border-amber-200/80 rounded-lg p-3 text-xs text-amber-900">
              <span className="font-bold">Notas del Alumno:</span> {student.notes}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex flex-wrap items-center gap-2">
            {student.parentPhone && waLink ? (
              <a
                id="btn-send-whatsapp-modal"
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Abrir en WhatsApp</span>
              </a>
            ) : null}

            <button
              id="btn-copy-whatsapp-text"
              type="button"
              onClick={handleCopyWa}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold transition-colors"
              title="Copiar texto resumen del estado de cuotas y datos bancarios para pegar en WhatsApp"
            >
              {copiedWa ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">¡Copiado al portapapeles!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-500" />
                  <span>Copiar Texto WhatsApp</span>
                </>
              )}
            </button>

            {student.parentEmail && gmailLink && (
              <a
                href={gmailLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
                title="Abrir redactor en Gmail web con el estado prellenado"
              >
                <Mail className="w-4 h-4" />
                <span>Enviar por Gmail</span>
              </a>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200 bg-slate-100 rounded-lg transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
