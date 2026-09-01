import React from 'react';
import { MessageCircle } from 'lucide-react';

interface FloatingWhatsAppButtonProps {
  phoneNumber?: string;
  defaultMessage?: string;
}

export const FloatingWhatsAppButton: React.FC<FloatingWhatsAppButtonProps> = ({
  phoneNumber = '56942788044',
  defaultMessage = '¡Hola! Me gustaría solicitar información sobre el sistema Cuotin (Tesorería Digital) para mi institución.',
}) => {
  const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
  const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(defaultMessage)}`;

  return (
    <aside
      aria-label="Contacto de Soporte por WhatsApp"
      className="fixed bottom-5 right-5 z-50 flex items-center group pointer-events-auto"
    >
      {/* Tooltip text on hover / focus */}
      <div
        id="tooltip-whatsapp-contact"
        role="tooltip"
        className="mr-2 px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-xl shadow-lg border border-slate-700 whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-focus-within:opacity-100 transition-all duration-200 transform translate-x-2 group-hover:translate-x-0 hidden sm:flex items-center gap-1.5"
      >
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        <span>¿Consultas o activar cuenta? WhatsApp directo</span>
      </div>

      {/* Floating Action Button */}
      <a
        id="btn-floating-whatsapp"
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Escribir a Soporte Cuotin por WhatsApp al +56942788044"
        className="relative flex items-center justify-center w-14 h-14 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white rounded-full shadow-xl hover:shadow-2xl shadow-emerald-900/30 transition-all duration-200 ring-4 ring-white/80 focus:outline-hidden focus:ring-4 focus:ring-emerald-400"
      >
        {/* Subtle ping animation indicator */}
        <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-400 border-2 border-white"></span>
        </span>

        {/* WhatsApp Icon */}
        <MessageCircle className="w-7 h-7 fill-white/20 stroke-[2.2]" />
      </a>
    </aside>
  );
};
