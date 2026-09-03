import { env } from '~/env';
import { type Auth, type FormData, type Product } from '~/types/payu';

import { calculateSignature } from './signature';

export type PayUPaymentType = 'course' | 'plan' | 'guidedProject';

// PayU only echoes back the reference code, so it is the only field that can
// carry the product identity into the confirmation webhook. Each payment type
// owns a prefix so the confirmation routes can never claim another's sale.
export const GUIDED_PROJECT_REFERENCE_PREFIX = 'GP';

function resolveConfirmationUrl(paymentType: PayUPaymentType): string {
  if (paymentType === 'course') return env.CONFIRMATION_URL_COURSES;
  if (paymentType === 'plan') return env.CONFIRMATION_URL_PLANS;

  return (
    env.CONFIRMATION_URL_GUIDED_PROJECTS ??
    `${env.NEXT_PUBLIC_BASE_URL.replace(/\/$/, '')}/api/confirmGuidedProjectPayment`
  );
}

function buildReferenceCode(
  paymentType: PayUPaymentType,
  product: Product,
  timestamp: number
): string {
  if (paymentType === 'course') {
    // Format: C{courseId}T{timestamp}
    return `C${product.id}T${timestamp}`;
  }

  if (paymentType === 'guidedProject') {
    // Format: GP{guidedProjectId}T{timestamp}
    return `${GUIDED_PROJECT_REFERENCE_PREFIX}${product.id}T${timestamp}`;
  }

  // Incluir el nombre del plan en la referencia
  const cleanProductName = product.name.replace(/\s*Premium\s*/g, '').trim();
  return `${cleanProductName}_${timestamp}`;
}

export function createFormData(
  auth: Auth,
  product: Product,
  buyerEmail: string,
  buyerFullName: string,
  telephone: string,
  responseUrl: string,
  paymentType: PayUPaymentType
): FormData {
  // Calcular montos con precisión
  const amount = Number(product.amount);
  const formattedAmount = amount.toFixed(2);
  const tax = Math.round(amount * 0.19).toFixed(2); // 19% IVA
  const taxReturnBase = (amount - Number(tax)).toFixed(2);
  const currency = 'COP';

  // Generar referenceCode único combinando ID del producto y timestamp
  const timestamp = Date.now();
  const cleanDescription =
    paymentType === 'plan' ? `Plan ${product.name}` : product.description;
  const referenceCode = buildReferenceCode(paymentType, product, timestamp);

  // Generar signature con formato correcto
  const signature = calculateSignature(
    auth.apiKey,
    auth.merchantId,
    referenceCode,
    formattedAmount,
    currency
  );

  // Select correct confirmation URL based on payment type
  const confirmationUrl = resolveConfirmationUrl(paymentType);

  return {
    merchantId: auth.merchantId,
    accountId: auth.accountId,
    description: cleanDescription,
    referenceCode,
    amount: formattedAmount,
    tax,
    taxReturnBase,
    currency,
    signature,
    // PayU docs: test=1 marks a test transaction, test=0 a real charge
    test: auth.mode === 'sandbox' ? '1' : '0',
    buyerEmail,
    buyerFullName,
    telephone,
    responseUrl,
    confirmationUrl, // Esta URL determinará a qué endpoint se envía la confirmación
  } satisfies FormData;
}
