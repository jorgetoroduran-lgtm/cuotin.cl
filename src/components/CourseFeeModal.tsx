import React, { useState } from 'react';
import {
  AlertCircle,
  BadgeCheck,
  Calculator,
  Calendar,
  Check,
  CheckCircle2,
  Coins,
  DollarSign,
  Info,
  Lock,
  RotateCcw,
  Sparkles,
  Unlock,
  Users,
  Wallet,
  X,
  Zap,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useApp } from '../context/AppContext';
import { COURSE_FEE_RANGES, Course } from '../types';
import { formatCLP, formatDate } from '../utils/formatters';

interface CourseFeeModalProps {
  course: Course;
  onClose: () => void;
}

export const CourseFeeModal: React.FC<CourseFeeModalProps> = ({ course, onClose }) => {
  const { setCourseMonthlyFee, currentUser, courseStudents } = useApp();

  const isAlreadyConfigured = Boolean(course.feeConfigured);
  const currentFee = course.monthlyFee || 5000;

  const [selectedFee, setSelectedFee] = useState<number>(currentFee);
  const [allowReconfigure, setAllowReconfigure] = useState<boolean>(!isAlreadyConfigured);
  const [showSuccessToast, setShowSuccessToast] = useState<boolean>(false);

  // Projected Annual Totals
  const studentCount = courseStudents.length || 30; // fallback preview count
  const annualTotalPerStudent = selectedFee * 10;
  const annualCourseProjection = annualTotalPerStudent * studentCount;

  const handleConfirmFee = (e: React.FormEvent) => {
    e.preventDefault();

    const actorName =
      currentUser?.name ||
      course.treasurer?.fullName ||
      'Tesorera del Curso';

    setCourseMonthlyFee(course.id, selectedFee, actorName);

    // Launch celebratory confetti
    confetti({
      particleCount: 60,
      spread: 60,
      origin: { y: 0.6 },
    });

    setShowSuccessToast(true);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <div
      id="course-fee-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto"
    >
      <div
        id="course-fee-modal-container"
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-6 animate-fade-in flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 text-white p-5 sm:p-6 flex items-start justify-between shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-blue-500/20 text-blue-300 text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-blue-400/30 flex items-center gap-1">
                <Coins className="w-3 h-3 text-yellow-400" />
                Gestión de Cuota del Curso
              </span>
              {isAlreadyConfigured && (
                <span className="bg-emerald-500/20 text-emerald-300 text-[11px] font-bold px-2 py-0.5 rounded-full border border-emerald-400/30 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-emerald-400" />
                  Cuota Oficial Fijada
                </span>
              )}
            </div>

            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <span>{course.name}</span>
              <span className="text-slate-400 font-normal text-base">({course.year})</span>
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Selecciona el monto mensual por alumno (desde <strong>$5.000</strong> a <strong>$50.000 CLP</strong> en rangos de $5.000). Esta cuota se fija <strong>1 sola vez</strong> para el año escolar.
            </p>
          </div>

          <button
            id="btn-close-course-fee-modal"
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleConfirmFee} className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1 text-xs sm:text-sm">
          {/* If already configured banner */}
          {isAlreadyConfigured && !allowReconfigure ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                  <BadgeCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-emerald-950 text-sm">
                    Cuota mensual oficial: {formatCLP(course.monthlyFee)} CLP / mes
                  </h4>
                  <p className="text-xs text-emerald-800 mt-0.5">
                    Fijada para las 10 mensualidades del año (Marzo a Diciembre).
                    {course.feeConfiguredBy && (
                      <span className="block text-[11px] text-emerald-700 mt-0.5">
                        Definida por: <strong>{course.feeConfiguredBy}</strong>
                        {course.feeConfiguredAt && ` el ${formatDate(course.feeConfiguredAt)}`}
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setAllowReconfigure(true)}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold rounded-lg text-xs transition-colors shrink-0 shadow-2xs"
              >
                <Unlock className="w-3.5 h-3.5" />
                <span>Modificar Selección</span>
              </button>
            </div>
          ) : isAlreadyConfigured && allowReconfigure ? (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-amber-900 text-xs">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  Modo de reconfiguración excepcional activo. Selecciona el nuevo valor oficial a continuación.
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedFee(course.monthlyFee);
                  setAllowReconfigure(false);
                }}
                className="text-xs font-semibold text-amber-800 hover:underline shrink-0"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div className="text-xs text-blue-900 leading-relaxed">
                <strong>Paso Inicial para la Tesorera:</strong> Elige el valor de cuota acordado en la reunión de apoderados. Al confirmar, este valor se aplicará de inmediato a las planillas de cobro y comprobantes del curso.
              </div>
            </div>
          )}

          {/* Fee Tiers Grid ($5.000 to $50.000) */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-blue-600" />
                <span>Rangos de Cuota Mensual Disponibles ($5.000 a $50.000 CLP):</span>
              </label>
              <span className="text-[11px] text-slate-500">10 opciones con saltos de $5.000</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
              {COURSE_FEE_RANGES.map((feeOption) => {
                const isSelected = selectedFee === feeOption;
                const isCurrentStored = course.monthlyFee === feeOption;
                const annualFee = feeOption * 10;

                return (
                  <button
                    key={feeOption}
                    type="button"
                    disabled={isAlreadyConfigured && !allowReconfigure}
                    onClick={() => setSelectedFee(feeOption)}
                    className={`relative p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-700 shadow-md ring-2 ring-blue-400/50 scale-[1.02]'
                        : 'bg-white hover:bg-slate-50 text-slate-900 border-slate-200 hover:border-slate-300 shadow-2xs'
                    } ${
                      isAlreadyConfigured && !allowReconfigure
                        ? 'opacity-60 cursor-not-allowed'
                        : 'cursor-pointer'
                    }`}
                  >
                    {/* Checkmark badge */}
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-4 h-4 bg-white text-blue-700 rounded-full flex items-center justify-center shadow-xs">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}

                    {isCurrentStored && !isSelected && (
                      <div className="absolute top-2 right-2">
                        <span className="text-[9px] bg-slate-100 text-slate-700 font-bold px-1.5 py-0.5 rounded">
                          Actual
                        </span>
                      </div>
                    )}

                    <div>
                      <span
                        className={`text-[10px] font-bold block uppercase tracking-wider ${
                          isSelected ? 'text-blue-100' : 'text-slate-500'
                        }`}
                      >
                        Mensual
                      </span>
                      <div
                        className={`text-base sm:text-lg font-black font-mono tracking-tight mt-0.5 ${
                          isSelected ? 'text-white' : 'text-slate-900'
                        }`}
                      >
                        {formatCLP(feeOption)}
                      </div>
                    </div>

                    <div className="mt-2 pt-1.5 border-t border-black/10 text-[10px]">
                      <span className={isSelected ? 'text-blue-100' : 'text-slate-500'}>
                        Anual: {formatCLP(annualFee)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Projection Calculation Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <Calculator className="w-4 h-4 text-slate-500" />
                <span>Simulación de Fondos para el Curso ({course.name}):</span>
              </span>
              <span className="text-xs text-slate-500">Base: {studentCount} alumnos</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="text-[11px] text-slate-500 block">Cuota Mensual</span>
                <span className="text-base font-black font-mono text-blue-600">
                  {formatCLP(selectedFee)} <span className="text-xs font-normal text-slate-500">/ mes</span>
                </span>
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="text-[11px] text-slate-500 block">Total Anual por Alumno (10 meses)</span>
                <span className="text-base font-black font-mono text-slate-900">
                  {formatCLP(annualTotalPerStudent)}
                </span>
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="text-[11px] text-slate-500 block">Meta Anual del Curso</span>
                <span className="text-base font-black font-mono text-emerald-700">
                  {formatCLP(annualCourseProjection)}
                </span>
              </div>
            </div>
          </div>

          {/* Success toast if recently updated */}
          {showSuccessToast && (
            <div className="p-3 bg-emerald-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 animate-bounce shadow-md">
              <CheckCircle2 className="w-5 h-5" />
              <span>¡Cuota del curso guardada y fijada exitosamente en {formatCLP(selectedFee)} CLP!</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              id="btn-cancel-course-fee"
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cerrar
            </button>

            {(!isAlreadyConfigured || allowReconfigure) && (
              <button
                id="btn-confirm-course-fee"
                type="submit"
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2"
              >
                <Lock className="w-4 h-4 text-blue-200" />
                <span>
                  {isAlreadyConfigured
                    ? `Guardar Nuevo Valor: ${formatCLP(selectedFee)} CLP`
                    : `Fijar Cuota Oficial de ${formatCLP(selectedFee)} CLP`}
                </span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
