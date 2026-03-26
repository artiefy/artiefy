import crypto from 'crypto';

import { env } from '~/env'; // Importar correctamente las variables de entorno

interface PaymentData {
  merchant_id: string;
  reference_sale: string;
  value: string;
  currency: string;
  state_pol: string;
  sign: string;
}

function resolveApiKeyForSignature(merchantId: string): string {
  const testMerchantId = env.PAYU_TEST_MERCHANT_ID;
  const prodMerchantId = env.PAYU_PROD_MERCHANT_ID;

  if (
    testMerchantId &&
    merchantId === testMerchantId &&
    env.PAYU_TEST_API_KEY
  ) {
    return env.PAYU_TEST_API_KEY;
  }

  if (
    prodMerchantId &&
    merchantId === prodMerchantId &&
    env.PAYU_PROD_API_KEY
  ) {
    return env.PAYU_PROD_API_KEY;
  }

  if (env.PAYU_MODE === 'sandbox' && env.PAYU_TEST_API_KEY) {
    return env.PAYU_TEST_API_KEY;
  }

  if (env.PAYU_MODE === 'production' && env.PAYU_PROD_API_KEY) {
    return env.PAYU_PROD_API_KEY;
  }

  return env.API_KEY;
}

// ✅ Formatear correctamente el monto según las reglas de PayU
function formatValueForSignature(value: string): string {
  const numericValue = parseFloat(value);
  return numericValue % 1 === 0
    ? numericValue.toFixed(1)
    : numericValue.toFixed(2);
}

// ✅ Calcular la firma MD5 según el formato de PayU
function calculateMD5ForVerification(paymentData: PaymentData): string {
  const formattedValue = formatValueForSignature(paymentData.value);
  const apiKey = resolveApiKeyForSignature(paymentData.merchant_id);
  const rawSignature = [
    apiKey,
    paymentData.merchant_id,
    paymentData.reference_sale,
    formattedValue,
    paymentData.currency,
    paymentData.state_pol,
  ].join('~');

  return crypto.createHash('md5').update(rawSignature).digest('hex');
}

// ✅ Función principal para verificar la firma
export function verifySignature(paymentData: PaymentData): boolean {
  if (!env.API_KEY && !env.PAYU_TEST_API_KEY && !env.PAYU_PROD_API_KEY) {
    throw new Error('❌ Error: API_KEY no está definido en el archivo .env');
  }

  const generatedSignature = calculateMD5ForVerification(paymentData).trim();
  const receivedSignature = paymentData.sign.trim();

  console.log('🔍 Signature check:', {
    merchantId: paymentData.merchant_id,
    reference: paymentData.reference_sale,
    state: paymentData.state_pol,
    generatedPrefix: generatedSignature.slice(0, 8),
    receivedPrefix: receivedSignature.slice(0, 8),
  });

  return generatedSignature.toLowerCase() === receivedSignature.toLowerCase();
}
