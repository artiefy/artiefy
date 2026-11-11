import { and, desc, eq, inArray } from 'drizzle-orm';

import { env } from '~/env';
import { db } from '~/server/db';
import {
  ACADEMY_PAGO_ESTADOS,
  academyPagoHistorial,
  academyPagos,
  academyPagoVerificacion,
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

// ------------------------------------- Historial de Transacciones ---
// Como /dashboard/transaction-history de Artiefy: filtros, resumen,
// paginación, detalle con comprobante y verificación con historial. La
// verificación vive aparte (academy_pago_verificacion / _historial); sin su
// SQL los pagos se ven "Pendiente" y verificar avisa que falta el script.

export interface FiltrosHistorial {
  q?: string;
  verificado?: string;
  desde?: string;
  hasta?: string;
  metodo?: string;
  concepto?: string;
  page?: number;
  pageSize?: number;
}

const normal = (s: string | null | undefined) =>
  (s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

async function verificacionesDe(ids: number[]) {
  if (ids.length === 0) return [];
  return db
    .select()
    .from(academyPagoVerificacion)
    .where(inArray(academyPagoVerificacion.pagoId, ids))
    .catch(() => []);
}

export async function historialPagos(
  academyId: number,
  filtros: FiltrosHistorial
) {
  const pagos = await listarPagos(academyId);
  const verif = await verificacionesDe(pagos.map((p) => p.id));
  const items = pagos
    .filter((p) => p.estado !== 'anulado')
    .map((p) => {
      const v = verif.find((x) => x.pagoId === p.id);
      return {
        id: p.id,
        nroPago: p.id,
        concepto: p.concepto,
        metodo: p.metodo ?? '',
        valor: p.monto,
        fecha: p.fecha,
        createdAt: p.createdAt.toISOString(),
        receiptVerified: v?.verificado ?? false,
        receiptVerifiedAt: v?.verificadoAt?.toISOString() ?? null,
        userName: p.estudiante,
        userEmail: p.email ?? '',
        userId: p.userId,
      };
    });

  const q = normal(filtros.q);
  const filtrados = items.filter(
    (i) =>
      (!q ||
        [i.concepto, i.userName, i.userEmail].some((v) =>
          normal(v).includes(q)
        )) &&
      (!filtros.verificado ||
        filtros.verificado === 'all' ||
        String(i.receiptVerified) === filtros.verificado) &&
      (!filtros.desde || i.fecha >= filtros.desde) &&
      (!filtros.hasta || i.fecha <= filtros.hasta) &&
      (!filtros.metodo || normal(i.metodo).includes(normal(filtros.metodo))) &&
      (!filtros.concepto ||
        normal(i.concepto).includes(normal(filtros.concepto)))
  );

  const total = filtrados.reduce((s, i) => s + i.valor, 0);
  const verificado = filtrados
    .filter((i) => i.receiptVerified)
    .reduce((s, i) => s + i.valor, 0);
  const verificadas = filtrados.filter((i) => i.receiptVerified).length;
  const pageSize = Math.min(Math.max(filtros.pageSize ?? 10, 1), 100);
  const totalPages = Math.max(1, Math.ceil(filtrados.length / pageSize));
  const page = Math.min(Math.max(filtros.page ?? 1, 1), totalPages);

  return {
    items: filtrados.slice((page - 1) * pageSize, page * pageSize),
    pagination: { page, pageSize, totalItems: filtrados.length, totalPages },
    summary: {
      totalRecaudado: total,
      totalRecaudadoVerificado: verificado,
      totalRecaudadoNoVerificado: total - verificado,
      totalTransacciones: filtrados.length,
      totalVerificadas: verificadas,
      totalPendientes: filtrados.length - verificadas,
      porcentajeVerificado: filtrados.length
        ? Math.round((verificadas / filtrados.length) * 100)
        : 0,
    },
  };
}

const urlS3 = (key: string | null | undefined) =>
  key ? `${env.NEXT_PUBLIC_AWS_S3_URL}/${key}` : null;

/** Detalle del pago con su comprobante y el historial de verificaciones. */
export async function detallePago(academyId: number, id: number) {
  const pago = (await listarPagos(academyId)).find((p) => p.id === id);
  if (!pago) throw new ErrorAcademia('Pago no encontrado', 404);
  const [v] = await verificacionesDe([id]);
  const historial = await db
    .select()
    .from(academyPagoHistorial)
    .where(eq(academyPagoHistorial.pagoId, id))
    .orderBy(desc(academyPagoHistorial.createdAt))
    .catch(() => []);
  return {
    pago: {
      id: pago.id,
      nroPago: pago.id,
      concepto: pago.concepto,
      metodo: pago.metodo ?? '',
      valor: pago.monto,
      fecha: pago.fecha,
      userId: pago.userId,
      receiptKey: v?.comprobanteKey ?? null,
      receiptUrl: urlS3(v?.comprobanteKey),
      receiptName: v?.comprobanteNombre ?? null,
      receiptUploadedAt: v?.comprobanteSubidoAt?.toISOString() ?? null,
      receiptVerified: v?.verificado ?? false,
      receiptVerifiedAt: v?.verificadoAt?.toISOString() ?? null,
      receiptVerifiedBy: v?.verificadoPor ?? null,
      user: { name: pago.estudiante, email: pago.email ?? '' },
    },
    verificaciones: historial.map((h) => ({
      id: h.id,
      pagoId: h.pagoId,
      verificado: h.verificado,
      verifiedBy: h.por,
      notes: h.notas,
      fileKey: h.archivoKey,
      fileUrl: urlS3(h.archivoKey),
      fileName: h.archivoNombre,
      createdAt: h.createdAt.toISOString(),
    })),
  };
}

const esKeyS3 = (v: unknown): v is string =>
  typeof v === 'string' && /^uploads\/[\w./-]{1,300}$/.test(v);

/**
 * Verifica o rechaza un pago (queda en el historial con notas y archivo
 * opcional), o sube su comprobante.
 */
export async function actualizarVerificacion(
  academyId: number,
  id: number,
  actor: string,
  body: Record<string, unknown>
) {
  await pagoDe(academyId, id);
  const ahora = new Date();

  if (esKeyS3(body.comprobanteKey)) {
    const comprobante = {
      comprobanteKey: body.comprobanteKey,
      comprobanteNombre:
        typeof body.comprobanteNombre === 'string'
          ? body.comprobanteNombre.slice(0, 200)
          : null,
      comprobanteSubidoAt: ahora,
    };
    await db
      .insert(academyPagoVerificacion)
      .values({ pagoId: id, ...comprobante })
      .onConflictDoUpdate({
        target: academyPagoVerificacion.pagoId,
        set: comprobante,
      });
    return 'Comprobante subido';
  }

  if (typeof body.verificado !== 'boolean') {
    throw new ErrorAcademia('Indica si el pago queda verificado.');
  }
  const estado = {
    verificado: body.verificado,
    verificadoAt: body.verificado ? ahora : null,
    verificadoPor: body.verificado ? actor : null,
  };
  await db
    .insert(academyPagoVerificacion)
    .values({ pagoId: id, ...estado })
    .onConflictDoUpdate({
      target: academyPagoVerificacion.pagoId,
      set: estado,
    });
  await db.insert(academyPagoHistorial).values({
    pagoId: id,
    verificado: body.verificado,
    por: actor,
    notas:
      typeof body.notas === 'string' && body.notas.trim()
        ? body.notas.trim().slice(0, 1000)
        : null,
    archivoKey: esKeyS3(body.archivoKey) ? body.archivoKey : null,
    archivoNombre:
      typeof body.archivoNombre === 'string'
        ? body.archivoNombre.slice(0, 200)
        : null,
  });
  return body.verificado ? 'Pago verificado' : 'Pago rechazado';
}
