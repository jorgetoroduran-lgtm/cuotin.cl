import React, { useState } from 'react';
import {
  GraduationCap,
  Building,
  Trophy,
  Home,
  HeartHandshake,
  Users2,
  Briefcase,
  BookOpen,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';

export interface UseCaseItem {
  id: string;
  name: string;
  categoryTag: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  typicalFee: string;
  periodicity: string;
  membersLabel: string;
  groupTypeLabel: string;
  exampleName: string;
  description: string;
  whyCuotinFits: string[];
  sampleExpenses: string[];
  quote: string;
}

export const INSTITUTION_USE_CASES: UseCaseItem[] = [
  {
    id: 'colegios',
    name: 'Colegios y Escuelas',
    categoryTag: 'Educación Escolar',
    icon: GraduationCap,
    color: 'from-blue-600 to-indigo-700',
    badgeBg: 'bg-blue-50',
    badgeBorder: 'border-blue-200',
    badgeText: 'text-blue-700',
    typicalFee: '$3.000 a $10.000 CLP',
    periodicity: 'Mensual (Marzo a Diciembre)',
    membersLabel: 'Alumnos y Apoderados',
    groupTypeLabel: 'Cursos (1° Básico a 4° Medio)',
    exampleName: '3° Básico A — Escuela Los Robles',
    description:
      'Gestiona las cuotas del curso escolar de forma impecable. Controla pagos mes a mes de cada familia, registra gastos de convivencias, materiales y paseos de fin de año con fotos de boletas adjuntas.',
    whyCuotinFits: [
      'Matriz mensual de Marzo a Diciembre en 1 clic.',
      'Modo Observador para que el Presidente o Apoderados auditen sin alterar datos.',
      'Informes automáticos en PDF para proyectar en reuniones de apoderados.',
      'Almacena boletas digitales para que nunca se borre el papel térmico.',
    ],
    sampleExpenses: ['Paseo de Fin de Año', 'Convivencias y Día del Alumno', 'Materiales y Fotocopias', 'Regalos de Profesores'],
    quote: '«En las asambleas proyectamos el balance PDF generado por Cuotin y se acabaron las dudas de las familias.»',
  },
  {
    id: 'academias',
    name: 'Instituciones & Academias',
    categoryTag: 'Artes, Música & Idiomas',
    icon: Building,
    color: 'from-purple-600 to-indigo-800',
    badgeBg: 'bg-purple-50',
    badgeBorder: 'border-purple-200',
    badgeText: 'text-purple-700',
    typicalFee: '$10.000 a $35.000 CLP',
    periodicity: 'Mensual o por Módulos',
    membersLabel: 'Estudiantes Matriculados',
    groupTypeLabel: 'Niveles, Talleres o Clases',
    exampleName: 'Academia Danza Ritmo Sur — Nivel Intermedio',
    description:
      'Lleva el orden financiero de talleres de idiomas, danza, robótica, música o preuniversitarios. Monitorea matrículas, mensualidades y arriendo de salas o compra de insumos.',
    whyCuotinFits: [
      'Control de alumnos activos por taller o nivel formativo.',
      'Historial de transferencias y comprobantes de abonos en tiempo real.',
      'Registro ordenado de gastos en insumos, profesores y arriendos.',
      'Visualización de morosidad instantánea por alumno.',
    ],
    sampleExpenses: ['Vestuario y Escenografía', 'Arriendo de Sala / Estudio', 'Certificados y Diplomas', 'Audio y Equipamiento'],
    quote: '«Administramos 4 talleres de danza y cada profesor tesorero rinde sus gastos con fotos de facturas al día.»',
  },
  {
    id: 'deportes',
    name: 'Clubes Deportivos',
    categoryTag: 'Deporte & Escuelas Formativas',
    icon: Trophy,
    color: 'from-emerald-600 to-teal-700',
    badgeBg: 'bg-emerald-50',
    badgeBorder: 'border-emerald-200',
    badgeText: 'text-emerald-700',
    typicalFee: '$5.000 a $20.000 CLP',
    periodicity: 'Mensual o por Torneo',
    membersLabel: 'Socios, Jugadores y Cadetes',
    groupTypeLabel: 'Series (Sub-15, Senior, Femenino)',
    exampleName: 'Club Deportivo Unión Cordillera — Serie Honor',
    description:
      'Ideal para clubes de fútbol, básquetbol, pádel, artes marciales y ligas amateurs. Lleva el control de cuotas sociales, pago de arbitrajes, arriendo de canchas e indumentaria.',
    whyCuotinFits: [
      'Segmentación por series (Infantil, Juvenil, Adulto, Senior).',
      'Rendición transparente ante la directiva del club y socios.',
      'Respaldo de pagos de árbitros, turnos, balones y camisetas.',
      'Disponibilidad del saldo exacto en caja antes de cada partido.',
    ],
    sampleExpenses: ['Pago de Arbitrajes y Turnos', 'Juego de Camisetas y Balones', 'Arriendo de Canchas y Complejos', 'Inscripción en Ligas'],
    quote: '«Ahora los jugadores revisan con su usuario de consulta el estado de su serie y los gastos de cada fecha.»',
  },
  {
    id: 'comunidades',
    name: 'Condominios & Comunidades',
    categoryTag: 'Inmuebles & Habitacional',
    icon: Home,
    color: 'from-amber-600 to-orange-700',
    badgeBg: 'bg-amber-50',
    badgeBorder: 'border-amber-200',
    badgeText: 'text-amber-700',
    typicalFee: '$15.000 a $60.000 CLP',
    periodicity: 'Mensual (Gastos Comunes / Fondos)',
    membersLabel: 'Departamentos, Casas o Copropietarios',
    groupTypeLabel: 'Torres, Pasajes o Parcelaciones',
    exampleName: 'Comunidad Los Quillayes — Pasaje 2',
    description:
      'Perfecto para condominios pequeños, juntas de vigilancia, parcelaciones y pasajes cerrados que administran gastos comunes, fondos de reserva o portones automáticos.',
    whyCuotinFits: [
      'Seguimiento claro de quién ha pagado el gasto común del mes.',
      'Registro de egresos por conserjería, jardinería y mantenimiento.',
      'Cuentas abiertas para que los vecinos revisen boletas sin desconfianza.',
      'Balance exacto del fondo de reserva para emergencias.',
    ],
    sampleExpenses: ['Mantención de Portón Eléctrico', 'Luminarias y Cámaras de Seguridad', 'Jardinería y Aseo', 'Fondo de Emergencia Vecinal'],
    quote: '«Logramos 100% de transparencia en nuestro pasaje; los vecinos ven las facturas del arreglo del portón al instante.»',
  },
  {
    id: 'fundaciones',
    name: 'Fundaciones & ONG',
    categoryTag: 'Social & Sin Fines de Lucro',
    icon: HeartHandshake,
    color: 'from-rose-600 to-pink-700',
    badgeBg: 'bg-rose-50',
    badgeBorder: 'border-rose-200',
    badgeText: 'text-rose-700',
    typicalFee: '$2.000 a $25.000 CLP',
    periodicity: 'Aportes Mensuales / Donaciones',
    membersLabel: 'Socios Colaboradores y Voluntarios',
    groupTypeLabel: 'Proyectos, Comisiones o Sedes',
    exampleName: 'Fundación Huellas Vivas — Sede Valparaíso',
    description:
      'Organiza aportes de socios benefactores, cuotas de voluntariado y fondos destinados a causas sociales, rescate animal o ayuda humanitaria con estricta trazabilidad contable.',
    whyCuotinFits: [
      'Auditoría continua de cada donación o aporte recibido.',
      'Rendición de cuentas con boletas para directores y donantes.',
      'Separación por proyectos o áreas de intervención.',
      'Exportación en PDF y Excel para asambleas y memorias anuales.',
    ],
    sampleExpenses: ['Alimentos y Medicamentos', 'Logística y Traslados', 'Material de Difusión y Eventos', 'Operativos en Terreno'],
    quote: '«Cumplimos con todas las exigencias de transparencia ante nuestros donantes con balances descargables.»',
  },
  {
    id: 'clubes-sociales',
    name: 'Clubes Sociales & Adulto Mayor',
    categoryTag: 'Comunidad & Recreación',
    icon: Users2,
    color: 'from-teal-600 to-emerald-800',
    badgeBg: 'bg-teal-50',
    badgeBorder: 'border-teal-200',
    badgeText: 'text-teal-700',
    typicalFee: '$1.000 a $5.000 CLP',
    periodicity: 'Mensual o Quincenal',
    membersLabel: 'Socios Activos y Honorarios',
    groupTypeLabel: 'Comités, Talleres o Filiales',
    exampleName: 'Club Adulto Mayor Años Dorados — San Miguel',
    description:
      'Pensado para centros de madres, clubes de adulto mayor, agrupaciones juveniles o scouts. Facilita el cobro amigable de cuotas y la rendición de bingos, paseos y onces.',
    whyCuotinFits: [
      'Interfaz ultra clara y visual, fácil de comprender para cualquier persona.',
      'Historial de pago de cada socio sin enredos de papeles.',
      'Control de caja chica y gastos en eventos o convivencias.',
      'Libro de cuentas siempre al día para postulación a fondos municipales.',
    ],
    sampleExpenses: ['Onces y Convivencias Mensuales', 'Premios de Bingos y Loterías', 'Paseos Recreativos', 'Insumos de Sede Social'],
    quote: '«La directiva no se complica con cuadernos; mostramos en la reunión mensual cuánto entró y cuánto se gastó.»',
  },
  {
    id: 'asociaciones',
    name: 'Asociaciones & Gremios',
    categoryTag: 'Profesional & Comercio',
    icon: Briefcase,
    color: 'from-slate-700 to-slate-900',
    badgeBg: 'bg-slate-100',
    badgeBorder: 'border-slate-300',
    badgeText: 'text-slate-800',
    typicalFee: '$5.000 a $30.000 CLP',
    periodicity: 'Mensual, Trimestral o Semestral',
    membersLabel: 'Empresas, Socios o Colegiados',
    groupTypeLabel: 'Capítulos, Filiales o Comités',
    exampleName: 'Asociación Gremial de Comerciantes Centro',
    description:
      'Administra cuotas sociales de sindicatos, colegios profesionales, cámaras de comercio comunales y comités de adelanto con reportes financieros de nivel ejecutivo.',
    whyCuotinFits: [
      'Padrón de socios con estado de cuenta y morosidad detallada.',
      'Doble rol: Tesorero oficial y Comisión Revisora de Cuentas.',
      'Carga masiva de nómina de socios desde Excel.',
      'Reportes financieros para asambleas generales ordinarias.',
    ],
    sampleExpenses: ['Asesorías Jurídicas y Contables', 'Sitio Web y Comunicaciones', 'Eventos Gremiales y Foros', 'Gastos de Representación'],
    quote: '«La comisión revisora de cuentas audita las transferencias en tiempo real sin entorpecer el trabajo del tesorero.»',
  },
  {
    id: 'capacitacion',
    name: 'Centros de Capacitación (OTEC / Cursos)',
    categoryTag: 'Formación Técnica & Cursos',
    icon: BookOpen,
    color: 'from-cyan-600 to-blue-800',
    badgeBg: 'bg-cyan-50',
    badgeBorder: 'border-cyan-200',
    badgeText: 'text-cyan-700',
    typicalFee: '$20.000 a $80.000 CLP',
    periodicity: 'Por Curso / Matrícula + Cuotas',
    membersLabel: 'Alumnos y Participantes',
    groupTypeLabel: 'Cohortes, Secciones o Módulos',
    exampleName: 'Centro Técnico — Cohorte Soldadura Industrial 2026',
    description:
      'Controla los pagos de aranceles fraccionados, matrículas y materiales de talleres formativos y certificaciones laborales con control de caja y saldos.',
    whyCuotinFits: [
      'Control de cuotas mensuales de aranceles por alumno.',
      'Registro de compras de materiales prácticos y EPP con boletas.',
      'Monitoreo del saldo real disponible para costear relatores.',
      'Informes ejecutivos listos para enviar a directores de sede.',
    ],
    sampleExpenses: ['Honorarios de Relatores', 'Materiales Prácticos y Herramientas', 'Certificaciones y Licencias', 'Manuales e Impresiones'],
    quote: '«Seguimiento preciso de la recaudación de cada cohorte con liquidación de egresos en 1 solo panel.»',
  },
];

interface DidacticUseCasesShowcaseProps {
  onOpenAccessRequest?: () => void;
}

export const DidacticUseCasesShowcase: React.FC<DidacticUseCasesShowcaseProps> = ({
  onOpenAccessRequest,
}) => {
  const [selectedCaseId, setSelectedCaseId] = useState<string>('colegios');

  const currentCase =
    INSTITUTION_USE_CASES.find((item) => item.id === selectedCaseId) ||
    INSTITUTION_USE_CASES[0];

  const IconComponent = currentCase.icon;

  return (
    <div
      id="section-institution-use-cases"
      className="w-full bg-white rounded-3xl p-5 sm:p-8 border border-slate-200 shadow-xl space-y-6 animate-fade-in"
    >
      {/* Top Header */}
      <div className="text-center max-w-3xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-xs">
          <Zap className="w-3.5 h-3.5 text-emerald-600" />
          <span>Versatilidad Total para 8 Sectores Institucionales</span>
        </div>
        <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          ¿Cómo se adapta Cuotin a tu tipo de Institución?
        </h3>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          Haz clic en tu actividad para ver cómo Cuotin resuelve la cobranza de cuotas, el libro de compras con boletas y la rendición de cuentas en cada caso:
        </p>
      </div>

      {/* 🧭 Didactic 8-Button Grid Selector */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {INSTITUTION_USE_CASES.map((item) => {
          const isSelected = selectedCaseId === item.id;
          const ItemIcon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              id={`btn-usecase-${item.id}`}
              onClick={() => setSelectedCaseId(item.id)}
              className={`p-3 rounded-2xl text-left transition-all border-2 flex flex-col justify-between cursor-pointer ${
                isSelected
                  ? 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-900/20 scale-[1.02]'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-2">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                    isSelected
                      ? 'bg-emerald-500 text-white'
                      : 'bg-white text-slate-700 shadow-xs border border-slate-200'
                  }`}
                >
                  <ItemIcon className="w-4 h-4" />
                </div>
                {isSelected && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                )}
              </div>

              <div>
                <span className="font-bold text-xs sm:text-sm block line-clamp-1">
                  {item.name}
                </span>
                <span
                  className={`text-[10px] block line-clamp-1 mt-0.5 ${
                    isSelected ? 'text-slate-300' : 'text-slate-500'
                  }`}
                >
                  {item.categoryTag}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* 📋 Interactive Selected Detail Card */}
      <div className="bg-slate-950 rounded-2xl p-5 sm:p-7 text-white border border-slate-800 shadow-2xl relative overflow-hidden space-y-6">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${currentCase.color} flex items-center justify-center text-white shadow-lg shrink-0`}>
              <IconComponent className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {currentCase.name}
                </h4>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  {currentCase.categoryTag}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Ejemplo en la plataforma: <strong className="text-amber-300 font-semibold">{currentCase.exampleName}</strong>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
              <span className="text-slate-400 text-[10px] block">Monto habitual:</span>
              <span className="font-bold text-emerald-400 font-mono">{currentCase.typicalFee}</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
              <span className="text-slate-400 text-[10px] block">Frecuencia:</span>
              <span className="font-bold text-blue-300">{currentCase.periodicity}</span>
            </div>
          </div>
        </div>

        {/* 2-Columns Content */}
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Description + Why Cuotin Fits (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {currentCase.description}
            </p>

            <div className="space-y-2">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">
                ¿Por qué Cuotin es ideal para este sector?
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {currentCase.whyCuotinFits.map((point, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-2 text-xs text-slate-200"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span className="leading-snug">{point}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Testimonial / Practical Quote */}
            <div className="p-3.5 rounded-xl bg-slate-900 border-l-4 border-amber-400 text-xs text-slate-300 italic">
              {currentCase.quote}
            </div>
          </div>

          {/* Right Column: Key Data Mapping & Sample Expenses (5 cols) */}
          <div className="lg:col-span-5 space-y-3 bg-slate-900/90 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between">
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-blue-400" />
                <span>Estructura de Datos en Cuotin:</span>
              </span>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/70 border border-slate-800">
                  <span className="text-slate-400">Tipo de Agrupación:</span>
                  <span className="font-bold text-white text-right">{currentCase.groupTypeLabel}</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/70 border border-slate-800">
                  <span className="text-slate-400">Padrón de Miembros:</span>
                  <span className="font-bold text-amber-300 text-right">{currentCase.membersLabel}</span>
                </div>
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Gastos & Compras Frecuentes:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {currentCase.sampleExpenses.map((exp, i) => (
                    <span
                      key={i}
                      className="text-[10px] font-semibold bg-slate-800 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700"
                    >
                      • {exp}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {onOpenAccessRequest && (
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  ¿Administras este tipo de entidad?
                </span>
                <button
                  type="button"
                  onClick={onOpenAccessRequest}
                  className="px-3.5 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <span>Solicitar Cuenta</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
