import React, { useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  Banknote,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Coins,
  DollarSign,
  Download,
  Edit2,
  Eye,
  FileCheck,
  FileSpreadsheet,
  FileText,
  Filter,
  HandCoins,
  Hash,
  HelpCircle,
  Image as ImageIcon,
  Info,
  Paperclip,
  Plus,
  Receipt,
  RotateCcw,
  Search,
  Sparkles,
  Tag,
  Trash2,
  Upload,
  User,
  X,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useApp } from '../context/AppContext';
import {
  CourseExpense,
  CreditorType,
  ExpenseAttachment,
  ExpenseCategory,
  ExpensePaymentStatus,
  ReceiptType,
} from '../types';
import {
  exportExpensesToExcel,
  formatCLP,
  formatDate,
} from '../utils/formatters';
import {
  formatAttachmentSize,
  readFileAsAttachment,
  validateAttachmentFile,
} from '../utils/attachmentHelper';
import { ExpenseAttachmentModal } from './ExpenseAttachmentModal';

const CATEGORIES: ExpenseCategory[] = [
  'Eventos y Celebraciones',
  'Paseos y Transporte',
  'Materiales y Decoración',
  'Alimentación y Convivencias',
  'Regalos y Premios',
  'Fotografía y Recuerdos',
  'Imprevistos y Varios',
];

const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  'Eventos y Celebraciones': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'Paseos y Transporte': 'bg-blue-50 text-blue-700 border-blue-200',
  'Materiales y Decoración': 'bg-amber-50 text-amber-800 border-amber-200',
  'Alimentación y Convivencias': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Regalos y Premios': 'bg-rose-50 text-rose-700 border-rose-200',
  'Fotografía y Recuerdos': 'bg-cyan-50 text-cyan-700 border-cyan-200',
  'Imprevistos y Varios': 'bg-slate-100 text-slate-700 border-slate-200',
};

const RECEIPT_TYPES: ReceiptType[] = [
  'Boleta',
  'Factura',
  'Comprobante Transferencia',
  'Recibo Simple',
  'Otro',
];

const QUICK_EXPENSE_PRESETS: {
  concept: string;
  category: ExpenseCategory;
  defaultAmount?: number;
  icon: string;
}[] = [
  {
    concept: 'Torta, bebidas y snack convivencia',
    category: 'Alimentación y Convivencias',
    defaultAmount: 25000,
    icon: '🎂',
  },
  {
    concept: 'Furgón / Bus traslado paseo',
    category: 'Paseos y Transporte',
    defaultAmount: 120000,
    icon: '🚌',
  },
  {
    concept: 'Materiales decoración y cartulinas',
    category: 'Materiales y Decoración',
    defaultAmount: 15000,
    icon: '🎨',
  },
  {
    concept: 'Regalo y flores Día del Profesor',
    category: 'Regalos y Premios',
    defaultAmount: 30000,
    icon: '🎁',
  },
  {
    concept: 'Fotografías y cuadros de graduación',
    category: 'Fotografía y Recuerdos',
    defaultAmount: 85000,
    icon: '📸',
  },
  {
    concept: 'Artículos de botiquín y aseo para la sala',
    category: 'Imprevistos y Varios',
    defaultAmount: 18000,
    icon: '🩹',
  },
];

