import { auth } from '@clerk/nextjs/server';
import { and, asc, desc, eq, gte, ilike, lte, or, type SQL } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '~/server/db';
import { pagos, users } from '~/server/db/schema';

// Esquema de validación para query params
const listTransactionsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().nullish(), // búsqueda por email, nombre, userId, concepto
  verified: z.enum(['true', 'false']).nullish(),
  from: z.string().nullish(), // 'YYYY-MM-DD'
  to: z.string().nullish(), // 'YYYY-MM-DD'
  method: z.string().nullish(),
  concepto: z.string().nullish(),
  userId: z.string().nullish(),
  sort: z
    .enum(['createdAt_desc', 'createdAt_asc', 'valor_desc', 'valor_asc'])
    .nullish()
    .default('createdAt_desc'),
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
      page: url.searchParams.get('page'),
      pageSize: url.searchParams.get('pageSize'),
      q: url.searchParams.get('q'),
      verified: url.searchParams.get('verified'),
      from: url.searchParams.get('from'),
      to: url.searchParams.get('to'),
      method: url.searchParams.get('method'),
      concepto: url.searchParams.get('concepto'),
      userId: url.searchParams.get('userId'),
      sort: url.searchParams.get('sort'),
    };

    const parsed = listTransactionsSchema.parse(queryParams);
    const {
      page,
      pageSize,
      q,
      verified,
      from,
      to,
      method,
      concepto,
      userId: filterUserId,
      sort,
    } = parsed;

    // Construir condiciones de WHERE
    const conditions: (SQL | undefined)[] = [];

    // Búsqueda por q (email, nombre, concepto)
    if (q) {
      conditions.push(
        or(
          ilike(users.email, `%${q}%`),
          ilike(users.name, `%${q}%`),
          ilike(pagos.concepto, `%${q}%`)
        )
      );
    }

    // Filtro por verificación
    if (verified === 'true') {
      conditions.push(eq(pagos.receiptVerified, true));
    } else if (verified === 'false') {
      conditions.push(eq(pagos.receiptVerified, false));
    }

    // Filtro por rango de fechas
    if (from) {
      conditions.push(gte(pagos.fecha, from));
    }
    if (to) {
      conditions.push(lte(pagos.fecha, to));
    }

    // Filtro por método
    if (method) {
      conditions.push(ilike(pagos.metodo, `%${method}%`));
    }

    // Filtro por concepto
    if (concepto) {
      conditions.push(ilike(pagos.concepto, `%${concepto}%`));
    }

    // Filtro por userId
    if (filterUserId) {
      conditions.push(eq(pagos.userId, filterUserId));
    }

    // Determinar orden
    let orderBy;
    switch (sort) {
      case 'createdAt_asc':
        orderBy = asc(pagos.createdAt);
        break;
      case 'valor_desc':
        orderBy = desc(pagos.valor);
        break;
      case 'valor_asc':
        orderBy = asc(pagos.valor);
        break;
      case 'createdAt_desc':
      default:
        orderBy = desc(pagos.createdAt);
        break;
    }

    // Construir query base con join
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Contar total de items
    const countResult = await db
      .select({ count: pagos.id })
      .from(pagos)
      .innerJoin(users, eq(pagos.userId, users.id))
      .where(whereClause);

    const totalItems = countResult[0]?.count || 0;
    const totalPages = Math.ceil(totalItems / pageSize);

    // Obtener items paginados
    const items = await db
      .select({
        id: pagos.id,
        nroPago: pagos.nroPago,
        concepto: pagos.concepto,
        metodo: pagos.metodo,
        valor: pagos.valor,
        fecha: pagos.fecha,
        createdAt: pagos.createdAt,
        receiptVerified: pagos.receiptVerified,
        receiptVerifiedAt: pagos.receiptVerifiedAt,
        userName: users.name,
        userEmail: users.email,
        userId: pagos.userId,
      })
      .from(pagos)
      .innerJoin(users, eq(pagos.userId, users.id))
      .where(whereClause)
      .orderBy(orderBy)
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    return Response.json(
      {
        ok: true,
        data: {
          items,
          pagination: {
            page,
            pageSize,
            totalItems,
            totalPages,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error en GET /api/transaction-history:', error);

    if (error instanceof z.ZodError) {
      return Response.json(
        {
          ok: false,
          message: 'Parámetros inválidos',
          errors: error.issues,
        },
        { status: 400 }
      );
    }

    return Response.json(
      {
        ok: false,
        message: 'Error interno del servidor',
      },
      { status: 500 }
    );
  }
}
