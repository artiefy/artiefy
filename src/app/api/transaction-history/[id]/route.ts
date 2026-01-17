import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '~/server/db';
import { pagos, pagoVerificaciones, users } from '~/server/db/schema';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verificar autenticación
    const { userId, sessionClaims } = await auth();
    if (!userId) {
      return Response.json(
        { ok: false, message: 'No autorizado' },
        { status: 401 }
      );
    }

    // Verificar rol
    const role = sessionClaims?.metadata?.role as string | undefined;
    if (role !== 'admin' && role !== 'super-admin') {
      return Response.json(
        { ok: false, message: 'Acceso denegado: solo admin y super-admin' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const pagoId = parseInt(id, 10);

    if (isNaN(pagoId)) {
      return Response.json(
        { ok: false, message: 'ID de transacción inválido' },
        { status: 400 }
      );
    }

    // Obtener pago con datos del usuario
    const pagoData = await db
      .select({
        id: pagos.id,
        userId: pagos.userId,
        programaId: pagos.programaId,
        concepto: pagos.concepto,
        nroPago: pagos.nroPago,
        fecha: pagos.fecha,
        metodo: pagos.metodo,
        valor: pagos.valor,
        createdAt: pagos.createdAt,
        receiptKey: pagos.receiptKey,
        receiptUrl: pagos.receiptUrl,
        receiptName: pagos.receiptName,
        receiptUploadedAt: pagos.receiptUploadedAt,
        receiptVerified: pagos.receiptVerified,
        receiptVerifiedAt: pagos.receiptVerifiedAt,
        receiptVerifiedBy: pagos.receiptVerifiedBy,
        verifiedReceiptKey: pagos.verifiedReceiptKey,
        verifiedReceiptUrl: pagos.verifiedReceiptUrl,
        verifiedReceiptName: pagos.verifiedReceiptName,
        userName: users.name,
        userEmail: users.email,
      })
      .from(pagos)
      .innerJoin(users, eq(pagos.userId, users.id))
      .where(eq(pagos.id, pagoId));

    if (!pagoData || pagoData.length === 0) {
      return Response.json(
        { ok: false, message: 'Transacción no encontrada' },
        { status: 404 }
      );
    }

    const pago = pagoData[0];

    // Obtener historial de verificaciones, ordenado por createdAt DESC
    const verificaciones = await db
      .select({
        id: pagoVerificaciones.id,
        pagoId: pagoVerificaciones.pagoId,
        verifiedBy: pagoVerificaciones.verifiedBy,
        notes: pagoVerificaciones.notes,
        fileKey: pagoVerificaciones.fileKey,
        fileUrl: pagoVerificaciones.fileUrl,
        fileName: pagoVerificaciones.fileName,
        createdAt: pagoVerificaciones.createdAt,
      })
      .from(pagoVerificaciones)
      .where(eq(pagoVerificaciones.pagoId, pagoId))
      .orderBy((t) => t.createdAt); // Más antiguo primero

    return Response.json(
      {
        ok: true,
        data: {
          pago: {
            ...pago,
            user: {
              name: pago.userName,
              email: pago.userEmail,
            },
          },
          verificaciones,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error en GET /api/transaction-history/[id]:', error);

    return Response.json(
      {
        ok: false,
        message: 'Error interno del servidor',
      },
      { status: 500 }
    );
  }
}

// Esquema para actualizar transacción
const updateTransactionSchema = z.object({
  receiptVerified: z.boolean(),
  receiptVerifiedAt: z.string().nullable().optional(),
  receiptVerifiedBy: z.string().nullable().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verificar autenticación
    const { userId, sessionClaims } = await auth();
    if (!userId) {
      return Response.json(
        { ok: false, message: 'No autorizado' },
        { status: 401 }
      );
    }

    // Verificar rol
    const role = sessionClaims?.metadata?.role as string | undefined;
    if (role !== 'admin' && role !== 'super-admin') {
      return Response.json(
        { ok: false, message: 'Acceso denegado: solo admin y super-admin' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const pagoId = parseInt(id, 10);

    if (isNaN(pagoId)) {
      return Response.json(
        { ok: false, message: 'ID de transacción inválido' },
        { status: 400 }
      );
    }

    // Parsear y validar body
    const body = await request.json();
    const parsed = updateTransactionSchema.parse(body);

    // Validar que receiptVerifiedBy sea un ID válido en users (si se proporciona)
    let verifiedById: string | null = parsed.receiptVerifiedBy || null;
    if (verifiedById) {
      const [exists] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.id, verifiedById));
      if (!exists) {
        return Response.json(
          {
            ok: false,
            message: `Usuario verificador con ID ${verifiedById} no encontrado`,
          },
          { status: 400 }
        );
      }
    }

    // Actualizar la transacción
    await db
      .update(pagos)
      .set({
        receiptVerified: parsed.receiptVerified,
        receiptVerifiedAt: parsed.receiptVerifiedAt
          ? new Date(parsed.receiptVerifiedAt)
          : null,
        receiptVerifiedBy: verifiedById,
      })
      .where(eq(pagos.id, pagoId));

    return Response.json(
      {
        ok: true,
        message: 'Transacción actualizada correctamente',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error en PATCH /api/transaction-history/[id]:', error);

    if (error instanceof z.ZodError) {
      return Response.json(
        {
          ok: false,
          message: 'Datos inválidos',
          errors: error.issues,
        },
        { status: 400 }
      );
    }

    return Response.json(
      { ok: false, message: 'Error al actualizar transacción' },
      { status: 500 }
    );
  }
}
