import 'server-only';

/**
 * Caché en memoria con vencimiento y petición única.
 *
 * Pensado para operaciones caras que se piden varias veces seguidas — el caso
 * concreto: la sincronización con Microsoft Graph tarda 7-9 segundos y la
 * página del curso la dispara media docena de veces al abrirse.
 *
 * Hace dos cosas:
 *
 *  - **Petición única**: si llega una segunda petición mientras la primera
 *    sigue en vuelo, se engancha a ella en vez de lanzar otra. Esto por sí
 *    solo convierte seis llamadas de 8 s en una.
 *  - **Vencimiento**: el resultado se reutiliza durante `ttlMs`. Las
 *    grabaciones de Teams no cambian de un segundo a otro.
 *
 * Vive en memoria del proceso: en Vercel es por instancia, así que no
 * sustituye a un caché compartido, pero elimina las ráfagas, que es de donde
 * viene la espera.
 */

interface Entrada<T> {
  valor?: T;
  expiraEn: number;
  /** Promesa en vuelo, para que las peticiones simultáneas se enganchen. */
  enCurso?: Promise<T>;
}

const almacen = new Map<string, Entrada<unknown>>();

export async function conCacheTTL<T>(
  clave: string,
  ttlMs: number,
  producir: () => Promise<T>
): Promise<T> {
  const ahora = Date.now();
  const actual = almacen.get(clave) as Entrada<T> | undefined;

  // Valor fresco: se devuelve tal cual.
  if (actual && actual.valor !== undefined && actual.expiraEn > ahora) {
    return actual.valor;
  }

  // Ya hay alguien calculándolo: se espera a ese, no se lanza otro.
  if (actual?.enCurso) {
    return actual.enCurso;
  }

  const enCurso = producir()
    .then((valor) => {
      almacen.set(clave, { valor, expiraEn: Date.now() + ttlMs });
      return valor;
    })
    .catch((error) => {
      // Un fallo no se cachea: la siguiente petición vuelve a intentarlo.
      almacen.delete(clave);
      throw error;
    });

  almacen.set(clave, { expiraEn: ahora + ttlMs, enCurso });
  return enCurso;
}

/** Invalida una clave, o todas las que empiecen por un prefijo. */
export function invalidarCache(clavePrefijo: string): void {
  for (const clave of almacen.keys()) {
    if (clave === clavePrefijo || clave.startsWith(clavePrefijo)) {
      almacen.delete(clave);
    }
  }
}
