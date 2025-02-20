"use client"

import type * as React from "react"
import { FaLock } from "react-icons/fa"
import { Icons } from "~/components/estudiantes/ui/icons"
import type { FormData } from "~/types/payu"

interface BuyerInfoFormProps {
  formData: Pick<FormData, "buyerEmail" | "buyerFullName" | "telephone">
  termsAndConditions: boolean
  privacyPolicy: boolean
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  showErrors: boolean
  errors: {
    telephone?: string
    termsAndConditions?: string
    privacyPolicy?: string
  }
  onSubmit: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void
  loading?: boolean
}

export default function BuyerInfoForm({
  formData,
  termsAndConditions,
  privacyPolicy,
  onChange,
  showErrors,
  errors,
  onSubmit,
  loading = false,
}: BuyerInfoFormProps) {
  return (
    <div className="grid grid-cols-1 gap-y-4">
      <label className="label">
        <span className="title">Correo Electrónico</span>
        <input
          type="email"
          name="buyerEmail"
          placeholder="ejemplo@correo.com"
          value={formData.buyerEmail}
          onChange={onChange}
          className="input-field"
          required
          readOnly
        />
      </label>
      <label className="label">
        <span className="title">Nombre Completo</span>
        <input
          type="text"
          name="buyerFullName"
          placeholder="Juan Pérez"
          value={formData.buyerFullName}
          onChange={onChange}
          className="input-field"
          required
          readOnly
        />
      </label>
      <div className="grid gap-1">
        <label className="label">
          <span className="title">Teléfono</span>
          <input
            type="tel"
            name="telephone"
            placeholder="+57 3003333333"
            value={formData.telephone}
            onChange={onChange}
            maxLength={14}
            className={`input-field ${showErrors && errors.telephone ? "input-error" : ""}`}
            required
          />
        </label>
        {showErrors && errors.telephone && <span className="error-message">{errors.telephone}</span>}
      </div>
      <div className="grid gap-2">
        <label className="label-checkbox">
          <input type="checkbox" name="termsAndConditions" checked={termsAndConditions} onChange={onChange} required />
          <span className="checkbox-title">Acepto los términos y condiciones</span>
        </label>
        <label className="label-checkbox">
          <input type="checkbox" name="privacyPolicy" checked={privacyPolicy} onChange={onChange} required />
          <span className="checkbox-title">Acepto la política de privacidad</span>
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
      <button type="button" className="checkout-btn" onClick={onSubmit} disabled={loading}>
        {loading ? (
          <>
            <Icons.spinner className="mr-2 text-background" style={{ width: "25px", height: "25px" }} />
            <span className="font-bold text-background">Redirigiendo a PayU...</span>
          </>
        ) : (
          "Enviar"
        )}
      </button>
    </div>
  )
}

