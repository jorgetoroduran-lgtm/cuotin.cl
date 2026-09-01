export type MonthKey =
  | 'mar'
  | 'abr'
  | 'may'
  | 'jun'
  | 'jul'
  | 'ago'
  | 'sep'
  | 'oct'
  | 'nov'
  | 'dic';

export interface MonthInfo {
  key: MonthKey;
  label: string;
  shortLabel: string;
  monthNumber: number; // 3 to 12
}

export const MONTHS_LIST: MonthInfo[] = [
  { key: 'mar', label: 'Marzo', shortLabel: 'Mar', monthNumber: 3 },
  { key: 'abr', label: 'Abril', shortLabel: 'Abr', monthNumber: 4 },
  { key: 'may', label: 'Mayo', shortLabel: 'May', monthNumber: 5 },
  { key: 'jun', label: 'Junio', shortLabel: 'Jun', monthNumber: 6 },
  { key: 'jul', label: 'Julio', shortLabel: 'Jul', monthNumber: 7 },
  { key: 'ago', label: 'Agosto', shortLabel: 'Ago', monthNumber: 8 },
  { key: 'sep', label: 'Septiembre', shortLabel: 'Sep', monthNumber: 9 },
  { key: 'oct', label: 'Octubre', shortLabel: 'Oct', monthNumber: 10 },
  { key: 'nov', label: 'Noviembre', shortLabel: 'Nov', monthNumber: 11 },
  { key: 'dic', label: 'Diciembre', shortLabel: 'Dic', monthNumber: 12 },
];

export type PaymentMethod = 'Transferencia' | 'Efectivo' | 'Webpay / Débito' | 'Depósito' | 'Otro';

export interface PaymentRecord {
  month: MonthKey;
  isPaid: boolean;
  amount: number;
  paidAt?: string; // ISO date string (YYYY-MM-DD)
  paymentMethod?: PaymentMethod;
  receiptNumber?: string;
  registeredBy?: string;
  notes?: string;
}

export interface Student {
  id: string;
  courseId: string;
  studentFullName: string;
  studentRut?: string;
  parentFullName: string;
  parentEmail?: string;
  parentPhone?: string;
  parentRut?: string;
  payments: Record<MonthKey, PaymentRecord>;
  createdAt: string;
  notes?: string;
}

export type ExpenseCategory =
  | 'Eventos y Celebraciones'
  | 'Paseos y Transporte'
  | 'Materiales y Decoración'
  | 'Alimentación y Convivencias'
  | 'Regalos y Premios'
  | 'Fotografía y Recuerdos'
  | 'Imprevistos y Varios';

export type ReceiptType =
  | 'Boleta'
  | 'Factura'
  | 'Comprobante Transferencia'
  | 'Recibo Simple'
  | 'Otro';

export type ExpensePaymentStatus = 'PAGADO' | 'CON_DEUDA' | 'PARCIAL';

export type CreditorType =
  | 'PROVEEDOR'
  | 'APODERADO_REEMBOLSO'
  | 'DIRECTIVA'
  | 'OTRO';

export interface ExpenseAttachment {
  id?: string;
  fileName: string;
  fileSize: number; // in bytes
  fileType: string; // mime type
  fileData: string; // Base64 Data URL (data:image/png;base64,... or data:application/pdf;base64,...)
  uploadedAt: string; // ISO string or timestamp
}

export interface ExpenseAbono {
  id: string;
  date: string;
  amount: number;
  paymentMethod: PaymentMethod;
  referenceNumber?: string;
  notes?: string;
  registeredBy?: string;
}

export interface CourseExpense {
  id: string;
  courseId: string;
  date: string; // YYYY-MM-DD
  concept: string; // Detalle del gasto
  category: ExpenseCategory;
  amount: number; // Monto total en CLP
  responsible: string; // Pagado por / Proveedor
  receiptType: ReceiptType;
  receiptNumber?: string; // N° Boleta / Factura
  registeredBy: string;
  notes?: string;

  // Document Attachment (Comprobante / Evidencia digital opcional)
  attachment?: ExpenseAttachment;

  // Format "Con Deuda" fields:
  paymentStatus?: ExpensePaymentStatus; // 'PAGADO' | 'CON_DEUDA' | 'PARCIAL'
  paidAmount?: number; // Monto pagado efectivamente a la fecha
  debtAmount?: number; // Monto pendiente / adeudado
  creditorName?: string; // A quién se le debe (Proveedor o Apoderado que adelantó el dinero)
  creditorType?: CreditorType; // 'PROVEEDOR' | 'APODERADO_REEMBOLSO' | 'DIRECTIVA' | 'OTRO'
  creditorContact?: string; // Teléfono o correo del acreedor
  dueDate?: string; // Fecha límite de pago de la deuda
  settledDate?: string; // Fecha en que se liquidó totalmente la deuda
  abonos?: ExpenseAbono[]; // Historial de abonos para amortizar la deuda
}

export interface BankAccountDetails {
  bankName: string;
  accountType: string; // e.g. Cuenta Corriente, Cuenta Vista, Cuenta RUT
  accountNumber: string;
  holderName: string;
  holderRut: string;
  email: string;
}

export interface CourseTreasurer {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  rut: string;
  courseId: string;
  assignedAt: string;
  isActive: boolean;
}

export const COURSE_FEE_RANGES = [
  5000,
  10000,
  15000,
  20000,
  25000,
  30000,
  35000,
  40000,
  45000,
  50000,
] as const;

export type CourseFeeAmount = (typeof COURSE_FEE_RANGES)[number];

export interface Course {
  id: string;
  institutionId: string;
  name: string; // e.g. "4° Básico A", "8° Básico B", "2° Medio C"
  year: number; // 2026
  monthlyFee: number; // 5000, 10000, 15000, ..., 50000 CLP
  feeConfigured?: boolean; // Selected and confirmed by treasurer
  feeConfiguredAt?: string; // Date when selected
  feeConfiguredBy?: string; // Name of treasurer/user who set it
  treasurer?: CourseTreasurer;
  bankInfo?: BankAccountDetails;
  description?: string;
  createdAt: string;
}

export interface Institution {
  id: string;
  name: string;
  city: string;
  address?: string;
  contactEmail?: string;
  contactPhone?: string;
  createdAt: string;
}

export type UserRole = 'ADMIN_GENERAL' | 'TESORERO_CURSO';

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  rut?: string;
  phone?: string;
  assignedCourseId?: string; // If role is TESORERO_CURSO
  assignedInstitutionId?: string;
  avatar?: string;
  mustChangePassword?: boolean; // Requires password creation on first login or after reset
  isReadOnly?: boolean; // Read-only treasurer (Observador de resúmenes)
  createdAt?: string;
}

export interface AccessRequest {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  rut?: string;
  institutionName?: string;
  courseName?: string;
  selectedPlan?: 'MONTHLY' | 'ANNUAL';
  message?: string;
  createdAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  adminNotes?: string;
}

export interface CurrentUser {
  id: string;
  role: UserRole;
  name: string;
  email: string;
  rut?: string;
  phone?: string;
  assignedCourseId?: string;
  assignedInstitutionId?: string;
  mustChangePassword?: boolean;
  isReadOnly?: boolean;
}
