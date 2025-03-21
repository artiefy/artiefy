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

	// Ensure the telephone number follows the structure +00 0000000000
	const phonePattern = /^\+57\s3\d{9}$/;

	if (!phonePattern.test(telephone)) {
		errors.telephone = 'Formato de teléfono inválido. Debe ser +00 0000000000.';
	}
	if (!termsAndConditions || !privacyPolicy) {
		errors.termsAndConditions =
			'Debe aceptar los términos y condiciones y la política de privacidad';
		errors.privacyPolicy =
			'Debe aceptar los términos y condiciones y la política de privacidad';
	}

	return errors;
}
