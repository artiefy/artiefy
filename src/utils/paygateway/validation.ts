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

	// Ensure the telephone number follows the structure +000000000000
	const phonePattern = /^\+\d{12}$/;

	if (!phonePattern.test(telephone)) {
		errors.telephone = 'Formato de teléfono inválido. Debe ser +000000000000.';
	}
	if (!termsAndConditions || !privacyPolicy) {
		errors.termsAndConditions =
			'Debe aceptar los términos y condiciones y la política de privacidad';
		errors.privacyPolicy =
			'Debe aceptar los términos y condiciones y la política de privacidad';
	}

	return errors;
}
