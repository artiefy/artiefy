import crypto from 'crypto';

import { type Auth, type PayUMode } from '~/types/payu';

import { type PayUCardNetwork } from './cardFormat';
import { calculateSignature } from './signature';

export {
  detectCardNetwork,
  isValidCardNumber,
  normalizeCardNumber,
  toPayUExpirationDate,
  type PayUCardNetwork,
} from './cardFormat';

/**
 * PayU Payments API client for card charges.
 *
 * Two calls, in order:
 *  1. `CREATE_TOKEN` exchanges the raw PAN for a `creditCardTokenId`.
 *  2. `SUBMIT_TRANSACTION` charges that token.
 *
 * The raw PAN and the security code exist only inside a single request on the
 * server; nothing here writes them to the database or to a log line. The
 * WebCheckout path (see `./form.ts`) stays the default for PSE, where PayU
 * hosts the form and no card data reaches us at all.
 *
 * Docs: https://developers.payulatam.com/latam/en/docs/integrations/api-integration/tokenization-api.html
 */

const PAYMENTS_API_URLS: Record<PayUMode, string> = {
  sandbox: 'https://sandbox.api.payulatam.com/payments-api/4.0/service.cgi',
  production: 'https://api.payulatam.com/payments-api/4.0/service.cgi',
};

export function getPaymentsApiUrl(mode: PayUMode): string {
  return PAYMENTS_API_URLS[mode];
}

interface PayUTokenResponse {
  code: string;
  error: string | null;
  creditCardToken?: {
    creditCardTokenId: string;
    name: string;
    payerId: string;
    maskedNumber: string;
    paymentMethod: string;
    errorDescription?: string;
  };
}

interface PayUTransactionResponse {
  code: string;
  error: string | null;
  transactionResponse?: {
    orderId?: number;
    transactionId?: string;
    state?: string;
    responseCode?: string;
    responseMessage?: string;
    paymentNetworkResponseErrorMessage?: string;
    pendingReason?: string;
  };
}

// PayU marks buyer/payer addresses as mandatory even for digital goods, which
// we never ship. A fixed Bogota address keeps the contract satisfied without
// asking the buyer for data the product does not need.
const DEFAULT_ADDRESS = {
  street1: 'Calle 1 # 1-1',
  city: 'Bogota',
  state: 'Bogota D.C.',
  country: 'CO',
  postalCode: '000000',
} as const;

/**
 * PayU's fraud engine wants a device fingerprint. We derive it from a random
 * per-request id plus the buyer's user agent, which is what PayU's own
 * examples do when their JS collector is not embedded.
 */
export function buildDeviceSessionId(userAgent: string): string {
  const sessionId = crypto.randomBytes(16).toString('hex');
  return crypto
    .createHash('md5')
    .update(`${sessionId}${userAgent}`)
    .digest('hex');
}

async function postToPayU<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
    // PayU can sit on a card authorization for a while; failing earlier than
    // the gateway would leave us unsure whether the buyer was charged.
    signal: AbortSignal.timeout(45_000),
  });

  if (!response.ok) {
    throw new Error(`PayU respondio ${response.status}`);
  }

  return (await response.json()) as T;
}

export interface CreateTokenInput {
  auth: Auth;
  cardNumber: string;
  holderName: string;
  /** `YYYY/MM`. */
  expirationDate: string;
  documentNumber: string;
  /** Stable per-buyer id so PayU can group tokens. */
  payerId: string;
  network: PayUCardNetwork;
}

export interface CreateTokenResult {
  creditCardTokenId: string;
  maskedNumber: string;
}

export async function createCreditCardToken(
  input: CreateTokenInput
): Promise<CreateTokenResult> {
  const payload = {
    language: 'es',
    command: 'CREATE_TOKEN',
    merchant: {
      apiLogin: input.auth.apiLogin,
      apiKey: input.auth.apiKey,
    },
    creditCardToken: {
      payerId: input.payerId,
      name: input.holderName,
      identificationNumber: input.documentNumber,
      paymentMethod: input.network,
      number: input.cardNumber,
      expirationDate: input.expirationDate,
    },
  };

  const data = await postToPayU<PayUTokenResponse>(
    getPaymentsApiUrl(input.auth.mode),
    payload
  );

  if (data.code !== 'SUCCESS' || !data.creditCardToken?.creditCardTokenId) {
    throw new Error(
      data.creditCardToken?.errorDescription ??
        data.error ??
        'No pudimos validar los datos de la tarjeta.'
    );
  }

  return {
    creditCardTokenId: data.creditCardToken.creditCardTokenId,
    maskedNumber: data.creditCardToken.maskedNumber,
  };
}

