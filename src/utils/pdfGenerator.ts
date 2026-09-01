import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Course, CourseExpense, Institution, MONTHS_LIST, MonthKey, Student } from '../types';
import { formatCLP, formatDate, getMonthLabel, getStudentPaymentSummary } from './formatters';

interface BaseReportOptions {
  course: Course;
  institution?: Institution;
  students: Student[];
  expenses: CourseExpense[];
  notes?: string;
  treasurerName?: string;
  presidentName?: string;
}

interface MonthlyReportOptions extends BaseReportOptions {
  monthKey: MonthKey;
}

/**
 * Adds official header, title, institution details and treasurer metadata
 */
const addOfficialHeader = (
  doc: jsPDF,
  title: string,
  subtitle: string,
  course: Course,
  institution?: Institution,
  badgeText = 'DOCUMENTO OFICIAL'
) => {
  const pageWidth = doc.internal.pageSize.getWidth();

  // Top header banner background
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Top color accent bar
  doc.setFillColor(37, 99, 235); // blue-600
  doc.rect(0, 0, pageWidth, 3, 'F');

  // Badge
  doc.setFillColor(30, 58, 138); // blue-900
  doc.roundedRect(14, 7, 36, 5, 1, 1, 'F');
  doc.setTextColor(191, 219, 254); // blue-200
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text(badgeText, 16, 10.5);

  // Main Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, 18);

  // Subtitle / Course info
  doc.setTextColor(203, 213, 225); // slate-300
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text(subtitle, 14, 24);

  // Right-aligned Metadata (Date & Institution)
  const now = new Date();
  const dateStr = now.toLocaleDateString('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const timeStr = now.toLocaleTimeString('es-CL', {
    hour: '2-digit',
    minute: '2-digit',
  });

  doc.setFontSize(7.5);
  doc.setTextColor(226, 232, 240);
  doc.text(`Emisión: ${dateStr} ${timeStr}`, pageWidth - 14, 10, { align: 'right' });
  doc.setFont('helvetica', 'bold');
  doc.text(institution?.name || 'Colegio / Establecimiento', pageWidth - 14, 16, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text(`${institution?.city || 'Chile'} • Curso: ${course.name} (${course.year})`, pageWidth - 14, 22, { align: 'right' });

  // Reset text color
  doc.setTextColor(15, 23, 42);
};

/**
 * Adds official signature boxes at bottom
 */
const addSignatures = (
  doc: jsPDF,
  startY: number,
  treasurerName: string,
  presidentName: string
) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Ensure enough room on current page or new page
  if (startY + 35 > pageHeight - 15) {
    doc.addPage();
    startY = 20;
  }

  const colWidth = (pageWidth - 28 - 20) / 3;
  let currentX = 14;

  const roles = [
    { title: 'Tesorero/a Titular', name: treasurerName, sub: 'Rendición de Cuentas' },
    { title: 'Presidente/a Curso', name: presidentName, sub: 'Directiva de Curso' },
    { title: 'Profesor/a Jefe / Revisor', name: 'Firma y Timbre', sub: 'Visado General' },
  ];

  roles.forEach((r) => {
    // Signature line
    doc.setDrawColor(148, 163, 184); // slate-400
    doc.setLineWidth(0.4);
    doc.line(currentX, startY + 18, currentX + colWidth, startY + 18);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text(r.name, currentX + colWidth / 2, startY + 22, { align: 'center' });

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(r.title, currentX + colWidth / 2, startY + 25.5, { align: 'center' });
    doc.text(r.sub, currentX + colWidth / 2, startY + 29, { align: 'center' });

    currentX += colWidth + 10;
  });
};

/**
 * Adds footer pagination and validity badge to all pages
 */
const addFooterAndPagination = (doc: jsPDF, course: Course) => {
  const pageCount = (doc as any).internal.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(0.3);
    doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12);

    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text(
      `Cuotin • Tesorería Digital • ${course.name} (${course.year}) • Documento informativo oficial de tesorería`,
      14,
      pageHeight - 8
    );
    doc.text(
      `Página ${i} de ${pageCount}`,
      pageWidth - 14,
      pageHeight - 8,
      { align: 'right' }
    );
  }
};