export const ExpensesManager: React.FC = () => {
  const {
    currentCourse,
    courseExpenses,
    courseStudents,
    addExpense,
    updateExpense,
    deleteExpense,
    currentUser,
  } = useApp();

  const conceptInputRef = useRef<HTMLInputElement>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all'); // 'all', 'PAGADO', 'CON_DEUDA'

  // Direct Registration Panel State
  const today = new Date().toISOString().split('T')[0];
  const [directConcept, setDirectConcept] = useState('');
  const [directAmount, setDirectAmount] = useState<number | ''>('');
  const [directCategory, setDirectCategory] = useState<ExpenseCategory>('Eventos y Celebraciones');
  const [directDate, setDirectDate] = useState(today);
  const [directResponsible, setDirectResponsible] = useState(
    currentCourse?.treasurer?.fullName || 'Tesorero/a del Curso'
  );
  const [directReceiptType, setDirectReceiptType] = useState<ReceiptType>('Boleta');
  const [directReceiptNumber, setDirectReceiptNumber] = useState('');
  const [directNotes, setDirectNotes] = useState('');
  const [isWithDebt, setIsWithDebt] = useState(false);
  const [directPaidAmount, setDirectPaidAmount] = useState<number | ''>('');
  const [directCreditorName, setDirectCreditorName] = useState('');
  const [directCreditorType, setDirectCreditorType] = useState<CreditorType>('PROVEEDOR');
  const [directDueDate, setDirectDueDate] = useState('');

  // Attachment State for Direct Entry Form
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const [directAttachment, setDirectAttachment] = useState<ExpenseAttachment | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);

  // Modal State for Viewing Attached Document
  const [selectedAttachmentExpense, setSelectedAttachmentExpense] = useState<{
    expense: CourseExpense;
    attachment: ExpenseAttachment;
  } | null>(null);

  // File Upload Helper Handlers
  const handleProcessFile = async (file: File, isEditMode = false) => {
    setAttachmentError(null);
    setIsProcessingFile(true);
    try {
      const att = await readFileAsAttachment(file);
      if (isEditMode && expenseToEdit) {
        setExpenseToEdit({ ...expenseToEdit, attachment: att });
      } else {
        setDirectAttachment(att);
      }
    } catch (err: any) {
      setAttachmentError(err.message || 'Error al cargar el documento.');
    } finally {
      setIsProcessingFile(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>, isEditMode = false) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleProcessFile(files[0], isEditMode);
    }
    // Clear input so same file can be re-selected if needed
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(false);
  };

  const handleDrop = (e: React.DragEvent, isEditMode = false) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleProcessFile(files[0], isEditMode);
    }
  };

  // UI feedback state
  const [lastRegisteredToast, setLastRegisteredToast] = useState<{
    concept: string;
    amount: number;
    hasAttachment?: boolean;
  } | null>(null);

  // Modal State for Editing / Viewing
  const [showEditModal, setShowEditModal] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<CourseExpense | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<CourseExpense | null>(null);

  // Total calculations
  const totalCollected = useMemo(() => {
    return courseStudents.reduce((acc, s) => {
      const records = Object.values(s.payments) as (typeof s.payments[keyof typeof s.payments])[];
      return (
        acc +
        records.reduce((sum, p) => (p && p.isPaid ? sum + (p.amount || 5000) : sum), 0)
      );
    }, 0);
  }, [courseStudents]);

  const totalExpenseAmount = useMemo(() => {
    return courseExpenses.reduce((acc, curr) => acc + curr.amount, 0);
  }, [courseExpenses]);

  const totalActualCashSpent = useMemo(() => {
    return courseExpenses.reduce((acc, curr) => {
      if (curr.paymentStatus === 'CON_DEUDA' || curr.paymentStatus === 'PARCIAL') {
        return acc + (curr.paidAmount || 0);
      }
      return acc + curr.amount;
    }, 0);
  }, [courseExpenses]);

  const totalDebtPending = useMemo(() => {
    return courseExpenses.reduce((acc, curr) => {
      if (curr.debtAmount !== undefined && curr.debtAmount > 0) {
        return acc + curr.debtAmount;
      }
      if (curr.paymentStatus === 'CON_DEUDA') {
        return acc + (curr.amount - (curr.paidAmount || 0));
      }
      return acc;
    }, 0);
  }, [courseExpenses]);

  const currentCashBalance = totalCollected - totalActualCashSpent;

  // Filtered Expenses
  const filteredExpenses = useMemo(() => {
    return courseExpenses.filter((exp) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        exp.concept.toLowerCase().includes(q) ||
        exp.responsible.toLowerCase().includes(q) ||
        (exp.creditorName && exp.creditorName.toLowerCase().includes(q)) ||
        (exp.receiptNumber && exp.receiptNumber.toLowerCase().includes(q)) ||
        (exp.notes && exp.notes.toLowerCase().includes(q));

      if (!matchSearch) return false;

      if (selectedCategory !== 'all' && exp.category !== selectedCategory) {
        return false;
      }

      if (selectedStatusFilter === 'PAGADO') {
        if (exp.paymentStatus === 'CON_DEUDA' || exp.paymentStatus === 'PARCIAL') return false;
      } else if (selectedStatusFilter === 'CON_DEUDA') {
        if (exp.paymentStatus !== 'CON_DEUDA' && exp.paymentStatus !== 'PARCIAL' && (!exp.debtAmount || exp.debtAmount <= 0)) {
          return false;
        }
      }

      return true;
    });
  }, [courseExpenses, searchQuery, selectedCategory, selectedStatusFilter]);

  // Handle Quick Presets
  const handleApplyPreset = (preset: typeof QUICK_EXPENSE_PRESETS[0]) => {
    setDirectConcept(preset.concept);
    setDirectCategory(preset.category);
    if (preset.defaultAmount) {
      setDirectAmount(preset.defaultAmount);
    }
    conceptInputRef.current?.focus();
  };

  // Add Amount Helpers
  const handleAddAmount = (addValue: number) => {
    setDirectAmount((prev) => {
      const current = typeof prev === 'number' ? prev : 0;
      return current + addValue;
    });
  };

  // Submit Direct Expense Registration
  const handleDirectSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!directConcept.trim()) {
      alert('Por favor ingrese el nombre o concepto del gasto.');
      conceptInputRef.current?.focus();
      return;
    }

    const numAmount = Number(directAmount);
    if (!numAmount || numAmount <= 0) {
      alert('Por favor ingrese un monto válido mayor a $0.');
      return;
    }

    let paymentStatus: ExpensePaymentStatus = 'PAGADO';
    let paidAmount = numAmount;
    let debtAmount = 0;

    if (isWithDebt) {
      const numPaid = directPaidAmount === '' ? 0 : Number(directPaidAmount);
      if (numPaid < 0 || numPaid > numAmount) {
        alert('El monto pagado no puede ser menor a 0 ni superior al monto total del gasto.');
        return;
      }
      paidAmount = numPaid;
      debtAmount = numAmount - numPaid;
      paymentStatus = debtAmount > 0 ? (paidAmount > 0 ? 'PARCIAL' : 'CON_DEUDA') : 'PAGADO';
    }

    // Add to state
    addExpense({
      courseId: currentCourse?.id || 'course-1',
      date: directDate || today,
      concept: directConcept.trim(),
      category: directCategory,
      amount: numAmount,
      responsible: directResponsible.trim() || 'Directiva',
      receiptType: directReceiptType,
      receiptNumber: directReceiptNumber.trim() || undefined,
      registeredBy: currentUser?.name || currentCourse?.treasurer?.fullName || 'Tesorero/a',
      notes: directNotes.trim() || undefined,
      attachment: directAttachment || undefined,
      paymentStatus,
      paidAmount,
      debtAmount,
      creditorName: isWithDebt ? (directCreditorName.trim() || directResponsible.trim() || 'Acreedor') : undefined,
      creditorType: isWithDebt ? directCreditorType : undefined,
      dueDate: isWithDebt && directDueDate ? directDueDate : undefined,
    });

    // Toast & Confetti
    setLastRegisteredToast({
      concept: directConcept.trim(),
      amount: numAmount,
      hasAttachment: !!directAttachment,
    });
    setTimeout(() => setLastRegisteredToast(null), 5000);

    confetti({
      particleCount: 50,
      spread: 50,
      origin: { y: 0.7 },
    });

    // Reset Form for next entry
    setDirectConcept('');
    setDirectAmount('');
    setDirectReceiptNumber('');
    setDirectNotes('');
    setDirectAttachment(null);
    setAttachmentError(null);
    setIsWithDebt(false);
    setDirectPaidAmount('');
    setDirectCreditorName('');
    setDirectDueDate('');

    // Re-focus concept input for smooth continuous entry
    setTimeout(() => {
      conceptInputRef.current?.focus();
    }, 100);
  };

  // Open Edit Modal
  const handleOpenEdit = (exp: CourseExpense) => {
    setExpenseToEdit(exp);
    setShowEditModal(true);
  };

  return (
    <div id="expenses-manager-section" className="space-y-6">
      {/* Toast Notification Banner on success */}
      {lastRegisteredToast && (
        <div className="bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-lg flex items-center justify-between animate-fade-in border border-emerald-500">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold">
              <Check className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold text-emerald-100 flex items-center gap-1.5">
                <span>¡Gasto Registrado Exitosamente!</span>
                {lastRegisteredToast.hasAttachment && (
                  <span className="bg-white/20 text-white text-[10px] px-1.5 py-0.2 rounded font-bold inline-flex items-center gap-1">
                    <Paperclip className="w-2.5 h-2.5" />
                    Con Comprobante Adjunto
                  </span>
                )}
              </p>
              <p className="text-sm font-bold">
                {lastRegisteredToast.concept} — {formatCLP(lastRegisteredToast.amount)}
              </p>
            </div>
          </div>
          <button
            onClick={() => setLastRegisteredToast(null)}
            className="text-emerald-200 hover:text-white p-1 rounded-md"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Banner / Summary Header */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-rose-50 text-rose-700 text-xs font-bold px-2.5 py-0.5 rounded-md border border-rose-200 flex items-center gap-1">
                <Receipt className="w-3.5 h-3.5" />
                Módulo de Gastos
              </span>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Ingreso & Registro de Gastos del Curso
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Ingresa el nombre del gasto y el monto asociado de cada compra, actividad o desembolso del {currentCourse?.name}.
            </p>
          </div>

          {/* Header Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              id="btn-export-expenses-excel"
              onClick={() => {
                if (currentCourse && courseExpenses.length > 0) {
                  exportExpensesToExcel(courseExpenses, currentCourse);
                }
              }}
              disabled={courseExpenses.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs sm:text-sm font-medium transition-colors border border-slate-200 disabled:opacity-50 shadow-xs"
              title="Descargar libro de gastos en Excel"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span>Exportar Planilla Excel</span>
            </button>
          </div>
        </div>

        {/* Live Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100">
          <div className="bg-rose-50/70 p-3 rounded-lg border border-rose-100">
            <span className="text-[11px] font-semibold text-rose-700 block">Total Gastos Comprometidos</span>
            <span className="text-base sm:text-xl font-black text-rose-950 font-mono">
              {formatCLP(totalExpenseAmount)}
            </span>
          </div>

          <div className="bg-emerald-50/70 p-3 rounded-lg border border-emerald-100">
            <span className="text-[11px] font-semibold text-emerald-700 block">Total Pagado en Efectivo</span>
            <span className="text-base sm:text-xl font-black text-emerald-950 font-mono">
              {formatCLP(totalActualCashSpent)}
            </span>
          </div>

          <div className="bg-amber-50/70 p-3 rounded-lg border border-amber-100">
            <span className="text-[11px] font-semibold text-amber-700 block">Saldo Pendiente / Deuda</span>
            <span className="text-base sm:text-xl font-black text-amber-950 font-mono">
              {formatCLP(totalDebtPending)}
            </span>
          </div>

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <span className="text-[11px] font-semibold text-slate-600 block">Saldo Disponible en Caja</span>
            <span
              className={`text-base sm:text-xl font-black font-mono ${
                currentCashBalance >= 0 ? 'text-blue-700' : 'text-rose-700'
              }`}
            >
              {formatCLP(currentCashBalance)}
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 📌 SECCIÓN DESTACADA: FORMULARIO DE INGRESO DE GASTO (NOMBRE + MONTO) */}
      {/* ========================================================================= */}
      <div
        id="expense-direct-entry-panel"
        className="bg-white rounded-xl shadow-xs border-2 border-blue-200/80 p-4 sm:p-6 transition-all"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Donde Ingresar el Gasto: Nombre y Monto Asociado
              </h3>
              <p className="text-xs text-slate-500">
                Completa los datos del gasto. Al pulsar registrar, se sumará automáticamente a la contabilidad del curso.
              </p>
            </div>
          </div>
          <span className="text-[11px] text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md font-medium border border-blue-100 self-start sm:self-center">
            ⚡ Ingreso Inmediato
          </span>
        </div>

        {/* Quick Concept Presets Chips */}
        <div className="mb-4">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Sugerencias Rápidas de Gastos Frecuentes (Haz clic para autocompletar):
          </label>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_EXPENSE_PRESETS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleApplyPreset(preset)}
                className="inline-flex items-center gap-1.5 text-xs bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 text-slate-700 px-2.5 py-1 rounded-md border border-slate-200 transition-colors"
              >
                <span>{preset.icon}</span>
                <span className="font-medium">{preset.concept}</span>
                {preset.defaultAmount && (
                  <span className="text-[10px] font-mono text-slate-400 font-semibold">
                    ({formatCLP(preset.defaultAmount)})
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Main Entry Form */}
        <form onSubmit={handleDirectSubmit} className="space-y-4">
          {/* Row 1: Nombre / Concepto (Left) + Monto Asociado (Right) - High Contrast Separation */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* 1. NOMBRE / CONCEPTO DEL GASTO (7 COLS) */}
            <div className="lg:col-span-7 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-blue-900">
                  <Tag className="w-3.5 h-3.5 text-blue-600" />
                  1. Nombre o Concepto del Gasto *
                </span>
                <span className="text-[10px] text-rose-500 font-semibold normal-case">Requerido</span>
              </label>
              <input
                ref={conceptInputRef}
                id="input-direct-expense-concept"
                type="text"
                required
                placeholder="Ej. Compra de bebidas y torta para el día del alumno..."
                value={directConcept}
                onChange={(e) => setDirectConcept(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-xs"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Escribe claramente en qué se utilizó el dinero o qué producto/servicio se adquirió.
              </p>
            </div>

            {/* 2. MONTO ASOCIADO EN CLP (5 COLS) */}
            <div className="lg:col-span-5 bg-rose-50/40 p-3.5 rounded-xl border border-rose-200/80">
              <label className="block text-xs font-bold text-rose-950 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-rose-900">
                  <Coins className="w-3.5 h-3.5 text-rose-600" />
                  2. Monto Asociado ($ CLP) *
                </span>
                {directAmount !== '' && Number(directAmount) > 0 && (
                  <span className="text-xs font-mono font-black text-rose-700 bg-rose-100 px-2 py-0.5 rounded">
                    {formatCLP(Number(directAmount))}
                  </span>
                )}
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm">
                  $
                </span>
                <input
                  id="input-direct-expense-amount"
                  type="number"
                  min="1"
                  step="100"
                  required
                  placeholder="Ej. 35000"
                  value={directAmount}
                  onChange={(e) =>
                    setDirectAmount(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  className="w-full pl-8 pr-3.5 py-2.5 text-base font-bold font-mono bg-white border border-rose-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 shadow-xs"
                />
              </div>

              {/* Quick Amount Adder Chips */}
              <div className="flex items-center gap-1 mt-2 overflow-x-auto">
                <span className="text-[10px] text-slate-500 font-medium whitespace-nowrap">Sumar:</span>
                {[5000, 10000, 20000, 50000].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleAddAmount(val)}
                    className="text-[10px] font-mono font-semibold px-2 py-0.5 bg-white hover:bg-rose-100 text-rose-800 rounded border border-rose-200 transition-colors whitespace-nowrap"
                  >
                    +{formatCLP(val)}
                  </button>
                ))}
                {directAmount !== '' && (
                  <button
                    type="button"
                    onClick={() => setDirectAmount('')}
                    className="text-[10px] font-semibold px-1.5 py-0.5 text-slate-400 hover:text-rose-600 transition-colors ml-auto"
                    title="Borrar monto"
                  >
                    Limpiar
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Row 2: Secondary Attributes Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
            {/* Categoría */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Categoría
              </label>
              <select
                id="select-direct-category"
                value={directCategory}
                onChange={(e) => setDirectCategory(e.target.value as ExpenseCategory)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Fecha del Gasto */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Fecha del Desembolso
              </label>
              <input
                id="input-direct-date"
                type="date"
                required
                value={directDate}
                onChange={(e) => setDirectDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Tipo de Documento */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Tipo Comprobante
              </label>
              <select
                id="select-direct-receipt-type"
                value={directReceiptType}
                onChange={(e) => setDirectReceiptType(e.target.value as ReceiptType)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500"
              >
                {RECEIPT_TYPES.map((rt) => (
                  <option key={rt} value={rt}>
                    {rt}
                  </option>
                ))}
              </select>
            </div>

            {/* N° Comprobante / Folio */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                N° Boleta / Folio (Opcional)
              </label>
              <input
                id="input-direct-receipt-number"
                type="text"
                placeholder="Ej. BOL-9481"
                value={directReceiptNumber}
                onChange={(e) => setDirectReceiptNumber(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 font-mono focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Row 3: Responsable + Observaciones + Condición de Deuda */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 pt-1">
            <div className="lg:col-span-4">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Proveedor / Responsable de la Compra
              </label>
              <input
                id="input-direct-responsible"
                type="text"
                placeholder="Ej. Librería Central / Mamá de Lucas"
                value={directResponsible}
                onChange={(e) => setDirectResponsible(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="lg:col-span-5">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Notas / Justificación (Opcional)
              </label>
              <input
                id="input-direct-notes"
                type="text"
                placeholder="Ej. Aprobado en reunión de apoderados del mes..."
                value={directNotes}
                onChange={(e) => setDirectNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Toggle: ¿Gasto con Deuda Pendiente? */}
            <div className="lg:col-span-3 flex items-end">
              <label
                htmlFor="toggle-with-debt"
                className={`w-full flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                  isWithDebt
                    ? 'bg-rose-50 border-rose-300 text-rose-900 font-semibold'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <HandCoins
                    className={`w-4 h-4 ${isWithDebt ? 'text-rose-600' : 'text-slate-400'}`}
                  />
                  <span>¿Tiene saldo por pagar / deuda?</span>
                </div>
                <input
                  id="toggle-with-debt"
                  type="checkbox"
                  checked={isWithDebt}
                  onChange={(e) => setIsWithDebt(e.target.checked)}
                  className="rounded text-rose-600 focus:ring-rose-500 h-4 w-4"
                />
              </label>
            </div>
          </div>

          {/* Conditional Debt Details Fields if isWithDebt is active */}
          {isWithDebt && (
            <div className="bg-rose-50/60 p-4 rounded-xl border border-rose-200 space-y-3 animate-fade-in">
              <div className="flex items-center gap-2 text-xs font-bold text-rose-900">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <span>Detalles del Saldo Pendiente y Acreedor:</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-rose-900 mb-1">
                    Monto Pagado a la Fecha ($ CLP)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={directPaidAmount}
                    onChange={(e) =>
                      setDirectPaidAmount(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    className="w-full px-3 py-1.5 bg-white border border-rose-300 rounded-lg text-slate-900 font-mono focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-rose-900 mb-1">
                    Nombre del Acreedor / Proveedor a pagar
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Distribuidora / Apoderada Reembolso"
                    value={directCreditorName}
                    onChange={(e) => setDirectCreditorName(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-rose-300 rounded-lg text-slate-900 focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-rose-900 mb-1">
                    Fecha Límite de Pago
                  </label>
                  <input
                    type="date"
                    value={directDueDate}
                    onChange={(e) => setDirectDueDate(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-rose-300 rounded-lg text-slate-900 focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Row 4: Adjuntar Documento de Respaldo / Evidencia (Opcional) */}
          <div className="pt-2 border-t border-slate-100/80">
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-blue-950 font-bold">
                <Paperclip className="w-3.5 h-3.5 text-blue-600" />
                Adjuntar Documento / Evidencia de Respaldo (Opcional)
              </span>
              <span className="text-[10px] text-slate-500 font-normal">
                Boleta, Factura, Recibo o Voucher (PNG, JPG, PDF máx. 10MB)
              </span>
            </label>

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/svg+xml,application/pdf"
              onChange={(e) => handleFileInputChange(e, false)}
              className="hidden"
              id="direct-file-input"
            />

            {directAttachment ? (
              /* Card showing the selected file */
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-blue-50/80 border border-blue-200 rounded-xl gap-3 animate-fade-in shadow-2xs">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-blue-600/10 text-blue-700 flex items-center justify-center shrink-0 border border-blue-200">
                    {directAttachment.fileType.startsWith('image/') ||
                    directAttachment.fileName.match(/\.(jpg|jpeg|png|webp|svg)$/i) ? (
                      <ImageIcon className="w-5 h-5 text-blue-600" />
                    ) : (
                      <FileText className="w-5 h-5 text-rose-600" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-900 truncate max-w-xs sm:max-w-sm">
                        {directAttachment.fileName}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-mono font-semibold">
                        {formatAttachmentSize(directAttachment.fileSize)}
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-700 font-medium flex items-center gap-1 mt-0.5">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Documento listo para guardar con el gasto
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedAttachmentExpense({
                        expense: {
                          id: 'temp-preview',
                          courseId: currentCourse?.id || 'course-1',
                          date: directDate || today,
                          concept: directConcept || 'Nuevo Gasto en Registro',
                          category: directCategory,
                          amount: Number(directAmount) || 0,
                          responsible: directResponsible || 'Directiva',
                          receiptType: directReceiptType,
                          receiptNumber: directReceiptNumber,
                          registeredBy: currentUser?.name || 'Tesorero/a',
                          attachment: directAttachment,
                        },
                        attachment: directAttachment,
                      })
                    }
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-blue-700 text-xs font-semibold border border-blue-200 transition-colors shadow-2xs cursor-pointer"
                    title="Ver vista previa del documento"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Ver Previa</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors cursor-pointer"
                    title="Cambiar documento"
                  >
                    <Upload className="w-3.5 h-3.5 text-slate-500" />
                    <span>Cambiar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDirectAttachment(null)}
                    className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold border border-rose-200 transition-colors cursor-pointer"
                    title="Eliminar documento adjunto"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Quitar</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Dropzone area to select file */
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, false)}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-3 sm:p-3.5 text-center cursor-pointer transition-all ${
                  isDraggingFile
                    ? 'border-blue-500 bg-blue-50/80 scale-[1.005]'
                    : 'border-slate-300 hover:border-blue-400 bg-slate-50/60 hover:bg-blue-50/30'
                }`}
              >
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5">
                  <div className="flex items-center gap-3 text-left">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                      <Upload className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        {isDraggingFile
                          ? 'Suelta el archivo aquí para adjuntarlo'
                          : 'Haz clic aquí o arrastra un comprobante para adjuntarlo (Opcional)'}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Foto de boleta, factura en PDF, recibo o comprobante de transferencia bancaria
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 px-3 py-1.5 bg-white hover:bg-blue-50 text-blue-700 text-xs font-bold rounded-lg border border-blue-200 shadow-2xs inline-flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5" />
                    Examinar Archivo
                  </span>
                </div>
              </div>
            )}

            {attachmentError && (
              <div className="text-xs text-rose-600 font-medium flex items-center gap-1.5 mt-1.5 animate-fade-in">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{attachmentError}</span>
              </div>
            )}
          </div>

          {/* Form Action Submit Button */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
            <div className="text-xs text-slate-500 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>
                Al registrar, se actualizará el balance en tiempo real y quedará reflejado en la planilla.
              </span>
            </div>

            <button
              id="btn-submit-direct-expense"
              type="submit"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold transition-all shadow-md shadow-blue-600/20 active:scale-98"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Gasto</span>
            </button>
          </div>
        </form>
      </div>

      {/* ========================================================================= */}
      {/* 📋 LISTADO Y PLANILLA DE GASTOS REGISTRADOS */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        {/* Filters and Search Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="input-search-expenses"
              type="text"
              placeholder="Buscar por nombre, proveedor, boleta o nota..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-xs"
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

          {/* Status Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
            <button
              onClick={() => setSelectedStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
                selectedStatusFilter === 'all'
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Todos ({courseExpenses.length})
            </button>
            <button
              onClick={() => setSelectedStatusFilter('PAGADO')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
                selectedStatusFilter === 'PAGADO'
                  ? 'bg-emerald-700 text-white font-semibold'
                  : 'bg-white text-emerald-700 hover:bg-emerald-50 border border-emerald-200'
              }`}
            >
              🟢 Pagados al 100%
            </button>
            <button
              onClick={() => setSelectedStatusFilter('CON_DEUDA')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
                selectedStatusFilter === 'CON_DEUDA'
                  ? 'bg-rose-700 text-white font-semibold'
                  : 'bg-white text-rose-700 hover:bg-rose-50 border border-rose-200'
              }`}
            >
              🔴 Con Saldo Pendiente
            </button>
          </div>
        </div>

        {/* Category Pills Strip */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors whitespace-nowrap ${
              selectedCategory === 'all'
                ? 'bg-blue-600 text-white font-semibold'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Todas las categorías
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white font-semibold shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Table of Registered Expenses */}
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[950px]">
              <thead>
                <tr className="bg-slate-900 text-white text-xs uppercase tracking-wider font-semibold">
                  <th className="py-3 px-3 w-10 text-center">#</th>
                  <th className="py-3 px-3 min-w-[100px]">Fecha</th>
                  <th className="py-3 px-3 min-w-[260px]">Nombre / Concepto del Gasto</th>
                  <th className="py-3 px-3 min-w-[150px]">Categoría</th>
                  <th className="py-3 px-3 text-right min-w-[130px]">Monto Asociado ($)</th>
                  <th className="py-3 px-3 min-w-[160px]">Proveedor / Responsable</th>
                  <th className="py-3 px-3 min-w-[140px]">Documento & Folio</th>
                  <th className="py-3 px-3 text-center min-w-[110px]">Estado</th>
                  <th className="py-3 px-3 text-center min-w-[90px]">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                {filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-500">
                      <div className="max-w-md mx-auto space-y-3">
                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                          <Receipt className="w-6 h-6" />
                        </div>
                        <p className="text-sm font-medium text-slate-700">
                          {courseExpenses.length === 0
                            ? 'Aún no se han registrado gastos para este curso.'
                            : 'No se encontraron gastos con los filtros aplicados.'}
                        </p>
                        <p className="text-xs text-slate-500">
                          Utiliza el formulario de arriba para ingresar el nombre del gasto y el monto asociado.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredExpenses.map((exp, idx) => {
                    const badgeClass = CATEGORY_COLORS[exp.category] || 'bg-slate-100 text-slate-800';
                    const hasDebt =
                      exp.paymentStatus === 'CON_DEUDA' ||
                      exp.paymentStatus === 'PARCIAL' ||
                      (exp.debtAmount !== undefined && exp.debtAmount > 0);

                    return (
                      <tr
                        key={exp.id}
                        className="hover:bg-slate-50/80 transition-colors group"
                      >
                        {/* Index */}
                        <td className="py-3 px-3 text-center text-slate-400 font-mono text-xs">
                          {idx + 1}
                        </td>

                        {/* Date */}
                        <td className="py-3 px-3 text-slate-700 whitespace-nowrap font-medium">
                          {formatDate(exp.date)}
                        </td>

                        {/* Concept & Notes */}
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900 text-sm">
                            {exp.concept}
                          </div>
                          {exp.notes && (
                            <div className="text-[11px] text-slate-500 mt-0.5 italic">
                              {exp.notes}
                            </div>
                          )}
                        </td>

                        {/* Category Badge */}
                        <td className="py-3 px-3">
                          <span
                            className={`inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${badgeClass}`}
                          >
                            {exp.category}
                          </span>
                        </td>

                        {/* Associated Amount */}
                        <td className="py-3 px-3 text-right font-black text-rose-700 font-mono text-sm sm:text-base">
                          {formatCLP(exp.amount)}
                        </td>

                        {/* Responsible / Provider */}
                        <td className="py-3 px-3 text-slate-700">
                          <div className="font-medium text-slate-800">{exp.responsible}</div>
                          {exp.registeredBy && (
                            <span className="text-[10px] text-slate-400 block">
                              Reg. por {exp.registeredBy}
                            </span>
                          )}
                        </td>

                        {/* Receipt Info & Document Attachment */}
                        <td className="py-3 px-3">
                          <span className="text-slate-700 font-medium">{exp.receiptType}</span>
                          {exp.receiptNumber && (
                            <span className="block font-mono text-[11px] text-slate-500 font-semibold">
                              N° {exp.receiptNumber}
                            </span>
                          )}
                          {exp.attachment ? (
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedAttachmentExpense({
                                  expense: exp,
                                  attachment: exp.attachment!,
                                })
                              }
                              className="mt-1.5 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[11px] border border-blue-200 hover:border-blue-300 transition-all shadow-2xs cursor-pointer group-hover:bg-blue-100/90"
                              title={`Ver documento adjunto: ${exp.attachment.fileName} (${formatAttachmentSize(exp.attachment.fileSize)})`}
                            >
                              <Paperclip className="w-3 h-3 text-blue-600 shrink-0" />
                              <span className="truncate max-w-[110px]">
                                {exp.attachment.fileType.startsWith('image/') ||
                                exp.attachment.fileName.match(/\.(jpg|jpeg|png|webp|svg)$/i)
                                  ? 'Ver Boleta'
                                  : 'Ver PDF'}
                              </span>
                              <span className="text-[9px] bg-blue-200/80 text-blue-900 px-1 py-0.2 rounded font-mono shrink-0">
                                {formatAttachmentSize(exp.attachment.fileSize)}
                              </span>
                            </button>
                          ) : (
                            <span className="mt-1 text-[10px] text-slate-400 block italic">
                              Sin documento
                            </span>
                          )}
                        </td>

                        {/* Payment Status Badge */}
                        <td className="py-3 px-3 text-center">
                          {hasDebt ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                              <AlertCircle className="w-3 h-3 text-rose-600" />
                              Deuda: {formatCLP(exp.debtAmount || (exp.amount - (exp.paidAmount || 0)))}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Pagado 100%
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleOpenEdit(exp)}
                              className="p-1.5 text-slate-400 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                              title="Editar gasto"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setExpenseToDelete(exp)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                              title="Eliminar gasto"
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
      </div>

      {/* Edit Expense Modal */}
      {showEditModal && expenseToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden my-auto animate-scale-up">
            {/* Header */}
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">
                    Modificar Registro de Gasto
                  </h3>
                  <p className="text-xs text-slate-400">
                    {currentCourse?.name} — Actualizar Nombre y Monto Asociado
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setExpenseToEdit(null);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!expenseToEdit.concept.trim() || !expenseToEdit.amount || expenseToEdit.amount <= 0) return;

                updateExpense(expenseToEdit.id, {
                  date: expenseToEdit.date,
                  concept: expenseToEdit.concept.trim(),
                  category: expenseToEdit.category,
                  amount: Number(expenseToEdit.amount),
                  responsible: expenseToEdit.responsible.trim() || 'Directiva',
                  receiptType: expenseToEdit.receiptType,
                  receiptNumber: expenseToEdit.receiptNumber?.trim() || undefined,
                  notes: expenseToEdit.notes?.trim() || undefined,
                  attachment: expenseToEdit.attachment || undefined,
                  paymentStatus: expenseToEdit.paymentStatus,
                  paidAmount: expenseToEdit.paidAmount,
                  debtAmount: expenseToEdit.debtAmount,
                  creditorName: expenseToEdit.creditorName?.trim() || undefined,
                });

                setShowEditModal(false);
                setExpenseToEdit(null);
              }}
              className="p-5 space-y-4 text-xs sm:text-sm"
            >
              {/* Concept */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nombre / Concepto del Gasto *
                </label>
                <input
                  type="text"
                  required
                  value={expenseToEdit.concept}
                  onChange={(e) =>
                    setExpenseToEdit({ ...expenseToEdit, concept: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Amount & Date Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Monto Asociado ($ CLP) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={expenseToEdit.amount}
                    onChange={(e) =>
                      setExpenseToEdit({
                        ...expenseToEdit,
                        amount: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 font-bold font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Fecha del Gasto *
                  </label>
                  <input
                    type="date"
                    required
                    value={expenseToEdit.date}
                    onChange={(e) =>
                      setExpenseToEdit({ ...expenseToEdit, date: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Categoría
                </label>
                <select
                  value={expenseToEdit.category}
                  onChange={(e) =>
                    setExpenseToEdit({
                      ...expenseToEdit,
                      category: e.target.value as ExpenseCategory,
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500 bg-white"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Responsible / Provider */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Proveedor / Responsable
                </label>
                <input
                  type="text"
                  value={expenseToEdit.responsible}
                  onChange={(e) =>
                    setExpenseToEdit({
                      ...expenseToEdit,
                      responsible: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Receipt Type & Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tipo de Comprobante
                  </label>
                  <select
                    value={expenseToEdit.receiptType}
                    onChange={(e) =>
                      setExpenseToEdit({
                        ...expenseToEdit,
                        receiptType: e.target.value as ReceiptType,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500 bg-white"
                  >
                    {RECEIPT_TYPES.map((rt) => (
                      <option key={rt} value={rt}>
                        {rt}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    N° Boleta / Folio
                  </label>
                  <input
                    type="text"
                    value={expenseToEdit.receiptNumber || ''}
                    onChange={(e) =>
                      setExpenseToEdit({
                        ...expenseToEdit,
                        receiptNumber: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Observaciones
                </label>
                <textarea
                  rows={2}
                  value={expenseToEdit.notes || ''}
                  onChange={(e) =>
                    setExpenseToEdit({
                      ...expenseToEdit,
                      notes: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Document Attachment Field in Edit Modal */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5 text-blue-600" />
                    Documento de Respaldo / Evidencia
                  </span>
                  <span className="text-[10px] text-slate-400">Opcional</span>
                </div>

                <input
                  ref={editFileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/svg+xml,application/pdf"
                  onChange={(e) => handleFileInputChange(e, true)}
                  className="hidden"
                />

                {expenseToEdit.attachment ? (
                  <div className="flex items-center justify-between p-2.5 bg-blue-50/80 border border-blue-200 rounded-lg gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-blue-600/10 text-blue-700 flex items-center justify-center shrink-0">
                        {expenseToEdit.attachment.fileType.startsWith('image/') ||
                        expenseToEdit.attachment.fileName.match(/\.(jpg|jpeg|png|webp|svg)$/i) ? (
                          <ImageIcon className="w-4 h-4 text-blue-600" />
                        ) : (
                          <FileText className="w-4 h-4 text-rose-600" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-800 truncate max-w-[200px]">
                          {expenseToEdit.attachment.fileName}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {formatAttachmentSize(expenseToEdit.attachment.fileSize)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedAttachmentExpense({
                            expense: expenseToEdit,
                            attachment: expenseToEdit.attachment!,
                          })
                        }
                        className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded"
                        title="Ver comprobante"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => editFileInputRef.current?.click()}
                        className="p-1 text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded"
                        title="Cambiar documento"
                      >
                        <Upload className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setExpenseToEdit({ ...expenseToEdit, attachment: undefined })}
                        className="p-1 text-rose-600 hover:text-rose-800 hover:bg-rose-100 rounded"
                        title="Eliminar documento adjunto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => editFileInputRef.current?.click()}
                    className="w-full py-2 px-3 border border-dashed border-slate-300 hover:border-blue-400 bg-white hover:bg-blue-50/40 rounded-lg text-xs font-semibold text-blue-700 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Adjuntar Foto de Boleta o PDF</span>
                  </button>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setExpenseToEdit(null);
                  }}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Expense Dialog */}
      {expenseToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-5 border border-slate-200">
            <h3 className="text-base font-bold text-slate-800">
              ¿Eliminar Registro de Gasto?
            </h3>
            <p className="text-xs text-slate-600 mt-2">
              Se eliminará el registro de <strong>{expenseToDelete.concept}</strong> por un monto de <strong>{formatCLP(expenseToDelete.amount)}</strong>.
            </p>
            <div className="flex justify-end gap-2 mt-5">
              <button
                type="button"
                onClick={() => setExpenseToDelete(null)}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                id="btn-confirm-delete-expense"
                type="button"
                onClick={() => {
                  deleteExpense(expenseToDelete.id);
                  setExpenseToDelete(null);
                }}
                className="px-3 py-1.5 text-xs font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs"
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Attachment Full Preview Modal */}
      {selectedAttachmentExpense && (
        <ExpenseAttachmentModal
          expense={selectedAttachmentExpense.expense}
          attachment={selectedAttachmentExpense.attachment}
          onClose={() => setSelectedAttachmentExpense(null)}
        />
      )}
    </div>
  );
};
