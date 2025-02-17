import { type Product } from '~/types/payu';
import { plansPersonas, plansEmpresas, type Plan } from '~/types/plans';
import { generateReferenceCode } from '~/utils/referenceCode';

// Creación de los productos (planes de suscripción)
export const products: Product[] = [
	...plansPersonas.map((plan) => createProduct(plan)),
	...plansEmpresas.map((plan) => createProduct(plan)),
];

// Función para crear un producto con una referencia única
function createProduct(plan: Plan): Product {
	let amount = '100000'; // Default amount
	if (plan.name === 'Pro') {
		amount = '100000';
	} else if (plan.name === 'Premium') {
		amount = '150000';
	} else if (plan.name === 'Enterprise') {
		amount = '200000';
	}

	return {
		id: plan.id,
		name: plan.name,
		amount: amount,
		description: `Plan ${plan.name} mensual`,
		referenceCode: generateReferenceCode(),
	};
}

// Función para obtener un producto por su ID
export function getProductById(productId: number): Product | undefined {
	return products.find((product) => product.id === productId);
}
