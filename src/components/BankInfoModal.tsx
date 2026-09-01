import React, { useEffect, useState } from 'react';
import { Check, Copy, Landmark, Save, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { BankAccountDetails } from '../types';

interface BankInfoModalProps {
  onClose: () => void;
}

export const BankInfoModal: React.FC<BankInfoModalProps> = ({ onClose }) => {
  const { currentCourse, updateBankInfo } = useApp();

  const [bankName, setBankName] = useState('');
  const [accountType, setAccountType] = useState('Cuenta RUT / Vista');
  const [accountNumber, setAccountNumber] = useState('');
  const [holderName, setHolderName] = useState('');
  const [holderRut, setHolderRut] = useState('');
  const [email, setEmail] = useState('');
  const [copied, setCopied] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (currentCourse?.bankInfo) {
      setBankName(currentCourse.bankInfo.bankName);
      setAccountType(currentCourse.bankInfo.accountType);
      setAccountNumber(currentCourse.bankInfo.accountNumber);
      setHolderName(currentCourse.bankInfo.holderName);
      setHolderRut(currentCourse.bankInfo.holderRut);
      setEmail(currentCourse.bankInfo.email);
    } else if (currentCourse?.treasurer) {
      setBankName('Banco Estado (Cuenta RUT)');
      setAccountType('Cuenta RUT / Vista');
      setAccountNumber(currentCourse.treasurer.rut.replace(/[^0-9]/g, ''));
      setHolderName(currentCourse.treasurer.fullName);
      setHolderRut(currentCourse.treasurer.rut);
      setEmail(currentCourse.treasurer.email);
    }
  }, [currentCourse]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCourse) return;

    const info: BankAccountDetails = {
      bankName: bankName.trim() || 'Banco Estado',
      accountType: accountType.trim() || 'Cuenta RUT / Vista',
      accountNumber: accountNumber.trim(),
      holderName: holderName.trim(),
      holderRut: holderRut.trim(),
      email: email.trim(),
    };

    updateBankInfo(currentCourse.id, info);
    setSavedSuccess(true);
    setTimeout(() => {
      onClose();
    }, 900);
  };

  const copyToClipboard = () => {
    const text = `📌 *Datos de Transferencia — Cuotas ${currentCourse?.name || 'Curso'}:*
- *Banco:* ${bankName}
- *Tipo de Cuenta:* ${accountType}
- *N° de Cuenta:* ${accountNumber}
- *Titular:* ${holderName}
- *RUT:* ${holderRut}
- *Correo para comprobantes:* ${email}
- *Monto Cuota:* $5.000 CLP`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden my-auto">
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold">
              <Landmark className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">
                Cuenta Bancaria del Curso
              </h3>
              <p className="text-xs text-slate-400">
                {currentCourse?.name} — Datos para transferencias de apoderados
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

        {/* Body */}
        <form onSubmit={handleSave} className="p-5 space-y-3.5 text-xs sm:text-sm">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nombre del Banco *
            </label>
            <input
              id="input-bank-name"
              type="text"
              required
              placeholder="Ej. Banco Estado (Cuenta RUT), Banco de Chile, Santander..."
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tipo de Cuenta *
              </label>
              <select
                id="select-account-type"
                value={accountType}
                onChange={(e) => setAccountType(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
              >
                <option value="Cuenta RUT / Vista">Cuenta RUT / Vista</option>
                <option value="Cuenta Corriente">Cuenta Corriente</option>
                <option value="Cuenta de Ahorro">Cuenta de Ahorro</option>
                <option value="Cuenta Vista Fan / Más">Cuenta Vista Fan / Más</option>
                <option value="Otra">Otra</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                N° de Cuenta *
              </label>
              <input
                id="input-account-number"
                type="text"
                required
                placeholder="15432198"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nombre del Titular *
            </label>
            <input
              id="input-holder-name"
              type="text"
              required
              placeholder="Nombre y Apellidos del Tesorero/a"
              value={holderName}
              onChange={(e) => setHolderName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                RUT Titular *
              </label>
              <input
                id="input-holder-rut"
                type="text"
                required
                placeholder="15.432.198-7"
                value={holderRut}
                onChange={(e) => setHolderRut(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Comprobantes *
              </label>
              <input
                id="input-holder-email"
                type="email"
                required
                placeholder="cuotas.4toa@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Quick Copy Action Banner */}
          <div className="bg-blue-50/70 border border-blue-200/80 rounded-lg p-3 flex items-center justify-between">
            <span className="text-xs text-blue-950 font-medium">
              Texto listo para compartir por WhatsApp
            </span>
            <button
              type="button"
              id="btn-copy-bank-details"
              onClick={copyToClipboard}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold shadow-xs transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>¡Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar Datos</span>
                </>
              )}
            </button>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              id="btn-save-bank-info"
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>{savedSuccess ? '¡Guardado!' : 'Guardar Cuenta'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
