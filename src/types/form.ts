// Definición de la interfaz para los datos del formulario
export interface FormData {
  merchantId: string;
  accountId: string;
  description: string;
  referenceCode: string;
  amount: string;
  tax: string;
  taxReturnBase: string;
  currency: string;
  signature: string;
  test: string;
  buyerEmail: string;
  buyerFullName: string;
  telephone: string;
  responseUrl: string;
  confirmationUrl: string;
}

// Función que crea los datos del formulario utilizando los parámetros proporcionados
export function createFormData(
  merchantId: string,
  accountId: string,
  description: string,
  referenceCode: string,
  amount: string,
  tax: string,
  taxReturnBase: string,
  currency: string,
  signature: string,
  test: string,
  buyerEmail: string,
  buyerFullName: string,
  telephone: string,
  responseUrl: string,
  confirmationUrl: string
): FormData {
  return {
    merchantId,
    accountId,
    description,
    referenceCode,
    amount,
    tax,
    taxReturnBase,
    currency,
    signature,
    test,
    buyerEmail,
    buyerFullName,
    telephone,
    responseUrl,
    confirmationUrl,
  };
}
