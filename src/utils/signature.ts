import crypto from 'crypto';

// Función para calcular el hash MD5
export function calculateMD5(apiKey: string, merchantId: string, referenceCode: string, amount: string, currency: string): string {
  const data = `${apiKey}~${merchantId}~${referenceCode}~${amount}~${currency}`;
  return crypto.createHash('md5').update(data).digest('hex');
}
