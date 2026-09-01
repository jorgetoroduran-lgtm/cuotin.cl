import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Copy,
  ExternalLink,
  KeyRound,
  Lock,
  Mail,
  Send,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface PasswordRecoveryModalProps {
  onClose: () => void;
  onSuccessLogin?: (email: string, tempPass: string) => void;
}

export const PasswordRecoveryModal: React.FC<PasswordRecoveryModalProps> = ({
  onClose,
  onSuccessLogin,
}) => {
  const { requestPasswordRecovery, userAccounts } = useApp();

  const [emailInput, setEmailInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const [recoveredData, setRecoveredData] = useState<{
    userEmail: string;
    userName: string;
    tempPassword: string;
  } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    setTimeout(() => {
      const cleanEmail = emailInput.trim().toLowerCase();
      const res = requestPasswordRecovery(cleanEmail);

      if (!res.success || !res.tempPassword || !res.user) {
        setErrorMsg(
          res.message ||
            'No encontramos ninguna cuenta inscrita con ese correo electrónico. Verifica que esté bien escrito o solicita una cuenta nueva.'
        );
        setLoading(false);
        return;
      }

      setRecoveredData({
        userEmail: res.user.email,
        userName: res.user.name,
        tempPassword: res.tempPassword,
      });
      setLoading(false);
    }, 450);
  };

  const handleCopyCode = () => {
    if (!recoveredData) return;
    navigator.clipboard.writeText(recoveredData.tempPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const mailtoUrl = recoveredData
    ? `mailto:${recoveredData.userEmail}?subject=${encodeURIComponent(
        'Recuperación de Contraseña - Cuotin Escolar'
      )}&body=${encodeURIComponent(
        `Hola ${recoveredData.userName},\n\nHas solicitado la recuperación de tu contraseña para Cuotin Escolar.\n\nTu clave temporal de inicio es:\n${recoveredData.tempPassword}\n\nIngresa a la plataforma y el sistema te solicitará generar tu nueva contraseña definitiva.\n\nSaludos cordiales,\nEquipo Cuotin Escolar`
      )}`
    : '#';

  return (
    <div
      id="password-recovery-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto"
    >
      <div
        id="password-recovery-modal"
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden my-6 animate-fade-in"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 text-white p-5 sm:p-6 flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="bg-blue-500/20 text-blue-300 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border border-blue-400/30 flex items-center gap-1">
                <KeyRound className="w-3 h-3 text-amber-400" />
                Seguridad & Recuperación
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-black tracking-tight text-white flex items-center gap-2">
              Recuperar mi Contraseña
            </h2>
            <p className="text-xs text-slate-300">
              Ingresa el correo inscrito en tu cuenta para recibir tu clave de acceso.
            </p>
          </div>

          <button
            id="btn-close-recovery-modal"
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-4 text-xs sm:text-sm">
          {!recoveredData ? (
            /* Step 1: Input registered email */
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-3.5 flex items-start gap-2.5 text-blue-900">
                <Mail className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed">
                  Ingresa el correo con el que fuiste registrado como Tesorero o Administrador. El sistema verificará tu cuenta y te enviará una <strong>clave de inicio temporal</strong> para que puedas generar una nueva.
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Correo Electrónico Inscrito *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="input-recovery-email"
                    type="email"
                    required
                    autoFocus
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="tu-correo@ejemplo.cl"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  id="btn-cancel-recovery"
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancelar
                </button>

                <button
                  id="btn-submit-recovery"
                  type="submit"
                  disabled={loading || !emailInput.trim()}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition-all flex items-center gap-2"
                >
                  {loading ? (
                    <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Enviar Clave a mi Correo</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* Step 2: Confirmation & Dispatched Temporary Password */
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-emerald-950 text-sm sm:text-base">
                    ¡Clave Temporal Generada con Éxito!
                  </h4>
                  <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                    Hemos procesado la recuperación para <strong>{recoveredData.userName}</strong> ({recoveredData.userEmail}).
                  </p>
                </div>
              </div>

              {/* Temporary Password Box */}
              <div className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1 font-semibold uppercase tracking-wider">
                    <Lock className="w-3.5 h-3.5 text-yellow-400" />
                    Tu Clave Temporal de Inicio:
                  </span>
                  <span className="text-amber-300 font-bold">Válida para 1 uso</span>
                </div>

                <div className="flex items-center justify-between gap-2 p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="font-mono text-lg sm:text-xl font-black text-yellow-300 tracking-wider">
                    {recoveredData.tempPassword}
                  </span>

                  <button
                    id="btn-copy-temp-pass"
                    type="button"
                    onClick={handleCopyCode}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg border border-slate-700 transition-colors shadow-xs"
                  >
                    {copied ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-300">¡Copiada!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-300" />
                        <span>Copiar Clave</span>
                      </>
                    )}
                  </button>
                </div>

                <p className="text-[11px] text-slate-300 leading-relaxed pt-1">
                  💡 Al ingresar con esta clave, el sistema te solicitará inmediatamente generar tu <strong>nueva contraseña personal definitiva</strong>.
                </p>
              </div>

              {/* Email dispatch link */}
              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <a
                  href={mailtoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-xl border border-slate-300 transition-colors"
                >
                  <Mail className="w-4 h-4 text-blue-600" />
                  <span>Abrir Aplicación de Correo</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>

                {onSuccessLogin && (
                  <button
                    id="btn-auto-fill-login"
                    type="button"
                    onClick={() =>
                      onSuccessLogin(recoveredData.userEmail, recoveredData.tempPassword)
                    }
                    className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all hover:scale-[1.02]"
                  >
                    <span>Iniciar Sesión Ahora</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
