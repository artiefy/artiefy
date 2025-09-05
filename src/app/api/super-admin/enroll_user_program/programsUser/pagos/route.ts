import { NextResponse } from 'next/server';

import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { and, eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { pagos } from '~/server/db/schema';

export const runtime = 'nodejs';

const REGION = process.env.AWS_REGION ?? 'us-east-2';
const BUCKET = process.env.AWS_S3_BUCKET ?? process.env.AWS_BUCKET_NAME ?? '';
const PUBLIC_BASE_URL =
  process.env.NEXT_PUBLIC_AWS_S3_URL ??
  `https://s3.${REGION}.amazonaws.com/${BUCKET}`;

if (!BUCKET) throw new Error('Falta AWS_S3_BUCKET o AWS_BUCKET_NAME');

const s3 = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

async function uploadToS3(
  file: File,
  userId: string,
  programId: number,
  nroPago: number
) {
  const buf = Buffer.from(await file.arrayBuffer());
  const ext = file.type?.includes('pdf')
    ? '.pdf'
    : file.type?.includes('png')
      ? '.png'
      : file.type?.includes('jpeg')
        ? '.jpg'
        : '';

  const key = `documents/pagos/${userId}/${programId}/${nroPago}-${Date.now()}${ext}`;
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buf,
      ContentType: file.type || 'application/octet-stream',
    })
  );
  return { key, url: `${PUBLIC_BASE_URL}/${key}` };
}

// Define el tipo del body que esperas
interface JsonBody {
  userId?: string | number;
  programId?: number | string;
  index?: number | string;
  concepto?: string;
  nro_pago?: number | string;
  fecha?: string;
  metodo?: string;
  valor?: number | string;
}

// Helper seguro que “coacciona” cualquier unknown a JsonBody sin usar any
function coerceJsonBody(u: unknown): JsonBody {
  if (u && typeof u === 'object') {
    const r = u as Record<string, unknown>;
    return {
      userId:
        typeof r.userId === 'string' || typeof r.userId === 'number'
          ? r.userId
          : undefined,
      programId:
        typeof r.programId === 'string' || typeof r.programId === 'number'
          ? r.programId
          : undefined,
      index:
        typeof r.index === 'string' || typeof r.index === 'number'
          ? r.index
          : undefined,
      concepto: typeof r.concepto === 'string' ? r.concepto : undefined,
      nro_pago:
        typeof r.nro_pago === 'string' || typeof r.nro_pago === 'number'
          ? r.nro_pago
          : undefined,
      fecha: typeof r.fecha === 'string' ? r.fecha : undefined,
      metodo: typeof r.metodo === 'string' ? r.metodo : undefined,
      valor:
        typeof r.valor === 'string' || typeof r.valor === 'number'
          ? r.valor
          : undefined,
    };
  }
  return {};
}