/**
 * GENERATE OFFICIAL MONTHLY FINANCIAL BALANCE PDF
 */
export const generateMonthlyFinancialReportPDF = (options: MonthlyReportOptions): jsPDF => {
  const {
    course,
    institution,
    students,
    expenses,
    monthKey,
    notes,
    treasurerName = course.treasurer?.fullName || 'Tesorero/a del Curso',
    presidentName = 'Presidente/a Centro de Padres',
  } = options;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const monthObj = MONTHS_LIST.find((m) => m.key === monthKey) || MONTHS_LIST[0];
  const monthlyFee = course.monthlyFee || 5000;
  const monthNum = monthObj.monthNumber;

  // Title and header
  addOfficialHeader(
    doc,
    `BALANCE FINANCIERO MENSUAL: ${monthObj.label.toUpperCase()} ${course.year}`,
    `Rendición Oficial de Tesorería • Cuota Mensual Oficial: ${formatCLP(monthlyFee)}`,
    course,
    institution,
    `MES: ${monthObj.label.toUpperCase()}`
  );

  // Calculate month metrics
  let monthCollected = 0;
  let paidStudentsCount = 0;
  const totalStudents = students.length;

  students.forEach((s) => {
    const p = s.payments[monthKey];
    if (p && p.isPaid) {
      paidStudentsCount++;
      monthCollected += p.amount || monthlyFee;
    }
  });

  const pendingStudentsCount = totalStudents - paidStudentsCount;
  const monthExpected = totalStudents * monthlyFee;
  const monthCollectionRate = monthExpected > 0 ? Math.round((monthCollected / monthExpected) * 100) : 0;

  // Filter expenses of this month
  const monthExpenses = expenses.filter((e) => {
    if (!e.date) return false;
    const d = new Date(e.date);
    return d.getMonth() + 1 === monthNum;
  });

  const monthSpent = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const monthPaidExpenses = monthExpenses.reduce((sum, e) => {
    const paid = e.paidAmount !== undefined ? e.paidAmount : (e.paymentStatus === 'CON_DEUDA' ? 0 : e.amount);
    return sum + paid;
  }, 0);
  const monthDebtExpenses = monthSpent - monthPaidExpenses;
  const monthNetFlow = monthCollected - monthPaidExpenses;

  // Cumulative numbers up to this month
  let cumulativeCollected = 0;
  students.forEach((s) => {
    MONTHS_LIST.forEach((m) => {
      const rec = s.payments[m.key];
      if (rec && rec.isPaid) {
        cumulativeCollected += rec.amount || monthlyFee;
      }
    });
  });

  const totalSpentAllYear = expenses.reduce((sum, e) => sum + (e.paidAmount !== undefined ? e.paidAmount : (e.paymentStatus === 'CON_DEUDA' ? 0 : e.amount)), 0);
  const totalBalanceAllYear = cumulativeCollected - totalSpentAllYear;

  // Render Top 4 Summary KPI Boxes
  const startY = 33;
  const boxWidth = (doc.internal.pageSize.getWidth() - 28 - 9) / 4;

  const kpis = [
    {
      title: 'RECAUDACIÓN MES',
      value: formatCLP(monthCollected),
      sub: `${paidStudentsCount}/${totalStudents} alumnos (${monthCollectionRate}%)`,
      color: [16, 185, 129], // emerald-500
      bg: [236, 253, 245],
    },
    {
      title: 'GASTOS DEL MES',
      value: formatCLP(monthSpent),
      sub: `${monthExpenses.length} boletas (${formatCLP(monthPaidExpenses)} pagado)`,
      color: [239, 68, 68], // red-500
      bg: [254, 242, 242],
    },
    {
      title: 'FLUJO NETO DEL MES',
      value: (monthNetFlow >= 0 ? '+' : '') + formatCLP(monthNetFlow),
      sub: monthNetFlow >= 0 ? 'Superávit del mes' : 'Déficit del mes',
      color: monthNetFlow >= 0 ? [37, 99, 235] : [225, 29, 72],
      bg: monthNetFlow >= 0 ? [239, 246, 255] : [255, 241, 242],
    },
    {
      title: 'SALDO EN CAJA TOTAL',
      value: formatCLP(totalBalanceAllYear),
      sub: 'Disponible en cuenta bancaria',
      color: [79, 70, 229], // indigo-600
      bg: [238, 242, 255],
    },
  ];

  kpis.forEach((kpi, idx) => {
    const x = 14 + idx * (boxWidth + 3);
    doc.setFillColor(kpi.bg[0], kpi.bg[1], kpi.bg[2]);
    doc.setDrawColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, startY, boxWidth, 20, 1.5, 1.5, 'FD');

    doc.setFontSize(6);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    doc.text(kpi.title, x + 2.5, startY + 4.5);

    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(kpi.value, x + 2.5, startY + 11.5);

    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.sub, x + 2.5, startY + 16.5);
  });

  let currentY = startY + 25;

  // Account / Bank Details Card if configured
  if (course.bankInfo) {
    const bank = course.bankInfo;
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, currentY, doc.internal.pageSize.getWidth() - 28, 10, 1, 1, 'FD');

    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('DATOS DE LA CUENTA DEL CURSO:', 17, currentY + 4);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(
      `Banco: ${bank.bankName} • ${bank.accountType} N° ${bank.accountNumber} • Titular: ${bank.holderName} (RUT: ${bank.holderRut}) • Email: ${bank.email}`,
      17,
      currentY + 7.5
    );
    currentY += 13;
  }

  // Section 1: Expenses of the month table
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`1. DETALLE DE GASTOS Y COMPROBANTES - ${monthObj.label.toUpperCase()} (${monthExpenses.length})`, 14, currentY + 3);

  const expenseRows = monthExpenses.length > 0
    ? monthExpenses.map((e, idx) => [
        (idx + 1).toString(),
        formatDate(e.date),
        e.concept,
        e.category,
        `${e.receiptType} ${e.receiptNumber ? '#' + e.receiptNumber : ''}`,
        e.responsible,
        e.paymentStatus === 'CON_DEUDA' ? 'Deuda' : 'Pagado',
        formatCLP(e.amount),
      ])
    : [['-', '-', 'No se registraron gastos en este mes', '-', '-', '-', '-', '$0']];

  autoTable(doc, {
    startY: currentY + 5,
    head: [['#', 'Fecha', 'Concepto / Proveedor', 'Categoría', 'Comprobante', 'Responsable', 'Estado', 'Monto']],
    body: expenseRows,
    foot: [
      [
        { content: 'TOTAL GASTOS DEL MES:', colSpan: 7, styles: { halign: 'right', fontStyle: 'bold' } },
        { content: formatCLP(monthSpent), styles: { halign: 'right', fontStyle: 'bold', textColor: [225, 29, 72] } },
      ],
    ],
    theme: 'striped',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontSize: 7,
      fontStyle: 'bold',
      cellPadding: 2,
    },
    bodyStyles: {
      fontSize: 6.8,
      cellPadding: 1.8,
      textColor: [51, 65, 85],
    },
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontSize: 7.5,
      cellPadding: 2,
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 18 },
      2: { cellWidth: 'auto' },
      3: { cellWidth: 32 },
      4: { cellWidth: 26 },
      5: { cellWidth: 24 },
      6: { cellWidth: 16, halign: 'center' },
      7: { cellWidth: 22, halign: 'right', fontStyle: 'bold' },
    },
    margin: { left: 14, right: 14 },
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // Section 2: Payments of the month table
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`2. RECAUDACIÓN DE CUOTAS POR ALUMNO - ${monthObj.label.toUpperCase()} (${paidStudentsCount} Pagadas / ${pendingStudentsCount} Pendientes)`, 14, currentY + 3);

  const studentRows = students.map((s, idx) => {
    const payment = s.payments[monthKey];
    const isPaid = payment?.isPaid || false;
    const amount = isPaid ? payment?.amount || monthlyFee : 0;
    const date = payment?.paidAt ? formatDate(payment.paidAt) : '-';
    const method = payment?.paymentMethod || '-';

    return [
      (idx + 1).toString(),
      s.studentFullName,
      s.parentFullName || 'Apoderado',
      isPaid ? 'PAGADO' : 'PENDIENTE',
      date,
      method,
      isPaid ? formatCLP(amount) : '$0',
    ];
  });

  autoTable(doc, {
    startY: currentY + 5,
    head: [['#', 'Nombre Alumno/a', 'Apoderado/a', 'Estado', 'Fecha Pago', 'Medio', 'Monto Pagado']],
    body: studentRows,
    foot: [
      [
        { content: 'TOTAL RECAUDADO EN EL MES:', colSpan: 6, styles: { halign: 'right', fontStyle: 'bold' } },
        { content: formatCLP(monthCollected), styles: { halign: 'right', fontStyle: 'bold', textColor: [16, 185, 129] } },
      ],
    ],
    theme: 'grid',
    headStyles: {
      fillColor: [37, 99, 235],
      textColor: [255, 255, 255],
      fontSize: 7,
      fontStyle: 'bold',
      cellPadding: 2,
    },
    bodyStyles: {
      fontSize: 6.8,
      cellPadding: 1.8,
      textColor: [51, 65, 85],
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 3) {
        if (data.cell.raw === 'PAGADO') {
          data.cell.styles.textColor = [16, 185, 129];
          data.cell.styles.fontStyle = 'bold';
        } else {
          data.cell.styles.textColor = [225, 29, 72];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontSize: 7.5,
      cellPadding: 2,
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 42 },
      3: { cellWidth: 22, halign: 'center' },
      4: { cellWidth: 20, halign: 'center' },
      5: { cellWidth: 22 },
      6: { cellWidth: 24, halign: 'right', fontStyle: 'bold' },
    },
    margin: { left: 14, right: 14 },
  });

  currentY = (doc as any).lastAutoTable.finalY + 6;

  // Notes section if exists
  if (notes && notes.trim()) {
    if (currentY + 20 > doc.internal.pageSize.getHeight() - 40) {
      doc.addPage();
      currentY = 20;
    }
    doc.setFillColor(254, 252, 232); // amber-50
    doc.setDrawColor(253, 224, 71); // amber-300
    doc.roundedRect(14, currentY, doc.internal.pageSize.getWidth() - 28, 14, 1, 1, 'FD');
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(146, 64, 14);
    doc.text('OBSERVACIONES DE TESORERÍA:', 17, currentY + 4.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(113, 63, 18);
    doc.text(notes.trim(), 17, currentY + 9.5, { maxWidth: doc.internal.pageSize.getWidth() - 34 });
    currentY += 18;
  }

  // Add Signatures
  addSignatures(doc, currentY + 4, treasurerName, presidentName);

  // Add Footers and page numbers
  addFooterAndPagination(doc, course);

  return doc;
};

