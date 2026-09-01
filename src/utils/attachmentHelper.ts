import { ExpenseAttachment } from '../types';

export const MAX_ATTACHMENT_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export const formatAttachmentSize = (bytes: number): string => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export const validateAttachmentFile = (file: File): { valid: boolean; error?: string } => {
  if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
    return {
      valid: false,
      error: `El archivo supera el límite máximo de ${formatAttachmentSize(MAX_ATTACHMENT_SIZE_BYTES)} (tu archivo pesa ${formatAttachmentSize(file.size)}). Por favor sube un archivo más liviano.`,
    };
  }

  const validTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/svg+xml',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ];

  // Also check extension if MIME is generic
  const validExtensions = /\.(jpg|jpeg|png|webp|gif|svg|pdf|doc|docx|xls|xlsx)$/i;

  if (!validTypes.includes(file.type) && !validExtensions.test(file.name)) {
    return {
      valid: false,
      error: 'Formato no soportado. Por favor adjunta una imagen (JPG, PNG, WEBP) o un documento PDF.',
    };
  }

  return { valid: true };
};

export const readFileAsAttachment = (file: File): Promise<ExpenseAttachment> => {
  return new Promise((resolve, reject) => {
    const validation = validateAttachmentFile(file);
    if (!validation.valid) {
      reject(new Error(validation.error || 'Archivo no válido'));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve({
        id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type || 'application/octet-stream',
        fileData: result,
        uploadedAt: new Date().toISOString(),
      });
    };
    reader.onerror = () => {
      reject(new Error('Error al leer el archivo en el navegador.'));
    };
    reader.readAsDataURL(file);
  });
};

/**
 * Creates a clean SVG base64 receipt for sample mock data
 */
export const createSampleReceiptSvg = (
  storeName: string,
  concept: string,
  amountCLP: number,
  date: string,
  receiptType: string,
  receiptNumber?: string
): string => {
  const formattedAmount = '$' + amountCLP.toLocaleString('es-CL');
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 800" width="600" height="800">
  <defs>
    <style>
      .bg { fill: #f8fafc; }
      .paper { fill: #ffffff; stroke: #cbd5e1; stroke-width: 2; }
      .header-bg { fill: #1e293b; }
      .title { fill: #ffffff; font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 20px; font-weight: bold; text-anchor: middle; }
      .subtitle { fill: #94a3b8; font-family: Arial, sans-serif; font-size: 12px; text-anchor: middle; }
      .text-label { fill: #64748b; font-family: Arial, sans-serif; font-size: 13px; font-weight: 600; }
      .text-val { fill: #0f172a; font-family: Arial, sans-serif; font-size: 14px; font-weight: 500; }
      .text-amount { fill: #059669; font-family: 'Courier New', monospace; font-size: 28px; font-weight: bold; }
      .stamp { fill: none; stroke: #059669; stroke-width: 2.5; rx: 8; }
      .stamp-text { fill: #059669; font-family: Arial, sans-serif; font-size: 13px; font-weight: bold; text-anchor: middle; letter-spacing: 1px; }
      .divider { stroke: #e2e8f0; stroke-width: 1.5; stroke-dasharray: 4 4; }
    </style>
  </defs>

  <rect width="600" height="800" class="bg"/>

  <!-- Paper Card -->
  <g transform="translate(40, 30)">
    <rect width="520" height="740" rx="12" class="paper"/>
    
    <!-- Top Header -->
    <path d="M 0 12 Q 0 0 12 0 L 508 0 Q 520 0 520 12 L 520 90 L 0 90 Z" class="header-bg"/>
    <text x="260" y="42" class="title">${receiptType.toUpperCase()} ELECTRÓNICA</text>
    <text x="260" y="65" class="subtitle">DOCUMENTO TRIBUTARIO DE RESPALDO • ${receiptNumber || 'FOLIO-OFICIAL'}</text>

    <!-- Store Info -->
    <text x="40" y="130" class="text-label">EMISOR / COMERCIO:</text>
    <text x="40" y="152" class="text-val" font-weight="bold" font-size="16">${storeName}</text>
    <text x="40" y="172" class="subtitle" text-anchor="start">RUT: 76.543.210-K • Santiago, Chile</text>

    <line x1="40" y1="195" x2="480" y2="195" class="divider"/>

    <!-- Expense Details -->
    <text x="40" y="230" class="text-label">FECHA DE EMISIÓN:</text>
    <text x="40" y="252" class="text-val">${date}</text>

    <text x="280" y="230" class="text-label">N° COMPROBANTE:</text>
    <text x="280" y="252" class="text-val" font-family="monospace">${receiptNumber || 'BOL-0001'}</text>

    <text x="40" y="300" class="text-label">DETALLE / PRODUCTO ADQUIRIDO:</text>
    <text x="40" y="325" class="text-val" font-size="15">${concept}</text>

    <!-- Item table box -->
    <rect x="40" y="360" width="440" height="110" rx="6" fill="#f1f5f9" stroke="#e2e8f0"/>
    <text x="60" y="390" class="text-label">DESCRIPCIÓN</text>
    <text x="460" y="390" class="text-label" text-anchor="end">TOTAL</text>
    <line x1="60" y1="405" x2="460" y2="405" stroke="#cbd5e1"/>
    
    <text x="60" y="435" class="text-val" font-size="13">${concept.length > 35 ? concept.substring(0, 32) + '...' : concept}</text>
    <text x="460" y="435" class="text-val" font-weight="bold" text-anchor="end">${formattedAmount}</text>

    <!-- Total Area -->
    <line x1="40" y1="510" x2="480" y2="510" class="divider"/>
    <text x="40" y="555" class="text-label" font-size="16">TOTAL PAGADO CLP:</text>
    <text x="480" y="560" class="text-amount" text-anchor="end">${formattedAmount}</text>

    <!-- Verification Stamp -->
    <g transform="translate(160, 600)">
      <rect x="0" y="0" width="200" height="50" class="stamp"/>
      <text x="100" y="30" class="stamp-text">✓ VERIFICADO Y PAGADO</text>
    </g>

    <!-- Footer Note -->
    <text x="260" y="700" class="subtitle">Respaldo digital archivado en la Tesorería del Curso</text>
  </g>
</svg>
`.trim();

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};
