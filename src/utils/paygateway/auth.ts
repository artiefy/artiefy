import { env } from '~/env';
import { type Auth, type PayUMode } from '~/types/payu';

const CHECKOUT_URLS: Record<PayUMode, string> = {
  sandbox: 'https://sandbox.checkout.payulatam.com/ppp-web-gateway-payu/',
  production: 'https://checkout.payulatam.com/ppp-web-gateway-payu/',
};

export function getCheckoutUrl(mode: PayUMode): string {
  return CHECKOUT_URLS[mode];
}

function resolvePayUMode(): PayUMode {
  // Outside a production runtime nothing may charge a real card, so sandbox is
  // forced here and PAYU_MODE cannot override it. Without this, a single stray
  // `PAYU_MODE=production` in a local .env turns every checkout on a developer
  // machine into a live charge, with `test: '0'` on the WebCheckout form and
  // `test: false` on the Payments API.
  if (env.NODE_ENV !== 'production') return 'sandbox';

  if (env.PAYU_MODE) return env.PAYU_MODE;

  // Heurística segura: si el checkout apunta al sandbox, usar sandbox.
  return env.NEXT_PUBLIC_PAYU_URL.includes('sandbox')
    ? 'sandbox'
    : 'production';
}

/**
 * PayU's public demo credentials, published in their documentation. They must
 * never be used in production mode: charges made with them are not settled to
 * any real merchant account, and the matching API key is public, so signatures
 * built from it can be forged by anyone.
 */
const PAYU_DEMO_MERCHANT_ID = '508029';
const PAYU_DEMO_ACCOUNT_ID = '512321';
const PAYU_DEMO_API_LOGIN = 'pRRXKOl8ikMmt9u';
const PAYU_DEMO_API_KEY = '4Vj8eK4rloUd272L48hsrarnUA';

function nonEmpty(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

// Función para obtener las variables de entorno para la autenticación
export function getAuthConfig(): Auth {
  const mode = resolvePayUMode();
  const isProduction = mode === 'production';

  // In production the dedicated PAYU_PROD_* variables are required. Falling
  // back to the generic ones would silently charge real cards against whatever
  // credentials happen to be there — including the demo ones.
  const merchantId = isProduction
    ? nonEmpty(env.PAYU_PROD_MERCHANT_ID)
    : (nonEmpty(env.PAYU_TEST_MERCHANT_ID) ?? nonEmpty(env.MERCHANT_ID));
  const accountId = isProduction
    ? nonEmpty(env.PAYU_PROD_ACCOUNT_ID)
    : (nonEmpty(env.PAYU_TEST_ACCOUNT_ID) ?? nonEmpty(env.ACCOUNT_ID));
  const apiLogin = isProduction
    ? nonEmpty(env.PAYU_PROD_API_LOGIN)
    : (nonEmpty(env.PAYU_TEST_API_LOGIN) ?? nonEmpty(env.API_LOGIN));
  const apiKey = isProduction
    ? nonEmpty(env.PAYU_PROD_API_KEY)
    : (nonEmpty(env.PAYU_TEST_API_KEY) ?? nonEmpty(env.API_KEY));

  if (!merchantId || !accountId || !apiLogin || !apiKey) {
    throw new Error(
      isProduction
        ? 'Missing PayU production credentials: PAYU_PROD_MERCHANT_ID, PAYU_PROD_ACCOUNT_ID, PAYU_PROD_API_LOGIN and PAYU_PROD_API_KEY are all required when PAYU_MODE=production.'
        : 'Missing authentication configuration'
    );
  }

  if (
    isProduction &&
    (merchantId === PAYU_DEMO_MERCHANT_ID ||
      accountId === PAYU_DEMO_ACCOUNT_ID ||
      apiLogin === PAYU_DEMO_API_LOGIN ||
      apiKey === PAYU_DEMO_API_KEY)
  ) {
    throw new Error(
      'Refusing to run PayU in production mode with its public demo credentials. Set real PAYU_PROD_* values.'
    );
  }

  console.log('PayU config loaded:', {
    mode,
    merchantId,
    accountId,
  });

  return {
    merchantId,
    accountId,
    apiLogin,
    apiKey,
    mode,
  };
}
