import { env } from '~/env';
import { type Auth } from '~/types/payu';

function resolvePayUMode(): 'sandbox' | 'production' {
  if (env.PAYU_MODE) return env.PAYU_MODE;

  // Heurística segura: en desarrollo o checkout sandbox, usar sandbox.
  const isLocalRuntime = env.NODE_ENV !== 'production';
  const isSandboxCheckout = env.NEXT_PUBLIC_PAYU_URL.includes('sandbox');

  return isLocalRuntime || isSandboxCheckout ? 'sandbox' : 'production';
}

// Función para obtener las variables de entorno para la autenticación
export function getAuthConfig(): Auth {
  const mode = resolvePayUMode();

  const merchantId =
    mode === 'sandbox'
      ? (env.PAYU_TEST_MERCHANT_ID ?? env.MERCHANT_ID)
      : (env.PAYU_PROD_MERCHANT_ID ?? env.MERCHANT_ID);
  const accountId =
    mode === 'sandbox'
      ? (env.PAYU_TEST_ACCOUNT_ID ?? env.ACCOUNT_ID)
      : (env.PAYU_PROD_ACCOUNT_ID ?? env.ACCOUNT_ID);
  const apiLogin =
    mode === 'sandbox'
      ? (env.PAYU_TEST_API_LOGIN ?? env.API_LOGIN)
      : (env.PAYU_PROD_API_LOGIN ?? env.API_LOGIN);
  const apiKey =
    mode === 'sandbox'
      ? (env.PAYU_TEST_API_KEY ?? env.API_KEY)
      : (env.PAYU_PROD_API_KEY ?? env.API_KEY);

  if (!merchantId || !accountId || !apiLogin || !apiKey) {
    throw new Error('Missing authentication configuration');
  }

  console.log('PayU config loaded:', {
    mode,
    merchantId,
    accountId,
    apiLogin,
  });

  return {
    merchantId,
    accountId,
    apiLogin,
    apiKey,
  };
}
