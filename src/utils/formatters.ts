import * as XLSX from 'xlsx';
import { Course, CourseExpense, MONTHS_LIST, MonthKey, Student } from '../types';

export const formatCLP = (amount: number): string => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (dateStr?: string): string => {
  if (!dateStr) return '-';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('es-CL');
  } catch {
    return dateStr;
  }
};

export const getMonthLabel = (monthKey: MonthKey): string => {
  const found = MONTHS_LIST.find((m) => m.key === monthKey);
  return found ? found.label : monthKey;
};

export const getStudentPaymentSummary = (student: Student, monthlyFee = 5000) => {
  const totalMonths = MONTHS_LIST.length; // 10 (Marzo a Diciembre)
  let paidCount = 0;
  let paidAmount = 0;
  const pendingMonths: MonthKey[] = [];
  const paidMonths: MonthKey[] = [];

  MONTHS_LIST.forEach((m) => {
    const record = student.payments[m.key];
    if (record && record.isPaid) {
      paidCount++;
      paidAmount += record.amount || monthlyFee;
      paidMonths.push(m.key);
    } else {
      pendingMonths.push(m.key);
    }
  });

  const totalExpected = totalMonths * monthlyFee;
  const debtAmount = totalExpected - paidAmount;
  const isFullyPaid = paidCount === totalMonths;
  const percent = totalExpected > 0 ? Math.round((paidAmount / totalExpected) * 100) : 0;

  return {
    paidCount,
    totalMonths,
    paidAmount,
    debtAmount,
    totalExpected,
    isFullyPaid,
    percent,
    pendingMonths,
    paidMonths,
  };
};

export const generateWhatsAppLink = (
  student: Student,
  course: Course,
  customMessage?: string
): string => {
  const phone = student.parentPhone?.replace(/[^0-9]/g, '') || '';
  if (!phone) return '';

  const summary = getStudentPaymentSummary(student, course.monthlyFee);

  let message = customMessage;
  if (!message) {
    const pendingNames = summary.pendingMonths.map(getMonthLabel).join(', ');
    const bank = course.bankInfo;
    const bankDetails = bank
      ? `\n\n📌 *Datos de Transferencia:*\n- Banco: ${bank.bankName}\n- Tipo de Cuenta: ${bank.accountType}\n- N° Cuenta: ${bank.accountNumber}\n- Titular: ${bank.holderName}\n- RUT: ${bank.holderRut}\n- Correo: ${bank.email}`
      : '';

    message = `Estimado/a ${student.parentFullName || 'Apoderado/a'},\n\nLe saluda la Tesorería del curso *${course.name}* (${course.year}).\n\nInformamos el estado de cuotas de su alumno/a *${student.studentFullName}*:\n- Cuotas Pagadas: ${summary.paidCount} de 10 (${formatCLP(summary.paidAmount)})\n- Cuotas Pendientes: ${summary.pendingMonths.length} (${pendingNames || 'Ninguna'})\n- Total Adeudado: *${formatCLP(summary.debtAmount)}*${bankDetails}\n\nAgradecemos enviar el comprobante de pago a este medio. ¡Muchas gracias por su compromiso con las actividades del curso!`;
  }

  // Ensure Chilean international prefix if 9 digits
  let formattedPhone = phone;
  if (phone.length === 9 && phone.startsWith('9')) {
    formattedPhone = `56${phone}`;
  }

  return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
};

/**
 * Generates email subject and body for a student payment summary
 */
export const generateStudentEmailData = (
  student: Student,
  course: Course
): { subject: string; body: string } => {
  const summary = getStudentPaymentSummary(student, course.monthlyFee);
  const pendingNames = summary.pendingMonths.map(getMonthLabel).join(', ');
  const bank = course.bankInfo;
  const bankDetails = bank
    ? `\n\n📌 DATOS DE TRANSFERENCIA BANCARIA:\n- Banco: ${bank.bankName}\n- Tipo de Cuenta: ${bank.accountType}\n- N° Cuenta: ${bank.accountNumber}\n- Titular: ${bank.holderName}\n- RUT: ${bank.holderRut}\n- Correo de Notificación: ${bank.email}`
    : '';

  const subject = `[Estado de Cuotas] ${student.studentFullName} — ${course.name} (${course.year})`;
  const body =
    `Estimado/a ${student.parentFullName || 'Apoderado/a'}:\n\n` +
    `Junto con saludarle, la Tesorería del curso ${course.name} le informa el estado actualizado de cuotas escolares de su alumno/a ${student.studentFullName}:\n\n` +
    `• Cuotas Pagadas: ${summary.paidCount} de 10 cuotas (${formatCLP(summary.paidAmount)})\n` +
    `• Cuotas Pendientes: ${summary.pendingMonths.length} (${pendingNames || 'Al día'})\n` +
    `• Monto Total Pendiente: ${formatCLP(summary.debtAmount)} CLP\n` +
    `• Valor de la Cuota Mensual: ${formatCLP(course.monthlyFee)} CLP\n` +
    `${bankDetails}\n\n` +
    `Si ya realizó una transferencia reciente, por favor adjunte su comprobante respondiendo a este mensaje.\n\n` +
    `Agradecemos su constante compromiso y colaboración con las actividades del curso.\n\n` +
    `Atentamente,\nTesorería ${course.name}`;

  return { subject, body };
};

