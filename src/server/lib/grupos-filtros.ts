import { asc, eq, type SQL, sql } from 'drizzle-orm';

import { db } from '~/server/db';
import { users } from '~/server/db/schema';

import 'server-only';

/**
 * Columnas por las que se puede filtrar al crear un grupo de estudiantes
 * (los mismos filtros de la tabla de Estudiantes).
 *
 * Es una LISTA BLANCA: el cliente manda una clave (p. ej. 'enrollmentStatus')
 * y aquí se resuelve a SQL armado con Drizzle; el valor siempre va como
 * parámetro. Nunca se arma SQL con nombres recibidos del cliente.
 *
 * Cada columna define:
 *  - valores: opciones del selector "Valor" (solo de estudiantes).
 *  - condicion: filtro sobre `users` para un valor elegido.
 */
interface DefFiltro {
  label: string;
  /** 'fecha': el front muestra los valores como "junio 20, 2026". */
  tipo?: 'fecha';
  valores: () => Promise<string[]>;
  condicion: (valor: string) => SQL;
}

const soloEstudiantes = eq(users.role, 'estudiante');

const limpiar = (filas: { v: string | null }[]) =>
  filas
    .map((f) => f.v)
    .filter((v): v is string => typeof v === 'string' && v.trim() !== '');

/** Valores distintos de una expresión sobre los estudiantes. */
const distintos = async (expr: SQL<string | null>) =>
  limpiar(
    await db
      .selectDistinct({ v: expr })
      .from(users)
      .where(soloEstudiantes)
      .orderBy(asc(expr))
  );

// Subconsultas correlacionadas con alias explícitos: Drizzle quita el prefijo
// de tabla cuando la expresión va en el SELECT y `id` quedaría ambiguo.

// Estado de cartera más reciente del estudiante (como la tabla de Estudiantes).
const carteraActual = sql<
  string | null
>`(select uc.status from user_cartera uc where uc.user_id = "users"."id" order by uc.updated_at desc limit 1)`;

// Título del curso de la matrícula más reciente ("Último curso").
const ultimoCurso = sql<
  string | null
>`(select c.title from enrollments e inner join courses c on c.id = e.course_id where e.user_id = "users"."id" order by e.enrolled_at desc, e.id desc limit 1)`;

const fechaInicioDia = sql<string | null>`left(${users.fechaInicio}, 10)`;

const finSuscripcion = sql<
  string | null
>`to_char(${users.subscriptionEndDate}, 'YYYY-MM-DD')`;

export const COLUMNAS_FILTRO = {
  // Campo libre users.grupos (el de la tabla de Estudiantes), no la tabla
  // `grupos` de la planilla.
  grupos: {
    label: 'Grupos',
    valores: () => distintos(sql`${users.grupos}`),
    condicion: (valor) => eq(users.grupos, valor),
  },
  enrollmentStatus: {
    label: 'Estado',
    valores: () => distintos(sql`${users.enrollmentStatus}`),
    condicion: (valor) => eq(users.enrollmentStatus, valor),
  },
  subscriptionEndDate: {
    label: 'Fin Suscripción',
    tipo: 'fecha',
    valores: async () =>
      limpiar(
        await db
          .selectDistinct({ v: finSuscripcion })
          .from(users)
          .where(soloEstudiantes)
          .orderBy(asc(finSuscripcion))
      ),
    condicion: (valor) => sql`${finSuscripcion} = ${valor}`,
  },
  carteraStatus: {
    label: 'Estado cartera',
    valores: () => Promise.resolve(['Al día', 'En cartera']),
    // Sin registro de cartera cuenta como "En cartera" (igual que la tabla).
    condicion: (valor) =>
      valor === 'Al día'
        ? sql`${carteraActual} = 'activo'`
        : sql`coalesce(${carteraActual}, 'inactivo') <> 'activo'`,
  },
  ultimoCurso: {
    label: 'Último curso',
    valores: () => distintos(ultimoCurso),
    condicion: (valor) => sql`${ultimoCurso} = ${valor}`,
  },
  fechaInicio: {
    label: 'Fecha inicio',
    tipo: 'fecha',
    // Se guarda como texto, a veces con hora ("…T00:00:00.000Z"): se compara
    // solo el día para no repetir fechas en el selector.
    valores: () => distintos(fechaInicioDia),
    condicion: (valor) => sql`${fechaInicioDia} = ${valor}`,
  },
} satisfies Record<string, DefFiltro>;

export type ColumnaFiltro = keyof typeof COLUMNAS_FILTRO;

export const esColumnaValida = (valor: string): valor is ColumnaFiltro =>
  Object.prototype.hasOwnProperty.call(COLUMNAS_FILTRO, valor);
