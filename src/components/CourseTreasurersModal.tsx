import React, { useState } from 'react';
import {
  AlertCircle,
  BadgeCheck,
  Check,
  CheckCircle2,
  Copy,
  Eye,
  Info,
  KeyRound,
  Lock,
  Mail,
  Phone,
  Plus,
  Shield,
  ShieldCheck,
  Sparkles,
  Trash2,
  User,
  UserCheck,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useApp } from '../context/AppContext';
import { Course, UserAccount } from '../types';

interface CourseTreasurersModalProps {
  course: Course;
  onClose: () => void;
}

export const CourseTreasurersModal: React.FC<CourseTreasurersModalProps> = ({
  course,
  onClose,
}) => {
  const {
    userAccounts,
    addReadOnlyTreasurer,
    deleteUserAccount,
    currentUser,
  } = useApp();

  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+56 9 ');
  const [rut, setRut] = useState('');
  const [initialPassword, setInitialPassword] = useState(() =>
    Math.floor(100000 + Math.random() * 900000).toString()
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [newlyCreatedAcc, setNewlyCreatedAcc] = useState<UserAccount | null>(null);

  // Find all accounts associated with this course
  const courseAccounts = userAccounts.filter(
    (u) =>
      u.assignedCourseId === course.id ||
      (course.treasurer && u.email.toLowerCase() === course.treasurer.email.toLowerCase())
  );

  const primaryTreasurer = course.treasurer;
  const readOnlyTreasurers = courseAccounts.filter((u) => u.isReadOnly);

  const handleCreateReadOnlyTreasurer = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim() || !email.trim()) {
      setErrorMsg('Nombre y Correo electrónico son requeridos.');
      return;
    }

    // Check if email already exists
    const existing = userAccounts.find(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase()
    );
    if (existing) {
      setErrorMsg(
        `Ya existe una cuenta con el correo ${email.trim()}. Usa un correo diferente.`
      );
      return;
    }

    const created = addReadOnlyTreasurer(course.id, {
      fullName: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      rut: rut.trim(),
      initialPassword: initialPassword.trim(),
    });

    setNewlyCreatedAcc(created);
    setShowAddForm(false);
    setName('');
    setEmail('');
    setPhone('+56 9 ');
    setRut('');
    setInitialPassword(Math.floor(100000 + Math.random() * 900000).toString());

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 },
    });
  };

  const handleCopyCredentials = (account: UserAccount) => {
    const text = `Acceso Cuotin Escolar (${course.name}):\nUsuario: ${account.email}\nClave Inicial: ${account.password || '123456'}\nRol: Tesorero Observador (Solo Lectura)\nEnlace: ${window.location.origin}`;
    navigator.clipboard.writeText(text);
    setCopiedKey(account.id);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  return (
    <div
      id="course-treasurers-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto"
    >
      <div
        id="course-treasurers-modal"
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-6 animate-fade-in flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white p-5 sm:p-6 flex items-start justify-between shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-indigo-500/20 text-indigo-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-indigo-400/30 flex items-center gap-1">
                <Users className="w-3 h-3 text-indigo-400" />
                Equipo de Tesorería del Curso
              </span>
            </div>

            <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
              <span>{course.name}</span>
              <span className="text-slate-400 font-normal text-base">({course.year})</span>
            </h2>

            <p className="text-xs sm:text-sm text-slate-300">
              Administra los accesos de tesorería y crea un <strong>Tesorero Observador (Solo Lectura)</strong> para que la directiva o co-tesorero visualice los resúmenes financieros.
            </p>
          </div>

          <button
            id="btn-close-treasurers-modal"
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-6 overflow-y-auto flex-1 text-xs sm:text-sm">
          {/* Newly created confirmation banner */}
          {newlyCreatedAcc && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2 animate-fade-in">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 text-emerald-950 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>¡Tesorero Observador Creado con Éxito!</span>
                </div>
                <button
                  type="button"
                  onClick={() => setNewlyCreatedAcc(null)}
                  className="text-emerald-700 hover:text-emerald-900 text-xs"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-emerald-800">
                Se ha generado la cuenta para <strong>{newlyCreatedAcc.name}</strong>. Comparte sus credenciales de inicio:
              </p>

              <div className="p-3 bg-white rounded-xl border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="font-mono text-xs text-slate-800">
                  <div>Correo: <strong>{newlyCreatedAcc.email}</strong></div>
                  <div>Clave Inicial: <strong className="text-indigo-600">{newlyCreatedAcc.password}</strong></div>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopyCredentials(newlyCreatedAcc)}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition-colors shadow-xs"
                >
                  {copiedKey === newlyCreatedAcc.id ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>¡Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar Datos de Acceso</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Section 1: Tesorero Titular */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>Tesorero Titular (Administración Total)</span>
              </h3>
              <span className="bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded text-[11px] border border-blue-200">
                Permisos Completos
              </span>
            </div>

            {primaryTreasurer ? (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                    {primaryTreasurer.fullName.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">
                      {primaryTreasurer.fullName}
                    </h4>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-500 text-xs mt-0.5">
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3 text-slate-400" />
                        {primaryTreasurer.email}
                      </span>
                      {primaryTreasurer.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {primaryTreasurer.phone}
                        </span>
                      )}
                      {primaryTreasurer.rut && (
                        <span className="font-mono text-[11px]">
                          RUT: {primaryTreasurer.rut}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 shrink-0">
                  Asignado el: {primaryTreasurer.assignedAt}
                </div>
              </div>
            ) : (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs">
                No hay un tesorero titular asignado aún por el Administrador General.
              </div>
            )}
          </div>

          {/* Section 2: Tesorero Observador / Solo Lectura */}
          <div className="space-y-3 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-indigo-600" />
                  <span>Tesoreros Observadores (Solo Lectura)</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Pueden ingresar a ver resúmenes, matrices y reportes contables sin poder modificar registros.
                </p>
              </div>

              {!showAddForm && (
                <button
                  id="btn-open-add-read-only-treasurer"
                  type="button"
                  onClick={() => setShowAddForm(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs shadow-xs transition-colors self-start sm:self-center"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ Crear Tesorero Lector</span>
                </button>
              )}
            </div>

            {/* Form to Add Read-Only Treasurer */}
            {showAddForm && (
              <form
                onSubmit={handleCreateReadOnlyTreasurer}
                className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-2xl space-y-3 animate-fade-in"
              >
                <div className="flex items-center justify-between border-b border-indigo-200 pb-2">
                  <span className="font-bold text-indigo-950 text-xs flex items-center gap-1.5">
                    <UserPlus className="w-4 h-4 text-indigo-600" />
                    <span>Nuevo Tesorero Observador (Acceso Solo Lectura)</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="text-slate-400 hover:text-slate-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {errorMsg && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Nombre Completo *
                    </label>
                    <input
                      id="input-readonly-name"
                      type="text"
                      required
                      placeholder="Ej. Rodrigo Morales (Co-tesorero)"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Correo Electrónico (Login) *
                    </label>
                    <input
                      id="input-readonly-email"
                      type="email"
                      required
                      placeholder="rodrigo.morales@correo.cl"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Teléfono / WhatsApp
                    </label>
                    <input
                      id="input-readonly-phone"
                      type="text"
                      placeholder="+56 9 1234 5678"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      RUT (Opcional)
                    </label>
                    <input
                      id="input-readonly-rut"
                      type="text"
                      placeholder="16.789.012-3"
                      value={rut}
                      onChange={(e) => setRut(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Initial password */}
                <div className="bg-white p-3 rounded-xl border border-indigo-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-bold text-slate-800 block">
                      Clave de Inicio Provisoria
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Al iniciar sesión por primera vez, el sistema le pedirá crear su clave personal.
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      id="input-readonly-initial-pass"
                      type="text"
                      value={initialPassword}
                      onChange={(e) => setInitialPassword(e.target.value)}
                      className="w-28 px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold text-indigo-700 text-center"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setInitialPassword(
                          Math.floor(100000 + Math.random() * 900000).toString()
                        )
                      }
                      className="text-[10px] font-semibold text-indigo-600 hover:underline"
                    >
                      Regenerar
                    </button>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-white rounded-xl transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    id="btn-confirm-create-readonly-treasurer"
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Guardar y Habilitar Acceso</span>
                  </button>
                </div>
              </form>
            )}

            {/* List of Read Only Treasurers */}
            <div className="space-y-2">
              {readOnlyTreasurers.length === 0 && !showAddForm ? (
                <div className="p-6 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-center text-slate-500">
                  <Eye className="w-8 h-8 text-slate-400 mx-auto mb-1.5 opacity-60" />
                  <p className="font-semibold text-xs text-slate-700">
                    No hay tesoreros observadores registrados para este curso.
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Puedes invitar a un segundo apoderado, auditor o miembro de la directiva con privilegios exclusivos de lectura.
                  </p>
                </div>
              ) : (
                readOnlyTreasurers.map((acc) => (
                  <div
                    key={acc.id}
                    className="p-3.5 bg-white border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs hover:border-slate-300 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-800 font-bold flex items-center justify-center text-xs">
                        {acc.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{acc.name}</span>
                          <span className="bg-indigo-50 text-indigo-700 font-bold text-[10px] px-2 py-0.5 rounded border border-indigo-200 flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            Solo Lectura
                          </span>
                          {acc.mustChangePassword && (
                            <span className="bg-amber-50 text-amber-700 text-[10px] px-1.5 py-0.2 rounded border border-amber-200">
                              Pendiente 1er Login
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-slate-500 text-[11px] mt-0.5">
                          <span className="font-mono">{acc.email}</span>
                          {acc.phone && <span>Tel: {acc.phone}</span>}
                          {acc.rut && <span>RUT: {acc.rut}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => handleCopyCredentials(acc)}
                        className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                        title="Copiar credenciales de acceso"
                      >
                        {copiedKey === acc.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span className="hidden sm:inline">Copiar Credenciales</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => deleteUserAccount(acc.id)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Eliminar acceso de este tesorero observador"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
          <button
            id="btn-close-treasurers-modal-bottom"
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
          >
            Listo / Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
