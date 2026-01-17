import { auth } from '@clerk/nextjs/server';
import { and, eq, gte, ilike, lte, or, type SQL } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '~/server/db';
import { pagos, users } from '~/server/db/schema';

const summarySchema = z.object({
  q: z.string().nullish(),
  verified: z.enum(['true', 'false']).nullish(),
  from: z.string().nullish(),
  to: z.string().nullish(),
  method: z.string().nullish(),
  concepto: z.string().nullish(),
});

export async function GET(request: Request) {
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

    // Extraer y validar query params
    const url = new URL(request.url);
    const queryParams = {
      q: url.searchParams.get('q'),
      verified: url.searchParams.get('verified'),
      from: url.searchParams.get('from'),
      to: url.searchParams.get('to'),
      method: url.searchParams.get('method'),
      concepto: url.searchParams.get('concepto'),
    };

    const parsed = summarySchema.parse(queryParams);
    const { q, verified, from, to, method, concepto } = parsed;

    console.log('📥 Summary API recibió parámetros:', {
      q,
      verified,
      from,
      to,
      method,
      concepto,
    });

    // Construir condiciones WHERE
    const conditions: (SQL | undefined)[] = [];

    if (q) {
      conditions.push(
        or(
          ilike(pagos.concepto, `%${q}%`),
          ilike(users.name, `%${q}%`),
          ilike(users.email, `%${q}%`)
        )
      );
    }

    if (verified) {
      const isVerified = verified === 'true';
      conditions.push(eq(pagos.receiptVerified, isVerified));
    }

    if (from) {
      conditions.push(gte(pagos.fecha, from));
    }

    if (to) {
      conditions.push(lte(pagos.fecha, to));
    }

    if (method) {
      conditions.push(ilike(pagos.metodo, `%${method}%`));
    }

    if (concepto) {
      conditions.push(ilike(pagos.concepto, `%${concepto}%`));
    }

    console.log('🔧 Condiciones construidas:', conditions.length, 'filtros');

    // Obtener todos los datos que coinciden (sin paginación)
    const allItems = await db
      .select()
      .from(pagos)
      .leftJoin(users, eq(pagos.userId, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    console.log('📋 Query retornó:', allItems.length, 'registros');

    // Calcular totales
    const totalRecaudado = allItems.reduce(
      (sum, item) => sum + (item.pagos?.valor || 0),
      0
    );

    const totalRecaudadoVerificado = allItems
      .filter((item) => item.pagos?.receiptVerified)
      .reduce((sum, item) => sum + (item.pagos?.valor || 0), 0);

    const totalRecaudadoNoVerificado =
      totalRecaudado - totalRecaudadoVerificado;

    const totalTransacciones = allItems.length;
    const totalVerificadas = allItems.filter(
      (item) => item.pagos?.receiptVerified
    ).length;
    const totalPendientes = totalTransacciones - totalVerificadas;

    return Response.json(
      {
        ok: true,
        data: {
          totalRecaudado,
          totalRecaudadoVerificado,
          totalRecaudadoNoVerificado,
          totalTransacciones,
          totalVerificadas,
          totalPendientes,
          porcentajeVerificado:
            totalTransacciones > 0
              ? ((totalVerificadas / totalTransacciones) * 100).toFixed(1)
              : '0',
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching summary:', error);

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
      { ok: false, message: 'Error al cargar resumen' },
      { status: 500 }
    );
  }
}
