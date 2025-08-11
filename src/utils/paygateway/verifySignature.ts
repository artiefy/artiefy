import crypto from "crypto";

import { env } from "~/env"; // Importar correctamente las variables de entorno

interface PaymentData {
  merchant_id: string;
  reference_sale: string;
  value: string;
  currency: string;
  state_pol: string;
  sign: string;
}

// ✅ Formatear correctamente el monto según las reglas de PayU
function formatValueForSignature(value: string): string {
  const numericValue = parseFloat(value);
  return numericValue % 1 === 0
    ? numericValue.toFixed(1)
    : numericValue.toFixed(2);
}

// ✅ Calcular la firma MD5 según el formato de PayU
function calculateMD5ForVerification(paymentData: PaymentData): string {
  const formattedValue = formatValueForSignature(paymentData.value);
  const rawSignature = [
    env.API_KEY,
    paymentData.merchant_id,
    paymentData.reference_sale,
    formattedValue,
    paymentData.currency,
    paymentData.state_pol,
  ].join("~");

  console.log("🔍 Data for MD5:", rawSignature);
  return crypto.createHash("md5").update(rawSignature).digest("hex");
}

// ✅ Función principal para verificar la firma
export function verifySignature(paymentData: PaymentData): boolean {
  if (!env.API_KEY) {
    throw new Error("❌ Error: API_KEY no está definido en el archivo .env");
  }

  const generatedSignature = calculateMD5ForVerification(paymentData);
  console.log("🔍 Generated Signature:", generatedSignature);
  console.log("🔍 Received Signature:", paymentData.sign);

  return generatedSignature === paymentData.sign;
}
