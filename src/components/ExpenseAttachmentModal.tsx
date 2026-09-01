import React, { useState } from 'react';
import {
  Download,
  Eye,
  FileText,
  Image as ImageIcon,
  Maximize2,
  Minimize2,
  Printer,
  Receipt,
  RotateCw,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { CourseExpense, ExpenseAttachment } from '../types';
import { formatCLP, formatDate } from '../utils/formatters';

interface ExpenseAttachmentModalProps {
  expense: CourseExpense;
  attachment: ExpenseAttachment;
  onClose: () => void;
}

export const ExpenseAttachmentModal: React.FC<ExpenseAttachmentModalProps> = ({
  expense,
  attachment,
  onClose,
}) => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);

  const isImage =
    attachment.fileType.startsWith('image/') ||
    attachment.fileData.startsWith('data:image/') ||
    /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(attachment.fileName);

  const isPdf =
    attachment.fileType === 'application/pdf' ||
    attachment.fileData.startsWith('data:application/pdf') ||
    /\.pdf$/i.test(attachment.fileName);

  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.25, 0.5));
  const handleResetZoom = () => {
    setZoomLevel(1);
    setRotation(0);
  };
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  const handlePrintImage = () => {
    if (!isImage) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Comprobante - ${expense.concept}</title>
          <style>
            body { margin: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; font-family: sans-serif; padding: 20px; }
            h2 { margin: 0 0 5px 0; color: #1e293b; font-size: 16px; }
            p { margin: 0 0 15px 0; color: #64748b; font-size: 13px; }
            img { max-width: 100%; max-height: 85vh; object-fit: contain; box-shadow: 0 2px 8px rgba(0,0,0,0.15); border-radius: 6px; }
          </style>
        </head>
        <body>
          <h2>Comprobante de Respaldo de Gasto</h2>
          <p><strong>Concepto:</strong> ${expense.concept} | <strong>Monto:</strong> ${formatCLP(expense.amount)} | <strong>Fecha:</strong> ${formatDate(expense.date)}</p>
          <img src="${attachment.fileData}" alt="Comprobante" />
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div
      id="modal-expense-attachment-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-700/30 overflow-hidden flex flex-col max-h-[92vh] animate-scale-up">
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400/40 text-blue-400 flex items-center justify-center shrink-0">
              {isImage ? <ImageIcon className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded border border-blue-400/30">
                  Evidencia Digital Adjunta
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {formatFileSize(attachment.fileSize)}
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white tracking-tight line-clamp-1 mt-0.5">
                {expense.concept}
              </h3>
              <p className="text-xs text-slate-400">
                Gasto de <strong className="text-emerald-400">{formatCLP(expense.amount)}</strong> • Fecha: {formatDate(expense.date)} • Archivo: <span className="text-slate-300 font-mono">{attachment.fileName}</span>
              </p>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center gap-1.5 self-end sm:self-center">
            {isImage && (
              <>
                <button
                  type="button"
                  onClick={handleZoomIn}
                  className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                  title="Acercar (Zoom +)"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleZoomOut}
                  className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                  title="Alejar (Zoom -)"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleRotate}
                  className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                  title="Rotar 90°"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handlePrintImage}
                  className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                  title="Imprimir imagen"
                >
                  <Printer className="w-4 h-4" />
                </button>
              </>
            )}

            {/* Download file button */}
            <a
              href={attachment.fileData}
              download={attachment.fileName}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-xs"
              title="Descargar documento a tu computador o teléfono"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar</span>
            </a>

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors ml-1"
              title="Cerrar visor"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Viewer Body */}
        <div className="flex-1 overflow-auto bg-slate-950/95 flex items-center justify-center p-4 sm:p-6 min-h-[350px]">
          {isImage ? (
            <div className="overflow-auto max-w-full max-h-full flex items-center justify-center">
              <img
                src={attachment.fileData}
                alt={`Evidencia de ${expense.concept}`}
                className="rounded-lg shadow-2xl transition-transform duration-150 ease-out object-contain max-h-[65vh] max-w-full"
                style={{
                  transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                }}
              />
            </div>
          ) : isPdf ? (
            <div className="w-full h-[65vh] flex flex-col items-center justify-center bg-slate-900 rounded-xl border border-slate-800 p-4">
              <div className="text-center space-y-3 max-w-md">
                <div className="w-16 h-16 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center mx-auto shadow-inner">
                  <FileText className="w-8 h-8" />
                </div>
                <h4 className="text-lg font-bold text-white">Documento PDF Adjunto</h4>
                <p className="text-xs text-slate-400 font-mono break-all">{attachment.fileName}</p>
                <p className="text-xs text-slate-300">
                  Tamaño: <span className="font-semibold">{formatFileSize(attachment.fileSize)}</span> • Subido el {formatDate(attachment.uploadedAt?.split('T')[0] || expense.date)}
                </p>
                <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
                  <a
                    href={attachment.fileData}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Ver / Abrir PDF Completo</span>
                  </a>
                  <a
                    href={attachment.fileData}
                    download={attachment.fileName}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition-all"
                  >
                    <Download className="w-4 h-4" />
                    <span>Descargar PDF</span>
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-3 p-8 bg-slate-900 rounded-xl border border-slate-800 max-w-md">
              <div className="w-14 h-14 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center mx-auto">
                <FileText className="w-7 h-7" />
              </div>
              <h4 className="text-base font-bold text-white">Archivo Adjunto</h4>
              <p className="text-xs text-slate-300 font-mono break-all">{attachment.fileName}</p>
              <a
                href={attachment.fileData}
                download={attachment.fileName}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all shadow-md"
              >
                <Download className="w-4 h-4" />
                <span>Descargar Archivo ({formatFileSize(attachment.fileSize)})</span>
              </a>
            </div>
          )}
        </div>

        {/* Footer Details */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 py-3 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-600 gap-2 shrink-0">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-800 flex items-center gap-1.5">
              <Receipt className="w-3.5 h-3.5 text-blue-600" />
              Comprobante: {expense.receiptType} {expense.receiptNumber ? `N° ${expense.receiptNumber}` : ''}
            </span>
            <span className="text-slate-400">|</span>
            <span>Responsable: <strong>{expense.responsible}</strong></span>
          </div>

          <div className="text-slate-500 text-[11px]">
            {isImage && <span>Usa la rueda del ratón o los botones para hacer zoom en los detalles de la boleta.</span>}
          </div>
        </div>
      </div>
    </div>
  );
};
