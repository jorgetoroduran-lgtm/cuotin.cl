import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  CreditCard,
  DollarSign,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  Filter,
  HandCoins,
  History,
  Info,
  Layers,
  Phone,
  PieChart,
  Printer,
  Paperclip,
  Receipt,
  Scale,
  Search,
  Sparkles,
  Tag,
  TrendingDown,
  TrendingUp,
  User,
  UserCheck,
  Wallet,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CourseExpense, ExpenseAttachment, ExpenseCategory, ExpensePaymentStatus, MONTHS_LIST, MonthKey, ReceiptType } from '../types';
import {
  exportExpensesDebtToExcel,
  exportExpensesToExcel,
  exportPaymentsToExcel,
  formatCLP,
  formatDate,
  getStudentPaymentSummary,
} from '../utils/formatters';
import { formatAttachmentSize } from '../utils/attachmentHelper';
import { ExpenseAttachmentModal } from './ExpenseAttachmentModal';
import { FinancialPdfReportModal } from './FinancialPdfReportModal';
import {
  downloadPDFDocument,
  generateMonthlyFinancialReportPDF,
} from '../utils/pdfGenerator';

const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  'Eventos y Celebraciones': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'Paseos y Transporte': 'bg-blue-50 text-blue-700 border-blue-200',
  'Materiales y Decoración': 'bg-amber-50 text-amber-800 border-amber-200',
  'Alimentación y Convivencias': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Regalos y Premios': 'bg-rose-50 text-rose-700 border-rose-200',
  'Fotografía y Recuerdos': 'bg-cyan-50 text-cyan-700 border-cyan-200',
  'Imprevistos y Varios': 'bg-slate-100 text-slate-700 border-slate-200',
};

const CATEGORIES: ExpenseCategory[] = [
  'Eventos y Celebraciones',
  'Paseos y Transporte',
  'Materiales y Decoración',
  'Alimentación y Convivencias',
  'Regalos y Premios',
  'Fotografía y Recuerdos',
  'Imprevistos y Varios',
];

