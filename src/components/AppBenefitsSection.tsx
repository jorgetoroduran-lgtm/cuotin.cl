import React, { useState } from 'react';
import {
  Award,
  BadgeCheck,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Coins,
  DollarSign,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  GraduationCap,
  Info,
  Layers,
  Lock,
  Mail,
  Maximize2,
  MessageCircle,
  Receipt,
  RotateCcw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserCheck,
  Users,
  Wallet,
  Zap,
} from 'lucide-react';
import matrixImg from '../assets/images/treasurer_matrix_app_1787577794819.jpg';
import observerImg from '../assets/images/treasurer_observer_mode_1787577807640.jpg';
import expensesImg from '../assets/images/treasurer_expenses_receipts_1787577826793.jpg';
import reportsImg from '../assets/images/treasurer_reports_summary_1787577838863.jpg';

interface AppBenefitsSectionProps {
  onOpenAccessRequest?: () => void;
}

interface ShowcaseView {
  id: string;
  title: string;
  shortTitle: string;
  subtitle: string;
  badge: string;
  badgeColor: string;
  imageSrc: string;
  fictionalData: {
    course: string;
    monthlyFee: string;
    studentsCount: string;
    collected: string;
    balance: string;
    pendingDebt: string;
  };
  roleAudience: 'TESORERO_TITULAR' | 'TESORERO_OBSERVADOR' | 'AMBOS';
  roleBadgeText: string;
  description: string;
  keyHighlights: string[];
  benefitsList: { icon: string; title: string; desc: string }[];
  transparencyTip: string;
}

