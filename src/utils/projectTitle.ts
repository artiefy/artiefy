/**
 * Quita las comillas que envuelven un título entero.
 *
 * Los títulos generados con IA vuelven a menudo como `"Impacto y Prevención de
 * Terremotos"`, comillas incluidas, y se guardaban así: cada pantalla las
 * pintaba y el título se leía entrecomillado en toda la plataforma. Se limpia
 * al guardar, no al mostrar, para que el dato quede bien de una vez.
 *
 * Solo se tocan las comillas de los EXTREMOS, y solo si abren y cierran. Un
 * título como `El "efecto" invernadero` se deja intacto, porque ahí las
 * comillas las puso la persona a propósito.
 */
const PARES_DE_COMILLAS: readonly (readonly [string, string])[] = [
  ['"', '"'],
  ['“', '”'],
  ['«', '»'],
  ["'", "'"],
];

export function stripWrappingQuotes(value: string): string {
  let resultado = value.trim();

  // En bucle: la IA a veces devuelve comillas dobles anidadas («"Título"»).
  let cambio = true;
  while (cambio) {
    cambio = false;
    for (const [apertura, cierre] of PARES_DE_COMILLAS) {
      if (
        resultado.length > apertura.length + cierre.length &&
        resultado.startsWith(apertura) &&
        resultado.endsWith(cierre)
      ) {
        resultado = resultado
          .slice(apertura.length, resultado.length - cierre.length)
          .trim();
        cambio = true;
      }
    }
  }

  // Si el título era solo comillas, se devuelve lo original: vaciarlo sería
  // peor que dejarlo raro.
  return resultado.length > 0 ? resultado : value.trim();
}
