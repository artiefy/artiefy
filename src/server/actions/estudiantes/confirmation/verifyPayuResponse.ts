'use server';

import crypto from 'crypto';

import {
  formatValueForSignature,
  resolveApiKeyForSignature,
} from '~/utils/paygateway/verifySignature';

export interface PayuResponseParams {
  merchantId: string;
  referenceCode: string;
  txValue: string;
  currency: string;
  transactionState: string;
  signature: string;
}

/**
 * Verifies the PayU WebCheckout response-URL signature so the thank-you pages
 * can only be reached after a genuine, PayU-approved redirect — never by typing
 * the URL manually (the `signature` cannot be forged without the merchant apiKey).
 *
 * Response signature = MD5(apiKey~merchantId~referenceCode~newValue~currency~transactionState)
 * transactionState '4' means APPROVED.
 */
export async function verifyPayuResponse(
  params: PayuResponseParams
): Promise<{ valid: boolean; approved: boolean }> {
  const {
    merchantId,
    referenceCode,
    txValue,
    currency,
    transactionState,
    signature,
  } = params;

  if (
    !merchantId ||
    !referenceCode ||
    !txValue ||
    !currency ||
    !transactionState ||
    !signature
  ) {
    return { valid: false, approved: false };
  }

  const apiKey = resolveApiKeyForSignature(merchantId);
  const newValue = formatValueForSignature(txValue);
  const rawSignature = [
    apiKey,
    merchantId,
    referenceCode,
    newValue,
    currency,
    transactionState,
  ].join('~');

  const expectedSignature = crypto
    .createHash('md5')
    .update(rawSignature)
    .digest('hex')
    .toLowerCase();

  const valid = expectedSignature === signature.trim().toLowerCase();

  console.log('🔐 PayU response signature check:', {
    merchantId,
    referenceCode,
    transactionState,
    valid,
    expectedPrefix: expectedSignature.slice(0, 8),
    receivedPrefix: signature.trim().toLowerCase().slice(0, 8),
  });

  // transactionState '4' = APPROVED in the PayU response URL.
  return { valid, approved: valid && transactionState.trim() === '4' };
}