/**
 * Generates direct Gmail web composer URL
 */
export const generateGmailComposeLink = (
  toEmail: string,
  subject: string,
  body: string
): string => {
  const encodedTo = encodeURIComponent(toEmail);
  const encodedSubject = encodeURIComponent(subject);
  const encodedBody = encodeURIComponent(body);
  return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodedTo}&su=${encodedSubject}&body=${encodedBody}`;
};

/**
 * Generates standard mailto URL
 */
export const generateMailtoLink = (
  toEmail: string,
  subject: string,
  body: string
): string => {
  const encodedSubject = encodeURIComponent(subject);
  const encodedBody = encodeURIComponent(body);
  return `mailto:${toEmail}?subject=${encodedSubject}&body=${encodedBody}`;
};

/**
 * Downloads a pre-formatted Excel template for bulk student import
 */
export const downloadExcelTemplate = (courseName = 'Curso') => {
  const templateData = [
    {
      'Nombre y Apellido del Alumno': 'Benjamín Soto Muñoz',
      'RUT Alumno (Opcional)': '24.556.789-1',
      'Nombre y Apellido del Apoderado': 'Marcela Muñoz Silva',
      'Email Apoderado': 'marcela.munoz@ejemplo.cl',
      'Teléfono / WhatsApp': '+56 9 8765 4321',
      'RUT Apoderado (Opcional)': '15.234.567-8',
      'Notas': 'Apoderada suplente Juan Soto',
    },
    {
      'Nombre y Apellido del Alumno': 'Constanza Paz Valenzuela',
      'RUT Alumno (Opcional)': '24.667.890-2',
      'Nombre y Apellido del Apoderado': 'Felipe Valenzuela Tapia',
      'Email Apoderado': 'felipe.valenzuela@ejemplo.cl',
      'Teléfono / WhatsApp': '+56 9 9876 5432',
      'RUT Apoderado (Opcional)': '14.112.334-5',
      'Notas': 'Preferencia contacto por WhatsApp',
    },
    {
      'Nombre y Apellido del Alumno': 'Ignacio Andrés Castro Díaz',
      'RUT Alumno (Opcional)': '24.778.901-3',
      'Nombre y Apellido del Apoderado': 'Lorena Díaz Pizarro',
      'Email Apoderado': 'lorena.diaz@ejemplo.cl',
      'Teléfono / WhatsApp': '+56 9 7654 3210',
      'RUT Apoderado (Opcional)': '16.998.776-K',
      'Notas': '',
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(templateData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Alumnos');

  // Adjust column widths
  worksheet['!cols'] = [
    { wch: 32 }, // Alumno
    { wch: 20 }, // RUT Alumno
    { wch: 32 }, // Apoderado
    { wch: 28 }, // Email
    { wch: 20 }, // Teléfono
    { wch: 22 }, // RUT Apoderado
    { wch: 30 }, // Notas
  ];

  XLSX.writeFile(workbook, `Plantilla_Alumnos_${courseName.replace(/\s+/g, '_')}.xlsx`);
};

/**
 * Export full payment roster & summary to Excel
 */
export const exportPaymentsToExcel = (students: Student[], course: Course) => {
  const exportData = students.map((s, idx) => {
    const summary = getStudentPaymentSummary(s, course.monthlyFee);
    const row: Record<string, string | number> = {
      'N°': idx + 1,
      'Alumno': s.studentFullName,
      'RUT Alumno': s.studentRut || '-',
      'Apoderado': s.parentFullName,
      'Teléfono Apoderado': s.parentPhone || '-',
      'Email Apoderado': s.parentEmail || '-',
    };

    MONTHS_LIST.forEach((m) => {
      const p = s.payments[m.key];
      row[m.label] = p && p.isPaid ? 'PAGADO' : 'PENDIENTE';
    });

    row['Cuotas Pagadas'] = `${summary.paidCount} / 10`;
    row['Total Pagado ($)'] = summary.paidAmount;
    row['Total Pendiente ($)'] = summary.debtAmount;
    row['Estado'] = summary.isFullyPaid ? 'AL DÍA' : summary.paidCount >= 5 ? 'PARCIAL' : 'MOROSO';

    return row;
  });

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Cuotas_Alumnos');

  XLSX.writeFile(workbook, `Planilla_Cuotas_${course.name.replace(/\s+/g, '_')}_${course.year}.xlsx`);
};

/**
 * Export full expenses ledger to Excel
 */
export const exportExpensesToExcel = (expenses: CourseExpense[], course: Course) => {
  const exportData = expenses.map((e, idx) => ({
    'N°': idx + 1,
    'Fecha': formatDate(e.date),
    'Concepto / Detalle': e.concept,
    'Categoría': e.category,
    'Monto ($ CLP)': e.amount,
    'Proveedor / Responsable': e.responsible,
    'Tipo Documento': e.receiptType,
    'N° Documento': e.receiptNumber || '-',
    'Registrado Por': e.registeredBy,
    'Observaciones': e.notes || '-',
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Gastos_Curso');

  XLSX.writeFile(workbook, `Planilla_Gastos_${course.name.replace(/\s+/g, '_')}_${course.year}.xlsx`);
};

/**
 * Export detailed expenses ledger in "Con Deuda" format to Excel
 */
export const exportExpensesDebtToExcel = (expenses: CourseExpense[], course: Course) => {
  const exportData = expenses.map((e, idx) => {
    const paid = e.paidAmount !== undefined ? e.paidAmount : (e.paymentStatus === 'CON_DEUDA' ? 0 : e.amount);
    const debt = e.debtAmount !== undefined ? e.debtAmount : Math.max(0, e.amount - paid);
    const statusLabel =
      debt === 0 || e.paymentStatus === 'PAGADO'
        ? 'PAGADO 100%'
        : paid > 0
        ? 'PAGO PARCIAL (CON DEUDA)'
        : 'CON DEUDA PENDIENTE';

    const creditorTypeLabel =
      e.creditorType === 'APODERADO_REEMBOLSO'
        ? 'Reembolso Apoderado'
        : e.creditorType === 'PROVEEDOR'
        ? 'Proveedor / Factura'
        : e.creditorType === 'DIRECTIVA'
        ? 'Directiva de Curso'
        : 'Otro';

    return {
      'N°': idx + 1,
      'Fecha Registro': formatDate(e.date),
      'Fecha Vencimiento / Plazo': formatDate(e.dueDate) || '-',
      'Concepto / Detalle del Gasto': e.concept,
      'Categoría': e.category,
      'Acreedor / A Quién se le Debe': e.creditorName || e.responsible || '-',
      'Tipo Acreedor': creditorTypeLabel,
      'Contacto Acreedor': e.creditorContact || '-',
      'Monto Total Gasto ($)': e.amount,
      'Monto Pagado / Rendido ($)': paid,
      'Saldo Con Deuda Pendiente ($)': debt,
      'Estado Deuda': statusLabel,
      'Tipo Comprobante': e.receiptType,
      'N° Comprobante': e.receiptNumber || '-',
      'Fecha Liquidación Total': formatDate(e.settledDate) || '-',
      'Registrado Por': e.registeredBy,
      'Observaciones': e.notes || '-',
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Gastos_Con_Deuda');

  // Adjust column widths for readability
  worksheet['!cols'] = [
    { wch: 6 }, // N°
    { wch: 14 }, // Fecha Registro
    { wch: 16 }, // Vencimiento
    { wch: 38 }, // Concepto
    { wch: 24 }, // Categoría
    { wch: 30 }, // Acreedor
    { wch: 22 }, // Tipo Acreedor
    { wch: 24 }, // Contacto
    { wch: 18 }, // Monto Total
    { wch: 18 }, // Pagado
    { wch: 22 }, // Saldo Con Deuda
    { wch: 24 }, // Estado
    { wch: 18 }, // Comprobante
    { wch: 16 }, // N°
    { wch: 18 }, // Liquidado
    { wch: 20 }, // Registrado
    { wch: 35 }, // Observaciones
  ];

  XLSX.writeFile(
    workbook,
    `Informe_Gastos_Con_Deuda_${course.name.replace(/\s+/g, '_')}_${course.year}.xlsx`
  );
};
