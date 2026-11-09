import crypto from 'crypto';

import { env } from '~/env'; // Importar correctamente las variables de entorno
import { resolvePayUMode } from '~/utils/paygateway/auth';

interface PaymentData {
  merchant_id: string;
  reference_sale: string;
  value: string;
  currency: string;
  state_pol: string;
  sign: string;
}

export function resolveApiKeyForSignature(merchantId: string): string {
  // PayU's sandbox credentials are public, so in production a signature made
  // with the test merchant/key must never validate. Only the production
  // merchant and its key are accepted there.
  if (resolvePayUMode() === 'production') {
    const prodMerchantId = env.PAYU_PROD_MERCHANT_ID?.trim();
    const prodApiKey = env.PAYU_PROD_API_KEY?.trim();

    if (!prodMerchantId || !prodApiKey || merchantId !== prodMerchantId) {
      // Random per call, so no signature (not even one built from a public
      // key) can ever match, and callers keep a plain string contract.
      return crypto.randomBytes(32).toString('hex');
    }

    return prodApiKey;
  }

  const testMerchantId = env.PAYU_TEST_MERCHANT_ID;

  if (
    testMerchantId &&
    merchantId === testMerchantId &&
    env.PAYU_TEST_API_KEY
  ) {
    return env.PAYU_TEST_API_KEY;
  }

  if (env.PAYU_TEST_API_KEY) {
    return env.PAYU_TEST_API_KEY;
  }

  return env.API_KEY;
}

// ✅ Formatear correctamente el monto según las reglas de PayU
export function formatValueForSignature(value: string): string {
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

  return generatedSignature.toLowerCase() === receivedSignature.toLowerCase();
}
