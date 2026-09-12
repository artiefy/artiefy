import type { FormData as PayUFormData } from '~/types/payu';

/**
 * Hands the buyer off to PayU's hosted WebCheckout.
 *
 * PayU's WebCheckout only accepts a real form POST, not fetch, so the fields
 * are materialized into a hidden form and submitted. This is the PSE path:
 * from here on PayU owns the payment screens and the result page, which is why
 * the modal's steps 3 and 4 never render for that method.
 */

export type WebCheckoutPaymentType = 'course' | 'plan' | 'guidedProject';

const GENERATE_ENDPOINTS: Record<WebCheckoutPaymentType, string> = {
  course: '/api/generateCoursePayment',
  plan: '/api/generatePaymentData',
  guidedProject: '/api/generateGuidedProjectPayment',
};

const DEFAULT_CHECKOUT_URL =
  'https://checkout.payulatam.com/ppp-web-gateway-payu/';

export interface WebCheckoutRequest {
  paymentType: WebCheckoutPaymentType;
  productId: number;
  amount: string;
  description: string;
  buyerEmail: string;
  buyerFullName: string;
  telephone: string;
}

export async function redirectToWebCheckout(
  request: WebCheckoutRequest
): Promise<void> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(GENERATE_ENDPOINTS[request.paymentType], {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: request.productId,
        amount: request.amount,
        description: request.description,
        buyerEmail: request.buyerEmail,
        buyerFullName: request.buyerFullName,
        telephone: request.telephone,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error('No se pudo generar el pago. Intenta de nuevo.');
    }

    const data = (await response.json()) as PayUFormData & {
      checkoutUrl?: string;
    };
    const { checkoutUrl, ...fields } = data;

    const form = document.createElement('form');
    form.method = 'POST';
    // The server resolves the checkout URL from the same PayU mode it used to
    // sign the transaction, so credentials and environment never diverge.
    form.action =
      checkoutUrl ?? process.env.NEXT_PUBLIC_PAYU_URL ?? DEFAULT_CHECKOUT_URL;

    for (const [name, value] of Object.entries(fields)) {
      const hidden = document.createElement('input');
      hidden.type = 'hidden';
      hidden.name = name;
      hidden.value = String(value);
      form.appendChild(hidden);
    }

    document.body.appendChild(form);
    form.submit();
  } finally {
    window.clearTimeout(timeoutId);
  }
}
