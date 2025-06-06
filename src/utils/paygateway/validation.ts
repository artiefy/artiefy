interface ValidationErrors {
  telephone?: string;
  termsAndConditions?: string;
  privacyPolicy?: string;
}

export function validateFormData(
  telephone: string,
  termsAndConditions: boolean,
  privacyPolicy: boolean
): ValidationErrors {
  const errors: ValidationErrors = {};

  // Validar número telefónico: +XXXXXXXXXXX (donde X son dígitos y el código de país puede ser 1-3 dígitos)
  const phonePattern = /^\+\d{1,3}\d{10}$/;

  if (!phonePattern.test(telephone)) {
    errors.telephone = 'Formato de teléfono inválido. Debe ser +573000000000';
  }
  if (!termsAndConditions || !privacyPolicy) {
    errors.termsAndConditions =
      'Debe aceptar los términos y condiciones y la política de privacidad';
    errors.privacyPolicy =
      'Debe aceptar los términos y condiciones y la política de privacidad';
  }

  return errors;
}
