import React, { useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Plus,
  Upload,
  UserCheck,
  X,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useApp } from '../context/AppContext';
import { downloadExcelTemplate } from '../utils/formatters';

interface ExcelUploadModalProps {
  onClose: () => void;
}

interface ParsedRow {
  studentFullName: string;
  studentRut?: string;
  parentFullName: string;
  parentEmail?: string;
  parentPhone?: string;
  parentRut?: string;
  notes?: string;
  isValid: boolean;
  error?: string;
}

export const ExcelUploadModal: React.FC<ExcelUploadModalProps> = ({ onClose }) => {
  const { currentCourse, importStudentsBulk } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fileName, setFileName] = useState<string>('');
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [importSuccessCount, setImportSuccessCount] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      processFile(files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const processFile = (file: File) => {
    setErrorMsg(null);
    setImportSuccessCount(null);
    setFileName(file.name);
    setIsProcessing(true);

    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];

        // Parse to JSON array of objects
        const rawJson = XLSX.utils.sheet_to_json<Record<string, any>>(ws, { defval: '' });

        if (!rawJson || rawJson.length === 0) {
          setErrorMsg('El archivo Excel está vacío o no contiene filas con datos válidos.');
          setIsProcessing(false);
          return;
        }

        // Auto-detect columns
        const rows: ParsedRow[] = rawJson.map((row) => {
          let studentName = '';
          let studentRut = '';
          let parentName = '';
          let parentEmail = '';
          let parentPhone = '';
          let parentRut = '';
          let notes = '';

          // Look through keys with flexible matching
          Object.keys(row).forEach((key) => {
            const normalizedKey = key.toLowerCase().trim();
            const val = String(row[key] || '').trim();

            if (!studentName && (normalizedKey.includes('alumno') || normalizedKey.includes('estudiante') || normalizedKey === 'nombre' || normalizedKey === 'nombre y apellido')) {
              studentName = val;
            } else if (!parentName && (normalizedKey.includes('apoderado') || normalizedKey.includes('padre') || normalizedKey.includes('madre') || normalizedKey.includes('tutor'))) {
              if (normalizedKey.includes('rut') || normalizedKey.includes('run')) {
                parentRut = val;
              } else if (normalizedKey.includes('email') || normalizedKey.includes('correo')) {
                parentEmail = val;
              } else if (normalizedKey.includes('tel') || normalizedKey.includes('cel') || normalizedKey.includes('whatsapp') || normalizedKey.includes('fono')) {
                parentPhone = val;
              } else {
                parentName = val;
              }
            } else if (normalizedKey.includes('rut alumno') || normalizedKey.includes('run alumno')) {
              studentRut = val;
            } else if (normalizedKey.includes('rut apoderado') || normalizedKey.includes('run apoderado')) {
              parentRut = val;
            } else if (normalizedKey.includes('email') || normalizedKey.includes('correo') || normalizedKey.includes('mail')) {
              parentEmail = val;
            } else if (normalizedKey.includes('tel') || normalizedKey.includes('cel') || normalizedKey.includes('fono') || normalizedKey.includes('whatsapp') || normalizedKey.includes('contacto')) {
              parentPhone = val;
            } else if (normalizedKey.includes('nota') || normalizedKey.includes('observaci')) {
              notes = val;
            }
          });

          // Fallback if specific column names weren't matched
          if (!studentName) {
            const values = Object.values(row).filter((v) => typeof v === 'string' && v.trim().length > 0);
            if (values[0]) studentName = String(values[0]);
            if (values[1] && !parentName) parentName = String(values[1]);
          }

          const isValid = !!studentName && !!parentName;

          return {
            studentFullName: studentName,
            studentRut,
            parentFullName: parentName || 'Apoderado no especificado',
            parentEmail,
            parentPhone,
            parentRut,
            notes,
            isValid,
            error: !studentName
              ? 'Falta nombre del alumno'
              : !parentName
              ? 'Falta nombre del apoderado'
              : undefined,
          };
        });

        const validRows = rows.filter((r) => r.studentFullName.length > 0);

        if (validRows.length === 0) {
          setErrorMsg('No se detectaron columnas con nombres de alumnos. Descarga la plantilla de ejemplo para verificar el formato.');
        }

        setParsedRows(validRows);
      } catch (err: any) {
        console.error('Error parsing excel', err);
        setErrorMsg(`Error al leer el archivo Excel: ${err.message || 'Formato no soportado'}`);
      } finally {
        setIsProcessing(false);
      }
    };

    reader.onerror = () => {
      setErrorMsg('No se pudo leer el archivo seleccionado.');
      setIsProcessing(false);
    };

    reader.readAsBinaryString(file);
  };

  const handleImport = () => {
    const validRowsToImport = parsedRows.filter((r) => r.studentFullName.trim().length > 0);
    if (validRowsToImport.length === 0) return;

    const result = importStudentsBulk(validRowsToImport);
    setImportSuccessCount(result.count);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-auto max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-400 block">
                Carga Masiva de Alumnos
              </span>
              <h2 className="text-base font-bold text-slate-100">
                Importar Lista de Curso desde Excel ({currentCourse?.name})
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs sm:text-sm">
          {/* Instructions & Template helper */}
          <div className="bg-blue-50/70 border border-blue-200/80 rounded-lg p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <p className="font-semibold text-blue-900">
                Formato esperado del archivo:
              </p>
              <p className="text-xs text-blue-800">
                Columnas: <strong>Nombre y Apellido del Alumno</strong>, <strong>Nombre y Apellido del Apoderado</strong>, <strong>Teléfono / WhatsApp</strong>, <strong>Email</strong>.
              </p>
            </div>
            <button
              type="button"
              id="btn-download-template-modal"
              onClick={() => downloadExcelTemplate(currentCourse?.name || 'Curso')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-xs transition-colors shrink-0 shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              Descargar Plantilla Modelo
            </button>
          </div>

          {/* Upload Zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
              isDragging
                ? 'border-blue-500 bg-blue-50/40'
                : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileChange}
              className="hidden"
              id="input-file-excel"
            />
            <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center mx-auto mb-3">
              <Upload className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-900">
              {fileName ? fileName : 'Arrastra tu archivo Excel aquí o haz clic para buscar'}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Soporta archivos .xlsx, .xls y .csv
            </p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-3 px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              Examinar Archivo
            </button>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-lg flex items-start gap-2 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>{errorMsg}</div>
            </div>
          )}

          {/* Success Message */}
          {importSuccessCount !== null && (
            <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-4 rounded-lg text-center space-y-2">
              <div className="w-10 h-10 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <p className="font-bold text-sm">
                ¡Se importaron exitosamente {importSuccessCount} alumnos al curso {currentCourse?.name}!
              </p>
              <p className="text-xs text-emerald-700">
                Las cuotas de Marzo a Diciembre quedaron configuradas y listas para su cobro.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-2 px-4 py-1.5 bg-emerald-700 text-white font-medium text-xs rounded-lg hover:bg-emerald-800"
              >
                Ver Planilla de Cuotas
              </button>
            </div>
          )}

          {/* Parsed Rows Preview */}
          {parsedRows.length > 0 && importSuccessCount === null && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide">
                  Vista Previa ({parsedRows.length} alumnos detectados)
                </h4>
                <span className="text-xs text-blue-700 font-semibold">
                  ✓ {parsedRows.filter((r) => r.isValid).length} listos para importar
                </span>
              </div>

              <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-lg">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-700 font-semibold sticky top-0 border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-2.5 w-8">#</th>
                      <th className="py-2 px-2.5">Alumno</th>
                      <th className="py-2 px-2.5">Apoderado</th>
                      <th className="py-2 px-2.5">Teléfono</th>
                      <th className="py-2 px-2.5">Email</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedRows.map((r, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="py-1.5 px-2.5 text-slate-400 font-mono text-[11px]">
                          {i + 1}
                        </td>
                        <td className="py-1.5 px-2.5 font-semibold text-slate-900">
                          {r.studentFullName}
                          {r.studentRut && (
                            <span className="block font-mono text-[10px] text-slate-400">
                              {r.studentRut}
                            </span>
                          )}
                        </td>
                        <td className="py-1.5 px-2.5 text-slate-700">
                          {r.parentFullName}
                        </td>
                        <td className="py-1.5 px-2.5 text-slate-600 font-mono">
                          {r.parentPhone || '-'}
                        </td>
                        <td className="py-1.5 px-2.5 text-slate-600 truncate max-w-[120px]">
                          {r.parentEmail || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200 bg-slate-100 rounded-lg transition-colors"
          >
            {importSuccessCount !== null ? 'Cerrar' : 'Cancelar'}
          </button>

          {parsedRows.length > 0 && importSuccessCount === null && (
            <button
              id="btn-confirm-import-excel"
              type="button"
              onClick={handleImport}
              disabled={isProcessing || parsedRows.length === 0}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
            >
              <UserCheck className="w-4 h-4" />
              <span>Confirmar e Importar {parsedRows.length} Alumnos</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
