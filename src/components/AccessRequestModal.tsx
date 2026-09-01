import React, { useState } from 'react';
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Copy,
  ExternalLink,
  GraduationCap,
  Mail,
  MessageCircle,
  MessageSquare,
  Phone,
  Send,
  ShieldCheck,
  Sparkles,
  User,
  X,
  Zap,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { generateGmailComposeLink, generateMailtoLink } from '../utils/formatters';

interface AccessRequestModalProps {
  isOpen?: boolean;
  onClose: () => void;
}

export const AccessRequestModal: React.FC<AccessRequestModalProps> = ({
  isOpen = true,
  onClose,
}) => {
  const { submitAccessRequest } = useApp();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [rut, setRut] = useState('');
  const [institutionName, setInstitutionName] = useState('');
  const [courseName, setCourseName] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<'ANNUAL' | 'MONTHLY'>('ANNUAL');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);

  if (isOpen === false) return null;

  const adminEmail = 'jorgetoroduran@gmail.com';

  const planText =
    selectedPlan === 'ANNUAL'
      ? 'Promoción Anual $29.990 CLP / Año'
      : 'Arriendo Mensual $3.490 CLP / Mes';

  const emailSubject = `[Solicitud de Acceso Cuotin] ${fullName.trim()} — ${courseName.trim() || institutionName.trim() || 'Nueva Institución'}`;
  const emailBody =
    `Estimado Administrador General (${adminEmail}):\n\n` +
    `Se ha enviado una solicitud de activación de cuenta para el sistema Cuotin (Tesorería Digital):\n\n` +
    `• Solicitante / Tesorero: ${fullName.trim()}\n` +
    `• Correo de Contacto: ${email.trim()}\n` +
    `• Teléfono / WhatsApp: ${phone.trim() || 'No especificado'}\n` +
    `• RUT: ${rut.trim() || 'No especificado'}\n` +
    `• Institución / Colegio / Organización: ${institutionName.trim() || 'No especificado'}\n` +
    `• Curso / Grupo / Nivel: ${courseName.trim() || 'No especificado'}\n` +
    `• Plan Elegido: ${planText}\n` +
    `• Mensaje adicional: ${message.trim() || 'Sin mensaje adicional'}\n` +
    `• Fecha: ${new Date().toLocaleString('es-CL')}\n\n` +
    `Solicito la creación y habilitación de mis accesos para la tesorería digital.`;

  const gmailComposeUrl = generateGmailComposeLink(adminEmail, emailSubject, emailBody);
  const mailtoUrl = generateMailtoLink(adminEmail, emailSubject, emailBody);

  const cleanPhoneForWa = phone.replace(/[^0-9]/g, '');
  const waUrl = `https://wa.me/?text=${encodeURIComponent(emailBody)}`;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) return;

    setIsSubmitting(true);

    // Save request in AppContext state and Firestore database
    submitAccessRequest({
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim() || undefined,
      rut: rut.trim() || undefined,
      institutionName: institutionName.trim() || undefined,
      courseName: courseName.trim() || undefined,
      selectedPlan,
      message: message.trim() || undefined,
    });

    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }, 300);
  };

  const handleCopySummary = () => {
    navigator.clipboard.writeText(emailBody);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  const handleResetAndClose = () => {
    setIsSubmitted(false);
    setFullName('');
    setEmail('');
    setPhone('');
    setRut('');
    setInstitutionName('');
    setCourseName('');
    setSelectedPlan('ANNUAL');
    setMessage('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden my-auto max-h-[95vh] flex flex-col">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-5 sm:p-6 flex items-start justify-between relative shrink-0">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-600 text-white flex items-center justify-center shrink-0 shadow-md">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Solicitud de Acceso a Cuotin
                </h3>
              </div>
              <p className="text-xs text-blue-200/90 mt-0.5">
                Planes: $3.490 CLP Mensual o Promoción Anual $29.990 CLP
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleResetAndClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1">
          {isSubmitted ? (
            <div className="text-center py-3 px-1 space-y-4 animate-fade-in">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div className="space-y-1">
                <h4 className="text-lg font-black text-slate-900">
                  ¡Solicitud Registrada con Éxito!
                </h4>
                <p className="text-xs sm:text-sm font-semibold text-emerald-700">
                  Ha quedado guardada y asignada al Administrador General.
                </p>
                <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed pt-1">
                  Tu información ha sido registrada en el sistema. Puedes enviar copia directa a <strong>{adminEmail}</strong> usando las siguientes opciones:
                </p>
              </div>

              {/* Direct Send Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
                <a
                  href={`https://wa.me/56942788044?text=${encodeURIComponent(emailBody)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Enviar por WhatsApp</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                </a>

                <a
                  href={gmailComposeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 py-2.5 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  <Mail className="w-4 h-4" />
                  <span>Abrir en Gmail</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                </a>

                <a
                  href={mailtoUrl}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Enviar por Correo</span>
                </a>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-left text-xs space-y-1.5 text-slate-600">
                <div className="flex justify-between">
                  <span className="text-slate-500">Destinatario:</span>
                  <strong className="text-blue-700 font-mono">{adminEmail}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Solicitante:</span>
                  <strong className="text-slate-800">{fullName}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Correo solicitante:</span>
                  <span className="font-mono text-slate-800">{email}</span>
                </div>
                {phone && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Teléfono:</span>
                    <span className="text-slate-800">{phone}</span>
                  </div>
                )}
                {institutionName && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Colegio:</span>
                    <span className="text-slate-800">{institutionName}</span>
                  </div>
                )}
                {courseName && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Curso:</span>
                    <span className="text-slate-800">{courseName}</span>
                  </div>
                )}
                <div className="flex justify-between pt-1 border-t border-slate-200">
                  <span className="text-slate-500">Plan Seleccionado:</span>
                  <strong className="text-orange-600 font-bold">{planText}</strong>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
                <button
                  type="button"
                  onClick={handleCopySummary}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedSummary ? '¡Copiado al portapapeles!' : 'Copiar Texto de la Solicitud'}</span>
                </button>

                <button
                  type="button"
                  id="btn-close-access-success"
                  onClick={handleResetAndClose}
                  className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Listo, Volver al Inicio
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Plan Selector Tiles */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Selecciona tu Plan de Arriendo
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {/* Plan Mensual */}
                  <div
                    onClick={() => setSelectedPlan('MONTHLY')}
                    className={`p-3 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                      selectedPlan === 'MONTHLY'
                        ? 'border-orange-500 bg-orange-50/70 shadow-xs'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">Arriendo Mensual</span>
                      <span className="w-3.5 h-3.5 rounded-full border flex items-center justify-center">
                        {selectedPlan === 'MONTHLY' && (
                          <div className="w-2 h-2 rounded-full bg-orange-600" />
                        )}
                      </span>
                    </div>
                    <div className="mt-1">
                      <span className="text-lg font-black text-slate-900 font-mono">$3.490</span>
                      <span className="text-[11px] text-slate-500 font-medium"> CLP / Mes</span>
                    </div>
                    <span className="text-[10px] text-slate-500 mt-0.5 block">Mes a mes</span>
                  </div>

                  {/* Promoción Anual */}
                  <div
                    onClick={() => setSelectedPlan('ANNUAL')}
                    className={`p-3 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between relative ${
                      selectedPlan === 'ANNUAL'
                        ? 'border-amber-500 bg-amber-50 shadow-xs ring-2 ring-amber-400/20'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-amber-900 flex items-center gap-1">
                        <Zap className="w-3 h-3 text-amber-600" />
                        Promo Anual
                      </span>
                      <span className="w-3.5 h-3.5 rounded-full border flex items-center justify-center">
                        {selectedPlan === 'ANNUAL' && (
                          <div className="w-2 h-2 rounded-full bg-amber-600" />
                        )}
                      </span>
                    </div>
                    <div className="mt-1">
                      <span className="text-lg font-black text-amber-950 font-mono">$29.990</span>
                      <span className="text-[11px] text-amber-800 font-medium"> CLP / Año</span>
                    </div>
                    <span className="text-[10px] text-amber-700 font-semibold mt-0.5 block">¡Ahorro escolar!</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Nombre */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Nombre Completo <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                    <input
                      id="input-req-fullname"
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Ej: Carolina Herrera o Juan Pérez"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Tu Correo Electrónico <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                    <input
                      id="input-req-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tu-correo@gmail.com"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Teléfono */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Teléfono / WhatsApp
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                    <input
                      id="input-req-phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+56 9 1234 5678"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Tipo de Organización / Actividad */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Tipo de Actividad / Institución
                  </label>
                  <select
                    id="select-req-org-type"
                    value={institutionName.startsWith('[') ? institutionName.split('] ')[0] + ']' : ''}
                    onChange={(e) => {
                      const prefix = e.target.value;
                      const rawName = institutionName.replace(/^\[.*?\]\s*/, '');
                      setInstitutionName(prefix ? `${prefix} ${rawName}`.trim() : rawName);
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 mb-2"
                  >
                    <option value="">-- Selecciona tu sector o actividad --</option>
                    <option value="[Colegio / Escuela]">🏫 Colegios y Escuelas</option>
                    <option value="[Institución / Academia]">🏛️ Instituciones / Academias</option>
                    <option value="[Club Deportivo]">🏆 Clubes Deportivos</option>
                    <option value="[Condominio / Comunidad]">🏢 Condominios / Comunidades</option>
                    <option value="[Fundación / ONG]">❤️ Fundaciones / ONG</option>
                    <option value="[Club Social]">👥 Clubes Sociales / Adulto Mayor</option>
                    <option value="[Asociación / Gremio]">💼 Asociaciones / Agrupaciones</option>
                    <option value="[Centro de Capacitación]">📚 Centros de Capacitación / OTEC</option>
                  </select>
                </div>

                {/* Colegio / Institución / Organización */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Nombre de la Institución u Organización
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                    <input
                      id="input-req-institution"
                      type="text"
                      value={institutionName}
                      onChange={(e) => setInstitutionName(e.target.value)}
                      placeholder="Ej: Escuela Los Robles, Club Unión Cordillera..."
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Curso / Grupo / Rama */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Grupo, Curso, Rama o Nivel
                  </label>
                  <div className="relative">
                    <GraduationCap className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                    <input
                      id="input-req-course"
                      type="text"
                      value={courseName}
                      onChange={(e) => setCourseName(e.target.value)}
                      placeholder="Ej: 3° Básico A, Serie Senior, Taller Nivel 1..."
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Mensaje opcional */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Mensaje o Consulta adicional
                  </label>
                  <textarea
                    id="input-req-message"
                    rows={2}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Escribe si necesitas agregar detalles sobre la cantidad de miembros, alumnos o requerimientos específicos..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  id="btn-submit-access-request"
                  type="submit"
                  disabled={isSubmitting || !fullName.trim() || !email.trim()}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isSubmitting ? (
                    <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Enviar Solicitud a {adminEmail}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

