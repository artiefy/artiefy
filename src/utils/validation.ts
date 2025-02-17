interface ValidationErrors {
	buyerEmail?: string;
	buyerFullName?: string;
	telephone?: string;
}

export function validateFormData(
	buyerEmail: string,
	buyerFullName: string,
	telephone: string
): ValidationErrors {
	const errors: ValidationErrors = {};

	const emailPattern = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
	const namePattern = /^[a-zA-Z\s]+$/;
	const phonePattern = /^\+57\s[0-9]{10}$/;

	if (!emailPattern.test(buyerEmail)) {
		errors.buyerEmail =
			'El correo electrónico es obligatorio y debe contener @.';
	}
	if (!namePattern.test(buyerFullName)) {
		errors.buyerFullName =
			'El nombre completo es obligatorio y debe contener solo letras.';
	}
	if (!phonePattern.test(telephone)) {
		errors.telephone =
			'El teléfono es obligatorio y debe seguir el formato +57 3113333332.';
	}

	return errors;
}
