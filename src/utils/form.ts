import { type FormData, type Auth, type Product } from '~/types/payu';
import { calculateMD5 } from './signature';
import { generateReferenceCode } from './referenceCode';

// Función que crea los datos del formulario utilizando los parámetros proporcionados
export function createFormData(
  auth: Auth,
  product: Product,
  buyerEmail: string,
  buyerFullName: string,
  telephone: string,
  responseUrl: string,
  confirmationUrl: string
): FormData {
  const referenceCode = generateReferenceCode();
  const amount = product.amount;
  const currency = 'COP';

  const signature = calculateMD5(
    auth.apiKey,
    auth.merchantId,
    referenceCode,
    amount,
    currency
  );

  return {
    merchantId: auth.merchantId,
    accountId: auth.accountId,
    description: product.description,
    referenceCode: referenceCode,
    amount: amount,
    tax: '3193', // Estos valores pueden ser ajustados según sea necesario
    taxReturnBase: '16806', // Estos valores pueden ser ajustados según sea necesario
    currency: currency,
    signature: signature,
    test: '0',
    buyerEmail: buyerEmail,
    buyerFullName: buyerFullName,
    telephone: telephone,
    responseUrl: responseUrl,
    confirmationUrl: confirmationUrl,
  };
}
