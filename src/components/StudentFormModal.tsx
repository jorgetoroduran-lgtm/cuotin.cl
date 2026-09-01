import React, { useEffect, useState } from 'react';
import { Mail, Phone, User, UserCheck, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Student } from '../types';

interface StudentFormModalProps {
  studentToEdit?: Student | null;
  onClose: () => void;
}

export const StudentFormModal: React.FC<StudentFormModalProps> = ({
  studentToEdit,
  onClose,
}) => {
  const { currentCourseId, addStudent, updateStudent } = useApp();

  const [studentFullName, setStudentFullName] = useState('');
  const [studentRut, setStudentRut] = useState('');
  const [parentFullName, setParentFullName] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [parentRut, setParentRut] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (studentToEdit) {
      setStudentFullName(studentToEdit.studentFullName);
      setStudentRut(studentToEdit.studentRut || '');
      setParentFullName(studentToEdit.parentFullName);
      setParentEmail(studentToEdit.parentEmail || '');
      setParentPhone(studentToEdit.parentPhone || '');
      setParentRut(studentToEdit.parentRut || '');
      setNotes(studentToEdit.notes || '');
    } else {
      setStudentFullName('');
      setStudentRut('');
      setParentFullName('');
      setParentEmail('');
      setParentPhone('+56 9 ');
      setParentRut('');
      setNotes('');
    }
  }, [studentToEdit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentFullName.trim() || !parentFullName.trim()) return;

    if (studentToEdit) {
      updateStudent(studentToEdit.id, {
        studentFullName: studentFullName.trim(),
        studentRut: studentRut.trim() || undefined,
        parentFullName: parentFullName.trim(),
        parentEmail: parentEmail.trim() || undefined,
        parentPhone: parentPhone.trim() || undefined,
        parentRut: parentRut.trim() || undefined,
        notes: notes.trim() || undefined,
      });
    } else {
      addStudent({
        courseId: currentCourseId,
        studentFullName: studentFullName.trim(),
        studentRut: studentRut.trim() || undefined,
        parentFullName: parentFullName.trim(),
        parentEmail: parentEmail.trim() || undefined,
        parentPhone: parentPhone.trim() || undefined,
        parentRut: parentRut.trim() || undefined,
        notes: notes.trim() || undefined,
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden my-auto">
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">
                {studentToEdit ? 'Editar Alumno & Apoderado' : 'Registrar Nuevo Alumno'}
              </h3>
              <p className="text-xs text-slate-400">
                Ficha del estudiante para el cobro de cuotas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs sm:text-sm">
          {/* Section: Alumno */}
          <div className="space-y-3 pb-3 border-b border-slate-100">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 block">
              1. Datos del Alumno / Estudiante
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nombre y Apellido del Alumno *
                </label>
                <input
                  id="input-student-name"
                  type="text"
                  required
                  placeholder="Ej. Lucas Silva González"
                  value={studentFullName}
                  onChange={(e) => setStudentFullName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  RUT Alumno (Opcional)
                </label>
                <input
                  id="input-student-rut"
                  type="text"
                  placeholder="24.123.456-7"
                  value={studentRut}
                  onChange={(e) => setStudentRut(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Section: Apoderado */}
          <div className="space-y-3 pb-3 border-b border-slate-100">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 block">
              2. Datos del Apoderado (Responsable de Pago)
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nombre y Apellido del Apoderado *
                </label>
                <input
                  id="input-parent-name"
                  type="text"
                  required
                  placeholder="Ej. Patricia González Morales"
                  value={parentFullName}
                  onChange={(e) => setParentFullName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  RUT Apoderado (Opcional)
                </label>
                <input
                  id="input-parent-rut"
                  type="text"
                  placeholder="15.876.543-2"
                  value={parentRut}
                  onChange={(e) => setParentRut(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Teléfono / WhatsApp (Avisos de cobro)
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="input-parent-phone"
                    type="text"
                    placeholder="+56 9 1234 5678"
                    value={parentPhone}
                    onChange={(e) => setParentPhone(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="input-parent-email"
                    type="email"
                    placeholder="apoderado@correo.cl"
                    value={parentEmail}
                    onChange={(e) => setParentEmail(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section: Observaciones */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Notas u Observaciones (Opcional)
            </label>
            <textarea
              id="input-student-notes"
              rows={2}
              placeholder="Ej. Apoderado suplente, beca parcial, acuerdos especiales..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              id="btn-save-student"
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs flex items-center gap-1.5"
            >
              <UserCheck className="w-4 h-4" />
              <span>{studentToEdit ? 'Guardar Cambios' : 'Registrar Alumno'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
