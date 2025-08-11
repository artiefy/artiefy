"use client";

import { FaEnvelope, FaLock, FaPhone, FaUser } from "react-icons/fa";

import { Icons } from "~/components/estudiantes/ui/icons";

import type { FormData } from "~/types/payu";
import type * as React from "react";

interface BuyerInfoFormProps {
  formData: Pick<FormData, "buyerEmail" | "buyerFullName" | "telephone">;
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
  readOnly?: boolean; // Nuevo
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
  readOnly = false, // Nuevo
}: BuyerInfoFormProps) {
  return (
    <div className="grid grid-cols-1 gap-y-4">
      <div className="relative grid gap-1">
        <label className="label">
          <span className="title">Correo Electrónico</span>
          <input
            type="email"
            name="buyerEmail"
            placeholder="ejemplo@correo.com"
            value={formData.buyerEmail}
            onChange={onChangeAction}
            className="input-field"
            required
            readOnly={readOnly}
          />
          <FaEnvelope className="absolute top-1/2 right-3 -translate-y-1/2 transform text-gray-400" />
        </label>
      </div>
      <div className="relative grid gap-1">
        <label className="label">
          <span className="title">Nombre</span>
          <input
            type="text"
            name="buyerFullName"
            placeholder="Juan Pérez"
            value={formData.buyerFullName}
            onChange={onChangeAction}
            className="input-field"
            required
            readOnly={readOnly}
          />
          <FaUser className="absolute top-1/2 right-3 -translate-y-1/2 transform text-gray-400" />
        </label>
      </div>
      <div className="relative grid gap-1">
        <label className="label">
          <span className="title">Teléfono</span>
          <input
            type="tel"
            name="telephone"
            placeholder="+000000000000"
            value={formData.telephone}
            onChange={onChangeAction}
            maxLength={14}
            className={`input-field ${showErrors && errors.telephone ? "input-error" : ""}`}
            required
          />
          <FaPhone className="absolute top-1/2 right-3 -translate-y-1/2 transform text-gray-400" />
        </label>
        {showErrors && errors.telephone && (
          <span className="error-message">{errors.telephone}</span>
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
        className="checkout-btn"
        onClick={onSubmitAction}
        disabled={loading}
      >
        {loading ? (
          <>
            <Icons.spinner
              className="text-background mr-2"
              style={{ width: "25px", height: "25px" }}
            />
            <span className="text-background font-bold">
              Redirigiendo a PayU...
            </span>
          </>
        ) : (
          "Enviar"
        )}
      </button>
    </div>
  );
}
