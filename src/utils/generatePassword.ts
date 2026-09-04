import { randomInt } from 'node:crypto';

/**
 * Generador único de contraseñas temporales de Artiefy.
 *
 * Estas claves las recibe la persona por correo y las teclea a mano (o se las
 * dictan por teléfono), así que se priorizó que sean fáciles de leer sin
 * sacrificar seguridad:
 *
 *  - Formato "PalabraPalabraPalabra######": tres palabras en español sin
 *    tildes ni eñes, cada una con la inicial en mayúscula, y seis dígitos al
 *    final. Ej: `HalconAuroraCedro094612`, `VolcanIrisDuna730285`.
 *  - Sin símbolos (`!@#$…`) ni caracteres que se confunden al copiar.
 *  - La seguridad viene del tamaño del espacio de búsqueda (~39 bits), no de
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
 * Devuelve una contraseña del tipo `PalabraPalabraPalabra######`.
 *
 * Se garantiza que las tres palabras sean distintas para no repetir
 * (`SolSolLuna`).
 *
 * Sobre el tamaño del espacio de búsqueda: el formato anterior era
 * `PalabraPalabra##`, es decir 83 x 82 x 90 = 612.540 combinaciones, unos 19
 * bits. Eso se agota en segundos con un diccionario, y estas claves llegan por
 * correo a una dirección que quien compró ya conoce. La longitud visible no
 * aportaba nada: con un alfabeto de 83 palabras conocidas, `HalconAurora96`
 * tiene 14 caracteres y la fuerza de tres. Una tercera palabra y seis dígitos
 * llevan el espacio a 83 x 82 x 81 x 10^6 ≈ 5,5 x 10^11, unos 39 bits, sin
 * volverla impronunciable por teléfono.
 */
export function generarPasswordSegura(): string {
  const elegidas: string[] = [];
  while (elegidas.length < 3) {
    const palabra = elegir(PALABRAS);
    if (!elegidas.includes(palabra)) elegidas.push(palabra);
  }

  // Seis dígitos con ceros a la izquierda: `000042` es tan válido como
  // `918273` y mantiene el largo constante.
  const numero = randomInt(0, 1_000_000).toString().padStart(6, '0');

  return `${elegidas.join('')}${numero}`;
}
