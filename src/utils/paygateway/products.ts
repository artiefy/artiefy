import { type Product } from '~/types/payu';
import { plansPersonas, plansEmpresas, type Plan } from '~/types/plans';

// ✅ Función para definir el precio de cada plan
function getPlanAmount(planName: string): string {
	switch (planName) {
		case 'Pro':
			return '100000.00';
		case 'Premium':
			return '150000.00';
		case 'Enterprise':
			return '200000.00';
		default:
			return '100000.00'; // Default en caso de un plan desconocido
	}
}

// ✅ Creación de los productos (planes de suscripción)
export const products: Product[] = [
	...plansPersonas.map(createProduct),
	...plansEmpresas.map(createProduct),
];

// ✅ Función para crear un producto correctamente (sin referenceCode)
function createProduct(plan: Plan): Product {
	return {
		id: plan.id,
		name: plan.name,
		amount: getPlanAmount(plan.name), // ✅ Se obtiene el precio del plan
		description: `Plan ${plan.name} mensual`,
	};
}

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
