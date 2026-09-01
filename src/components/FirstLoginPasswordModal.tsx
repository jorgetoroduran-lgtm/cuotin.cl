import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useApp } from '../context/AppContext';

export const FirstLoginPasswordModal: React.FC = () => {
  const { currentUser, changeUserPassword } = useApp();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!currentUser || !currentUser.mustChangePassword) {
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (newPassword.trim().length < 4) {
      setErrorMsg('La nueva contraseña debe contener al menos 4 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Las contraseñas no coinciden. Por favor verifícalas.');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      const res = changeUserPassword(currentUser.id, newPassword);
      if (!res.success) {
        setErrorMsg(res.message || 'Error al guardar la nueva contraseña.');
        setLoading(false);
        return;
      }

      setIsSuccess(true);
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
      });

      setLoading(false);
    }, 400);
  };

  return (
    <div
      id="first-login-password-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto"
    >
      <div
        id="first-login-password-modal"
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden my-6 animate-fade-in"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white p-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-amber-400/20 text-amber-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-amber-400/30 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              Primer Inicio de Sesión
            </span>
          </div>

          <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-yellow-400" />
            <span>Crea tu Nueva Contraseña</span>
          </h2>

          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
            Hola <strong>{currentUser.name}</strong>. Por seguridad de la tesorería de tu curso, debes definir tu contraseña definitiva para acceder al sistema.
          </p>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-xs sm:text-sm">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {isSuccess ? (
            <div className="text-center py-6 space-y-3 animate-fade-in">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                ¡Contraseña Establecida con Éxito!
              </h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Tu clave ha sido guardada. Ya puedes ingresar y administrar la recaudación de tu curso con total privacidad.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-600 space-y-1">
                <div className="font-semibold text-slate-800 flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Tu cuenta activa:</span>
                </div>
                <div className="font-mono text-slate-700 text-[11px]">{currentUser.email}</div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nueva Contraseña *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="input-first-login-new-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoFocus
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 4 caracteres"
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                    title={showPassword ? 'Ocultar' : 'Ver'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Confirmar Nueva Contraseña *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="input-first-login-confirm-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repite la nueva contraseña"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors font-mono"
                  />
                </div>
              </div>

              <button
                id="btn-submit-first-login-password"
                type="submit"
                disabled={loading || !newPassword.trim() || !confirmPassword.trim()}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <span>Guardar y Entrar a la Plataforma</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
