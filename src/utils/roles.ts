/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
// src/utils/roles.ts
import { type Roles } from "~/types/globals";  // Asegúrate de que Roles esté bien definido

export const checkRole = async (role: Roles, sessionClaims: any) => {
  // Verifica si el rol del usuario en sessionClaims coincide con el rol requerido
  return sessionClaims?.metadata?.role === role;
};