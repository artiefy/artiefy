interface ValidationErrors {
  telephone?: string
  termsAndConditions?: string
  privacyPolicy?: string
}

export function validateFormData(
  telephone: string,
  termsAndConditions: boolean,
  privacyPolicy: boolean,
): ValidationErrors {
  const errors: ValidationErrors = {}

  const phonePattern = /^\+\d{1,3}\s\d{10}$/

  if (!phonePattern.test(telephone) || telephone.length !== 14) {
    errors.telephone = "Formato de teléfono inválido."
  }
  if (!termsAndConditions || !privacyPolicy) {
    errors.termsAndConditions = "Debe aceptar los términos y condiciones y la política de privacidad"
    errors.privacyPolicy = "Debe aceptar los términos y condiciones y la política de privacidad"
  }

  return errors
}