// GET /api/super-admin/enroll_user_program/programsUser/pagos?userId=...&programId=...
export async function GET(req: Request) {
  const url = new URL(req.url);
  const userId = url.searchParams.get('userId');
  const programId = url.searchParams.get('programId');
  if (!userId || !programId) {
    return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 });
  }
  try {
    const pagosUsuarioPrograma = await db
      .select()
      .from(pagos)
      .where(
        and(eq(pagos.userId, userId), eq(pagos.programaId, Number(programId)))
      );
    return NextResponse.json({ pagos: pagosUsuarioPrograma });
  } catch (error) {
    console.error('Error al consultar pagos:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

// POST /api/super-admin/enroll_user_program/programsUser/pagos
// Body: { userId, programId, index, concepto, nro_pago, fecha, metodo, valor }
export async function POST(req: Request) {
  try {
    const contentType = req.headers.get('content-type') ?? '';

    // ──────────────────────────────
    // Branch MULTIPART (subida de comprobante)
    // ──────────────────────────────
    if (contentType.includes('multipart/form-data')) {
      const fd = await req.formData();

      const userIdEntry = fd.get('userId');
      const programIdEntry = fd.get('programId');
      const indexEntry = fd.get('index'); // opcional (0..11)
      const nroPagoEntry = fd.get('nro_pago'); // opcional
      const file = fd.get('receipt');

      // Evita "no-base-to-string": valida tipos antes de usar
      if (
        typeof userIdEntry !== 'string' ||
        typeof programIdEntry !== 'string' ||
        !(file instanceof File)
      ) {
        return NextResponse.json(
          { error: 'Parámetros inválidos' },
          { status: 400 }
        );
      }

      const userId = userIdEntry.trim();
      const programId = Number(programIdEntry);

      const index =
        typeof indexEntry === 'string' && indexEntry !== ''
          ? Number(indexEntry)
          : undefined;

      const nroPago =
        typeof nroPagoEntry === 'string' && nroPagoEntry !== ''
          ? Number(nroPagoEntry)
          : (index ?? NaN) + 1;

      if (!userId || !Number.isFinite(programId) || !Number.isFinite(nroPago)) {
        return NextResponse.json(
          { error: 'nro_pago/index inválido' },
          { status: 400 }
        );
      }

      // Subir a S3
      const { key, url } = await uploadToS3(file, userId, programId, nroPago);

      // Actualizar la fila del pago (debe existir)
      const updated = await db
        .update(pagos)
        .set({
          receiptKey: key,
          receiptUrl: url,
          receiptName: file.name ?? 'comprobante',
          receiptUploadedAt: new Date(),
        })
        .where(
          and(
            eq(pagos.userId, userId),
            eq(pagos.programaId, programId),
            eq(pagos.nroPago, nroPago)
          )
        )
        .returning();

      if (updated.length === 0) {
        return NextResponse.json(
          {
            error:
              'No existe esa cuota. Guarda la cuota antes de subir comprobante.',
          },
          { status: 404 }
        );
      }

      return NextResponse.json({ ok: true, receiptUrl: url, pago: updated[0] });
    }

    // ──────────────────────────────
    // Branch JSON (crear/actualizar pago)
    // ──────────────────────────────

    interface JsonBody {
      userId?: string | number;
      programId?: number | string;
      index?: number | string;
      concepto?: string;
      nro_pago?: number | string;
      fecha?: string;
      metodo?: string;
      valor?: number | string;
    }

    // Nota: ya trataste el branch multipart arriba; aquí solo tratamos JSON/otros
    let rawUnknown: unknown = null;

    if (contentType.includes('application/json')) {
      try {
        rawUnknown = await req.json();
      } catch {
        rawUnknown = null;
      }
    } else {
      // intenta parsear como JSON por si te mandan application/*+json u otros
      try {
        rawUnknown = await req.json();
      } catch {
        rawUnknown = null;
      }
    }

    // ✅ sin any, sin unsafe-return
    const body: JsonBody = coerceJsonBody(rawUnknown);

    const userId = String(body.userId ?? '').trim();
    const programId = Number(body.programId ?? NaN);
    const index = Number(body.index ?? 0);
    const concepto = body.concepto ?? '';
    const nroPago = Number(body.nro_pago ?? index + 1);
    const metodo = body.metodo ?? '';
    const valor = Number(body.valor ?? 0);

    // fecha en formato 'YYYY-MM-DD' OBLIGATORIA (schema notNull)
    const fechaInput = typeof body.fecha === 'string' ? body.fecha : '';
    const fecha =
      fechaInput && !Number.isNaN(new Date(fechaInput).getTime())
        ? new Date(fechaInput).toISOString().split('T')[0]
        : null;

    if (!userId || !Number.isFinite(programId) || !Number.isFinite(nroPago)) {
      return NextResponse.json(
        { error: 'Parámetros inválidos' },
        { status: 400 }
      );
    }

    if (!fecha) {
      return NextResponse.json(
        { error: 'La fecha es obligatoria' },
        { status: 400 }
      );
    }

    // ¿Existe ya un pago con (userId, programaId, nroPago)?
    const existing = await db
      .select()
      .from(pagos)
      .where(
        and(
          eq(pagos.userId, userId),
          eq(pagos.programaId, programId),
          eq(pagos.nroPago, nroPago)
        )
      );

    if (existing.length > 0) {
      await db
        .update(pagos)
        .set({
          concepto,
          metodo,
          valor,
          fecha, // string 'YYYY-MM-DD'
        })
        .where(
          and(
            eq(pagos.userId, userId),
            eq(pagos.programaId, programId),
            eq(pagos.nroPago, nroPago)
          )
        );
    } else {
      await db.insert(pagos).values({
        userId,
        programaId: programId,
        concepto,
        nroPago,
        fecha, // obligatorio por notNull
        metodo,
        valor,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error al guardar pago:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