/**
 * GENERATE OFFICIAL ANNUAL / CONSOLIDATED BALANCE PDF
 */
export const generateAnnualFinancialReportPDF = (options: BaseReportOptions): jsPDF => {
  const {
    course,
    institution,
    students,
    expenses,
    notes,
    treasurerName = course.treasurer?.fullName || 'Tesorero/a del Curso',
    presidentName = 'Presidente/a Centro de Padres',
  } = options;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const monthlyFee = course.monthlyFee || 5000;
  const totalStudents = students.length;
  const totalAnnualPotential = totalStudents * 10 * monthlyFee;

  addOfficialHeader(
    doc,
    `BALANCE FINANCIERO ANUAL CONSOLIDADO ${course.year}`,
    `Informe General de Recaudación y Rendición de Gastos • ${course.name}`,
    course,
    institution,
    'BALANCE ANUAL'
  );

  // Annual Totals
  let totalCollected = 0;
  students.forEach((s) => {
    MONTHS_LIST.forEach((m) => {
      const p = s.payments[m.key];
      if (p && p.isPaid) {
        totalCollected += p.amount || monthlyFee;
      }
    });
  });

  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalPaidExpenses = expenses.reduce((sum, e) => {
    const paid = e.paidAmount !== undefined ? e.paidAmount : (e.paymentStatus === 'CON_DEUDA' ? 0 : e.amount);
    return sum + paid;
  }, 0);
  const totalDebtExpenses = totalSpent - totalPaidExpenses;
  const balance = totalCollected - totalPaidExpenses;
  const collectionRate = totalAnnualPotential > 0 ? Math.round((totalCollected / totalAnnualPotential) * 100) : 0;

  // Top KPI summary
  const startY = 33;
  const boxWidth = (doc.internal.pageSize.getWidth() - 28 - 9) / 4;

  const kpis = [
    {
      title: 'TOTAL RECAUDADO',
      value: formatCLP(totalCollected),
      sub: `${collectionRate}% de la meta anual`,
      color: [16, 185, 129],
      bg: [236, 253, 245],
    },
    {
      title: 'TOTAL EGRESOS',
      value: formatCLP(totalSpent),
      sub: `${expenses.length} gastos (${formatCLP(totalDebtExpenses)} deuda)`,
      color: [239, 68, 68],
      bg: [254, 242, 242],
    },
    {
      title: 'SALDO EN CAJA ACTUAL',
      value: formatCLP(balance),
      sub: 'Disponible en cuenta',
      color: [37, 99, 235],
      bg: [239, 246, 255],
    },
    {
      title: 'CUOTAS POR COBRAR',
      value: formatCLP(Math.max(0, totalAnnualPotential - totalCollected)),
      sub: `Meta: ${formatCLP(totalAnnualPotential)}`,
      color: [217, 119, 6],
      bg: [254, 243, 199],
    },
  ];

  kpis.forEach((kpi, idx) => {
    const x = 14 + idx * (boxWidth + 3);
    doc.setFillColor(kpi.bg[0], kpi.bg[1], kpi.bg[2]);
    doc.setDrawColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, startY, boxWidth, 20, 1.5, 1.5, 'FD');

    doc.setFontSize(6);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    doc.text(kpi.title, x + 2.5, startY + 4.5);

    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(kpi.value, x + 2.5, startY + 11.5);

    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.sub, x + 2.5, startY + 16.5);
  });

  let currentY = startY + 25;

  // Section 1: Monthly breakdown table (Marzo a Diciembre)
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('1. FLUJO DE CAJA MENSUAL CONSOLIDADO (MARZO - DICIEMBRE)', 14, currentY + 3);

  const monthlyRows = MONTHS_LIST.map((m) => {
    let mCollected = 0;
    let mPaidStudents = 0;
    students.forEach((s) => {
      const p = s.payments[m.key];
      if (p && p.isPaid) {
        mPaidStudents++;
        mCollected += p.amount || monthlyFee;
      }
    });

    const mExpenses = expenses.filter((e) => {
      if (!e.date) return false;
      return new Date(e.date).getMonth() + 1 === m.monthNumber;
    });

    const mSpent = mExpenses.reduce((sum, e) => sum + e.amount, 0);
    const mNet = mCollected - mSpent;
    const partPct = totalStudents > 0 ? Math.round((mPaidStudents / totalStudents) * 100) : 0;

    return [
      m.label,
      `${mPaidStudents}/${totalStudents} (${partPct}%)`,
      formatCLP(mCollected),
      mExpenses.length.toString(),
      formatCLP(mSpent),
      (mNet >= 0 ? '+' : '') + formatCLP(mNet),
    ];
  });

  autoTable(doc, {
    startY: currentY + 5,
    head: [['Mes', 'Cumplimiento Alumnos', 'Recaudación Cuotas', 'N° Gastos', 'Total Gastado', 'Flujo Neto']],
    body: monthlyRows,
    foot: [
      [
        { content: 'TOTALES ACUMULADOS:', styles: { fontStyle: 'bold' } },
        { content: `${collectionRate}% Anual`, styles: { fontStyle: 'bold' } },
        { content: formatCLP(totalCollected), styles: { fontStyle: 'bold', textColor: [16, 185, 129] } },
        { content: expenses.length.toString(), styles: { fontStyle: 'bold' } },
        { content: formatCLP(totalSpent), styles: { fontStyle: 'bold', textColor: [225, 29, 72] } },
        { content: formatCLP(totalCollected - totalSpent), styles: { fontStyle: 'bold', textColor: [37, 99, 235] } },
      ],
    ],
    theme: 'striped',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 7,
      fontStyle: 'bold',
      cellPadding: 2,
    },
    bodyStyles: {
      fontSize: 6.8,
      cellPadding: 1.8,
      textColor: [51, 65, 85],
    },
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontSize: 7.5,
      cellPadding: 2,
    },
    columnStyles: {
      0: { cellWidth: 26, fontStyle: 'bold' },
      1: { cellWidth: 38 },
      2: { cellWidth: 32, halign: 'right' },
      3: { cellWidth: 20, halign: 'center' },
      4: { cellWidth: 32, halign: 'right' },
      5: { cellWidth: 34, halign: 'right', fontStyle: 'bold' },
    },
    margin: { left: 14, right: 14 },
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // Section 2: Category Breakdown Table
  const categoryMap: Record<string, { total: number; count: number }> = {};
  expenses.forEach((e) => {
    if (!categoryMap[e.category]) categoryMap[e.category] = { total: 0, count: 0 };
    categoryMap[e.category].total += e.amount;
    categoryMap[e.category].count += 1;
  });

  const categoryRows = Object.entries(categoryMap)
    .sort((a, b) => b[1].total - a[1].total)
    .map(([cat, data], idx) => [
      (idx + 1).toString(),
      cat,
      data.count.toString(),
      totalSpent > 0 ? `${Math.round((data.total / totalSpent) * 100)}%` : '0%',
      formatCLP(data.total),
    ]);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('2. DISTRIBUCIÓN DE GASTOS POR CATEGORÍA', 14, currentY + 3);

  autoTable(doc, {
    startY: currentY + 5,
    head: [['#', 'Categoría de Gasto', 'N° Comprobantes', '% del Total', 'Monto Total']],
    body: categoryRows.length > 0 ? categoryRows : [['-', 'Sin gastos registrados', '0', '0%', '$0']],
    foot: [
      [
        { content: 'TOTAL EGRESOS:', colSpan: 4, styles: { halign: 'right', fontStyle: 'bold' } },
        { content: formatCLP(totalSpent), styles: { halign: 'right', fontStyle: 'bold', textColor: [225, 29, 72] } },
      ],
    ],
    theme: 'grid',
    headStyles: {
      fillColor: [37, 99, 235],
      textColor: [255, 255, 255],
      fontSize: 7,
      fontStyle: 'bold',
      cellPadding: 2,
    },
    bodyStyles: {
      fontSize: 6.8,
      cellPadding: 1.8,
      textColor: [51, 65, 85],
    },
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontSize: 7.5,
      cellPadding: 2,
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 28, halign: 'center' },
      3: { cellWidth: 26, halign: 'center' },
      4: { cellWidth: 32, halign: 'right', fontStyle: 'bold' },
    },
    margin: { left: 14, right: 14 },
  });

  currentY = (doc as any).lastAutoTable.finalY + 6;

  if (notes && notes.trim()) {
    if (currentY + 20 > doc.internal.pageSize.getHeight() - 40) {
      doc.addPage();
      currentY = 20;
    }
    doc.setFillColor(254, 252, 232);
    doc.setDrawColor(253, 224, 71);
    doc.roundedRect(14, currentY, doc.internal.pageSize.getWidth() - 28, 14, 1, 1, 'FD');
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(146, 64, 14);
    doc.text('OBSERVACIONES GENERALES:', 17, currentY + 4.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(113, 63, 18);
    doc.text(notes.trim(), 17, currentY + 9.5, { maxWidth: doc.internal.pageSize.getWidth() - 34 });
    currentY += 18;
  }

  addSignatures(doc, currentY + 4, treasurerName, presidentName);
  addFooterAndPagination(doc, course);

  return doc;
};

/**
 * Downloads generated PDF with a clean standardized filename
 */
export const downloadPDFDocument = (doc: jsPDF, filename: string) => {
  doc.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
};
