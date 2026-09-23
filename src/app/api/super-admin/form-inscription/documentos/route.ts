/**
 * GET /api/super-admin/form-inscription/documentos
 *
 * Lista las personas inscritas por el formulario junto con los documentos que
 * subieron (identidad, recibo de servicio, acta/diploma, pagaré) y el
 * comprobante de pago de inscripción. Es la fuente del apartado "Documentos de
 * inscripción" del panel de super-admin.
 *
 * Solo lee claves de S3 ya guardadas y arma sus URLs públicas (el bucket sube
 * los archivos con ACL public-read). No sube ni modifica nada.
 *
 * Parámetros: `q` (busca por nombre, correo, documento o identificación),
 * `page` y `pageSize` (paginación).
 */

import { type NextRequest, NextResponse } from 'next/server';

import { auth } from '@clerk/nextjs/server';
import { and, desc, eq, ilike, inArray, isNotNull, or, sql } from 'drizzle-orm';

import { db } from '~/server/db';
import { pagos, users } from '~/server/db/schema';

const BASE_S3 = 'https://s3.us-east-2.amazonaws.com/artiefy-upload';

/** Convierte una clave de S3 en URL pública; deja pasar las que ya son URL. */
const urlDe = (key: string | null | undefined): string | null => {
  const limpia = (key ?? '').trim();
  if (!limpia) return null;
  return limpia.startsWith('http') ? limpia : `${BASE_S3}/${limpia}`;
};

export async function GET(request: NextRequest) {
  const { userId, sessionClaims } = await auth();
  const role = String(sessionClaims?.metadata?.role ?? '');
  if (!userId || (role !== 'super-admin' && role !== 'admin')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const params = request.nextUrl.searchParams;
  const q = (params.get('q') ?? '').trim();
  const programa = (params.get('programa') ?? '').trim();
  const sede = (params.get('sede') ?? '').trim();
  const page = Math.max(1, Number(params.get('page') ?? '1') || 1);
  // `pageSize` hasta 5000 para permitir exportar todo en una sola llamada.
  const pageSize = Math.min(
    5000,
    Math.max(1, Number(params.get('pageSize') ?? '20') || 20)
  );
  const offset = (page - 1) * pageSize;

  // Solo quienes subieron al menos un documento del formulario.
  const tieneAlgunDoc = or(
    isNotNull(users.idDocKey),
    isNotNull(users.utilityBillKey),
    isNotNull(users.diplomaKey),
    isNotNull(users.pagareKey)
  );

  const condiciones = [tieneAlgunDoc];
  if (q) {
    condiciones.push(
      or(
        ilike(users.name, `%${q}%`),
        ilike(users.email, `%${q}%`),
        ilike(users.document, `%${q}%`),
        ilike(users.identificacionNumero, `%${q}%`)
      )
    );
  }
  if (programa) condiciones.push(eq(users.programa, programa));
  if (sede) condiciones.push(eq(users.sede, sede));

  const where = and(...condiciones);

  try {
    const [filas, totalRes] = await Promise.all([
      db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          document: users.document,
          identificacionTipo: users.identificacionTipo,
          identificacionNumero: users.identificacionNumero,
          programa: users.programa,
          sede: users.sede,
          fechaInicio: users.fechaInicio,
          createdAt: users.createdAt,
          idDocKey: users.idDocKey,
          utilityBillKey: users.utilityBillKey,
          diplomaKey: users.diplomaKey,
          pagareKey: users.pagareKey,
        })
        .from(users)
        .where(where)
        .orderBy(desc(users.createdAt))
        .limit(pageSize)
        .offset(offset),
      db
        .select({ total: sql<number>`count(*)` })
        .from(users)
        .where(where),
    ]);

    // Comprobante de pago (receiptKey/receiptUrl) por usuario, el más reciente.
    const ids = filas.map((f) => f.id);
    const comprobantePorUsuario = new Map<string, string>();
    if (ids.length > 0) {
      const pagosConComprobante = await db
        .select({
          userId: pagos.userId,
          receiptKey: pagos.receiptKey,
          receiptUrl: pagos.receiptUrl,
          createdAt: pagos.createdAt,
        })
        .from(pagos)
        .where(and(inArray(pagos.userId, ids), isNotNull(pagos.receiptKey)))
        .orderBy(desc(pagos.createdAt));

      for (const p of pagosConComprobante) {
        if (comprobantePorUsuario.has(p.userId)) continue; // el primero = más reciente
        const url = urlDe(p.receiptUrl) ?? urlDe(p.receiptKey);
        if (url) comprobantePorUsuario.set(p.userId, url);
      }
    }

    const inscritos = filas.map((f) => ({
      id: f.id,
      name: f.name ?? f.email,
      email: f.email,
      document: f.document,
      identificacionTipo: f.identificacionTipo,
      identificacionNumero: f.identificacionNumero,
      programa: f.programa,
      sede: f.sede,
      fechaInicio: f.fechaInicio,
      createdAt: f.createdAt,
      documentos: {
        identidad: urlDe(f.idDocKey),
        recibo: urlDe(f.utilityBillKey),
        acta: urlDe(f.diplomaKey),
        pagare: urlDe(f.pagareKey),
        comprobante: comprobantePorUsuario.get(f.id) ?? null,
      },
    }));

    const total = Number(totalRes[0]?.total ?? 0);

    // Listas para los filtros: programas y sedes distintos entre quienes tienen
    // documentos (sin depender de la página actual).
    const [programasRows, sedesRows] = await Promise.all([
      db
        .selectDistinct({ valor: users.programa })
        .from(users)
        .where(and(tieneAlgunDoc, isNotNull(users.programa)))
        .orderBy(users.programa),
      db
        .selectDistinct({ valor: users.sede })
        .from(users)
        .where(and(tieneAlgunDoc, isNotNull(users.sede)))
        .orderBy(users.sede),
    ]);

    return NextResponse.json({
      inscritos,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
      programas: programasRows
        .map((r) => r.valor)
        .filter((v): v is string => !!v && v.trim() !== ''),
      sedes: sedesRows
        .map((r) => r.valor)
        .filter((v): v is string => !!v && v.trim() !== ''),
    });
  } catch (error) {
    console.error('[DOCS INSCRIPCION] error listando:', error);
    return NextResponse.json(
      { error: 'No se pudieron cargar los documentos' },
      { status: 500 }
    );
  }
}
