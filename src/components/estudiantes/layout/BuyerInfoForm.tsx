'use client';

import { useMemo, useState } from 'react';

import {
  FaArrowUpRightFromSquare,
  FaEnvelope,
  FaPhone,
  FaRegCreditCard,
  FaUser,
} from 'react-icons/fa6';
import { GoShieldCheck } from 'react-icons/go';
import { getCountries, getCountryCallingCode } from 'react-phone-number-input';

import { Icons } from '~/components/estudiantes/ui/icons';

import type * as React from 'react';

function countryCodeToFlagEmoji(countryCode: string): string {
  return countryCode
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)));
}

interface BuyerInfoFormProps {
  formData: {
    buyerEmail: string;
    buyerFirstName: string;
    buyerLastName: string;
    telephone: string;
  };
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
  submitLabel?: string;
  variant?: 'default' | 'inline-course-card' | 'inline-plan-card';
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
  submitLabel = 'Enviar',
  variant = 'default',
}: BuyerInfoFormProps) {
  const countryOptions = useMemo(() => {
    const regionNames = new Intl.DisplayNames(['es'], { type: 'region' });

    return getCountries()
      .map((country) => {
        const dialCode = `+${getCountryCallingCode(country)}`;
        const countryName = regionNames.of(country) ?? country;

        return {
          country,
          countryName,
          flag: countryCodeToFlagEmoji(country),
          dialCode,
          dialDigits: dialCode.replace('+', ''),
        };
      })
      .sort((a, b) => a.countryName.localeCompare(b.countryName, 'es'));
  }, []);

  const [selectedCountry, setSelectedCountry] = useState('CO');

  const inferredCountryFromPhone = useMemo(() => {
    const digitsOnly = formData.telephone.replace(/\D/g, '');
    if (!digitsOnly) return null;

    const byDialLengthDesc = [...countryOptions].sort(
      (a, b) => b.dialDigits.length - a.dialDigits.length
    );

    const matched = byDialLengthDesc.find((option) =>
      digitsOnly.startsWith(option.dialDigits)
    );

    return matched?.country ?? null;
  }, [countryOptions, formData.telephone]);

  const resolvedCountry = inferredCountryFromPhone ?? selectedCountry;

  const selectedCountryOption =
    countryOptions.find((option) => option.country === resolvedCountry) ??
    countryOptions.find((option) => option.country === 'CO') ??
    countryOptions[0];

  const selectedDialCode = selectedCountryOption?.dialCode ?? '+57';
  const selectedDialDigits = selectedDialCode.replace('+', '');

  const localPhoneDigits = useMemo(() => {
    const digitsOnly = formData.telephone.replace(/\D/g, '');

    if (selectedDialDigits && digitsOnly.startsWith(selectedDialDigits)) {
      return digitsOnly.slice(selectedDialDigits.length);
    }

    return digitsOnly;
  }, [formData.telephone, selectedDialDigits]);

  const maxLocalDigits = Math.max(4, 15 - selectedDialDigits.length);

  const emitPhoneChange = (nextFullPhone: string) => {
    const nextEvent = {
      target: {
        name: 'telephone',
        value: nextFullPhone,
      },
    } as React.ChangeEvent<HTMLInputElement>;

    onChangeAction(nextEvent);
  };

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextCountry = e.target.value;
    setSelectedCountry(nextCountry);

    const nextDialCode = `+${getCountryCallingCode(nextCountry as never)}`;
    emitPhoneChange(`${nextDialCode}${localPhoneDigits}`);
  };

  const handleLocalPhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const localDigits = e.target.value
      .replace(/\D/g, '')
      .slice(0, maxLocalDigits);
    emitPhoneChange(`${selectedDialCode}${localDigits}`);
  };

  const isInlineCourseCard = variant === 'inline-course-card';
  const isInlinePlanCard = variant === 'inline-plan-card';
  const isInlineCompactCard = isInlineCourseCard || isInlinePlanCard;
  const shouldHideInlineIdentityFields = isInlineCompactCard && readOnly;
  const shouldShowTelephoneField = !readOnly || isInlineCompactCard;
  const hasStartedFilling =
    formData.buyerEmail.trim().length > 0 ||
    formData.buyerFirstName.trim().length > 0 ||
    formData.buyerLastName.trim().length > 0 ||
    formData.telephone.trim().length > 0;
  const showTermsValidation =
    (showErrors || hasStartedFilling) &&
    (!termsAndConditions || !privacyPolicy);
  const shouldDisableSubmitButton =
    loading || (!isFormValid && !isInlineCompactCard);

  return (
    <div
      className={`
        grid grid-cols-1
        ${isInlineCompactCard ? 'gap-y-2' : 'gap-y-4'}
      `}
    >
      {!shouldHideInlineIdentityFields ? (
        <div
          className={
            isInlineCourseCard
              ? 'grid grid-cols-2 gap-2'
              : `
                grid grid-cols-1 gap-3
                sm:grid-cols-2
              `
          }
        >
          <div className="relative grid gap-1">
            <label className="label">
              {!isInlineCompactCard ? (
                <span className="title">Nombre *</span>
              ) : null}
              {readOnly ? (
                <div
                  className={`
                    input-field flex items-center
                    ${
                      !formData.buyerFirstName && showErrors
                        ? 'border-2 border-red-400'
                        : ''
                    }
                  `}
                  role="textbox"
                  aria-readonly="true"
                >
                  {formData.buyerFirstName || 'No disponible'}
                </div>
              ) : (
                <input
                  type="text"
                  name="buyerFirstName"
                  placeholder="Nombre"
                  value={formData.buyerFirstName}
                  onChange={onChangeAction}
                  className={`
                    input-field
                    ${!formData.buyerFirstName && showErrors ? 'border-2 border-red-400' : ''}`}
                  required
                />
              )}
              <FaUser
                className="
                  absolute top-1/2 right-3 -translate-y-1/2 transform
                  text-gray-400
                "
              />
            </label>
            {!formData.buyerFirstName && showErrors && (
              <span className="error-message text-[10px]">
                El nombre es requerido
              </span>
            )}
          </div>

          <div className="relative grid gap-1">
            <label className="label">
              {!isInlineCompactCard ? (
                <span className="title">Apellidos *</span>
              ) : null}
              {readOnly ? (
                <div
                  className={`
                    input-field flex items-center
                    ${
                      !formData.buyerLastName && showErrors
                        ? 'border-2 border-red-400'
                        : ''
                    }
                  `}
                  role="textbox"
                  aria-readonly="true"
                >
                  {formData.buyerLastName || 'No disponible'}
                </div>
              ) : (
                <input
                  type="text"
                  name="buyerLastName"
                  placeholder="Apellidos"
                  value={formData.buyerLastName}
                  onChange={onChangeAction}
                  className={`
                    input-field
                    ${!formData.buyerLastName && showErrors ? 'border-2 border-red-400' : ''}`}
                  required
                />
              )}
              <FaUser
                className="
                  absolute top-1/2 right-3 -translate-y-1/2 transform
                  text-gray-400
                "
              />
            </label>
            {!formData.buyerLastName && showErrors && (
              <span className="error-message text-[10px]">
                Los apellidos son requeridos
              </span>
            )}
          </div>
        </div>
      ) : null}

      {!shouldHideInlineIdentityFields ? (
        <div className="relative grid gap-1">
          <label className="label">
            {!isInlineCompactCard ? (
              <span className="title">Correo Electrónico *</span>
            ) : null}
            {readOnly ? (
              <div
                className={`
                  input-field flex items-center
                  ${
                    !formData.buyerEmail && showErrors
                      ? 'border-2 border-red-400'
                      : ''
                  }
                `}
                role="textbox"
                aria-readonly="true"
              >
                {formData.buyerEmail || 'No disponible'}
              </div>
            ) : (
              <input
                type="email"
                name="buyerEmail"
                placeholder="ejemplo@correo.com"
                value={formData.buyerEmail}
                onChange={onChangeAction}
                className={`
                  input-field
                  ${!formData.buyerEmail && showErrors ? 'border-2 border-red-400' : ''}`}
                required
              />
            )}
            <FaEnvelope
              className="
                absolute top-1/2 right-3 -translate-y-1/2 transform
                text-gray-400
              "
            />
          </label>
          {!formData.buyerEmail && showErrors && (
            <span className="error-message text-[10px]">
              El correo es requerido
            </span>
          )}
        </div>
      ) : null}

      {shouldShowTelephoneField ? (
        <div className="relative grid gap-1">
          <label className="label">
            {!isInlineCompactCard ? (
              <span className="title">Teléfono (incluir código de país) *</span>
            ) : null}
            {isInlineCompactCard ? (
              <div className="course-card-phone-row relative">
                <span className="course-card-required-indicator" aria-hidden>
                  *
                </span>
                <div className="course-card-country-select-wrap">
                  {/* Display visual: bandera + código + flecha */}
                  <div className="course-card-country-display" aria-hidden>
                    <span className="course-card-country-selected-flag">
                      {selectedCountryOption?.flag ?? '🌐'}
                    </span>
                    <span className="course-card-country-dial-code">
                      {selectedDialCode}
                    </span>
                    <span className="course-card-country-chevron">▾</span>
                  </div>
                  {/* Select nativo transparente superpuesto — controla la lógica y abre el dropdown del SO */}
                  <select
                    name="telephoneCountryCode"
                    value={resolvedCountry}
                    onChange={handleCountryChange}
                    className="course-card-country-select"
                    aria-label={`Código de país: ${selectedCountryOption?.countryName ?? ''} (${selectedDialCode})`}
                  >
                    {countryOptions.map((option) => (
                      <option key={option.country} value={option.country}>
                        {`${option.flag} ${option.countryName} (${option.dialCode})`}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="relative">
                  <input
                    type="tel"
                    name="telephone"
                    placeholder="Telefono"
                    value={localPhoneDigits}
                    onChange={handleLocalPhoneChange}
                    maxLength={maxLocalDigits}
                    inputMode="numeric"
                    className={`
                      input-field course-card-phone-input
                      ${showErrors && (errors.telephone || !formData.telephone) ? 'border-2 border-red-400' : ''}`}
                    required
                  />
                  <FaPhone
                    className="
                      absolute top-1/2 right-3 -translate-y-1/2 transform
                      text-gray-400
                    "
                  />
                </div>
              </div>
            ) : (
              <>
                <input
                  type="tel"
                  name="telephone"
                  placeholder="+12125551234"
                  value={formData.telephone}
                  onChange={onChangeAction}
                  maxLength={16}
                  inputMode="numeric"
                  pattern="\\+\\d{7,15}"
                  className={`
                    input-field
                    ${showErrors && (errors.telephone || !formData.telephone) ? 'border-2 border-red-400' : ''}`}
                  required
                />
                <FaPhone
                  className="
                    absolute top-1/2 right-3 -translate-y-1/2 transform
                    text-gray-400
                  "
                />
              </>
            )}
          </label>
          {showErrors && errors.telephone && (
            <span className="error-message">{errors.telephone}</span>
          )}
          {showErrors && !formData.telephone && !errors.telephone && (
            <span className="error-message text-[10px]">
              Ingresa tu telefono
            </span>
          )}
        </div>
      ) : null}
      <div
        className={`
          grid
          ${isInlineCompactCard ? 'gap-1.5' : 'gap-2'}
        `}
      >
        {isInlineCompactCard ? (
          <>
            {isInlineCourseCard ? (
              <div className="course-card-benefits">
                <span>✓ Todas las clases y recursos</span>
                <span>✓ Proyectos con feedback</span>
                <span>✓ Certificado oficial</span>
                <span>✓ Espacios exclusivos</span>
              </div>
            ) : null}
            <label className="label-checkbox label-checkbox--inline">
              <input
                type="checkbox"
                name="termsAndConditions"
                checked={termsAndConditions}
                onChange={onChangeAction}
                className={
                  showTermsValidation && !termsAndConditions
                    ? 'border-red-400 ring-1 ring-red-400'
                    : ''
                }
                required
              />
              <span
                className={`
                  checkbox-title checkbox-title--inline
                  ${
                    showTermsValidation && !termsAndConditions
                      ? 'text-red-300'
                      : ''
                  }
                `}
              >
                Acepto los{' '}
                <a
                  href="/terminos"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="
                    text-[#22C4D3]
                    hover:underline
                  "
                  onClick={(e) => e.stopPropagation()}
                >
                  Términos y Condiciones
                </a>{' '}
                y la{' '}
                <a
                  href="/privacidad"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="
                    text-[#22C4D3]
                    hover:underline
                  "
                  onClick={(e) => e.stopPropagation()}
                >
                  Política de Privacidad
                </a>
              </span>
            </label>
            {showTermsValidation && !termsAndConditions && (
              <span className="error-message text-center text-[10px]">
                Debe aceptar los términos y la política de privacidad
              </span>
            )}
          </>
        ) : (
          <>
            <label className="label-checkbox">
              <input
                type="checkbox"
                name="termsAndConditions"
                checked={termsAndConditions}
                onChange={onChangeAction}
                className={
                  showTermsValidation && !termsAndConditions
                    ? 'border-red-400 ring-1 ring-red-400'
                    : ''
                }
                required
              />
              <span
                className={`
                  checkbox-title
                  ${showTermsValidation && !termsAndConditions ? 'text-red-300' : ''}
                `}
              >
                Acepto los{' '}
                <a
                  href="/terminos"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="
                    text-[#22C4D3]
                    hover:underline
                  "
                  onClick={(e) => e.stopPropagation()}
                >
                  términos y condiciones
                </a>{' '}
                y la{' '}
                <a
                  href="/privacidad"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="
                    text-[#22C4D3]
                    hover:underline
                  "
                  onClick={(e) => e.stopPropagation()}
                >
                  política de privacidad
                </a>
              </span>
            </label>
            {showTermsValidation && errors.termsAndConditions && (
              <span className="error-message text-center text-[10px]">
                Debe aceptar los términos y condiciones y la política de
                privacidad
              </span>
            )}
          </>
        )}
      </div>
      <button
        type="button"
        className={`
          checkout-btn
          ${isInlineCompactCard ? 'checkout-btn--inline' : ''}
          ${shouldDisableSubmitButton ? 'cursor-not-allowed opacity-50' : ''}
        `}
        onClick={onSubmitAction}
        disabled={shouldDisableSubmitButton}
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
          <>
            {isInlineCompactCard ? <FaRegCreditCard /> : null}
            <span>{submitLabel}</span>
            {isInlineCompactCard ? <FaArrowUpRightFromSquare /> : null}
          </>
        )}
      </button>
      {isInlineCompactCard ? (
        <>
          <p
            className="
              flex items-center justify-center gap-1.5 text-center text-[11px]
              text-[#94A3B8]
            "
          >
            <GoShieldCheck className="size-3.5 text-green-400" />
            {isInlinePlanCard
              ? 'Pago seguro · Payu · Datos encriptados'
              : 'Pago seguro · Payu · Datos encriptados'}
          </p>
        </>
      ) : null}
    </div>
  );
}
