// Shared contract between the multi-step checkout modal and the tokenized
// payment route. Kept apart from `~/types/payu` because these shapes describe
// what the UI collects, not what PayU receives.

/** What the buyer picked on step 1. */
export type CheckoutPurchaseKind = 'unit' | 'subscription';

/**
 * How the buyer pays.
 *
 * - `card`: charged server-to-server through PayU's tokenization API, so the
 *   buyer never leaves the modal.
 * - `pse`: handed off to the PayU WebCheckout form, which owns steps 3 and 4.
 */
export type CheckoutPaymentMethod = 'card' | 'pse';

export type CheckoutStep = 1 | 2 | 3 | 4;

/** One purchasable thing shown on step 1. */
export interface CheckoutItem {
  /** Course id for a unit purchase, plan id for a subscription. */
  id: number;
  title: string;
  /** Instructor plus category, or the plan tagline. */
  subtitle: string;
  /** Amount in COP. PayU rejects decimals for this currency. */
  amount: number;
  imageUrl?: string | null;
}

/** Buyer identity collected on step 2. */
export interface CheckoutBuyer {
  firstName: string;
  secondName: string;
  firstLastName: string;
  secondLastName: string;
  email: string;
  /** Dial code including the leading `+`, e.g. `+57`. */
  dialCode: string;
  /** National number, digits only. */
  phone: string;
}

/** Card data collected on step 3. Never persisted, never logged. */
export interface CheckoutCardInput {
  number: string;
  holderName: string;
  /** `MM/YY` as typed by the buyer. */
  expiry: string;
  securityCode: string;
  /** Colombian ID number. PayU requires it to tokenize and to charge. */
  documentNumber: string;
  installments: number;
}

export type TokenizedPaymentState =
  'APPROVED' | 'DECLINED' | 'PENDING' | 'ERROR' | 'EXPIRED';

export interface TokenizedPaymentResult {
  state: TokenizedPaymentState;
  /** Buyer-facing message, already in Spanish. */
  message: string;
  orderId?: number;
  transactionId?: string;
  referenceCode?: string;
  /** Only the masked PAN ever leaves the payment route. */
  maskedNumber?: string;
}
