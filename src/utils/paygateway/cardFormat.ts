/**
 * Card helpers shared by the checkout form and the payment route.
 *
 * Kept free of Node built-ins on purpose: the client bundle imports this to
 * validate before spending a PayU call, while the server imports the same
 * functions so both sides agree on what a valid card looks like.
 */

/** PayU's card network names. `paymentMethod` must be one of these. */
export type PayUCardNetwork =
  'VISA' | 'MASTERCARD' | 'AMEX' | 'DINERS' | 'CODENSA';

/** Digits only, so spaces and dashes typed by the buyer never reach PayU. */
export function normalizeCardNumber(input: string): string {
  return input.replace(/\D/g, '');
}

/** Luhn checksum. Catches typos locally instead of spending a PayU call. */
export function isValidCardNumber(input: string): boolean {
  const digits = normalizeCardNumber(input);
  if (digits.length < 13 || digits.length > 19) return false;

  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let value = Number(digits[i]);
    if (double) {
      value *= 2;
      if (value > 9) value -= 9;
    }
    sum += value;
    double = !double;
  }

  return sum % 10 === 0;
}

/**
 * Resolves the card network from its BIN.
 *
 * PayU needs `paymentMethod` explicitly; it does not infer it from the token.
 */
export function detectCardNetwork(input: string): PayUCardNetwork | null {
  const digits = normalizeCardNumber(input);
  if (digits.length < 6) return null;

  if (/^4/.test(digits)) return 'VISA';
  if (/^3[47]/.test(digits)) return 'AMEX';
  if (/^3(?:0[0-5]|[68])/.test(digits)) return 'DINERS';
  if (/^5[1-5]/.test(digits)) return 'MASTERCARD';
  // Mastercard's 2-series range, live since 2017.
  if (/^2(?:2[2-9]|[3-6]|7[01]|720)/.test(digits)) return 'MASTERCARD';

  return null;
}

/**
 * Converts the `MM/YY` the buyer types into the `YYYY/MM` PayU expects.
 * Returns null when the date is malformed or already past.
 */
export function toPayUExpirationDate(expiry: string): string | null {
  const match = /^(\d{2})\s*\/\s*(\d{2}|\d{4})$/.exec(expiry.trim());
  if (!match) return null;

  const month = Number(match[1]);
  if (month < 1 || month > 12) return null;

  const rawYear = match[2]!;
  const year = rawYear.length === 2 ? 2000 + Number(rawYear) : Number(rawYear);

  // A card is valid through the last day of its expiration month.
  const expiresAt = new Date(year, month, 1);
  if (expiresAt.getTime() <= Date.now()) return null;

  return `${year}/${String(month).padStart(2, '0')}`;
}

/** Groups digits for display: `4111 1111 1111 1111`. AMEX uses 4-6-5. */
export function formatCardNumberForDisplay(input: string): string {
  const digits = normalizeCardNumber(input).slice(0, 19);
  const network = detectCardNetwork(digits);

  if (network === 'AMEX') {
    return [digits.slice(0, 4), digits.slice(4, 10), digits.slice(10, 15)]
      .filter(Boolean)
      .join(' ');
  }

  return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
}

/** Reformats free typing into `MM/YY` as the buyer goes. */
export function formatExpiryForDisplay(input: string): string {
  const digits = input.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

/** Security code length required by the network. AMEX asks for four. */
export function securityCodeLength(network: PayUCardNetwork | null): number {
  return network === 'AMEX' ? 4 : 3;
}