export const AppBenefitsSection: React.FC<AppBenefitsSectionProps> = ({
  onOpenAccessRequest,
}) => {
  const [activeViewIndex, setActiveViewIndex] = useState(0);
  const [showImageZoomModal, setShowImageZoomModal] = useState(false);
  const [activeAudienceFilter, setActiveAudienceFilter] = useState<'all' | 'titular' | 'observador'>('all');

  const showcaseViews: ShowcaseView[] = [
    {
      id: 'matrix',
      title: 'Matriz de Cobro de Cuotas Mensuales',
      shortTitle: '1. Matriz de Cuotas',
      subtitle: 'Control mes a mes de Marzo a Diciembre en 1 solo clic',
      badge: 'Cobranza Rápida & Ordenada',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30',
      imageSrc: matrixImg,
      fictionalData: {
        course: '3° Básico A — Escuela Los Robles',
        monthlyFee: '$5.000 CLP / mes',
        studentsCount: '34 Alumnos Matriculados',
        collected: '$1.450.000 CLP (85% pagado)',
        balance: '$745.000 CLP en Cuenta',
        pendingDebt: '$250.000 CLP pendiente',
      },
      roleAudience: 'TESORERO_TITULAR',
      roleBadgeText: 'Perfil Tesorero: Registro de Pagos',
      description:
        'Visualiza la nómina completa del curso en una cuadrícula interactiva. El tesorero puede marcar al instante los pagos con fecha, método (transferencia o efectivo) y notas adicionales.',
      keyHighlights: [
        'Registro instantáneo de cuotas con cálculo automático de totales.',
        'Semáforo visual: verde para pagado, rojo para pendiente de pago.',
        'Historial individual por cada alumno con fecha y comprobante.',
      ],
      benefitsList: [
        {
          icon: '⚡',
          title: 'Ahorro de hasta 6 horas al mes',
          desc: 'Se acabaron las libretas de papel y los cálculos manuales en Excel que se desconfiguran.',
        },
        {
          icon: '📊',
          title: 'Cuentas claras al segundo',
          desc: 'Sabrás exactamente cuánto dinero se ha recaudado y qué apoderados faltan por pagar.',
        },
        {
          icon: '📥',
          title: 'Carga masiva desde Excel',
          desc: 'Sube la lista de alumnos al inicio de año en 5 segundos con un archivo Excel estándar.',
        },
      ],
      transparencyTip:
        'Permite a la directiva y revisores de cuentas consultar el avance de pago sin alterar los registros.',
    },
    {
      id: 'observer',
      title: 'Modo Observador / Solo Visualización',
      shortTitle: '2. Modo Transparencia',
      subtitle: 'Acceso seguro para apoderados y directiva sin riesgo de modificación',
      badge: 'Transparencia Total del Curso',
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-400/30',
      imageSrc: observerImg,
      fictionalData: {
        course: '3° Básico A — Escuela Los Robles',
        monthlyFee: '$5.000 CLP fijada en asamblea',
        studentsCount: 'Revisión en Vivo: 34 Alumnos',
        collected: '$1.450.000 CLP auditados',
        balance: '$745.000 CLP disponible',
        pendingDebt: 'Cero discrepancias contables',
      },
      roleAudience: 'TESORERO_OBSERVADOR',
      roleBadgeText: 'Perfil Observador: Solo Lectura (Auditoría)',
      description:
        'Crea cuentas con perfil de "Solo Lectura" para el presidente de curso, el revisor de cuentas o cualquier apoderado. Pueden entrar y revisar todos los números, balances y boletas en tiempo real sin temor a que borren o modifiquen datos por error.',
      keyHighlights: [
        'Acceso 100% transparente a la información financiera del curso.',
        'Protección total: botones de edición y borrado desactivados para observadores.',
        'Genera absoluta confianza entre la directiva, el tesorero y toda la asamblea de apoderados.',
      ],
      benefitsList: [
        {
          icon: '🛡️',
          title: 'Cero suspicacias o desconfianza',
          desc: 'Cualquier miembro asignado puede auditar las cuentas en cualquier momento desde su teléfono.',
        },
        {
          icon: '🔒',
          title: 'Integridad de los datos protegida',
          desc: 'El tesorero oficial mantiene el control operativo sin peligro de borrados accidentales.',
        },
        {
          icon: '🤝',
          title: 'Traspaso de mando sin fricción',
          desc: 'Al cambiar la directiva o tesorería a fin de año, el historial completo permanece disponible.',
        },
      ],
      transparencyTip:
        'La mejor herramienta para asambleas escolares: proyecta la app en vivo o comparte el usuario observador.',
    },
    {
      id: 'expenses',
      title: 'Libro de Gastos con Boletas & Comprobantes',
      shortTitle: '3. Gastos & Boletas',
      subtitle: 'Comprobantes digitales adjuntos para que nunca se borre la tinta térmica',
      badge: 'Respaldo Contable Digital',
      badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-400/30',
      imageSrc: expensesImg,
      fictionalData: {
        course: '3° Básico A — Egresos 2026',
        monthlyFee: '12 Gastos Registrados',
        studentsCount: 'Categorías: Eventos, Materiales',
        collected: 'Total Gastado: $705.000 CLP',
        balance: 'Deudas Pendientes: $0 CLP',
        pendingDebt: '12 Boletas Digitalizadas',
      },
      roleAudience: 'TESORERO_TITULAR',
      roleBadgeText: 'Perfil Tesorero: Registro de Comprobantes',
      description:
        'Registra cada compra de convivencias, paseos de fin de año, materiales de arte o fotocopias. Adjunta la foto de la boleta o factura digital para respaldar cada peso gastado.',
      keyHighlights: [
        'Subida de fotos o archivos de boletas directamente desde el celular.',
        'Distinción clara entre gastos totalmente pagados y gastos con deuda o abonos.',
        'Detalle de responsable que ejecutó el gasto y proveedor correspondiente.',
      ],
      benefitsList: [
        {
          icon: '🧾',
          title: 'Boletas legibles para siempre',
          desc: 'Las boletas de papel térmico se borran en 2 meses; en la app quedan guardadas de por vida en la nube.',
        },
        {
          icon: '🏷️',
          title: 'Clasificación por categorías',
          desc: 'Separa egresos en Paseo de Fin de Año, Convivencias, Regalos de Profesores y Materiales.',
        },
        {
          icon: '⚖️',
          title: 'Control de abonos a proveedores',
          desc: 'Registra pagos parciales con saldo pendiente hasta liquidar el 100% de la compra.',
        },
      ],
      transparencyTip:
        'En cualquier reunión de apoderados puedes abrir y mostrar la foto de la boleta exacta de cualquier compra.',
    },
    {
      id: 'reports',
      title: 'Saldo en Cuenta Bancaria & Informes PDF / Excel',
      shortTitle: '4. Saldos & Reportes',
      subtitle: 'Balance automático instantáneo listo para presentar en reuniones',
      badge: 'Cuentas Claras & Balances',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-400/30',
      imageSrc: reportsImg,
      fictionalData: {
        course: '3° Básico A — Balance Oficial',
        monthlyFee: 'Cuota $5.000 / $50.000 Anual',
        studentsCount: '34 Familias en el Curso',
        collected: 'Recaudación: $1.450.000 CLP',
        balance: 'Saldo en Caja: $745.000 CLP',
        pendingDebt: 'Gastos: $705.000 CLP',
      },
      roleAudience: 'AMBOS',
      roleBadgeText: 'Perfil Tesorero & Observador: Descarga de Informes',
      description:
        'Fórmula matemática infalible: Saldo en Caja = Total Recaudado - Total Gastado. Genera informes ejecutivos en PDF y hojas de cálculo Excel con un solo clic.',
      keyHighlights: [
        'Cálculo en vivo del dinero que debe haber exactamente en la cuenta corriente o bipersonal.',
        'Gráficos de flujo mensual que comparan ingresos por cuotas versus egresos por actividades.',
        'Exportación de balances formales para la dirección del colegio y asambleas de apoderados.',
      ],
      benefitsList: [
        {
          icon: '📈',
          title: 'Visión gráfica y clara',
          desc: 'Los apoderados entienden el balance al instante gracias a gráficos visuales de barras y torta.',
        },
        {
          icon: '📄',
          title: 'Reportes PDF profesionales',
          desc: 'Imprime o envía por WhatsApp el informe financiero firmado por la directiva del curso.',
        },
        {
          icon: '🏦',
          title: 'Cuadratura con cartola bancaria',
          desc: 'Verifica rápidamente que el saldo de la app coincida con la cuenta bancaria del curso.',
        },
      ],
      transparencyTip:
        'Elimina las dudas y discusiones en las reuniones de apoderados con datos oficiales verificables.',
    },
  ];

  const currentView = showcaseViews[activeViewIndex];

  return (
    <section
      id="section-app-benefits-visual"
      className="w-full max-w-5xl mx-auto my-8 space-y-8 animate-fade-in"
    >
      {/* Section Header */}
      <div className="text-center space-y-2.5">
        <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-200 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>Tesorería Digital para Instituciones y Organizaciones</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Transparencia, Orden y Claridad para tu Institución
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Descubre cómo funciona la plataforma desde el rol de <strong>Tesorero</strong> y cómo el <strong>Modo de Solo Visualización</strong> permite compartir las cuentas en tiempo real con la directiva, comités y miembros para una transparencia intachable.
        </p>
      </div>

      {/* 🧭 Visual Tabs Selector */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 bg-slate-200/80 p-1.5 rounded-2xl border border-slate-300/80 shadow-xs">
        {showcaseViews.map((view, index) => {
          const isActive = activeViewIndex === index;
          return (
            <button
              key={view.id}
              type="button"
              id={`tab-showcase-${view.id}`}
              onClick={() => setActiveViewIndex(index)}
              className={`flex flex-col items-start p-3 rounded-xl text-left transition-all cursor-pointer ${
                isActive
                  ? 'bg-slate-900 text-white shadow-md shadow-slate-900/20'
                  : 'bg-white/70 hover:bg-white text-slate-700 hover:text-slate-900 border border-transparent hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span
                  className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                    isActive
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  Vista {index + 1}
                </span>
                {view.roleAudience === 'TESORERO_OBSERVADOR' ? (
                  <span className="text-[10px] text-indigo-400 font-bold flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    Observador
                  </span>
                ) : (
                  <span className={`text-[10px] font-bold ${isActive ? 'text-slate-400' : 'text-slate-400'}`}>
                    Tesorero
                  </span>
                )}
              </div>
              <span className="font-bold text-xs sm:text-sm line-clamp-1">
                {view.shortTitle}
              </span>
              <span
                className={`text-[11px] line-clamp-1 mt-0.5 ${
                  isActive ? 'text-slate-300' : 'text-slate-500'
                }`}
              >
                {view.subtitle}
              </span>
            </button>
          );
        })}
      </div>

      {/* 🖼️ Main Showcase Display Box */}
      <div className="bg-slate-950 rounded-3xl p-4 sm:p-7 text-white shadow-2xl border border-slate-800 relative overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute -top-24 -left-24 w-80 h-80 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          {/* Top Bar of Active View */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${currentView.badgeColor}`}>
                  {currentView.badge}
                </span>
                <span className="inline-flex items-center gap-1.5 bg-slate-800 text-slate-300 text-xs px-2.5 py-0.5 rounded-full border border-slate-700 font-medium">
                  {currentView.roleAudience === 'TESORERO_OBSERVADOR' ? (
                    <>
                      <Eye className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{currentView.roleBadgeText}</span>
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{currentView.roleBadgeText}</span>
                    </>
                  )}
                </span>
              </div>
              <h3 className="text-lg sm:text-2xl font-black text-white tracking-tight">
                {currentView.title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
                {currentView.description}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                id="btn-zoom-image-showcase"
                onClick={() => setShowImageZoomModal(true)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition-colors shadow-xs"
                title="Ampliar captura en pantalla completa"
              >
                <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Ver Imagen Completa</span>
              </button>
            </div>
          </div>

          {/* Screenshot Image + Fictional Data Overlay */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Left/Main Image Preview */}
            <div className="lg:col-span-8 space-y-3">
              <div
                className="relative aspect-video rounded-2xl overflow-hidden bg-slate-900 border-2 border-slate-800 shadow-2xl group cursor-pointer"
                onClick={() => setShowImageZoomModal(true)}
                title="Haz clic para ampliar la captura"
              >
                <img
                  src={currentView.imageSrc}
                  alt={currentView.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                />

                {/* Subtle Hover Callout */}
                <div className="absolute inset-0 bg-slate-950/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="bg-slate-900/90 text-white text-xs font-bold px-4 py-2 rounded-xl backdrop-blur-md border border-slate-700 shadow-xl flex items-center gap-2">
                    <Maximize2 className="w-4 h-4 text-amber-400" />
                    <span>Haz clic para ampliar captura detallada</span>
                  </div>
                </div>

                {/* Status Indicator Tag inside Image */}
                <div className="absolute bottom-3 left-3 bg-slate-950/85 backdrop-blur-md text-white text-[11px] px-3 py-1.5 rounded-lg border border-slate-700/80 shadow-md flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span className="font-mono text-slate-300">Ejemplo Ficticio:</span>
                  <span className="font-bold text-amber-300">{currentView.fictionalData.course}</span>
                </div>
              </div>

              {/* Quick Image Navigation buttons */}
              <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                <button
                  type="button"
                  onClick={() =>
                    setActiveViewIndex((prev) =>
                      prev === 0 ? showcaseViews.length - 1 : prev - 1
                    )
                  }
                  className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Anterior</span>
                </button>

                <div className="flex items-center gap-1.5">
                  {showcaseViews.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setActiveViewIndex(i)}
                      className={`w-2.5 h-2.5 rounded-full transition-all ${
                        activeViewIndex === i ? 'w-6 bg-emerald-400' : 'bg-slate-700 hover:bg-slate-500'
                      }`}
                    />
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setActiveViewIndex((prev) =>
                      prev === showcaseViews.length - 1 ? 0 : prev + 1
                    )
                  }
                  className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
                >
                  <span>Siguiente</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Right: Data & Transparency Highlights (4 cols) */}
            <div className="lg:col-span-4 space-y-4">
              {/* Fictional Context Card */}
              <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 shadow-lg space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                    <Building2 className="w-4 h-4 text-amber-400" />
                    <span>Datos Reales Simulados</span>
                  </div>
                  <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                    Curso Tipo Chile
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 block">Cuota Mensual</span>
                    <span className="font-bold text-white font-mono">{currentView.fictionalData.monthlyFee}</span>
                  </div>
                  <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 block">Matrícula</span>
                    <span className="font-bold text-white font-mono">{currentView.fictionalData.studentsCount}</span>
                  </div>
                  <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 block">Total Recaudado</span>
                    <span className="font-bold text-emerald-400 font-mono">{currentView.fictionalData.collected}</span>
                  </div>
                  <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 block">Saldo en Cuenta</span>
                    <span className="font-bold text-blue-400 font-mono">{currentView.fictionalData.balance}</span>
                  </div>
                </div>

                {/* Transparency Special Callout */}
                <div className="p-3 rounded-xl bg-indigo-950/50 border border-indigo-700/50 text-indigo-200 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-indigo-300">
                    <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span>Transparencia Tesorero ↔ Curso</span>
                  </div>
                  <p className="text-[11px] text-indigo-200/90 leading-relaxed">
                    {currentView.transparencyTip}
                  </p>
                </div>
              </div>

              {/* Highlights Checklist */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  Funciones Claves de esta Vista:
                </span>
                <ul className="space-y-2 text-xs text-slate-300">
                  {currentView.keyHighlights.map((hl, idx) => (
                    <li key={idx} className="flex items-start gap-2 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="leading-snug">{hl}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 🌟 2-Column Comparison: Tesorero Titular vs. Tesorero Observador (Transparencia) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-1.5">
          <div className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-800 border border-blue-200 px-3 py-0.5 rounded-full text-xs font-bold uppercase">
            <Users className="w-3.5 h-3.5 text-blue-600" />
            <span>Doble Perfil de Seguridad y Confianza</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-slate-900">
            ¿Cómo garantiza Cuotin la transparencia en tu Institución?
          </h3>
          <p className="text-xs sm:text-sm text-slate-600">
            Diseñado para que la tesorería trabaje con agilidad y los socios o apoderados tengan certeza absoluta de cada movimiento.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card: Tesorero Titular (Operativo) */}
          <div className="p-5 sm:p-6 rounded-2xl bg-emerald-50/60 border-2 border-emerald-200 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
                  <UserCheck className="w-5 h-5" />
                </div>
                <span className="bg-emerald-200 text-emerald-900 text-[11px] font-black px-2.5 py-1 rounded-full uppercase">
                  Gestión Operativa
                </span>
              </div>

              <h4 className="text-lg font-black text-slate-900">
                Tesorero Oficial del Curso
              </h4>
              <p className="text-xs text-slate-700 leading-relaxed">
                Tiene permisos de edición completa para registrar cuotas recibidas, crear compras con boletas, registrar abonos y configurar los datos bancarios del curso.
              </p>

              <ul className="space-y-2 text-xs text-slate-800 pt-2">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Marca cuotas pagadas mes a mes en 1 clic.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Sube fotos de boletas y facturas de compras.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Fija el valor de la cuota acordado en asamblea.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Importa alumnos masivamente desde planillas Excel.</span>
                </li>
              </ul>
            </div>

            <div className="p-3 bg-white rounded-xl border border-emerald-200 text-xs font-semibold text-emerald-900 flex items-center gap-2 shadow-xs">
              <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Reduce a minutos la cobranza y rendición de cuentas</span>
            </div>
          </div>

          {/* Card: Tesorero Observador / Solo Lectura (Transparencia) */}
          <div className="p-5 sm:p-6 rounded-2xl bg-indigo-50/60 border-2 border-indigo-200 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
                  <Eye className="w-5 h-5" />
                </div>
                <span className="bg-indigo-200 text-indigo-900 text-[11px] font-black px-2.5 py-1 rounded-full uppercase">
                  Solo Lectura / Auditoría
                </span>
              </div>

              <h4 className="text-lg font-black text-slate-900">
                Usuarios de Solo Visualización
              </h4>
              <p className="text-xs text-slate-700 leading-relaxed">
                Ideal para el Presidente del Curso, el Revisor de Cuentas o apoderados. Permite auditar en tiempo real sin peligro de alterar o borrar nada por error.
              </p>

              <ul className="space-y-2 text-xs text-slate-800 pt-2">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <span>Acceso a ver toda la matriz de cuotas y porcentajes.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <span>Revisión de todas las boletas y comprobantes adjuntos.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <span>Verificación del saldo en caja disponible al segundo.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <span>Descarga de informes PDF y Excel para la asamblea.</span>
                </li>
              </ul>
            </div>

            <div className="p-3 bg-white rounded-xl border border-indigo-200 text-xs font-semibold text-indigo-900 flex items-center gap-2 shadow-xs">
              <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>Transparencia inquebrantable y tranquilidad para todos</span>
            </div>
          </div>
        </div>

        {/* CTA in Section */}
        {onOpenAccessRequest && (
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
                <Zap className="w-5 h-5" />
              </div>
              <div className="text-xs text-slate-700">
                <span className="font-bold text-slate-900 block">
                  Planes de Arriendo: $3.490 CLP / Mes • Promoción Anual: $29.990 CLP / Año
                </span>
                <span>Incluye cuentas de Tesorero y usuarios de Solo Lectura ilimitados. • <strong className="text-emerald-700">WhatsApp: <a href="https://wa.me/56942788044?text=Hola%2C%20quisiera%20consultar%20por%20la%20plataforma%20Cuotin" target="_blank" rel="noopener noreferrer" className="underline hover:text-emerald-900 font-mono">+569 4278 8044</a></strong></span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <a
                id="btn-whatsapp-benefits-cta"
                href="https://wa.me/56942788044?text=Hola%2C%20quisiera%20solicitar%20informaci%C3%B3n%20para%20activar%20Cuotin%20en%20mi%20instituci%C3%B3n"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp Soporte</span>
              </a>

              <button
                type="button"
                id="btn-request-access-from-benefits"
                onClick={onOpenAccessRequest}
                className="px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <Zap className="w-4 h-4" />
                <span>Solicitar Cuenta</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 🔍 Fullscreen Zoom Modal for Active Image */}
      {showImageZoomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 sm:p-6 animate-fade-in">
          <div className="bg-slate-900 rounded-3xl max-w-5xl w-full border border-slate-800 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-4 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-bold">
                  {currentView.title} — {currentView.fictionalData.course}
                </span>
              </div>
              <button
                type="button"
                id="btn-close-zoom-modal"
                onClick={() => setShowImageZoomModal(false)}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                ✕ Cerrar
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-4">
              <div className="rounded-2xl overflow-hidden border border-slate-800 bg-black">
                <img
                  src={currentView.imageSrc}
                  alt={currentView.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-auto object-contain max-h-[60vh] mx-auto"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                {currentView.benefitsList.map((b, i) => (
                  <div key={i} className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-white">
                      <span>{b.icon}</span>
                      <span>{b.title}</span>
                    </div>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      {b.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