export interface SubmitTokenizedTransactionInput {
  auth: Auth;
  creditCardTokenId: string;
  securityCode: string;
  network: PayUCardNetwork;
  installments: number;
  referenceCode: string;
  description: string;
  /** COP, integer. PayU rejects decimals for this currency. */
  amount: number;
  notifyUrl: string;
  buyerEmail: string;
  buyerFullName: string;
  buyerPhone: string;
  documentNumber: string;
  payerId: string;
  ipAddress: string;
  userAgent: string;
  deviceSessionId: string;
}

export interface SubmitTokenizedTransactionResult {
  state: string;
  responseCode: string;
  responseMessage: string;
  orderId?: number;
  transactionId?: string;
}

export async function submitTokenizedTransaction(
  input: SubmitTokenizedTransactionInput
): Promise<SubmitTokenizedTransactionResult> {
  const currency = 'COP';

  // Same tax split the WebCheckout path uses (see `createFormData`), so a card
  // charge and a PSE charge for the same product report identically to PayU.
  const tax = Math.round(input.amount * 0.19);
  const taxReturnBase = input.amount - tax;

  // Signed with the same helper and the same two-decimal formatting as the
  // WebCheckout form, which is the formatting this merchant account already
  // validates against in production.
  const signature = calculateSignature(
    input.auth.apiKey,
    input.auth.merchantId,
    input.referenceCode,
    input.amount.toFixed(2),
    currency
  );

  const person = {
    fullName: input.buyerFullName,
    emailAddress: input.buyerEmail,
    contactPhone: input.buyerPhone,
    dniNumber: input.documentNumber,
  };

  const payload = {
    language: 'es',
    command: 'SUBMIT_TRANSACTION',
    merchant: {
      apiLogin: input.auth.apiLogin,
      apiKey: input.auth.apiKey,
    },
    transaction: {
      order: {
        accountId: input.auth.accountId,
        referenceCode: input.referenceCode,
        description: input.description,
        language: 'es',
        signature,
        // PENDING card transactions are resolved asynchronously by the same
        // webhook the WebCheckout flow already uses.
        notifyUrl: input.notifyUrl,
        additionalValues: {
          TX_VALUE: { value: input.amount, currency },
          TX_TAX: { value: tax, currency },
          TX_TAX_RETURN_BASE: { value: taxReturnBase, currency },
        },
        buyer: {
          merchantBuyerId: input.payerId,
          ...person,
          shippingAddress: { ...DEFAULT_ADDRESS, phone: input.buyerPhone },
        },
        shippingAddress: { ...DEFAULT_ADDRESS, phone: input.buyerPhone },
      },
      payer: {
        merchantPayerId: input.payerId,
        ...person,
        dniType: 'CC',
        billingAddress: { ...DEFAULT_ADDRESS, phone: input.buyerPhone },
      },
      creditCardTokenId: input.creditCardTokenId,
      creditCard: { securityCode: input.securityCode },
      extraParameters: { INSTALLMENTS_NUMBER: input.installments },
      type: 'AUTHORIZATION_AND_CAPTURE',
      paymentMethod: input.network,
      paymentCountry: 'CO',
      deviceSessionId: input.deviceSessionId,
      ipAddress: input.ipAddress,
      cookie: input.deviceSessionId,
      userAgent: input.userAgent,
    },
    test: input.auth.mode === 'sandbox',
  };

  const data = await postToPayU<PayUTransactionResponse>(
    getPaymentsApiUrl(input.auth.mode),
    payload
  );

  if (data.code !== 'SUCCESS' || !data.transactionResponse) {
    throw new Error(data.error ?? 'PayU rechazo la transaccion.');
  }

  const tx = data.transactionResponse;

  return {
    state: tx.state ?? 'ERROR',
    responseCode: tx.responseCode ?? '',
    responseMessage:
      tx.responseMessage ??
      tx.paymentNetworkResponseErrorMessage ??
      tx.pendingReason ??
      '',
    orderId: tx.orderId,
    transactionId: tx.transactionId,
  };
}