export const FinancialSummary: React.FC = () => {
  const { currentCourse, currentInstitution, courseStudents, courseExpenses } = useApp();
  const monthlyFee = currentCourse?.monthlyFee || 5000;

  // State for Realized Expenses Filtering & Detail Modal
  const [expenseSearch, setExpenseSearch] = useState('');
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState<string>('all');
  const [expenseMonthFilter, setExpenseMonthFilter] = useState<string>('all');
  const [expenseReceiptFilter, setExpenseReceiptFilter] = useState<string>('all');
  const [expenseStatusFilter, setExpenseStatusFilter] = useState<string>('all');
  const [selectedExpenseForDetail, setSelectedExpenseForDetail] = useState<CourseExpense | null>(null);
  const [selectedAttachmentExpense, setSelectedAttachmentExpense] = useState<{
    expense: CourseExpense;
    attachment: ExpenseAttachment;
  } | null>(null);
  const [showPrintAllExpensesModal, setShowPrintAllExpensesModal] = useState(false);
  const [showPdfReportModal, setShowPdfReportModal] = useState(false);
  const [pdfModalInitialMonth, setPdfModalInitialMonth] = useState<MonthKey>('marzo');

  // Global calculations
  const totalStudents = courseStudents.length;
  const totalAnnualPotential = totalStudents * 10 * monthlyFee;

  const totalCollected = useMemo(() => {
    return courseStudents.reduce((acc, s) => {
      const records = Object.values(s.payments) as (typeof s.payments[keyof typeof s.payments])[];
      return (
        acc +
        records.reduce((sum, p) => (p && p.isPaid ? sum + (p.amount || monthlyFee) : sum), 0)
      );
    }, 0);
  }, [courseStudents, monthlyFee]);

  const totalSpent = useMemo(() => {
    return courseExpenses.reduce((acc, e) => acc + e.amount, 0);
  }, [courseExpenses]);

  const totalPaidExpenses = useMemo(() => {
    return courseExpenses.reduce((acc, e) => {
      const paid = e.paidAmount !== undefined ? e.paidAmount : (e.paymentStatus === 'CON_DEUDA' ? 0 : e.amount);
      return acc + paid;
    }, 0);
  }, [courseExpenses]);

  const totalExpenseDebt = useMemo(() => {
    return courseExpenses.reduce((acc, e) => {
      const paid = e.paidAmount !== undefined ? e.paidAmount : (e.paymentStatus === 'CON_DEUDA' ? 0 : e.amount);
      const debt = e.debtAmount !== undefined ? e.debtAmount : Math.max(0, e.amount - paid);
      return acc + debt;
    }, 0);
  }, [courseExpenses]);

  const balance = totalCollected - totalPaidExpenses;
  const balanceAfterAllDebts = totalCollected - totalSpent;
  const totalPending = totalAnnualPotential - totalCollected;
  const collectionRate = totalAnnualPotential > 0 ? Math.round((totalCollected / totalAnnualPotential) * 100) : 0;

  // Month-by-month cashflow
  const monthlyBreakdown = useMemo(() => {
    return MONTHS_LIST.map((m) => {
      // Collected in month
      let collectedInMonth = 0;
      let paidStudentsCount = 0;

      courseStudents.forEach((s) => {
        const p = s.payments[m.key];
        if (p && p.isPaid) {
          collectedInMonth += p.amount || monthlyFee;
          paidStudentsCount++;
        }
      });

      // Expenses in this month (matching month number)
      const expensesInMonth = courseExpenses.filter((e) => {
        if (!e.date) return false;
        const d = new Date(e.date);
        const monthNum = d.getMonth() + 1; // 1-12
        return monthNum === m.monthNumber;
      });

      const totalExpenseInMonth = expensesInMonth.reduce((acc, curr) => acc + curr.amount, 0);
      const netCashflow = collectedInMonth - totalExpenseInMonth;
      const participationRate = totalStudents > 0 ? Math.round((paidStudentsCount / totalStudents) * 100) : 0;

      return {
        key: m.key,
        label: m.label,
        monthNumber: m.monthNumber,
        collected: collectedInMonth,
        paidStudentsCount,
        spent: totalExpenseInMonth,
        expensesCount: expensesInMonth.length,
        net: netCashflow,
        participationRate,
      };
    });
  }, [courseStudents, courseExpenses, monthlyFee, totalStudents]);

  // Expenses by category
  const expensesByCategory = useMemo(() => {
    const map: Record<string, { total: number; count: number }> = {};

    courseExpenses.forEach((e) => {
      if (!map[e.category]) {
        map[e.category] = { total: 0, count: 0 };
      }
      map[e.category].total += e.amount;
      map[e.category].count += 1;
    });

    return Object.entries(map).map(([category, data]) => ({
      category: category as ExpenseCategory,
      total: data.total,
      count: data.count,
      percent: totalSpent > 0 ? Math.round((data.total / totalSpent) * 100) : 0,
    })).sort((a, b) => b.total - a.total);
  }, [courseExpenses, totalSpent]);

  // Realized Expenses Metrics
  const expensesMetrics = useMemo(() => {
    const totalCount = courseExpenses.length;
    if (totalCount === 0) {
      return {
        totalCount: 0,
        average: 0,
        highestExpense: null,
        totalWithReceipt: 0,
      };
    }

    const average = Math.round(totalSpent / totalCount);
    let highest: CourseExpense | null = null;
    let withReceipt = 0;

    courseExpenses.forEach((e) => {
      if (!highest || e.amount > highest.amount) {
        highest = e;
      }
      if (e.receiptNumber && e.receiptNumber.trim() !== '') {
        withReceipt++;
      }
    });

    return {
      totalCount,
      average,
      highestExpense: highest,
      totalWithReceipt: withReceipt,
    };
  }, [courseExpenses, totalSpent]);

  // Helper for single expense metrics
  const getExpenseInfo = (expItem: CourseExpense) => {
    const total = expItem.amount || 0;
    const paid = expItem.paidAmount !== undefined ? expItem.paidAmount : (expItem.paymentStatus === 'CON_DEUDA' ? 0 : total);
    const debt = expItem.debtAmount !== undefined ? expItem.debtAmount : Math.max(0, total - paid);
    const status: ExpensePaymentStatus =
      debt === 0 || expItem.paymentStatus === 'PAGADO'
        ? 'PAGADO'
        : paid > 0
        ? 'PARCIAL'
        : 'CON_DEUDA';
    const percentPaid = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;
    return { total, paid, debt, status, percentPaid };
  };

  // Filtered List of Realized Expenses
  const filteredRealizedExpenses = useMemo(() => {
    return courseExpenses
      .filter((exp) => {
        const { status, debt } = getExpenseInfo(exp);

        // Search Filter
        if (expenseSearch.trim()) {
          const q = expenseSearch.toLowerCase().trim();
          const match =
            exp.concept.toLowerCase().includes(q) ||
            exp.responsible.toLowerCase().includes(q) ||
            (exp.creditorName && exp.creditorName.toLowerCase().includes(q)) ||
            (exp.receiptNumber && exp.receiptNumber.toLowerCase().includes(q)) ||
            (exp.notes && exp.notes.toLowerCase().includes(q));
          if (!match) return false;
        }

        // Category Filter
        if (expenseCategoryFilter !== 'all' && exp.category !== expenseCategoryFilter) {
          return false;
        }

        // Month Filter
        if (expenseMonthFilter !== 'all') {
          if (!exp.date) return false;
          const monthNum = new Date(exp.date).getMonth() + 1;
          if (monthNum.toString() !== expenseMonthFilter) return false;
        }

        // Receipt Filter
        if (expenseReceiptFilter !== 'all' && exp.receiptType !== expenseReceiptFilter) {
          return false;
        }

        // Status Filter
        if (expenseStatusFilter === 'PAGADO' && status !== 'PAGADO') return false;
        if (expenseStatusFilter === 'CON_DEUDA' && status !== 'CON_DEUDA') return false;
        if (expenseStatusFilter === 'PARCIAL' && status !== 'PARCIAL') return false;
        if (expenseStatusFilter === 'DEBT_ANY' && debt === 0) return false;

        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [
    courseExpenses,
    expenseSearch,
    expenseCategoryFilter,
    expenseMonthFilter,
    expenseReceiptFilter,
    expenseStatusFilter,
  ]);

  // Students status distribution
  const studentStatusCounts = useMemo(() => {
    let alDia = 0;
    let parcial = 0;
    let moroso = 0;

    courseStudents.forEach((s) => {
      const summary = getStudentPaymentSummary(s, monthlyFee);
      if (summary.isFullyPaid) alDia++;
      else if (summary.paidCount >= 5) parcial++;
      else moroso++;
    });

    return { alDia, parcial, moroso };
  }, [courseStudents, monthlyFee]);

  return (
    <div id="financial-summary-section" className="space-y-6">
      {/* Title banner */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-0.5 rounded-md border border-blue-200">
                Estado Financiero Consolidado
              </span>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Cuadro de Resumen: Recaudación vs Gastos ({currentCourse?.name})
              </h2>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Institución: <span className="font-semibold text-slate-800">{currentInstitution?.name}</span> •
              Año: <span className="font-semibold text-slate-800">{currentCourse?.year}</span> •
              Cuota Mensual: <span className="font-semibold text-slate-800">{formatCLP(monthlyFee)}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              id="btn-open-financial-pdf-modal"
              onClick={() => {
                setPdfModalInitialMonth('marzo');
                setShowPdfReportModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer hover:scale-102"
              title="Descargar balances mensuales y anuales oficiales en PDF con formato de rendición y firmas"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Descargar Balance en PDF</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (currentCourse) {
                  exportExpensesToExcel(courseExpenses, currentCourse);
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 font-semibold text-xs transition-colors shadow-2xs"
              title="Descargar detalle completo de gastos en Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Exportar Gastos (.xlsx)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (currentCourse) {
                  exportPaymentsToExcel(courseStudents, currentCourse);
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 font-semibold text-xs transition-colors shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar Cuotas (.xlsx)</span>
            </button>
          </div>
        </div>

        {/* Top 4 Metric KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
          {/* Card 1: Total Recaudado */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 relative overflow-hidden shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Total Recaudado
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                <ArrowDownRight className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 mt-2">
              {formatCLP(totalCollected)}
            </div>
            <div className="text-[11px] text-emerald-700 font-semibold mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>{collectionRate}% del potencial anual</span>
            </div>
          </div>

          {/* Card 2: Total Gastado */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 relative overflow-hidden shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Total Gastos Realizados
              </span>
              <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 mt-2">
              {formatCLP(totalSpent)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
              <span>{courseExpenses.length} gastos registrados</span>
              <span className="font-semibold text-rose-700">
                {formatCLP(totalPaidExpenses)} pagados
              </span>
            </div>
          </div>

          {/* Card 3: Saldo Disponible */}
          <div
            className={`border rounded-xl p-4 relative overflow-hidden shadow-xs ${
              balance >= 0
                ? 'bg-blue-50/50 border-blue-200 text-blue-950'
                : 'bg-rose-50/50 border-rose-200 text-rose-950'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Saldo en Caja / Banco
              </span>
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-white ${
                  balance >= 0 ? 'bg-blue-600' : 'bg-rose-600'
                }`}
              >
                <Wallet className="w-4 h-4" />
              </div>
            </div>
            <div
              className={`text-2xl font-black mt-2 ${
                balance >= 0 ? 'text-blue-900' : 'text-rose-700'
              }`}
            >
              {formatCLP(balance)}
            </div>
            <div className="text-[11px] text-slate-600 mt-1">
              Recaudación menos egresos pagados
            </div>
          </div>

          {/* Card 4: Por Recaudar */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 relative overflow-hidden shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Por Cobrar (Cuotas)
              </span>
              <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center">
                <Scale className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 mt-2">
              {formatCLP(totalPending)}
            </div>
            <div className="text-[11px] text-amber-700 font-semibold mt-1">
              {100 - collectionRate}% por recaudar
            </div>
          </div>
        </div>

        {/* Pasivo / Gastos con Deuda Callout */}
        {totalExpenseDebt > 0 && (
          <div className="mt-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-rose-600 text-white flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-rose-900">
                  Compromisos Pendientes de Pago (Gastos Con Deuda): {formatCLP(totalExpenseDebt)}
                </div>
                <div className="text-[11px] text-rose-700">
                  De los {formatCLP(totalSpent)} en gastos comprometidos, se han desembolsado {formatCLP(totalPaidExpenses)} en efectivo y restan {formatCLP(totalExpenseDebt)} por pagar a proveedores y reembolsos a apoderados.
                </div>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[10px] uppercase font-bold text-rose-700 block">Saldo Real tras Liquidar Deudas</span>
              <span className={`text-sm font-black ${balanceAfterAllDebts >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                {formatCLP(balanceAfterAllDebts)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Visual Balance Bar */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 space-y-3">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-blue-600" />
          Proporción Financiera: Recaudación vs Gastos vs Saldo
        </h3>

        <div className="space-y-1.5">
          <div className="flex h-5 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 text-[10px] font-bold text-white text-center leading-5">
            {totalSpent > 0 && (
              <div
                className="bg-rose-500 transition-all duration-500 truncate px-1"
                style={{ width: `${Math.min(100, Math.round((totalSpent / (totalCollected || 1)) * 100))}%` }}
                title={`Gastos ejecutados: ${formatCLP(totalSpent)}`}
              >
                Gastos: {formatCLP(totalSpent)}
              </div>
            )}
            {balance > 0 && (
              <div
                className="bg-blue-600 transition-all duration-500 truncate px-1"
                style={{ width: `${Math.round((balance / (totalCollected || 1)) * 100)}%` }}
                title={`Saldo disponible: ${formatCLP(balance)}`}
              >
                Saldo: {formatCLP(balance)}
              </div>
            )}
          </div>
          <div className="flex justify-between text-[11px] text-slate-500">
            <span>$0 CLP</span>
            <span className="font-semibold text-slate-700">
              Total Recaudado a la Fecha: {formatCLP(totalCollected)}
            </span>
          </div>
        </div>
      </div>

      {/* Two Columns: Monthly Cashflow & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Cashflow Table (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
          <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-400" />
              Flujo de Caja Mes a Mes (Marzo a Diciembre)
            </h3>
            <span className="text-[11px] text-slate-400">10 Meses Escolares</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Mes</th>
                  <th className="py-2.5 px-3 text-right">Recaudado</th>
                  <th className="py-2.5 px-3 text-center">% Apoderados</th>
                  <th className="py-2.5 px-3 text-right">Gastos</th>
                  <th className="py-2.5 px-3 text-right">Balance Neto</th>
                  <th className="py-2.5 px-3 text-center">Reporte</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {monthlyBreakdown.map((row) => (
                  <tr key={row.key} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-semibold text-slate-800">
                      {row.label}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-medium text-slate-900">
                      {formatCLP(row.collected)}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <div className="w-12 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-blue-600 h-1.5 rounded-full"
                            style={{ width: `${row.participationRate}%` }}
                          />
                        </div>
                        <span className="text-[11px] text-slate-600 font-mono">
                          {row.paidStudentsCount}/{totalStudents}
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-medium text-rose-700">
                      {row.spent > 0 ? formatCLP(row.spent) : '-'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold">
                      <span
                        className={
                          row.net > 0
                            ? 'text-blue-700'
                            : row.net < 0
                            ? 'text-rose-700'
                            : 'text-slate-500'
                        }
                      >
                        {formatCLP(row.net)}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        type="button"
                        id={`btn-pdf-month-${row.key}`}
                        onClick={() => {
                          setPdfModalInitialMonth(row.key as MonthKey);
                          setShowPdfReportModal(true);
                        }}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[11px] border border-blue-200 transition-colors shadow-2xs cursor-pointer"
                        title={`Generar y descargar Balance Oficial de ${row.label} en PDF`}
                      >
                        <FileText className="w-3 h-3 text-blue-600" />
                        <span>PDF</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 border-t-2 border-slate-300 font-bold text-slate-900 text-xs">
                <tr>
                  <td className="py-3 px-3">TOTALES</td>
                  <td className="py-3 px-3 text-right font-mono text-slate-900">
                    {formatCLP(totalCollected)}
                  </td>
                  <td className="py-3 px-3 text-center text-slate-600">
                    {collectionRate}% Global
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-rose-700">
                    {formatCLP(totalSpent)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-blue-700 text-sm">
                    {formatCLP(balance)}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <button
                      type="button"
                      id="btn-pdf-anual-footer"
                      onClick={() => {
                        setShowPdfReportModal(true);
                      }}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] border border-indigo-200 transition-colors shadow-2xs cursor-pointer"
                      title="Descargar Balance Anual Consolidado en PDF"
                    >
                      <Download className="w-3 h-3 text-indigo-600" />
                      <span>Anual</span>
                    </button>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Expenses by Category (1 Col) */}
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden flex flex-col">
          <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
              <PieChart className="w-4 h-4 text-blue-400" />
              Gastos por Categoría
            </h3>
            <span className="text-[11px] text-slate-400">{formatCLP(totalSpent)}</span>
          </div>

          <div className="p-4 flex-1 space-y-3.5 text-xs">
            {expensesByCategory.length === 0 ? (
              <div className="py-8 text-center text-slate-400">
                No hay gastos registrados aún para este curso.
              </div>
            ) : (
              expensesByCategory.map((cat) => (
                <div key={cat.category} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800 truncate max-w-[170px]" title={cat.category}>
                      {cat.category}
                    </span>
                    <span className="font-mono font-bold text-slate-900">
                      {formatCLP(cat.total)} ({cat.percent}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${cat.percent}%` }}
                    />
                  </div>
                </div>
              ))
            )}

            {/* Apoderados status overview */}
            <div className="pt-4 border-t border-slate-100 mt-auto">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide block mb-2">
                Estado de Apoderados
              </span>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-emerald-50 border border-emerald-200 p-2 rounded-lg">
                  <span className="font-bold text-emerald-800 text-sm block">
                    {studentStatusCounts.alDia}
                  </span>
                  <span className="text-[10px] text-emerald-700">Al Día (100%)</span>
                </div>

                <div className="bg-amber-50 border border-amber-200 p-2 rounded-lg">
                  <span className="font-bold text-amber-800 text-sm block">
                    {studentStatusCounts.parcial}
                  </span>
                  <span className="text-[10px] text-amber-700">Parcial</span>
                </div>

                <div className="bg-rose-50 border border-rose-200 p-2 rounded-lg">
                  <span className="font-bold text-rose-800 text-sm block">
                    {studentStatusCounts.moroso}
                  </span>
                  <span className="text-[10px] text-rose-700">Morosos</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* NUEVA SECCIÓN: RESUMEN Y DETALLES DE GASTOS REALIZADOS                     */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden space-y-4">
        {/* Header with Title & Action Controls */}
        <div className="p-5 border-b border-slate-200 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                <Receipt className="w-3 h-3" />
                Auditoría y Rendición de Cuentas
              </span>
              <span className="text-xs text-slate-300 font-medium">
                {courseExpenses.length} Gastos Realizados
              </span>
            </div>
            <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <FileText className="w-5 h-5 text-rose-400" />
              Resumen Detallado de Gastos Realizados
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Visualización ítem por ítem con comprobantes, fechas de desembolso, beneficiarios y estados de rendición.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              id="btn-open-pdf-from-expenses"
              onClick={() => {
                setShowPdfReportModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors shadow-sm cursor-pointer"
              title="Generar balance y rendición oficial en PDF"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Balance Oficial en PDF</span>
            </button>

            <button
              type="button"
              onClick={() => setShowPrintAllExpensesModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition-colors border border-white/20"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir Rendición</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (currentCourse) {
                  exportExpensesDebtToExcel(courseExpenses, currentCourse);
                }
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-sm"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Descargar Planilla Excel</span>
            </button>
          </div>
        </div>

        {/* 4 Micro-Kpis for Expenses Execution */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-5 pt-1">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Desembolsado</span>
            <span className="text-base font-black text-slate-900 mt-0.5 block">{formatCLP(totalPaidExpenses)}</span>
            <span className="text-[10px] text-slate-500">De {formatCLP(totalSpent)} comprometidos</span>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Gasto Promedio</span>
            <span className="text-base font-black text-slate-900 mt-0.5 block">{formatCLP(expensesMetrics.average)}</span>
            <span className="text-[10px] text-slate-500">Por cada registro</span>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Mayor Gasto Registrado</span>
            <span className="text-base font-black text-rose-700 mt-0.5 block truncate" title={expensesMetrics.highestExpense ? expensesMetrics.highestExpense.concept : ''}>
              {expensesMetrics.highestExpense ? formatCLP(expensesMetrics.highestExpense.amount) : '$0'}
            </span>
            <span className="text-[10px] text-slate-500 truncate block">
              {expensesMetrics.highestExpense ? expensesMetrics.highestExpense.concept : '-'}
            </span>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Con Comprobante / N°</span>
            <span className="text-base font-black text-emerald-700 mt-0.5 block">
              {expensesMetrics.totalWithReceipt} / {expensesMetrics.totalCount}
            </span>
            <span className="text-[10px] text-slate-500">
              {expensesMetrics.totalCount > 0 ? Math.round((expensesMetrics.totalWithReceipt / expensesMetrics.totalCount) * 100) : 0}% respaldados
            </span>
          </div>
        </div>

        {/* Filter controls */}
        <div className="px-5 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
            {/* Search */}
            <div className="lg:col-span-2 relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por concepto, responsable, comprobante..."
                value={expenseSearch}
                onChange={(e) => setExpenseSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-rose-500"
              />
              {expenseSearch && (
                <button
                  type="button"
                  onClick={() => setExpenseSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Category Filter */}
            <select
              value={expenseCategoryFilter}
              onChange={(e) => setExpenseCategoryFilter(e.target.value)}
              className="py-1.5 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-rose-500 font-medium text-slate-700 cursor-pointer"
            >
              <option value="all">🏷️ Todas las Categorías</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {/* Month Filter */}
            <select
              value={expenseMonthFilter}
              onChange={(e) => setExpenseMonthFilter(e.target.value)}
              className="py-1.5 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-rose-500 font-medium text-slate-700 cursor-pointer"
            >
              <option value="all">📅 Todos los Meses</option>
              {MONTHS_LIST.map((m) => (
                <option key={m.key} value={m.monthNumber.toString()}>
                  {m.label}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={expenseStatusFilter}
              onChange={(e) => setExpenseStatusFilter(e.target.value)}
              className="py-1.5 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-rose-500 font-semibold text-slate-700 cursor-pointer"
            >
              <option value="all">⚡ Todos los Estados</option>
              <option value="PAGADO">🟢 Pagado 100%</option>
              <option value="DEBT_ANY">🔴 Con Saldo Pendiente</option>
              <option value="PARCIAL">🟡 Pago Parcial</option>
              <option value="CON_DEUDA">⚠️ Con Deuda Total</option>
            </select>
          </div>
        </div>

        {/* Itemized Table of Realized Expenses */}
        <div className="overflow-x-auto border-t border-slate-100">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">Fecha</th>
                <th className="py-2.5 px-4">Concepto & Detalle</th>
                <th className="py-2.5 px-4">Categoría</th>
                <th className="py-2.5 px-4">Comprobante / N°</th>
                <th className="py-2.5 px-4">Responsable / Acreedor</th>
                <th className="py-2.5 px-4 text-right">Monto Total</th>
                <th className="py-2.5 px-4 text-right">Pagado / Rendido</th>
                <th className="py-2.5 px-4 text-center">Estado</th>
                <th className="py-2.5 px-4 text-center">Ficha Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRealizedExpenses.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-400">
                    <Receipt className="w-8 h-8 mx-auto text-slate-300 mb-1.5" />
                    <p className="font-semibold text-slate-600">No se encontraron gastos con los filtros seleccionados</p>
                    <p className="text-[11px] text-slate-400">Prueba ajustando los filtros de búsqueda o categoría</p>
                  </td>
                </tr>
              ) : (
                filteredRealizedExpenses.map((exp) => {
                  const { total, paid, debt, status } = getExpenseInfo(exp);
                  return (
                    <tr
                      key={exp.id}
                      className="hover:bg-slate-50/90 transition-colors group cursor-pointer"
                      onClick={() => setSelectedExpenseForDetail(exp)}
                    >
                      {/* Fecha */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-bold text-slate-900 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {formatDate(exp.date)}
                        </span>
                        {exp.settledDate && (
                          <span className="text-[10px] text-emerald-700 font-medium block">
                            Liq: {formatDate(exp.settledDate)}
                          </span>
                        )}
                      </td>

                      {/* Concepto & Detalle */}
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                          {exp.concept}
                        </div>
                        {exp.notes && (
                          <div className="text-[11px] text-slate-500 truncate max-w-[220px]" title={exp.notes}>
                            💬 {exp.notes}
                          </div>
                        )}
                      </td>

                      {/* Categoría */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                            CATEGORY_COLORS[exp.category] || 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {exp.category}
                        </span>
                      </td>

                      {/* Comprobante */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-medium text-slate-800">
                          {exp.receiptType}
                        </div>
                        <div className="text-[10px] font-mono text-slate-500">
                          {exp.receiptNumber ? `#${exp.receiptNumber}` : 'Sin comprobante'}
                        </div>
                      </td>

                      {/* Responsable / Acreedor */}
                      <td className="py-3 px-4 max-w-[180px]">
                        <div className="font-semibold text-slate-800 truncate">
                          {exp.creditorName || exp.responsible}
                        </div>
                        {exp.creditorType === 'APODERADO_REEMBOLSO' ? (
                          <span className="text-[9px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-1.5 py-0.2 rounded">
                            Reembolso Apoderado
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-500">
                            Resp: {exp.responsible}
                          </span>
                        )}
                      </td>

                      {/* Monto Total */}
                      <td className="py-3 px-4 text-right whitespace-nowrap font-black text-slate-900">
                        {formatCLP(total)}
                      </td>

                      {/* Pagado / Rendido */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <span className="font-bold text-emerald-700 block">
                          {formatCLP(paid)}
                        </span>
                        {debt > 0 ? (
                          <span className="text-[10px] font-bold text-rose-600 block">
                            Resta: {formatCLP(debt)}
                          </span>
                        ) : (
                          <span className="text-[10px] text-emerald-600 font-medium block">
                            100% saldado
                          </span>
                        )}
                      </td>

                      {/* Estado */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {status === 'PAGADO' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Pagado
                          </span>
                        ) : status === 'PARCIAL' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 inline-flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Parcial
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300 inline-flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Con Deuda
                          </span>
                        )}
                      </td>

                      {/* Ficha Detalle button */}
                      <td className="py-3 px-4 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => setSelectedExpenseForDetail(exp)}
                          className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 font-semibold text-[11px] border border-slate-200 transition-colors inline-flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3 text-slate-500" />
                          <span>Ver Ficha</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {filteredRealizedExpenses.length > 0 && (
              <tfoot className="bg-slate-50 font-bold text-slate-900 border-t-2 border-slate-300">
                <tr>
                  <td colSpan={5} className="py-3 px-4 text-right font-black uppercase tracking-wider text-xs">
                    Total Gastos en la Selección:
                  </td>
                  <td className="py-3 px-4 text-right font-black text-xs">
                    {formatCLP(filteredRealizedExpenses.reduce((acc, curr) => acc + curr.amount, 0))}
                  </td>
                  <td className="py-3 px-4 text-right font-black text-emerald-800 text-xs">
                    {formatCLP(filteredRealizedExpenses.reduce((acc, curr) => acc + getExpenseInfo(curr).paid, 0))}
                  </td>
                  <td colSpan={2} className="py-3 px-4 text-center text-[11px] text-slate-500 font-medium">
                    {filteredRealizedExpenses.length} gastos listados
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: FICHA COMPLETA DE DETALLE DE GASTO REALIZADO                       */}
      {/* ========================================================================= */}
      {selectedExpenseForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 border border-slate-200 my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Ficha de Detalle de Gasto Realizado
                  </h3>
                  <p className="text-xs text-slate-500">
                    {currentCourse?.name} • Rendición de Egresos
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedExpenseForDetail(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Expense Body */}
            {(() => {
              const exp = selectedExpenseForDetail;
              const { total, paid, debt, status, percentPaid } = getExpenseInfo(exp);
              return (
                <div className="mt-4 space-y-4 text-xs text-slate-700">
                  {/* Concept & Category Header Banner */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                          CATEGORY_COLORS[exp.category] || 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {exp.category}
                      </span>
                      {status === 'PAGADO' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Pagado 100%
                        </span>
                      ) : status === 'PARCIAL' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 inline-flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Pago Parcial
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300 inline-flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Con Deuda
                        </span>
                      )}
                    </div>
                    <div className="text-base font-bold text-slate-900 leading-snug">
                      {exp.concept}
                    </div>
                  </div>

                  {/* Financial Breakdown Grid */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2.5 bg-slate-100/80 border border-slate-200 rounded-xl">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">Monto Total</span>
                      <span className="text-sm font-black text-slate-900 block mt-0.5">{formatCLP(total)}</span>
                    </div>

                    <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl">
                      <span className="text-[10px] uppercase font-bold text-emerald-700 block">Pagado / Rendido</span>
                      <span className="text-sm font-black text-emerald-800 block mt-0.5">{formatCLP(paid)}</span>
                    </div>

                    <div className={`p-2.5 rounded-xl border ${debt > 0 ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-200'}`}>
                      <span className={`text-[10px] uppercase font-bold block ${debt > 0 ? 'text-rose-700' : 'text-slate-500'}`}>
                        Saldo Deudor
                      </span>
                      <span className={`text-sm font-black block mt-0.5 ${debt > 0 ? 'text-rose-700' : 'text-slate-700'}`}>
                        {formatCLP(debt)}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar of Payment */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-semibold text-slate-600">
                      <span>Progreso de Liquidación:</span>
                      <span>{percentPaid}% ({formatCLP(paid)} de {formatCLP(total)})</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${percentPaid}%` }} />
                    </div>
                  </div>

                  {/* Item Details Grid */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Fecha de Registro</span>
                        <span className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          {formatDate(exp.date)}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Comprobante de Respaldo</span>
                        <span className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                          <Receipt className="w-3.5 h-3.5 text-slate-500" />
                          {exp.receiptType} {exp.receiptNumber ? `#${exp.receiptNumber}` : '(Sin N°)'}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Responsable del Gasto</span>
                        <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                          <User className="w-3.5 h-3.5 text-slate-500" />
                          {exp.responsible}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Acreedor / Beneficiario</span>
                        <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-500" />
                          {exp.creditorName || exp.responsible}
                        </span>
                      </div>

                      {exp.creditorContact && (
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Contacto Acreedor</span>
                          <span className="font-mono text-slate-700 flex items-center gap-1 mt-0.5">
                            <Phone className="w-3.5 h-3.5 text-slate-500" />
                            {exp.creditorContact}
                          </span>
                        </div>
                      )}

                      {exp.dueDate && (
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Fecha Límite / Vencimiento</span>
                          <span className="font-bold text-amber-700 flex items-center gap-1 mt-0.5">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            {formatDate(exp.dueDate)}
                          </span>
                        </div>
                      )}
                    </div>

                    {exp.notes && (
                      <div className="pt-2 border-t border-slate-200">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Observaciones / Notas:</span>
                        <p className="text-xs text-slate-700 bg-white p-2 rounded-lg border border-slate-200 mt-1">
                          {exp.notes}
                        </p>
                      </div>
                    )}

                    {/* Documento de Respaldo / Comprobante Adjunto */}
                    {exp.attachment ? (
                      <div className="pt-2 border-t border-slate-200">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                          Documento / Comprobante Adjunto
                        </span>
                        <div className="p-2.5 bg-blue-50/80 border border-blue-200 rounded-xl flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-blue-600/10 text-blue-700 flex items-center justify-center shrink-0">
                              <Paperclip className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-900 truncate">
                                {exp.attachment.fileName}
                              </p>
                              <p className="text-[10px] text-slate-500 font-mono">
                                {formatAttachmentSize(exp.attachment.fileSize)} • {exp.attachment.fileType}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedAttachmentExpense({
                                expense: exp,
                                attachment: exp.attachment!,
                              })
                            }
                            className="px-2.5 py-1 bg-white hover:bg-blue-50 text-blue-700 text-xs font-bold rounded-lg border border-blue-200 shadow-2xs inline-flex items-center gap-1 shrink-0 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Ver Comprobante</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="pt-1 text-[11px] text-slate-400 italic">
                        Sin documento adjunto registrado para este gasto.
                      </div>
                    )}
                  </div>

                  {/* Abonos Realizados (if any) */}
                  {exp.abonos && exp.abonos.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1">
                        <History className="w-3.5 h-3.5 text-slate-500" />
                        Historial de Desembolsos y Abonos ({exp.abonos.length})
                      </span>
                      <div className="bg-slate-50 border border-slate-200 rounded-xl divide-y divide-slate-200 max-h-36 overflow-y-auto">
                        {exp.abonos.map((abn, i) => (
                          <div key={abn.id || i} className="p-2 flex items-center justify-between text-xs">
                            <div>
                              <div className="font-bold text-slate-900 flex items-center gap-1">
                                <span>{formatDate(abn.date)}</span>
                                <span className="text-[10px] font-normal text-slate-500">• {abn.paymentMethod}</span>
                              </div>
                              {abn.notes && <div className="text-[10px] text-slate-500">{abn.notes}</div>}
                            </div>
                            <div className="text-right">
                              <span className="font-black text-emerald-700">{formatCLP(abn.amount)}</span>
                              {abn.referenceNumber && (
                                <span className="text-[9px] font-mono text-slate-400 block">Ref: {abn.referenceNumber}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Auditoría Footer */}
                  <div className="text-[10px] text-slate-400 flex items-center justify-between pt-2 border-t border-slate-100">
                    <span>Registrado por: <strong className="text-slate-600">{exp.registeredBy}</strong></span>
                    <span>ID: {exp.id}</span>
                  </div>

                  {/* Close button */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setSelectedExpenseForDetail(null)}
                      className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors"
                    >
                      Cerrar Ficha
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: INFORME DE RENDICIÓN DE GASTOS PARA IMPRESIÓN ASAMBLEA            */}
      {/* ========================================================================= */}
      {showPrintAllExpensesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-6 border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-slate-700" />
                <h3 className="text-base font-bold text-slate-900">
                  Informe Consolidado de Gastos del Curso
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center gap-1"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir Documento</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowPrintAllExpensesModal(false)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Printable Report Area */}
            <div className="mt-4 p-6 bg-slate-50 border border-slate-200 rounded-xl space-y-4 text-xs text-slate-800">
              <div className="text-center border-b border-slate-300 pb-3">
                <h2 className="text-lg font-black text-slate-900">
                  INFORME DE RENDICIÓN DE CUENTAS Y GASTOS
                </h2>
                <p className="text-xs font-bold text-slate-600 mt-0.5">
                  {currentCourse?.name} • Año {currentCourse?.year} • {currentInstitution?.name}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Fecha de Emisión: {new Date().toLocaleDateString('es-CL')}
                </p>
              </div>

              {/* Totals Banner in Print Modal */}
              <div className="grid grid-cols-3 gap-3 text-center bg-white p-3 border border-slate-200 rounded-lg">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Total Recaudado</span>
                  <span className="text-sm font-black text-emerald-700">{formatCLP(totalCollected)}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Total Gastos</span>
                  <span className="text-sm font-black text-rose-700">{formatCLP(totalSpent)}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Saldo Disponible</span>
                  <span className="text-sm font-black text-blue-700">{formatCLP(balance)}</span>
                </div>
              </div>

              {/* Table of all expenses */}
              <div className="overflow-x-auto bg-white rounded-lg border border-slate-200">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-2">Fecha</th>
                      <th className="p-2">Concepto / Detalle</th>
                      <th className="p-2">Categoría</th>
                      <th className="p-2">Comprobante</th>
                      <th className="p-2 text-right">Monto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {courseExpenses.map((exp, idx) => (
                      <tr key={exp.id || idx}>
                        <td className="p-2 whitespace-nowrap">{formatDate(exp.date)}</td>
                        <td className="p-2 font-medium">{exp.concept}</td>
                        <td className="p-2">{exp.category}</td>
                        <td className="p-2">{exp.receiptType} {exp.receiptNumber ? `#${exp.receiptNumber}` : ''}</td>
                        <td className="p-2 text-right font-bold">{formatCLP(exp.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-100 font-bold border-t border-slate-200">
                    <tr>
                      <td colSpan={4} className="p-2 text-right">TOTAL GASTOS:</td>
                      <td className="p-2 text-right font-black text-rose-700">{formatCLP(totalSpent)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-8 pt-8 text-center text-xs">
                <div className="border-t border-slate-400 pt-2">
                  <p className="font-bold text-slate-900">
                    {currentCourse?.treasurer?.fullName || 'Tesorero/a del Curso'}
                  </p>
                  <p className="text-[10px] text-slate-500">Tesorero/a de Curso</p>
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

      {/* ========================================================================= */}
      {/* MODAL: GENERADOR DE BALANCES EN PDF OFICIALES                             */}
      {/* ========================================================================= */}
      {showPdfReportModal && (
        <FinancialPdfReportModal
          initialMonthKey={pdfModalInitialMonth}
          onClose={() => setShowPdfReportModal(false)}
        />
      )}

      {/* ========================================================================= */}
      {/* MODAL: VISOR DE DOCUMENTO / EVIDENCIA ADJUNTA                            */}
      {/* ========================================================================= */}
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
