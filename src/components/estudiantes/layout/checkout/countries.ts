/** Dial codes offered by the checkout phone field, Colombia first. */
export interface CheckoutCountry {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
  /** Digits expected after the dial code, used only to size the input hint. */
  example: string;
}

export const CHECKOUT_COUNTRIES: CheckoutCountry[] = [
  {
    code: 'CO',
    name: 'Colombia',
    dialCode: '+57',
    flag: '🇨🇴',
    example: '300 123 4567',
  },
  {
    code: 'MX',
    name: 'México',
    dialCode: '+52',
    flag: '🇲🇽',
    example: '55 1234 5678',
  },
  {
    code: 'AR',
    name: 'Argentina',
    dialCode: '+54',
    flag: '🇦🇷',
    example: '11 2345 6789',
  },
  {
    code: 'CL',
    name: 'Chile',
    dialCode: '+56',
    flag: '🇨🇱',
    example: '9 1234 5678',
  },
  {
    code: 'PE',
    name: 'Perú',
    dialCode: '+51',
    flag: '🇵🇪',
    example: '912 345 678',
  },
  {
    code: 'EC',
    name: 'Ecuador',
    dialCode: '+593',
    flag: '🇪🇨',
    example: '99 123 4567',
  },
  {
    code: 'VE',
    name: 'Venezuela',
    dialCode: '+58',
    flag: '🇻🇪',
    example: '412 1234567',
  },
  {
    code: 'PA',
    name: 'Panamá',
    dialCode: '+507',
    flag: '🇵🇦',
    example: '6123 4567',
  },
  {
    code: 'CR',
    name: 'Costa Rica',
    dialCode: '+506',
    flag: '🇨🇷',
    example: '8123 4567',
  },
  {
    code: 'ES',
    name: 'España',
    dialCode: '+34',
    flag: '🇪🇸',
    example: '612 345 678',
  },
  {
    code: 'US',
    name: 'Estados Unidos',
    dialCode: '+1',
    flag: '🇺🇸',
    example: '201 555 0123',
  },
];

export const DEFAULT_CHECKOUT_COUNTRY = CHECKOUT_COUNTRIES[0]!;

export function findCountryByDialCode(dialCode: string): CheckoutCountry {
  return (
    CHECKOUT_COUNTRIES.find((country) => country.dialCode === dialCode) ??
    DEFAULT_CHECKOUT_COUNTRY
  );
}
