/**
 * Emparejado de nombres para importar listas desde Excel.
 *
 * El problema real: la lista de la institución trae "Luis Miguel Sosa Garcia"
 * y en la plataforma esa persona puede estar como "Luis Sosa". No hay cédula
 * en todos los registros, así que el nombre es lo único con lo que cruzar, y
 * nunca coincide literalmente.
 *
 * Por eso NO se decide automáticamente: se puntúan los candidatos y se le
 * muestran a quien importa para que escoja. Equivocarse aquí significa
 * matricular a otra persona.
 */

export interface Candidato<T> {
  registro: T;
  /** Palabras del nombre que coinciden. */
  coincidencias: number;
  /** 0 a 1: qué tanto se parecen los nombres completos. */
  similitud: number;
}

/** Quita tildes, mayúsculas y espacios de más. */
export function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9ñ\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Palabras significativas de un nombre.
 *
 * Se descartan las de dos letras o menos ("de", "la", "y"): aparecen en
 * demasiados nombres y solo generan coincidencias falsas.
 */
export function palabrasDe(nombre: string): string[] {
  return normalizar(nombre)
    .split(' ')
    .filter((p) => p.length > 2);
}

/**
 * Busca coincidencias de `nombreBuscado` dentro de `registros`.
 *
 * Devuelve los mejores candidatos ordenados, no una respuesta única.
 */
export function buscarCandidatos<T>(
  nombreBuscado: string,
  registros: T[],
  nombreDe: (r: T) => string,
  maximo = 5
): Candidato<T>[] {
  const buscadas = palabrasDe(nombreBuscado);
  if (buscadas.length === 0) return [];

  const puntuados: Candidato<T>[] = [];

  for (const registro of registros) {
    const suyas = palabrasDe(nombreDe(registro));
    if (suyas.length === 0) continue;

    const coincidencias = buscadas.filter((p) => suyas.includes(p)).length;
    if (coincidencias === 0) continue;

    // Se divide por el nombre más largo para que "Luis" no puntúe alto
    // frente a "Luis Miguel Sosa Garcia" solo por tener una palabra.
    const similitud = coincidencias / Math.max(buscadas.length, suyas.length);

    puntuados.push({ registro, coincidencias, similitud });
  }

  return puntuados
    .sort(
      (a, b) => b.coincidencias - a.coincidencias || b.similitud - a.similitud
    )
    .slice(0, maximo);
}
