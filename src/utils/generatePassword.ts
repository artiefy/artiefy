import { randomInt } from 'node:crypto';

/**
 * Generador único de contraseñas temporales de Artiefy.
 *
 * Estas claves las recibe la persona por correo y las teclea a mano (o se las
 * dictan por teléfono), así que se priorizó que sean fáciles de leer sin
 * sacrificar seguridad:
 *
 *  - Formato "PalabraPalabra####": dos palabras en español sin tildes ni
 *    eñes, cada una con la inicial en mayúscula, y cuatro dígitos al final.
 *    Ej: `HalconAurora4612`, `VolcanIris7302`.
 *  - Sin símbolos (`!@#$…`) ni caracteres que se confunden al copiar.
 *  - La seguridad viene del tamaño del espacio de búsqueda (~26 bits), no de
 *    la longitud visible ni de meter símbolos raros.
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

/**
 * Elige un elemento al azar con aleatoriedad criptográfica y SIN sesgo.
 *
 * `randomBytes(1)[0] % lista.length` parece equivalente pero no lo es: 256 no
 * es múltiplo de 83, así que las primeras 256 % 83 = 7 palabras salían ~1,5
 * veces más seguido que el resto. `randomInt` hace rechazo de muestras y
 * reparte parejo.
 */
function elegir<T>(lista: readonly T[]): T {
  return lista[randomInt(0, lista.length)]!;
}

/**
 * Devuelve una contraseña del tipo `PalabraPalabra####`.
 *
 * Se garantiza que las dos palabras sean distintas para no repetir (`SolSol`).
 *
 * Sobre el tamaño del espacio de búsqueda: 83 x 82 x 10^4 = 68.060.000
 * combinaciones, unos 26 bits. Es un punto medio deliberado. El formato
 * original `PalabraPalabra##` daba 83 x 82 x 90 = 612.540 (19 bits), que se
 * agota en segundos con un diccionario; el de tres palabras y seis dígitos
 * daba 39 bits pero producía claves de 23 caracteres que la gente no llegaba
 * a teclear ni a dictar por teléfono sin equivocarse. Dieciséis caracteres
 * legibles conservan casi todo el margen práctico.
 *
 * ADVERTENCIA: `publicMetadata.mustChangePassword` se escribe al crear la
 * cuenta pero hoy no lo lee nadie, así que nada obliga a rotar esta clave y en
 * la práctica puede quedar como la contraseña definitiva. Mientras siga así,
 * estos 26 bits son la única protección real. Si se refuerza el flujo de
 * cambio obligatorio, este número puede bajar sin riesgo.
 */
export function generarPasswordSegura(): string {
  const elegidas: string[] = [];
  while (elegidas.length < 2) {
    const palabra = elegir(PALABRAS);
    if (!elegidas.includes(palabra)) elegidas.push(palabra);
  }

  // Cuatro dígitos con ceros a la izquierda: `0042` es tan válido como `9182`
  // y mantiene el largo constante.
  const numero = randomInt(0, 10_000).toString().padStart(4, '0');

  return `${elegidas.join('')}${numero}`;
}
