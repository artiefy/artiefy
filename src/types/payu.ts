// Definición de la interfaz para la autenticación
export interface Auth {
  merchantId: string;
  accountId: string;
  apiLogin: string;
  apiKey: string;
}

// ✅ Definición de la interfaz para los productos (referenceCode es opcional)
export interface Product {
  id: number;
  name: string;
  amount: string;
  description: string;
  referenceCode?: string; // ✅ Ahora es opcional
}

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
