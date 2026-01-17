'use client';

import { FaEnvelope, FaLock, FaPhone, FaUser } from 'react-icons/fa';

import { Icons } from '~/components/estudiantes/ui/icons';

import type { FormData } from '~/types/payu';
import type * as React from 'react';

interface BuyerInfoFormProps {
  formData: Pick<FormData, 'buyerEmail' | 'buyerFullName' | 'telephone'>;
  termsAndConditions: boolean;
  privacyPolicy: boolean;
  onChangeAction: (e: React.ChangeEvent<HTMLInputElement>) => void;
  showErrors: boolean;
  errors: {
    telephone?: string;
    termsAndConditions?: string;
    privacyPolicy?: string;
  };
  onSubmitAction: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  loading?: boolean;
  readOnly?: boolean;
  isFormValid?: boolean; // Nuevo: indica si el formulario está completo y válido
}

export default function BuyerInfoForm({
  formData,
  termsAndConditions,
  privacyPolicy,
  onChangeAction,
  showErrors,
  errors,
  onSubmitAction,
  loading = false,
  readOnly = false,
  isFormValid = false, // Nuevo
}: BuyerInfoFormProps) {
  return (
    <div className="grid grid-cols-1 gap-y-4">
      <div className="relative grid gap-1">
        <label className="label">
          <span className="title">Correo Electrónico *</span>
          <input
            type="email"
            name="buyerEmail"
            placeholder="ejemplo@correo.com"
            value={formData.buyerEmail}
            onChange={onChangeAction}
            className={`input-field ${!formData.buyerEmail && showErrors ? 'border-2 border-red-400' : ''}`}
            required
            readOnly={readOnly}
          />
          <FaEnvelope className="absolute top-1/2 right-3 -translate-y-1/2 transform text-gray-400" />
        </label>
        {!formData.buyerEmail && showErrors && (
          <span className="error-message text-xs">El correo es requerido</span>
        )}
      </div>
      <div className="relative grid gap-1">
        <label className="label">
          <span className="title">Nombre Completo *</span>
          <input
            type="text"
            name="buyerFullName"
            placeholder="Juan Pérez"
            value={formData.buyerFullName}
            onChange={onChangeAction}
            className={`input-field ${!formData.buyerFullName && showErrors ? 'border-2 border-red-400' : ''}`}
            required
            readOnly={readOnly}
          />
          <FaUser className="absolute top-1/2 right-3 -translate-y-1/2 transform text-gray-400" />
        </label>
        {!formData.buyerFullName && showErrors && (
          <span className="error-message text-xs">El nombre es requerido</span>
        )}
      </div>
      <div className="relative grid gap-1">
        <label className="label">
          <span className="title">Teléfono (incluir código de país) *</span>
          <input
            type="tel"
            name="telephone"
            placeholder="+573001234567"
            value={formData.telephone}
            onChange={onChangeAction}
            maxLength={14}
            className={`input-field ${showErrors && (errors.telephone || !formData.telephone) ? 'border-2 border-red-400' : ''}`}
            required
          />
          <FaPhone className="absolute top-1/2 right-3 -translate-y-1/2 transform text-gray-400" />
        </label>
        {showErrors && errors.telephone && (
          <span className="error-message">{errors.telephone}</span>
        )}
        {showErrors && !formData.telephone && !errors.telephone && (
          <span className="error-message text-xs">
            El teléfono es requerido
          </span>
        )}
      </div>
      <div className="grid gap-2">
        <label className="label-checkbox">
          <input
            type="checkbox"
            name="termsAndConditions"
            checked={termsAndConditions}
            onChange={onChangeAction}
            required
          />
          <span className="checkbox-title">
            Acepto los términos y condiciones
          </span>
        </label>
        <label className="label-checkbox">
          <input
            type="checkbox"
            name="privacyPolicy"
            checked={privacyPolicy}
            onChange={onChangeAction}
            required
          />
          <span className="checkbox-title">
            Acepto la política de privacidad
          </span>
        </label>
        {showErrors && (errors.termsAndConditions ?? errors.privacyPolicy) && (
          <span className="error-message text-center">
            Debe aceptar los términos y condiciones y la política de privacidad
          </span>
        )}
      </div>
      <div className="security-message">
        <FaLock className="lock-icon" />
        <span>Estás en un formulario de pagos seguro</span>
      </div>
      <button
        type="button"
        className={`checkout-btn ${!isFormValid && !loading ? 'cursor-not-allowed opacity-50' : ''}`}
        onClick={onSubmitAction}
        disabled={loading || !isFormValid}
        title={
          !isFormValid ? 'Por favor completa todos los campos requeridos' : ''
        }
      >
        {loading ? (
          <>
            <Icons.spinner
              className="mr-2 text-background"
              style={{ width: '25px', height: '25px' }}
            />
            <span className="font-bold text-background">
              Redirigiendo a PayU...
            </span>
          </>
        ) : (
          'Enviar'
        )}
      </button>
    </div>
  );
}
