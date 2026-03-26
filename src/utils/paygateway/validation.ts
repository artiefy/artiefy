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

  // Validar número telefónico internacional (E.164): + y entre 7 y 15 dígitos
  const phonePattern = /^\+\d{7,15}$/;

  if (!phonePattern.test(telephone)) {
    errors.telephone = 'Ingresa tu telefono';
  }
  if (!termsAndConditions || !privacyPolicy) {
    errors.termsAndConditions =
      'Debe aceptar los términos y condiciones y la política de privacidad';
    errors.privacyPolicy =
      'Debe aceptar los términos y condiciones y la política de privacidad';
  }

  return errors;
}
