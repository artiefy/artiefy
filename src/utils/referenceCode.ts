import { MD5 } from "crypto-js";

// Función para generar un código de referencia aleatorio
export function generateReferenceCode(): string {
  const timestamp = Date.now().toString();
  return MD5(timestamp).toString();
}
