import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  Building2,
  CheckCircle2,
  ChevronRight,
  Eye,
  EyeOff,
  GraduationCap,
  HelpCircle,
  Info,
  KeyRound,
  Lock,
  Mail,
  Send,
  Shield,
  ShieldCheck,
  Sparkles,
  User,
  UserCheck,
  UserPlus,
  Users,
  Wallet,
  Zap,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { UserAccount, UserRole } from '../types';
import { AccessRequestModal } from './AccessRequestModal';
import { AppBenefitsSection } from './AppBenefitsSection';
import { PasswordRecoveryModal } from './PasswordRecoveryModal';

export const LoginScreen: React.FC = () => {
  const { userAccounts, login } = useApp();

  const [activeTab, setActiveTab] = useState<UserRole>('TESORERO_CURSO');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPrivilegesModal, setShowPrivilegesModal] = useState(false);
  const [showAccessRequestModal, setShowAccessRequestModal] = useState(false);
  const [showPasswordRecoveryModal, setShowPasswordRecoveryModal] = useState(false);

  // Switch tab helper
  const handleTabChange = (role: UserRole) => {
    setActiveTab(role);
    setErrorMsg(null);
    if (role === 'ADMIN_GENERAL') {
      setEmail('admin@cuotaapp.cl');
      setPassword('admin');
    } else {
      setEmail('carolina.herrera@gmail.com');
      setPassword('123');
    }
  };

  const handleRecoverySuccess = (account: UserAccount, tempPass: string) => {
    setEmail(account.email);
    setPassword(tempPass);
    setShowPasswordRecoveryModal(false);
    // Log in with temporary password which immediately prompts password creation
    login(account.email, tempPass);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    setTimeout(() => {
      const res = login(email, password);
      if (!res.success) {
        setErrorMsg(res.message || 'Credenciales inválidas. Verifique su correo y contraseña.');
      }
      setLoading(false);
    }, 300);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between text-slate-800">
      {/* Top Brand Bar */}
      <header className="bg-slate-900 text-white px-6 py-4 border-b border-slate-800 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-bold tracking-tight text-white">
                  Cuotin
                </span>
                <span className="bg-blue-500/20 text-blue-300 text-[10px] uppercase font-semibold px-2 py-0.5 rounded border border-blue-400/30">
                  Tesorería Digital Institucional
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Tesorería digital para instituciones, colegios, cursos y organizaciones
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              id="btn-scroll-to-benefits"
              onClick={() => {
                const el = document.getElementById('section-app-benefits-visual');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/90 hover:bg-blue-500 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              <Eye className="w-4 h-4 text-amber-300" />
              <span>Ver Vistas & Beneficios</span>
            </button>

            <button
              type="button"
              id="btn-open-access-request-header"
              onClick={() => setShowAccessRequestModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold shadow-xs transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Solicitar Acceso</span>
            </button>

            <button
              type="button"
              id="btn-open-privileges-info"
              onClick={() => setShowPrivilegesModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium border border-slate-700 transition-colors"
            >
              <Info className="w-4 h-4 text-blue-400" />
              <span className="hidden md:inline">Ver Privilegios</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex flex-col items-center justify-start p-4 sm:p-6 md:p-8 space-y-8">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left Column: Login Card (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col justify-between">
            <div>
              {/* Header Title */}
              <div className="p-6 sm:p-8 pb-4 border-b border-slate-100">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Iniciar Sesión
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Ingresa con tu correo y contraseña asignada para acceder a tu tesorería.
                </p>

                {/* Role Switcher Tabs */}
                <div className="grid grid-cols-2 gap-2 mt-5 p-1 bg-slate-100 rounded-xl border border-slate-200">
                  <button
                    id="tab-login-treasurer"
                    type="button"
                    onClick={() => handleTabChange('TESORERO_CURSO')}
                    className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                      activeTab === 'TESORERO_CURSO'
                        ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Users
                      className={`w-4 h-4 ${
                        activeTab === 'TESORERO_CURSO' ? 'text-emerald-600' : 'text-slate-400'
                      }`}
                    />
                    <span>Tesorero de Curso</span>
                  </button>

                  <button
                    id="tab-login-admin"
                    type="button"
                    onClick={() => handleTabChange('ADMIN_GENERAL')}
                    className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                      activeTab === 'ADMIN_GENERAL'
                        ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <ShieldCheck
                      className={`w-4 h-4 ${
                        activeTab === 'ADMIN_GENERAL' ? 'text-blue-600' : 'text-slate-400'
                      }`}
                    />
                    <span>Administrador General</span>
                  </button>
                </div>
              </div>

              {/* Form Area */}
              <div className="p-6 sm:p-8 pt-6">
                {/* 🌟 BANNER PUBLICITARIO DESTACADO: PLAN MENSUAL $3.990 / PROMO ANUAL $34.990 CLP */}
                <div
                  id="treasurer-pricing-promo-banner"
                  className="mb-5 relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 via-orange-600 to-rose-600 p-4 sm:p-5 text-white shadow-lg shadow-orange-500/20 border border-amber-300/40"
                >
                  <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
                  <div className="absolute -left-8 -bottom-8 w-32 h-32 bg-amber-400/20 rounded-full blur-xl pointer-events-none" />

                  <div className="relative z-10">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <span className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md text-amber-100 font-bold text-[11px] px-2.5 py-1 rounded-full uppercase tracking-wider border border-white/25 shadow-xs">
                        <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                        <span>Planes de Tesorería Digital 2026</span>
                      </span>
                      <span className="bg-yellow-300 text-slate-950 font-black text-[11px] px-2 py-0.5 rounded-md shadow-xs flex items-center gap-1">
                        <Zap className="w-3 h-3 text-slate-900 fill-slate-900" />
                        PRECIOS OFICIALES
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 my-2.5">
                      {/* Opción Mensual */}
                      <div className="bg-white/15 backdrop-blur-sm border border-white/25 rounded-xl p-3 flex flex-col justify-between">
                        <span className="text-[11px] text-orange-100 font-bold uppercase tracking-wide">
                          Arriendo Mensual
                        </span>
                        <div className="flex items-baseline gap-1.5 mt-0.5">
                          <span className="text-2xl sm:text-3xl font-black text-white font-mono">
                            $3.490
                          </span>
                          <span className="text-xs font-bold text-amber-200">
                            CLP / Mes
                          </span>
                        </div>
                        <span className="text-[10px] text-amber-100/90 mt-1">
                          Sin contrato forzoso, mes a mes
                        </span>
                      </div>

                      {/* Opción Promoción Anual */}
                      <div className="bg-gradient-to-br from-yellow-400/30 to-amber-500/40 backdrop-blur-sm border-2 border-yellow-300/80 rounded-xl p-3 flex flex-col justify-between relative shadow-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-yellow-200 font-black uppercase tracking-wide">
                            Promoción Anual
                          </span>
                          <span className="bg-yellow-300 text-slate-950 font-black text-[9px] px-1.5 py-0.2 rounded uppercase">
                            Ahorro
                          </span>
                        </div>
                        <div className="flex items-baseline gap-1.5 mt-0.5">
                          <span className="text-2xl sm:text-3xl font-black text-white font-mono">
                            $29.990
                          </span>
                          <span className="text-xs font-bold text-yellow-200">
                            CLP / Año
                          </span>
                        </div>
                        <span className="text-[10px] text-yellow-100 font-semibold mt-1">
                          Pago único por todo el año escolar
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-white/20">
                      <div className="text-xs text-white/90">
                        <span>Incluye acceso para Tesorero y Observadores del curso</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowAccessRequestModal(true)}
                        className="w-full sm:w-auto px-4 py-2 bg-white hover:bg-amber-50 text-slate-900 font-bold text-xs rounded-xl shadow-md transition-transform hover:scale-105 flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                      >
                        <UserPlus className="w-3.5 h-3.5 text-orange-600" />
                        <span>Solicitar Cuenta</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* 📩 Banner de Consulta */}
                <div
                  id="banner-consultas-contacto"
                  className="mb-5 p-3 sm:p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-slate-800 text-xs font-semibold">
                        Consultas a:{' '}
                        <a
                          href="mailto:contacto@cuotin.cl"
                          className="text-blue-600 hover:text-blue-800 underline font-bold tracking-wide"
                        >
                          contacto@cuotin.cl
                        </a>
                      </p>
                    </div>
                  </div>
                  <a
                    href="mailto:contacto@cuotin.cl?subject=Consulta%20sobre%20Cuotin"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 hover:border-blue-300 font-bold text-xs rounded-lg transition-colors shadow-2xs self-end sm:self-auto"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Escribir correo</span>
                  </a>
                </div>

                {/* Error message */}
                {errorMsg && (
                  <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Email */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Correo Electrónico
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        id="input-login-email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="tu-email@ejemplo.cl"
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Contraseña
                      </label>
                      <span className="text-[11px] text-slate-400">
                        Acceso seguro de usuario
                      </span>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        id="input-login-password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                        title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    {/* Forgot Password Link */}
                    <div className="flex items-center justify-between pt-1.5 px-0.5">
                      <button
                        id="btn-forgot-password-trigger"
                        type="button"
                        onClick={() => setShowPasswordRecoveryModal(true)}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-1.5 transition-colors cursor-pointer group"
                      >
                        <KeyRound className="w-3.5 h-3.5 text-blue-500 group-hover:scale-110 transition-transform" />
                        <span>¿Olvidó su contraseña? <strong>Presione Aquí</strong></span>
                      </button>

                      <span className="text-[11px] text-slate-400 hidden sm:inline">
                        Envío a correo inscrito
                      </span>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    id="btn-login-submit"
                    type="submit"
                    disabled={loading}
                    className={`w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-bold text-white shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      activeTab === 'ADMIN_GENERAL'
                        ? 'bg-blue-600 hover:bg-blue-700 active:scale-[0.99]'
                        : 'bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99]'
                    }`}
                  >
                    {loading ? (
                      <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    ) : (
                      <>
                        <span>Ingresar a mi Tesorería</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* Bottom Footer Note with Request link */}
            <div className="bg-slate-50 p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-600">
              <span>¿No tienes una cuenta aún?</span>
              <button
                type="button"
                onClick={() => setShowAccessRequestModal(true)}
                className="font-bold text-orange-600 hover:text-orange-700 underline flex items-center gap-1 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Solicitar Cuenta ($3.990/Mes o $34.990/Año)</span>
              </button>
            </div>
          </div>

          {/* Right Column: Portal Information & Security (5 cols) */}
          <div className="lg:col-span-5 space-y-4 flex flex-col justify-between">
            {/* Security & Course Privacy Card */}
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                    Privacidad & Seguridad Institucional
                  </h2>
                </div>
                <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                  100% Protegido
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Cada institución, curso u organización cuenta con un espacio independiente y privado. Los datos de miembros, cuotas, pagos y comprobantes solo son accesibles por la tesorería oficial y usuarios autorizados.
              </p>

              <div className="space-y-2.5 pt-1 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2.5">
                  <UserCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-900 block">Perfil Tesorero Operativo</span>
                    <span className="text-slate-500 text-[11px]">Registro de cuotas, subida de boletas, libro de gastos y configuración bancaria.</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-200/70 flex items-start gap-2.5">
                  <Eye className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-indigo-950 block">Perfil Observador (Solo Lectura)</span>
                    <span className="text-indigo-700 text-[11px]">Para directiva y miembros: auditoría y visualización de balances en tiempo real sin peligro de edición.</span>
                  </div>
                </div>
              </div>

              {/* Access Request Callout Card */}
              <div className="p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border border-orange-200 text-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-orange-950 flex items-center gap-1.5">
                    <UserPlus className="w-4 h-4 text-orange-600" />
                    ¿Quieres activar tu institución o curso para este año?
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Solicita tu cuenta indicando la institución o curso. Elige entre arriendo mensual de <strong>$3.490 CLP/Mes</strong> o promoción anual de <strong>$29.990 CLP/Año</strong>.
                </p>
                <button
                  type="button"
                  id="btn-request-access-cta"
                  onClick={() => setShowAccessRequestModal(true)}
                  className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Llenar Formulario de Solicitud</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Quick Summary Card */}
            <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-xl border border-slate-800 flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                  <span>Respaldo Automático en la Nube</span>
                </div>
                <p className="text-xs text-slate-300">
                  Tus datos y comprobantes se guardan de forma instantánea y permanente en servidores seguros.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 🌟 Dedicated Illustrated Benefits Section near Login */}
        <AppBenefitsSection onOpenAccessRequest={() => setShowAccessRequestModal(true)} />
      </main>

      {/* Privileges Modal */}
      {showPrivilegesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-sm sm:text-base">
                  Matriz de Privilegios y Roles del Sistema
                </h3>
              </div>
              <button
                type="button"
                id="btn-close-privileges-modal"
                onClick={() => setShowPrivilegesModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <p className="text-xs text-slate-600">
                El sistema separa de manera independiente las facultades del Administrador General del Sitio frente a los Apoderados Administradores / Tesoreros de cada curso:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Admin General Column */}
                <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3.5 space-y-2.5">
                  <div className="flex items-center gap-2 font-bold text-blue-900 text-xs sm:text-sm">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    <span>Administrador General</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-700">
                    <li className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                      <span>Crea y administra <strong>Colegios y Cursos</strong>.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                      <span>Gestiona <strong>Solicitudes de Acceso</strong> ($3.990 Mes / $34.990 Año).</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                      <span>Asigna tesoreros y supervisa el portal completo.</span>
                    </li>
                  </ul>
                </div>

                {/* Course Treasurer Column */}
                <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 space-y-2.5">
                  <div className="flex items-center gap-2 font-bold text-emerald-900 text-xs sm:text-sm">
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                    <span>Tesorero de Curso (Operativo)</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-700">
                    <li className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Control de Cuotas</strong>: marca pagos mensuales en 1 clic.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Libro de Gastos</strong>: sube boletas y comprobantes.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Carga Masiva Excel</strong> de nómina de alumnos.</span>
                    </li>
                  </ul>
                </div>

                {/* Observer / Read-Only Column (Transparency) */}
                <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-3.5 space-y-2.5">
                  <div className="flex items-center gap-2 font-bold text-indigo-900 text-xs sm:text-sm">
                    <Eye className="w-4 h-4 text-indigo-600" />
                    <span>Tesorero Observador (Solo Lectura)</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-700">
                    <li className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                      <span><strong>Transparencia Total</strong>: acceso para directiva o apoderados.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                      <span><strong>Solo Visualización</strong>: sin riesgo de borrar o alterar datos.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                      <span>Consulta balances, boletas y descarga informes PDF.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setShowPrivilegesModal(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Access Request Modal */}
      {showAccessRequestModal && (
        <AccessRequestModal
          isOpen={showAccessRequestModal}
          onClose={() => setShowAccessRequestModal(false)}
        />
      )}

      {/* Password Recovery Modal */}
      {showPasswordRecoveryModal && (
        <PasswordRecoveryModal
          onClose={() => setShowPasswordRecoveryModal(false)}
          onSuccess={handleRecoverySuccess}
        />
      )}

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-6 px-4 border-t border-slate-800 text-center text-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 Cuotin Escolar — Sistema de Recaudación de Cuotas y Rendición de Cuentas.</p>
          <div className="flex items-center gap-4 text-slate-400">
            <button
              type="button"
              id="btn-footer-open-privileges"
              onClick={() => setShowPrivilegesModal(true)}
              className="hover:text-white underline cursor-pointer"
            >
              Matriz de Privilegios
            </button>
            <button
              type="button"
              id="btn-footer-request-access"
              onClick={() => setShowAccessRequestModal(true)}
              className="hover:text-white underline text-orange-400 cursor-pointer"
            >
              Solicitar Cuenta ($3.990 Mes / $34.990 Año)
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

