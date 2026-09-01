import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  Edit2,
  Eye,
  FileSpreadsheet,
  FileText,
  Filter,
  HandCoins,
  History,
  Layers,
  Phone,
  Plus,
  Printer,
  Receipt,
  RotateCcw,
  Search,
  Tag,
  Trash2,
  User,
  UserCheck,
  Wallet,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  CourseExpense,
  CreditorType,
  ExpenseCategory,
  ExpensePaymentStatus,
  PaymentMethod,
  ReceiptType,
} from '../types';
import {
  exportExpensesDebtToExcel,
  formatCLP,
  formatDate,
} from '../utils/formatters';

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

const CREDITOR_TYPES: { id: CreditorType; label: string; icon: string }[] = [
  { id: 'PROVEEDOR', label: 'Proveedor / Factura Comercial', icon: '🏢' },
  { id: 'APODERADO_REEMBOLSO', label: 'Apoderado/a (Reembolso)', icon: '👤' },
  { id: 'DIRECTIVA', label: 'Directiva / Tesorería', icon: '🎓' },
  { id: 'OTRO', label: 'Otro Acreedor', icon: '📌' },
];

export const ExpensesDebtDetail: React.FC = () => {
  const {
    currentCourse,
    courseExpenses,
    addExpense,
    updateExpense,
    deleteExpense,
    addExpenseAbono,
    settleExpenseDebt,
    currentUser,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all'); // 'all', 'CON_DEUDA', 'PARCIAL', 'PAGADO', 'PENDING_ANY'
  const [creditorFilter, setCreditorFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'debt_desc' | 'date_desc' | 'due_date' | 'amount_desc'>('debt_desc');

  // Modals state
  const [showFormModal, setShowFormModal] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<CourseExpense | null>(null);
  const [showAbonoModal, setShowAbonoModal] = useState(false);
  const [expenseForAbono, setExpenseForAbono] = useState<CourseExpense | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [expenseForHistory, setExpenseForHistory] = useState<CourseExpense | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<CourseExpense | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Form State for Expense Add/Edit
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(today);
  const [concept, setConcept] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Eventos y Celebraciones');
  const [amount, setAmount] = useState<number | ''>('');
  const [hasDebt, setHasDebt] = useState(false);
  const [paidAmount, setPaidAmount] = useState<number | ''>('');
  const [creditorType, setCreditorType] = useState<CreditorType>('PROVEEDOR');
  const [creditorName, setCreditorName] = useState('');
  const [creditorContact, setCreditorContact] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [responsible, setResponsible] = useState('');
  const [receiptType, setReceiptType] = useState<ReceiptType>('Boleta');
  const [receiptNumber, setReceiptNumber] = useState('');
  const [notes, setNotes] = useState('');

  // Abono Form State
  const [abonoAmount, setAbonoAmount] = useState<number | ''>('');
  const [abonoDate, setAbonoDate] = useState(today);
  const [abonoMethod, setAbonoMethod] = useState<PaymentMethod>('Transferencia');
  const [abonoReference, setAbonoReference] = useState('');
  const [abonoNotes, setAbonoNotes] = useState('');

  // Helper calculations for an expense
  const getExpenseMetrics = (e: CourseExpense) => {
    const total = e.amount || 0;
    const paid =
      e.paidAmount !== undefined
        ? e.paidAmount
        : e.paymentStatus === 'CON_DEUDA'
        ? 0
        : total;
    const debt = e.debtAmount !== undefined ? e.debtAmount : Math.max(0, total - paid);
    const status: ExpensePaymentStatus =
      debt === 0 || e.paymentStatus === 'PAGADO'
        ? 'PAGADO'
        : paid > 0
        ? 'PARCIAL'
        : 'CON_DEUDA';
    const percentPaid = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;
    return { total, paid, debt, status, percentPaid };
  };

  // Global KPI aggregates
  const totals = useMemo(() => {
    let totalCommitted = 0;
    let totalPaid = 0;
    let totalDebt = 0;
    let countWithDebt = 0;
    let countReembolsos = 0;
    let countProveedores = 0;

    courseExpenses.forEach((e) => {
      const { total, paid, debt, status } = getExpenseMetrics(e);
      totalCommitted += total;
      totalPaid += paid;
      totalDebt += debt;

      if (debt > 0 || status !== 'PAGADO') {
        countWithDebt++;
        if (e.creditorType === 'APODERADO_REEMBOLSO') {
          countReembolsos++;
        } else {
          countProveedores++;
        }
      }
    });

    const percentDebt = totalCommitted > 0 ? Math.round((totalDebt / totalCommitted) * 100) : 0;

    return {
      totalCommitted,
      totalPaid,
      totalDebt,
      countWithDebt,
      countReembolsos,
      countProveedores,
      percentDebt,
      totalCount: courseExpenses.length,
    };
  }, [courseExpenses]);

  // Filtered and Sorted Expenses
  const filteredExpenses = useMemo(() => {
    return courseExpenses
      .filter((exp) => {
        const { status, debt } = getExpenseMetrics(exp);

        // Status Filter
        if (statusFilter === 'PENDING_ANY' && debt === 0) return false;
        if (statusFilter === 'CON_DEUDA' && status !== 'CON_DEUDA') return false;
        if (statusFilter === 'PARCIAL' && status !== 'PARCIAL') return false;
        if (statusFilter === 'PAGADO' && status !== 'PAGADO') return false;

        // Creditor Filter
        if (creditorFilter !== 'all' && exp.creditorType !== creditorFilter) {
          return false;
        }

        // Category Filter
        if (categoryFilter !== 'all' && exp.category !== categoryFilter) {
          return false;
        }

        // Search Query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const match =
            exp.concept.toLowerCase().includes(q) ||
            exp.responsible.toLowerCase().includes(q) ||
            (exp.creditorName && exp.creditorName.toLowerCase().includes(q)) ||
            (exp.creditorContact && exp.creditorContact.toLowerCase().includes(q)) ||
            (exp.receiptNumber && exp.receiptNumber.toLowerCase().includes(q)) ||
            (exp.notes && exp.notes.toLowerCase().includes(q));
          if (!match) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const mA = getExpenseMetrics(a);
        const mB = getExpenseMetrics(b);

        if (sortBy === 'debt_desc') {
          return mB.debt - mA.debt || new Date(b.date).getTime() - new Date(a.date).getTime();
        }
        if (sortBy === 'date_desc') {
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        }
        if (sortBy === 'due_date') {
          const dueA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
          const dueB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
          return dueA - dueB;
        }
        if (sortBy === 'amount_desc') {
          return mB.total - mA.total;
        }
        return 0;
      });
  }, [courseExpenses, statusFilter, creditorFilter, categoryFilter, searchQuery, sortBy]);

  // Open Add Modal
  const openAddModal = (presetDebt = false) => {
    setExpenseToEdit(null);
    setDate(today);
    setConcept('');
    setCategory('Eventos y Celebraciones');
    setAmount('');
    setHasDebt(presetDebt);
    setPaidAmount(presetDebt ? 0 : '');
    setCreditorType('PROVEEDOR');
    setCreditorName('');
    setCreditorContact('');
    setDueDate('');
    setResponsible(currentUser?.name || currentCourse?.treasurer?.fullName || 'Tesorero/a');
    setReceiptType('Boleta');
    setReceiptNumber('');
    setNotes('');
    setShowFormModal(true);
  };

  // Open Edit Modal
  const openEditModal = (exp: CourseExpense) => {
    const { paid, debt } = getExpenseMetrics(exp);
    setExpenseToEdit(exp);
    setDate(exp.date);
    setConcept(exp.concept);
    setCategory(exp.category);
    setAmount(exp.amount);
    setHasDebt(debt > 0 || exp.paymentStatus === 'CON_DEUDA' || exp.paymentStatus === 'PARCIAL');
    setPaidAmount(paid);
    setCreditorType(exp.creditorType || 'PROVEEDOR');
    setCreditorName(exp.creditorName || exp.responsible || '');
    setCreditorContact(exp.creditorContact || '');
    setDueDate(exp.dueDate || '');
    setResponsible(exp.responsible);
    setReceiptType(exp.receiptType);
    setReceiptNumber(exp.receiptNumber || '');
    setNotes(exp.notes || '');
    setShowFormModal(true);
  };

  // Save Expense Handler
  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!concept.trim() || !amount || Number(amount) <= 0) return;

    const total = Number(amount);
    let finalPaid: number;
    if (!hasDebt) {
      finalPaid = total;
    } else {
      finalPaid = paidAmount === '' ? 0 : Math.min(total, Math.max(0, Number(paidAmount)));
    }
    const finalDebt = Math.max(0, total - finalPaid);
    const finalStatus: ExpensePaymentStatus =
      finalDebt === 0 ? 'PAGADO' : finalPaid > 0 ? 'PARCIAL' : 'CON_DEUDA';

    const expensePayload: Omit<CourseExpense, 'id'> = {
      courseId: currentCourse?.id || 'course-1',
      date,
      concept: concept.trim(),
      category,
      amount: total,
      paidAmount: finalPaid,
      debtAmount: finalDebt,
      paymentStatus: finalStatus,
      creditorName: creditorName.trim() || (hasDebt ? responsible.trim() : undefined),
      creditorType: hasDebt ? creditorType : undefined,
      creditorContact: creditorContact.trim() || undefined,
      dueDate: hasDebt && dueDate ? dueDate : undefined,
      responsible: responsible.trim() || creditorName.trim() || 'Directiva',
      receiptType,
      receiptNumber: receiptNumber.trim() || undefined,
      registeredBy: currentUser?.name || 'Tesorero/a',
      notes: notes.trim() || undefined,
    };

    if (expenseToEdit) {
      updateExpense(expenseToEdit.id, expensePayload);
    } else {
      addExpense(expensePayload);
    }

    setShowFormModal(false);
  };

  // Open Abono Modal
  const openAbonoModal = (exp: CourseExpense) => {
    const { debt } = getExpenseMetrics(exp);
    setExpenseForAbono(exp);
    setAbonoAmount(debt > 0 ? debt : '');
    setAbonoDate(today);
    setAbonoMethod('Transferencia');
    setAbonoReference('');
    setAbonoNotes('');
    setShowAbonoModal(true);
  };

  // Submit Abono
  const handleSaveAbono = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseForAbono || !abonoAmount || Number(abonoAmount) <= 0) return;

    addExpenseAbono(expenseForAbono.id, {
      amount: Number(abonoAmount),
      date: abonoDate,
      paymentMethod: abonoMethod,
      referenceNumber: abonoReference.trim() || undefined,
      notes: abonoNotes.trim() || undefined,
    });

    setShowAbonoModal(false);
  };

  // Open History Modal
  const openHistoryModal = (exp: CourseExpense) => {
    setExpenseForHistory(exp);
    setShowHistoryModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                <HandCoins className="w-3.5 h-3.5" />
                Formato Especial de Auditoría
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {currentCourse?.name} • {currentCourse?.year}
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Receipt className="w-7 h-7 text-rose-600" />
              Detalle de Gastos & Cuentas por Pagar (Con Deuda)
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
              Control transparente de compromisos económicos, facturas de proveedores y reembolsos pendientes a apoderados que pagaron de su bolsillo.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              id="btn-export-debt-excel"
              type="button"
              onClick={() => {
                if (currentCourse) {
                  exportExpensesDebtToExcel(courseExpenses, currentCourse);
                }
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold text-xs transition-colors shadow-xs"
              title="Descargar planilla Excel con columnas de Deuda y Acreedores"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Exportar Planilla (Con Deuda)</span>
            </button>

            <button
              id="btn-print-rendicion"
              type="button"
              onClick={() => setShowPrintModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 font-semibold text-xs transition-colors shadow-xs"
              title="Vista de impresión para asamblea de apoderados"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>Informe Asamblea</span>
            </button>

            <button
              id="btn-add-expense-with-debt"
              type="button"
              onClick={() => openAddModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-all shadow-sm active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Gasto con Deuda</span>
            </button>
          </div>
        </div>

        {/* 4 Financial KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100">
          {/* Total Gastos Comprometidos */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider">Total Gastos Comprometidos</span>
              <Layers className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-xl font-black text-slate-900">
              {formatCLP(totals.totalCommitted)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {totals.totalCount} registros de gasto totales
            </div>
          </div>

          {/* Total Pagado / Rendido */}
          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-4">
            <div className="flex items-center justify-between text-emerald-800 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider">Total Pagado / Rendido</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-xl font-black text-emerald-900">
              {formatCLP(totals.totalPaid)}
            </div>
            <div className="text-[11px] text-emerald-700 mt-1 flex items-center justify-between">
              <span>Dinero desembolsado</span>
              <span className="font-bold">
                {totals.totalCommitted > 0
                  ? Math.round((totals.totalPaid / totals.totalCommitted) * 100)
                  : 100}
                %
              </span>
            </div>
          </div>

          {/* Saldo Total Con Deuda (Highlight) */}
          <div className={`rounded-xl p-4 border transition-all ${
            totals.totalDebt > 0
              ? 'bg-rose-50/90 border-rose-300 ring-2 ring-rose-200/50'
              : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center justify-between mb-1">
              <span className={`text-xs font-bold uppercase tracking-wider ${
                totals.totalDebt > 0 ? 'text-rose-800' : 'text-slate-500'
              }`}>
                Saldo Total Con Deuda
              </span>
              <AlertTriangle className={`w-4 h-4 ${
                totals.totalDebt > 0 ? 'text-rose-600 animate-pulse' : 'text-slate-400'
              }`} />
            </div>
            <div className={`text-xl font-black ${
              totals.totalDebt > 0 ? 'text-rose-700' : 'text-slate-700'
            }`}>
              {formatCLP(totals.totalDebt)}
            </div>
            <div className={`text-[11px] mt-1 font-semibold ${
              totals.totalDebt > 0 ? 'text-rose-700' : 'text-slate-500'
            }`}>
              {totals.totalDebt > 0 ? '⚠️ Pasivos pendientes de pago' : '✅ Sin deudas pendientes'}
            </div>
          </div>

          {/* Gastos con Deuda Activa */}
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-4">
            <div className="flex items-center justify-between text-amber-800 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider">Cuentas por Liquidar</span>
              <HandCoins className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-xl font-black text-amber-900">
              {totals.countWithDebt} <span className="text-xs font-normal text-amber-700">gastos</span>
            </div>
            <div className="text-[11px] text-amber-800 mt-1 flex items-center justify-between">
              <span>{totals.countReembolsos} apoderados</span>
              <span>•</span>
              <span>{totals.countProveedores} proveedores</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3">
        {/* Status Filters */}
        <div className="flex flex-wrap items-center gap-1.5 pb-2 border-b border-slate-100 text-xs">
          <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] mr-2 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Estado:
          </span>

          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todos ({courseExpenses.length})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('PENDING_ANY')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
              statusFilter === 'PENDING_ANY'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Con Deuda Pendiente ({totals.countWithDebt})</span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('PARCIAL')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              statusFilter === 'PARCIAL'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            Pago Parcial ({courseExpenses.filter((e) => getExpenseMetrics(e).status === 'PARCIAL').length})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('PAGADO')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              statusFilter === 'PAGADO'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            Pagados 100% ({courseExpenses.filter((e) => getExpenseMetrics(e).status === 'PAGADO').length})
          </button>
        </div>

        {/* Search, Creditor and Category Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por concepto, acreedor, boleta..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-rose-500 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Creditor Type Filter */}
          <select
            value={creditorFilter}
            onChange={(e) => setCreditorFilter(e.target.value)}
            className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-rose-500 font-medium text-slate-700 cursor-pointer"
          >
            <option value="all">🏢 Todos los Tipos de Acreedor</option>
            <option value="APODERADO_REEMBOLSO">👤 Reembolso a Apoderado/a</option>
            <option value="PROVEEDOR">🏢 Proveedor Comercial (Facturas/Boletas)</option>
            <option value="DIRECTIVA">🎓 Directiva / Tesorería</option>
            <option value="OTRO">📌 Otros Acreedores</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-rose-500 font-medium text-slate-700 cursor-pointer"
          >
            <option value="all">🏷️ Todas las Categorías</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Sorting */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-rose-500 font-semibold text-slate-800 cursor-pointer"
          >
            <option value="debt_desc">🔻 Mayor Deuda Pendiente Primero</option>
            <option value="due_date">⏰ Próximos a Vencer</option>
            <option value="date_desc">📅 Fecha Más Reciente</option>
            <option value="amount_desc">💰 Mayor Monto Total</option>
          </select>
        </div>
      </div>

      {/* Main Expense Table in "Con Deuda" format */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900">
              Planilla Detallada de Gastos con Deuda y Pagos
            </h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-200 text-slate-700">
              {filteredExpenses.length} de {courseExpenses.length}
            </span>
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Mostrando pasivos y pagos liquidados
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-100/80 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-3.5">Fecha / Vencimiento</th>
                <th className="py-3 px-3.5">Concepto & Categoría</th>
                <th className="py-3 px-3.5">Acreedor / Proveedor</th>
                <th className="py-3 px-3.5">Comprobante</th>
                <th className="py-3 px-3.5 text-right">Monto Total</th>
                <th className="py-3 px-3.5 text-right">Monto Pagado</th>
                <th className="py-3 px-3.5 text-right bg-rose-50/40 text-rose-900">Saldo Deuda</th>
                <th className="py-3 px-3.5 text-center">Estado</th>
                <th className="py-3 px-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <Receipt className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600">No se encontraron gastos con los filtros aplicados</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Intenta cambiar los términos de búsqueda o estado de pago
                    </p>
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => {
                  const { total, paid, debt, status, percentPaid } = getExpenseMetrics(exp);
                  const isOverdue = exp.dueDate && new Date(exp.dueDate) < new Date(today) && debt > 0;

                  return (
                    <tr
                      key={exp.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        debt > 0 ? 'bg-rose-50/20' : ''
                      }`}
                    >
                      {/* Fecha / Vencimiento */}
                      <td className="py-3.5 px-3.5 whitespace-nowrap">
                        <div className="font-bold text-slate-900 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {formatDate(exp.date)}
                        </div>
                        {exp.dueDate && debt > 0 ? (
                          <div
                            className={`text-[10px] font-semibold flex items-center gap-1 mt-0.5 ${
                              isOverdue ? 'text-rose-700' : 'text-amber-700'
                            }`}
                            title={`Fecha límite de pago: ${formatDate(exp.dueDate)}`}
                          >
                            <Clock className="w-3 h-3" />
                            <span>
                              {isOverdue ? 'Venció:' : 'Vence:'} {formatDate(exp.dueDate)}
                            </span>
                          </div>
                        ) : exp.settledDate ? (
                          <div className="text-[10px] text-emerald-700 font-medium mt-0.5 flex items-center gap-0.5">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Liquidado: {formatDate(exp.settledDate)}</span>
                          </div>
                        ) : null}
                      </td>

                      {/* Concepto & Categoría */}
                      <td className="py-3.5 px-3.5 max-w-xs">
                        <div className="font-bold text-slate-900 leading-snug">
                          {exp.concept}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                              CATEGORY_COLORS[exp.category] || 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {exp.category}
                          </span>
                          {exp.notes && (
                            <span className="text-[10px] text-slate-500 truncate max-w-[180px]" title={exp.notes}>
                              💬 {exp.notes}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Acreedor / Proveedor */}
                      <td className="py-3.5 px-3.5 max-w-[200px]">
                        <div className="font-semibold text-slate-900 truncate">
                          {exp.creditorName || exp.responsible}
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          {exp.creditorType === 'APODERADO_REEMBOLSO' ? (
                            <span className="px-1.5 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded text-[9px] font-bold">
                              👤 Reembolso Apoderado
                            </span>
                          ) : exp.creditorType === 'PROVEEDOR' ? (
                            <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-[9px] font-bold">
                              🏢 Proveedor
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-500">
                              Resp: {exp.responsible}
                            </span>
                          )}
                        </div>
                        {exp.creditorContact && (
                          <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                            <Phone className="w-2.5 h-2.5 text-slate-400" />
                            <span>{exp.creditorContact}</span>
                          </div>
                        )}
                      </td>

                      {/* Comprobante */}
                      <td className="py-3.5 px-3.5 whitespace-nowrap">
                        <span className="font-medium text-slate-800 block">
                          {exp.receiptType}
                        </span>
                        <span className="text-[11px] font-mono text-slate-500">
                          {exp.receiptNumber ? `#${exp.receiptNumber}` : 'Sin N°'}
                        </span>
                      </td>

                      {/* Monto Total */}
                      <td className="py-3.5 px-3.5 text-right whitespace-nowrap font-bold text-slate-900">
                        {formatCLP(total)}
                      </td>

                      {/* Monto Pagado */}
                      <td className="py-3.5 px-3.5 text-right whitespace-nowrap">
                        <div className="font-bold text-emerald-700">
                          {formatCLP(paid)}
                        </div>
                        <div className="w-16 bg-slate-200 h-1.5 rounded-full ml-auto mt-1 overflow-hidden">
                          <div
                            className="bg-emerald-500 h-full rounded-full"
                            style={{ width: `${percentPaid}%` }}
                          />
                        </div>
                        <span className="text-[9px] text-slate-500 font-medium">
                          {percentPaid}% pagado
                        </span>
                      </td>

                      {/* Saldo Con Deuda (Red Column) */}
                      <td className="py-3.5 px-3.5 text-right whitespace-nowrap bg-rose-50/50">
                        {debt > 0 ? (
                          <div>
                            <div className="font-black text-rose-600 text-sm">
                              {formatCLP(debt)}
                            </div>
                            <span className="text-[9px] font-bold text-rose-700 uppercase tracking-tight">
                              Por pagar
                            </span>
                          </div>
                        ) : (
                          <div className="text-emerald-700 font-bold flex items-center justify-end gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>$0</span>
                          </div>
                        )}
                      </td>

                      {/* Estado */}
                      <td className="py-3.5 px-3.5 text-center whitespace-nowrap">
                        {status === 'PAGADO' ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Pagado 100%
                          </span>
                        ) : status === 'PARCIAL' ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200 inline-flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Pago Parcial
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-900 border border-rose-300 inline-flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Con Deuda
                          </span>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="py-3.5 px-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          {debt > 0 ? (
                            <button
                              id={`btn-abono-${exp.id}`}
                              type="button"
                              onClick={() => openAbonoModal(exp)}
                              className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] transition-all shadow-2xs flex items-center gap-1"
                              title="Registrar abono o liquidar saldo de deuda"
                            >
                              <HandCoins className="w-3 h-3" />
                              <span>Abonar / Pagar</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => openHistoryModal(exp)}
                              className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors"
                              title="Ver comprobantes y detalle de pagos"
                            >
                              <History className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {exp.abonos && exp.abonos.length > 0 && debt > 0 && (
                            <button
                              type="button"
                              onClick={() => openHistoryModal(exp)}
                              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                              title="Historial de abonos previos"
                            >
                              <History className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            id={`btn-edit-exp-${exp.id}`}
                            type="button"
                            onClick={() => openEditModal(exp)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                            title="Editar información del gasto"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            id={`btn-del-exp-${exp.id}`}
                            type="button"
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
            {/* Table Footer with Totals */}
            {filteredExpenses.length > 0 && (
              <tfoot className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                <tr>
                  <td colSpan={4} className="py-3 px-3.5 text-right font-black uppercase tracking-wider text-xs">
                    Totales Planilla Filtrada:
                  </td>
                  <td className="py-3 px-3.5 text-right font-black text-xs">
                    {formatCLP(filteredExpenses.reduce((acc, curr) => acc + curr.amount, 0))}
                  </td>
                  <td className="py-3 px-3.5 text-right font-black text-emerald-800 text-xs">
                    {formatCLP(
                      filteredExpenses.reduce((acc, curr) => acc + getExpenseMetrics(curr).paid, 0)
                    )}
                  </td>
                  <td className="py-3 px-3.5 text-right font-black text-rose-700 bg-rose-100/80 text-xs">
                    {formatCLP(
                      filteredExpenses.reduce((acc, curr) => acc + getExpenseMetrics(curr).debt, 0)
                    )}
                  </td>
                  <td colSpan={2} className="py-3 px-3.5 text-center text-[10px] text-slate-500 font-medium">
                    {filteredExpenses.filter((e) => getExpenseMetrics(e).debt > 0).length} con deuda activa
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* MODAL 1: ADD / EDIT EXPENSE WITH DEBT SUPPORT */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl max-w-xl w-full p-6 border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-rose-100 text-rose-700">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {expenseToEdit ? 'Editar Gasto / Deuda' : 'Registrar Nuevo Gasto con Deuda'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {currentCourse?.name} • Gestión de egresos y compromisos
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowFormModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="mt-4 space-y-4 text-xs">
              {/* Concept */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Concepto / Detalle del Gasto <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Contratación de Buses Paseo Granja Aventura"
                  value={concept}
                  onChange={(e) => setConcept(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-rose-500 text-xs text-slate-900"
                />
              </div>

              {/* Category and Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Categoría</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-rose-500 text-xs bg-white text-slate-900"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Fecha de Registro</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-rose-500 text-xs text-slate-900"
                  />
                </div>
              </div>

              {/* Monto Total */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Monto Total del Gasto ($ CLP) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">$</span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    required
                    placeholder="Ej: 130000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : '')}
                    className="w-full pl-7 pr-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-rose-500 text-xs font-bold text-slate-900"
                  />
                </div>
                {amount && Number(amount) > 0 && (
                  <p className="text-[11px] text-slate-500 mt-1">
                    Valor: <span className="font-bold text-slate-800">{formatCLP(Number(amount))}</span>
                  </p>
                )}
              </div>

              {/* Debt Configuration Toggle */}
              <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="checkbox-has-debt"
                      checked={hasDebt}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setHasDebt(checked);
                        if (!checked) {
                          setPaidAmount(amount);
                        } else {
                          setPaidAmount(0);
                        }
                      }}
                      className="w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500 cursor-pointer"
                    />
                    <label htmlFor="checkbox-has-debt" className="font-bold text-amber-950 cursor-pointer text-xs flex items-center gap-1">
                      <span>⚠️ Este gasto tiene saldo pendiente / Es una cuenta con deuda</span>
                    </label>
                  </div>
                  <span className="text-[10px] font-semibold text-amber-800 bg-amber-200/60 px-2 py-0.5 rounded">
                    {hasDebt ? 'Con Deuda Activa' : 'Pagado al 100%'}
                  </span>
                </div>

                {hasDebt && (
                  <div className="pt-2 border-t border-amber-200/60 space-y-3">
                    {/* Paid vs Debt live calculation */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          Monto Pagado Inicialmente ($)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max={amount || undefined}
                          placeholder="0 si es 100% a crédito"
                          value={paidAmount}
                          onChange={(e) =>
                            setPaidAmount(e.target.value !== '' ? Number(e.target.value) : '')
                          }
                          className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-rose-500 text-xs font-bold text-emerald-800 bg-white"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          Saldo Con Deuda Calculado ($)
                        </label>
                        <div className="px-3 py-2 bg-rose-50 border border-rose-200 rounded-xl font-black text-rose-700 text-xs">
                          {formatCLP(
                            Math.max(0, (Number(amount) || 0) - (Number(paidAmount) || 0))
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Acreedor Type & Name */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Tipo de Acreedor</label>
                        <select
                          value={creditorType}
                          onChange={(e) => setCreditorType(e.target.value as CreditorType)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-rose-500 text-xs bg-white text-slate-900"
                        >
                          {CREDITOR_TYPES.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.icon} {t.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          Nombre del Acreedor / Beneficiario
                        </label>
                        <input
                          type="text"
                          placeholder={
                            creditorType === 'APODERADO_REEMBOLSO'
                              ? 'Ej: Claudia Rojas (Mamá de Sofía)'
                              : 'Ej: Turismo Cordillera SpA'
                          }
                          value={creditorName}
                          onChange={(e) => setCreditorName(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-rose-500 text-xs text-slate-900 bg-white"
                        />
                      </div>
                    </div>

                    {/* Contact & Due Date */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          Contacto del Acreedor (Tel/Email)
                        </label>
                        <input
                          type="text"
                          placeholder="Ej: +56 9 8765 4321 / contacto@empresa.cl"
                          value={creditorContact}
                          onChange={(e) => setCreditorContact(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-rose-500 text-xs text-slate-900 bg-white"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          Fecha Límite / Compromiso de Pago
                        </label>
                        <input
                          type="date"
                          value={dueDate}
                          onChange={(e) => setDueDate(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-rose-500 text-xs text-slate-900 bg-white"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Receipt & Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tipo de Comprobante</label>
                  <select
                    value={receiptType}
                    onChange={(e) => setReceiptType(e.target.value as ReceiptType)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-rose-500 text-xs bg-white text-slate-900"
                  >
                    {RECEIPT_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    N° de Boleta / Factura / Respaldo
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: FAC-00892 o TRF-10293"
                    value={receiptNumber}
                    onChange={(e) => setReceiptNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-rose-500 text-xs text-slate-900"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Observaciones / Glosa</label>
                <textarea
                  rows={2}
                  placeholder="Detalles adicionales, condiciones de pago, acuerdos de asamblea..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-rose-500 text-xs text-slate-900 resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
                >
                  Cancelar
                </button>
                <button
                  id="btn-save-expense-submit"
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-xs transition-colors"
                >
                  {expenseToEdit ? 'Guardar Cambios' : 'Registrar Gasto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: REGISTRAR ABONO / PAGAR DEUDA */}
      {showAbonoModal && expenseForAbono && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                  <HandCoins className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Abonar o Liquidar Deuda
                  </h3>
                  <p className="text-xs text-slate-500 truncate max-w-[240px]">
                    {expenseForAbono.concept}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAbonoModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Current Debt Card */}
            {(() => {
              const { total, paid, debt } = getExpenseMetrics(expenseForAbono);
              const currentAbono = Number(abonoAmount) || 0;
              const newRemainingDebt = Math.max(0, debt - currentAbono);

              return (
                <form onSubmit={handleSaveAbono} className="mt-4 space-y-4 text-xs">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex justify-between items-center text-slate-600">
                      <span>Acreedor / Proveedor:</span>
                      <span className="font-bold text-slate-900">
                        {expenseForAbono.creditorName || expenseForAbono.responsible}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-slate-600">
                      <span>Monto Total del Gasto:</span>
                      <span className="font-bold text-slate-900">{formatCLP(total)}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-600">
                      <span>Pagado a la fecha:</span>
                      <span className="font-semibold text-emerald-700">{formatCLP(paid)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-slate-200 font-bold">
                      <span className="text-rose-700">Saldo Pendiente Actual:</span>
                      <span className="text-sm font-black text-rose-700">{formatCLP(debt)}</span>
                    </div>
                  </div>

                  {/* Quick Shortcuts */}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setAbonoAmount(debt)}
                      className="flex-1 py-1.5 px-2 bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 rounded-lg font-bold text-[11px] transition-colors"
                    >
                      Pagar Total ({formatCLP(debt)})
                    </button>
                    {debt > 2000 && (
                      <button
                        type="button"
                        onClick={() => setAbonoAmount(Math.round(debt / 2))}
                        className="flex-1 py-1.5 px-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg font-semibold text-[11px] transition-colors"
                      >
                        Abonar 50% ({formatCLP(Math.round(debt / 2))})
                      </button>
                    )}
                  </div>

                  {/* Abono Amount Input */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Monto a Abonar ($ CLP) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">$</span>
                      <input
                        type="number"
                        min="1"
                        max={debt}
                        required
                        placeholder="Ej: 50000"
                        value={abonoAmount}
                        onChange={(e) =>
                          setAbonoAmount(e.target.value ? Number(e.target.value) : '')
                        }
                        className="w-full pl-7 pr-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-500 font-bold text-slate-900 text-xs"
                      />
                    </div>
                    {currentAbono > 0 && (
                      <p className="text-[11px] text-slate-500 mt-1 flex justify-between">
                        <span>Nuevo saldo tras abono:</span>
                        <span className={`font-bold ${newRemainingDebt === 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {newRemainingDebt === 0 ? '✅ Deuda Liquidada ($0)' : formatCLP(newRemainingDebt)}
                        </span>
                      </p>
                    )}
                  </div>

                  {/* Date & Payment Method */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Fecha del Abono</label>
                      <input
                        type="date"
                        required
                        value={abonoDate}
                        onChange={(e) => setAbonoDate(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-500 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Medio de Pago</label>
                      <select
                        value={abonoMethod}
                        onChange={(e) => setAbonoMethod(e.target.value as PaymentMethod)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-500 text-xs bg-white"
                      >
                        <option value="Transferencia">Transferencia</option>
                        <option value="Efectivo">Efectivo</option>
                        <option value="Cheque">Cheque</option>
                        <option value="Otro">Otro</option>
                      </select>
                    </div>
                  </div>

                  {/* Reference Number */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      N° Comprobante / Transferencia de Respaldo
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: TRF-992102"
                      value={abonoReference}
                      onChange={(e) => setAbonoReference(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-500 text-xs"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setShowAbonoModal(false)}
                      className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs transition-colors"
                    >
                      Registrar Abono
                    </button>
                  </div>
                </form>
              );
            })()}
          </div>
        </div>
      )}

      {/* MODAL 3: HISTORIAL DE ABONOS Y TRAZABILIDAD */}
      {showHistoryModal && expenseForHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Historial de Pagos & Abonos
                  </h3>
                  <p className="text-xs text-slate-500 truncate max-w-[280px]">
                    {expenseForHistory.concept}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-2 text-center p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Total Gasto</span>
                  <span className="font-black text-slate-900">{formatCLP(expenseForHistory.amount)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-emerald-700 block uppercase font-bold">Total Rendido</span>
                  <span className="font-black text-emerald-700">
                    {formatCLP(getExpenseMetrics(expenseForHistory).paid)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-rose-700 block uppercase font-bold">Saldo Deudor</span>
                  <span className="font-black text-rose-700">
                    {formatCLP(getExpenseMetrics(expenseForHistory).debt)}
                  </span>
                </div>
              </div>

              {/* Abonos List */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-800 text-xs">Desglose de Desembolsos Realizados:</h4>
                {(!expenseForHistory.abonos || expenseForHistory.abonos.length === 0) ? (
                  <div className="p-4 bg-slate-50 rounded-xl text-center text-slate-400">
                    Sin abonos o pagos registrados aún.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                    {expenseForHistory.abonos.map((abn, idx) => (
                      <div key={abn.id || idx} className="p-3 bg-white hover:bg-slate-50/60 flex items-center justify-between">
                        <div>
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] flex items-center justify-center font-bold">
                              #{idx + 1}
                            </span>
                            <span>{formatCLP(abn.amount)}</span>
                            <span className="text-[10px] text-slate-500 font-normal">
                              via {abn.paymentMethod}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-2">
                            <span>📅 {formatDate(abn.date)}</span>
                            {abn.referenceNumber && <span>• N° {abn.referenceNumber}</span>}
                            {abn.registeredBy && <span>• Por: {abn.registeredBy}</span>}
                          </div>
                          {abn.notes && (
                            <p className="text-[10px] text-slate-600 mt-1 italic">"{abn.notes}"</p>
                          )}
                        </div>

                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Abonado
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 text-right">
                <button
                  type="button"
                  onClick={() => setShowHistoryModal(false)}
                  className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: CONFIRM DELETE */}
      {expenseToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 border border-slate-200">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 text-center">
              ¿Eliminar este registro de gasto?
            </h3>
            <p className="text-xs text-slate-500 text-center mt-1">
              Se eliminará <span className="font-bold text-slate-800">"{expenseToDelete.concept}"</span> por un monto de{' '}
              <span className="font-bold text-slate-800">{formatCLP(expenseToDelete.amount)}</span>. Esta acción no se puede deshacer.
            </p>

            <div className="flex items-center justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={() => setExpenseToDelete(null)}
                className="flex-1 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium text-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteExpense(expenseToDelete.id);
                  setExpenseToDelete(null);
                }}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs transition-colors"
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: PRINTABLE REPORT / INFORME ASAMBLEA */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-8 border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  Informe de Rendición de Gastos y Deudas
                </h3>
                <p className="text-xs text-slate-500">
                  {currentCourse?.name} • Año {currentCourse?.year}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-xs"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir / Guardar PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowPrintModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Content */}
            <div className="mt-6 space-y-6 text-xs text-slate-800">
              {/* Header Box */}
              <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Total Gastos Comprometidos</span>
                  <div className="text-base font-black text-slate-900">{formatCLP(totals.totalCommitted)}</div>
                </div>
                <div>
                  <span className="text-[10px] text-emerald-700 font-bold uppercase">Total Pagado Efectivo</span>
                  <div className="text-base font-black text-emerald-800">{formatCLP(totals.totalPaid)}</div>
                </div>
                <div>
                  <span className="text-[10px] text-rose-700 font-bold uppercase">Saldo Deuda / Por Pagar</span>
                  <div className="text-base font-black text-rose-700">{formatCLP(totals.totalDebt)}</div>
                </div>
              </div>

              {/* Table */}
              <table className="w-full text-left text-[11px] border border-slate-200 rounded-lg overflow-hidden">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[9px]">
                  <tr>
                    <th className="p-2 border-b">Fecha</th>
                    <th className="p-2 border-b">Detalle del Gasto</th>
                    <th className="p-2 border-b">Acreedor / Responsable</th>
                    <th className="p-2 border-b text-right">Total ($)</th>
                    <th className="p-2 border-b text-right">Pagado ($)</th>
                    <th className="p-2 border-b text-right">Saldo Deuda ($)</th>
                    <th className="p-2 border-b text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {courseExpenses.map((exp) => {
                    const { total, paid, debt, status } = getExpenseMetrics(exp);
                    return (
                      <tr key={exp.id}>
                        <td className="p-2">{formatDate(exp.date)}</td>
                        <td className="p-2 font-medium">{exp.concept}</td>
                        <td className="p-2 text-slate-600">{exp.creditorName || exp.responsible}</td>
                        <td className="p-2 text-right font-bold">{formatCLP(total)}</td>
                        <td className="p-2 text-right text-emerald-700 font-semibold">{formatCLP(paid)}</td>
                        <td className="p-2 text-right text-rose-700 font-bold">{formatCLP(debt)}</td>
                        <td className="p-2 text-center font-bold text-[9px]">
                          {status === 'PAGADO' ? 'PAGADO' : status === 'PARCIAL' ? 'PARCIAL' : 'CON DEUDA'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Signatures Footer */}
              <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs text-slate-600">
                <div className="border-t border-slate-400 pt-2">
                  <p className="font-bold text-slate-900">
                    {currentUser?.name || currentCourse?.treasurer?.fullName || 'Tesorero/a General de Curso'}
                  </p>
                  <p className="text-[10px] text-slate-500">Tesorería de Curso</p>
                </div>
                <div className="border-t border-slate-400 pt-2">
                  <p className="font-bold text-slate-900">Presidente/a Centro de Padres</p>
                  <p className="text-[10px] text-slate-500">Directiva de Curso</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
