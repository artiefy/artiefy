import { type Product } from '~/types/payu';
import { type Plan,plansEmpresas, plansPersonas } from '~/types/plans';

// 1. Primero definir las constantes
const PLAN_IDENTIFIERS = {
	PRO: 'plan_pro_',
	PREMIUM: 'plan_premium_',
	ENTERPRISE: 'plan_enterprise_',
} as const;

// ✅ Función para definir el precio de cada plan
function getPlanAmount(planName: string): string {
	switch (planName) {
		case 'Pro':
			return '99800.00';
		case 'Premium':
			return '100.00';
		case 'Enterprise':
			return '200000.00';
		default:
			return '99800.00'; // Default en caso de un plan desconocido
	}
}

// ✅ Función para crear un producto correctamente (sin referenceCode)
export function createProduct(plan: Plan): Product {
	const identifier =
		plan.name === 'Premium'
			? `${PLAN_IDENTIFIERS.PREMIUM}`
			: plan.name === 'Enterprise'
				? `${PLAN_IDENTIFIERS.ENTERPRISE}`
				: `${PLAN_IDENTIFIERS.PRO}`;

	const name = `${identifier}${plan.name}`;
	console.log('Creating product with name:', name); // Debug log

	return {
		id: plan.id,
		name,
		amount: getPlanAmount(plan.name), // ✅ Se obtiene el precio del plan
		description: `Plan ${plan.name} mensual`,
	};
}

// ✅ Creación de los productos (planes de suscripción)
export const products: Product[] = [
	...plansPersonas.map(createProduct),
	...plansEmpresas.map(createProduct),
];

// Añadir función para crear producto de curso individual
export function createProductFromCourse(course: {
	id: number;
	title: string;
	individualPrice: number | null;
}): Product {
	return {
		id: course.id,
		name: `Curso: ${course.title}`,
		amount: (course.individualPrice ?? 0).toFixed(2),
		description: course.title,
	};
}

// ✅ Función para obtener un producto por su ID
export function getProductById(productId: number): Product | undefined {
	if (!productId || isNaN(productId)) return undefined; // ✅ Validación extra
	return products.find((product) => product.id === productId);
}
