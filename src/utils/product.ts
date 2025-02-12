import { type Product } from '~/types/payu';
import { generateReferenceCode } from '~/utils/referenceCode';

// Creación de los productos (planes de suscripción)
export const products: Product[] = [
	{
		id: 1,
		name: 'Pro',
		amount: '100000',
		description: 'Plan Pro mensual',
		referenceCode: generateReferenceCode(),
	},
	{
		id: 2,
		name: 'Premium',
		amount: '150000',
		description: 'Plan Premium mensual',
		referenceCode: generateReferenceCode(),
	},
	{
		id: 3,
		name: 'Enterprise',
		amount: '200000',
		description: 'Plan Enterprise mensual',
		referenceCode: generateReferenceCode(),
	},
];

// Función para obtener un producto por su ID
export function getProductById(productId: number): Product | undefined {
	return products.find((product) => product.id === productId);
}
