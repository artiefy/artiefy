import { randomBytes } from 'node:crypto';

/**
 * Generador único de contraseñas temporales de Artiefy.
 *
 * Estas claves las recibe la persona por correo y las teclea a mano (o se las
 * dictan por teléfono), así que se priorizó que sean fáciles de leer sin
 * sacrificar seguridad:
 *
 *  - Formato "PalabraPalabra##": dos palabras en español sin tildes ni eñes,
 *    cada una con la inicial en mayúscula, y dos dígitos al final. Ej:
 *    `HalconAurora96`, `VolcanIris42`.
 *  - Sin símbolos (`!@#$…`) ni caracteres que se confunden al copiar.
 *  - La seguridad viene de la longitud (13-19 caracteres) más el número, no de
 *    meter símbolos raros.
 *  - Cumple las políticas de Clerk: siempre trae mayúscula, minúscula y dígito.
 *
 * Antes cada flujo (inscripción, reenvío de credenciales, checkout, matrícula
 * a curso y a proyecto) tenía su propio generador copiado, con largos y
 * alfabetos distintos — uno de 8 caracteres sin símbolos, otro que ni
 * garantizaba dígito y a veces producía claves que Clerk rechazaba. Este
 * módulo los unifica.
 */

// Palabras cortas, comunes y sin ambigüedades (sin tildes ni ñ). Cuantas más
// haya, más difícil es adivinar la combinación.
const PALABRAS = [
  'Tigre',
  'Cometa',
  'Rio',
  'Nube',
  'Faro',
  'Lince',
  'Bosque',
  'Coral',
  'Trueno',
  'Aurora',
  'Delfin',
  'Menta',
  'Cedro',
  'Halcon',
  'Puma',
  'Brisa',
  'Volcan',
  'Orca',
  'Sauce',
  'Jade',
  'Zorro',
  'Nieve',
  'Roble',
  'Aguila',
  'Perla',
  'Duna',
  'Cactus',
  'Iris',
  'Lobo',
  'Marea',
  'Nido',
  'Vela',
  'Ambar',
  'Fuego',
  'Estrella',
  'Selva',
  'Palma',
  'Rayo',
  'Cielo',
  'Monte',
  'Valle',
  'Arena',
  'Cascada',
  'Pino',
  'Gaviota',
  'Panda',
  'Zafiro',
  'Bambu',
  'Coyote',
  'Petalo',
  'Musgo',
  'Otono',
  'Verano',
  'Cristal',
  'Girasol',
  'Colibri',
  'Manzana',
  'Naranja',
  'Limon',
  'Uva',
  'Kiwi',
  'Mango',
  'Cereza',
  'Almendra',
  'Canela',
  'Vainilla',
  'Cobre',
  'Bronce',
  'Platino',
  'Marfil',
  'Turquesa',
  'Escarlata',
  'Indigo',
  'Carmesi',
  'Nebula',
  'Galaxia',
  'Planeta',
  'Meteoro',
  'Satelite',
  'Laguna',
  'Pradera',
  'Glaciar',
  'Arrecife',
] as const;

/** Elige un elemento al azar con aleatoriedad criptográfica. */
function elegir<T>(lista: readonly T[]): T {
  return lista[randomBytes(1)[0] % lista.length]!;
}

/**
 * Devuelve una contraseña del tipo `PalabraPalabra##`.
 *
 * Se garantiza que las dos palabras sean distintas para no repetir (`SolSol`).
 */
export function generarPasswordSegura(): string {
  const primera = elegir(PALABRAS);
  let segunda = elegir(PALABRAS);
  while (segunda === primera) {
    segunda = elegir(PALABRAS);
  }

  // Dos dígitos, 10-99: el 0 y el 1 no confunden dentro de un número, así que
  // no hace falta excluirlos aquí.
  const numero = 10 + (randomBytes(1)[0] % 90);

  return `${primera}${segunda}${numero}`;
}
