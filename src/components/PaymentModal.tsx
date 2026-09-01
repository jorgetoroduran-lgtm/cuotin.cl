import React, { useState } from 'react';
import { Calendar, CheckCircle2, DollarSign, FileText, Hash, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { MonthKey, PaymentMethod, Student } from '../types';
import { formatCLP, getMonthLabel } from '../utils/formatters';

interface PaymentModalProps {
  student: Student;
  month: MonthKey;
  onClose: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  student,
  month,
  onClose,
}) => {
  const { currentCourse, updatePaymentDetails } = useApp();
  const payment = student.payments[month];

  const defaultAmount = currentCourse?.monthlyFee || 5000;
  const today = new Date().toISOString().split('T')[0];

  const [isPaid, setIsPaid] = useState<boolean>(payment?.isPaid ?? true);
  const [amount, setAmount] = useState<number>(payment?.amount || defaultAmount);
  const [paidAt, setPaidAt] = useState<string>(payment?.paidAt || today);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    payment?.paymentMethod || 'Transferencia'
  );
  const [receiptNumber, setReceiptNumber] = useState<string>(
    payment?.receiptNumber || ''
  );
  const [notes, setNotes] = useState<string>(payment?.notes || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updatePaymentDetails(student.id, month, {
      isPaid,
      amount,
      paidAt: isPaid ? paidAt : undefined,
      paymentMethod: isPaid ? paymentMethod : undefined,
      receiptNumber: isPaid && receiptNumber ? receiptNumber.trim() : undefined,
      notes: notes.trim() || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-400">
              Detalle de Cuota — Mes de {getMonthLabel(month)}
            </span>
            <h3 className="text-base font-bold text-slate-100 mt-0.5">
              {student.studentFullName}
            </h3>
            <p className="text-xs text-slate-400">
              Apoderado: {student.parentFullName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs sm:text-sm">
          {/* Status Toggle Button */}
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="font-medium text-slate-700">Estado del Pago:</span>
            <div className="flex gap-1.5">
              <button
                type="button"
                id="modal-btn-status-paid"
                onClick={() => setIsPaid(true)}
                className={`px-3 py-1 rounded-md font-semibold text-xs transition-colors ${
                  isPaid
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-300'
                }`}
              >
                ✓ Pagado
              </button>
              <button
                type="button"
                id="modal-btn-status-unpaid"
                onClick={() => setIsPaid(false)}
                className={`px-3 py-1 rounded-md font-semibold text-xs transition-colors ${
                  !isPaid
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-300'
                }`}
              >
                ✗ Pendiente
              </button>
            </div>
          </div>

          {isPaid && (
            <>
              {/* Amount */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Monto Cancelado ($ CLP)
                </label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="modal-input-amount"
                    type="number"
                    min="0"
                    step="500"
                    required
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <span className="text-[11px] text-slate-500 mt-0.5 block">
                  Valor fijado por curso: {formatCLP(defaultAmount)}
                </span>
              </div>

              {/* Payment Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Fecha de Pago / Transferencia
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="modal-input-date"
                    type="date"
                    required
                    value={paidAt}
                    onChange={(e) => setPaidAt(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Medio de Pago
                </label>
                <select
                  id="modal-select-method"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                >
                  <option value="Transferencia">Transferencia Electrónica</option>
                  <option value="Efectivo">Efectivo</option>
                  <option value="Webpay / Débito">Webpay / Tarjeta Débito</option>
                  <option value="Depósito">Depósito Bancario</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              {/* Receipt / Voucher Number */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  N° Comprobante / Código de Operación (Opcional)
                </label>
                <div className="relative">
                  <Hash className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="modal-input-receipt"
                    type="text"
                    placeholder="Ej. TRF-982341 o Boleta 102"
                    value={receiptNumber}
                    onChange={(e) => setReceiptNumber(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>
            </>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Observaciones / Notas
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <textarea
                id="modal-input-notes"
                rows={2}
                placeholder="Ej. Comprobante enviado por WhatsApp por la mamá..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              id="modal-btn-save-payment"
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              Guardar Registro
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
