import { and, desc, eq } from 'drizzle-orm';

import { db } from '~/server/db';
import {
  ACADEMY_PAGO_ESTADOS,
  academyPagos,
  academyUsers,
} from '~/server/db/schema';
import { withRetry } from '~/server/db/withRetry';

import { ErrorAcademia } from './academias';

import 'server-only';

// Finanzas de una academia: registro manual de pagos de sus estudiantes (no
// pasa por PayU). Montos en pesos, enteros.

type EstadoPago = (typeof ACADEMY_PAGO_ESTADOS)[number];
const esEstadoPago = (v: unknown): v is EstadoPago =>
  ACADEMY_PAGO_ESTADOS.includes(v as EstadoPago);

const FECHA_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function listarPagos(academyId: number) {
  return withRetry(() =>
    db
      .select({
        id: academyPagos.id,
        userId: academyPagos.userId,
        estudiante: academyUsers.name,
        email: academyUsers.email,
        concepto: academyPagos.concepto,
        monto: academyPagos.monto,
        fecha: academyPagos.fecha,
        metodo: academyPagos.metodo,
        estado: academyPagos.estado,
        createdAt: academyPagos.createdAt,
      })
      .from(academyPagos)
      .leftJoin(
        academyUsers,
        and(
          eq(academyUsers.userId, academyPagos.userId),
          eq(academyUsers.academyId, academyId)
        )
      )
      .where(eq(academyPagos.academyId, academyId))
      .orderBy(desc(academyPagos.fecha), desc(academyPagos.id))
  );
}

export async function registrarPago(
  academyId: number,
  createdBy: string,
  body: Record<string, unknown>
) {
  const userId = typeof body.userId === 'string' ? body.userId : '';
  const [estudiante] = await db
    .select({ email: academyUsers.email })
    .from(academyUsers)
    .where(
      and(
        eq(academyUsers.academyId, academyId),
        eq(academyUsers.userId, userId)
      )
    )
    .limit(1);
  if (!estudiante)
    throw new ErrorAcademia('Elige un estudiante de la academia.');

  const concepto =
    typeof body.concepto === 'string' ? body.concepto.trim() : '';
  if (!concepto) throw new ErrorAcademia('El concepto es obligatorio.');
  const monto = Math.round(Number(body.monto));
  if (!Number.isFinite(monto) || monto < 0) {
    throw new ErrorAcademia('El monto debe ser un número positivo.');
  }
  const fecha = typeof body.fecha === 'string' ? body.fecha : '';
  if (!FECHA_RE.test(fecha)) throw new ErrorAcademia('Fecha inválida.');
  const estado = esEstadoPago(body.estado) ? body.estado : 'pagado';
  const metodo =
    typeof body.metodo === 'string' && body.metodo.trim()
      ? body.metodo.trim()
      : null;

  const [nuevo] = await db
    .insert(academyPagos)
    .values({
      academyId,
      userId,
      concepto,
      monto,
      fecha,
      metodo,
      estado,
      createdBy,
    })
    .returning({ id: academyPagos.id });
  return { id: nuevo!.id, detalle: `${estudiante.email} · $${monto}` };
}

async function pagoDe(academyId: number, id: number) {
  const [fila] = await db
    .select({ id: academyPagos.id, concepto: academyPagos.concepto })
    .from(academyPagos)
    .where(and(eq(academyPagos.id, id), eq(academyPagos.academyId, academyId)))
    .limit(1);
  if (!fila) throw new ErrorAcademia('Pago no encontrado', 404);
  return fila;
}

export async function cambiarEstadoPago(
  academyId: number,
  id: number,
  estado: unknown
) {
  if (!esEstadoPago(estado)) throw new ErrorAcademia('Estado inválido.');
  const pago = await pagoDe(academyId, id);
  await db.update(academyPagos).set({ estado }).where(eq(academyPagos.id, id));
  return `${pago.concepto} → ${estado}`;
}

export async function eliminarPago(academyId: number, id: number) {
  const pago = await pagoDe(academyId, id);
  await db.delete(academyPagos).where(eq(academyPagos.id, id));
  return pago.concepto;
}
