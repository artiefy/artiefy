import { type FormData, type Auth, type Product } from "~/types/payu";
import { calculateMD5 } from "./signature";
import { generateReferenceCode } from "./referenceCode";

// ✅ Función para formatear el `amount`
function formatAmount(amount: number): string {
  return amount % 1 === 0 ? amount.toFixed(1) : amount.toFixed(2);
}

// ✅ Crear datos del formulario
export function createFormData(
  auth: Auth,
  product: Product,
  buyerEmail: string,
  buyerFullName: string,
  telephone: string,
  responseUrl: string,
  confirmationUrl: string
): FormData {
  const referenceCode = generateReferenceCode();
  const formattedAmount = formatAmount(Number(product.amount)); // ✅ Convertir `amount` a número antes de formatear
  const currency = "COP";

  // ✅ Generar firma MD5 con el formato correcto
  const signature = calculateMD5(
    auth.apiKey,
    auth.merchantId,
    referenceCode,
    formattedAmount,
    currency
  );

  return {
    merchantId: auth.merchantId,
    accountId: auth.accountId,
    description: product.description,
    referenceCode: referenceCode,
    amount: formattedAmount, // ✅ Mantener `amount` como string
    tax: "3193", // Ajustable según el producto
    taxReturnBase: "16806", // Ajustable según el producto
    currency: currency,
    signature: signature,
    test: "0",
    buyerEmail: buyerEmail,
    buyerFullName: buyerFullName,
    telephone: telephone,
    responseUrl: responseUrl,
    confirmationUrl: confirmationUrl,
  };
}
