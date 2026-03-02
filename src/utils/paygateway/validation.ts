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

  // Validar número telefónico: +57 + 10-11 dígitos, sin espacios
  const phonePattern = /^\+57\d{10,11}$/;

  if (!phonePattern.test(telephone)) {
    errors.telephone =
      'Formato de teléfono inválido. Debe ser +57 seguido de 10 o 11 dígitos, sin espacios.';
  }
  if (!termsAndConditions || !privacyPolicy) {
    errors.termsAndConditions =
      'Debe aceptar los términos y condiciones y la política de privacidad';
    errors.privacyPolicy =
      'Debe aceptar los términos y condiciones y la política de privacidad';
  }

  return errors;
}
