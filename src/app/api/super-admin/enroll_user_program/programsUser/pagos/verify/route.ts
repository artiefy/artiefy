import { NextResponse } from 'next/server';

import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { and, eq, isNull } from 'drizzle-orm';

import { db } from '~/server/db';
import { pagos, pagoVerificaciones, users } from '~/server/db/schema';

export const runtime = 'nodejs';

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────
interface VerifyJsonBody {
  userId?: string;
  programId?: number | string | null;
  nro_pago?: number | string;
  verified?: boolean;
  verifiedBy?: string;
  notes?: string | null;
}

// ─────────────────────────────────────────────────────────
// Helpers de logging
// ─────────────────────────────────────────────────────────
function newReqId(): string {
  const r = Math.random().toString(36).slice(2, 7);
  return `${Date.now().toString(36)}-${r}`;
}

function log(reqId: string, ...args: unknown[]): void {
  // Prefijo para agrupar en logs
  console.log(`[verify][${reqId}]`, ...args);
}

function warn(reqId: string, ...args: unknown[]): void {
  console.warn(`[verify][${reqId}]`, ...args);
}

function err(reqId: string, ...args: unknown[]): void {
  console.error(`[verify][${reqId}]`, ...args);
}

function safe(v: unknown): unknown {
  try {
    if (v instanceof File) {
      return { isFile: true, name: v.name, type: v.type, size: v.size };
    }
    return JSON.parse(JSON.stringify(v));
  } catch {
    return String(v);
  }
}

// ─────────────────────────────────────────────────────────
// ENV / S3
// ─────────────────────────────────────────────────────────
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

function parseProgramId(v: unknown): number | null {
  if (v === undefined || v === null) return null;
  if (typeof v === 'string') {
    const s = v.trim().toLowerCase();
    if (s === '' || s === 'null' || s === '0') return null;
  }
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return n === 0 ? null : n;
}

function getFormDataValue(formData: FormData, key: string): string {
  const value = formData.get(key);
  if (value === null) return '';
  if (typeof value === 'string') return value;
  // Handle File objects or other non-string values safely
  if (value instanceof File) return value.name || '';
  // For other objects, convert to string safely
  return String(value);
}

async function uploadVerifiedToS3(
  file: File,
  userId: string,
  programId: number | null,
  nroPago: number,
  reqId: string
): Promise<{ key: string; url: string }> {
  console.time(`[verify][${reqId}] S3 upload verified`);
  const buf = Buffer.from(await file.arrayBuffer());
  const ext = file.type?.includes('pdf')
    ? '.pdf'
    : file.type?.includes('png')
      ? '.png'
      : file.type?.includes('jpeg')
        ? '.jpg'
        : '';

  const programFolder = programId === null ? 'no-program' : String(programId);
  const key = `documents/pagos-verified/${userId}/${programFolder}/${nroPago}-${Date.now()}${ext}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buf,
      ContentType: file.type || 'application/octet-stream',
    })
  );
  console.timeEnd(`[verify][${reqId}] S3 upload verified`);
  return { key, url: `${PUBLIC_BASE_URL}/${key}` };
}

// PATCH/POST /api/.../pagos/verify
// - JSON: { userId, programId, nro_pago, verified:boolean, verifiedBy, notes? }
// - multipart/form-data: { userId, programId, nro_pago, verifiedBy, notes?, file }
export async function POST(req: Request): Promise<NextResponse> {
  const reqId = newReqId();
  const startedAt = new Date();

  try {
    const contentType = req.headers.get('content-type') ?? '';
    log(reqId, '▶️ Nueva petición', {
      method: 'POST',
      contentType,
      startedAt: startedAt.toISOString(),
    });

    // ──────────────────────────────
    // MULTIPART (subida archivo verificado)
    // ──────────────────────────────
    if (contentType.includes('multipart/form-data')) {
      console.time(`[verify][${reqId}] multipart total`);
      const fd = await req.formData();

      const userId = getFormDataValue(fd, 'userId').trim();
      const programId = parseProgramId(fd.get('programId'));
      const nroPago = Number(fd.get('nro_pago') ?? NaN);
      let verifiedBy = getFormDataValue(fd, 'verifiedBy').trim() || null;
      const notes = fd.get('notes');
      const file = fd.get('file');

      log(reqId, '📦 FD recibida:', {
        userId,
        programId,
        nroPago,
        verifiedBy,
        hasFile: file instanceof File,
        notes: typeof notes === 'string' ? notes : null,
      });

      // Validación "verifiedBy" contra users (si llega algo)
      if (verifiedBy) {
        console.time(`[verify][${reqId}] check verifiedBy (multipart)`);
        const [exists] = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.id, verifiedBy));
        console.timeEnd(`[verify][${reqId}] check verifiedBy (multipart)`);
        if (!exists) {
          warn(
            reqId,
            'verifiedBy no existe en users; se usará null para no romper FK'
          );
          verifiedBy = null;
        }
      }

      // Validaciones de parámetros
      const invalids: string[] = [];
      if (!userId) invalids.push('userId vacío');
      if (!Number.isFinite(nroPago)) invalids.push('nro_pago inválido');
      if (!(file instanceof File)) invalids.push('file ausente o inválido');
      if (invalids.length) {
        warn(reqId, '❌ Parámetros inválidos:', invalids);
        console.timeEnd(`[verify][${reqId}] multipart total`);
        return NextResponse.json(
          { error: 'Parámetros inválidos', details: invalids },
          { status: 400 }
        );
      }

      // Sube archivo verificado
      const { key, url } = await uploadVerifiedToS3(
        file as File,
        userId,
        programId,
        nroPago,
        reqId
      );
      log(reqId, '☁️ S3 verificado subido:', { key, url });

      // UPDATE pago
      console.time(`[verify][${reqId}] update pagos (multipart)`);
      const updated = await db
        .update(pagos)
        .set({
          receiptVerified: true,
          receiptVerifiedAt: new Date(),
          receiptVerifiedBy: verifiedBy, // puede ser null si no existe
          verifiedReceiptKey: key,
          verifiedReceiptUrl: url,
          verifiedReceiptName: (file as File).name ?? 'comprobante-verificado',
        })
        .where(
          and(
            eq(pagos.userId, userId),
            programId === null
              ? isNull(pagos.programaId)
              : eq(pagos.programaId, programId),
            eq(pagos.nroPago, nroPago)
          )
        )
        .returning();
      console.timeEnd(`[verify][${reqId}] update pagos (multipart)`);

      if (updated.length === 0) {
        warn(reqId, '⚠️ Pago no encontrado para actualizar', {
          userId,
          programId,
          nroPago,
        });
        console.timeEnd(`[verify][${reqId}] multipart total`);
        return NextResponse.json(
          { error: 'Pago no encontrado' },
          { status: 404 }
        );
      }
      log(reqId, '✅ Pago actualizado (multipart):', safe(updated[0]));

      // LOG en tabla intermedia
      console.time(`[verify][${reqId}] insert pago_verificaciones (multipart)`);
      await db.insert(pagoVerificaciones).values({
        pagoId: updated[0].id,
        verifiedBy: verifiedBy ?? null,
        notes: typeof notes === 'string' ? notes : null,
        fileKey: key,
        fileUrl: url,
        fileName: (file as File).name ?? 'comprobante-verificado',
      });
      console.timeEnd(
        `[verify][${reqId}] insert pago_verificaciones (multipart)`
      );
      log(reqId, '🧾 Log de verificación (multipart) insertado');

      console.timeEnd(`[verify][${reqId}] multipart total`);
      return NextResponse.json({ ok: true, pago: updated[0] });
    }

    // ──────────────────────────────
    // JSON (marcar/desmarcar sin archivo)
    // ──────────────────────────────
    console.time(`[verify][${reqId}] json total`);
    const body = (await req.json().catch(() => null)) as VerifyJsonBody | null;

    log(reqId, '📨 BODY JSON:', safe(body));

    const userId = String(body?.userId ?? '').trim();
    const programId = parseProgramId(body?.programId);
    const nroPago = Number(body?.nro_pago ?? NaN);
    const verified = Boolean(body?.verified);
    let verifiedBy = String(body?.verifiedBy ?? '').trim() || null;
    const notes = body?.notes ?? null;

    log(reqId, '🔎 Normalizado JSON:', {
      userId,
      programId,
      nroPago,
      verified,
      verifiedBy,
      hasNotes: typeof notes === 'string' && !!notes.trim(),
    });

    // validación verifiedBy contra users (si llega algo)
    if (verifiedBy) {
      console.time(`[verify][${reqId}] check verifiedBy (json)`);
      const [exists] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.id, verifiedBy));
      console.timeEnd(`[verify][${reqId}] check verifiedBy (json)`);
      if (!exists) {
        warn(
          reqId,
          'verifiedBy no existe en users; se usará null para no romper FK'
        );
        verifiedBy = null;
      }
    }

    // ✅ Validación sin exigir verifiedBy (puede ser null si no existe en users)
    const invalids: string[] = [];
    if (!userId) invalids.push('userId vacío');
    if (!Number.isFinite(nroPago)) invalids.push('nro_pago inválido');
    if (typeof verified !== 'boolean') invalids.push('verified no es boolean');

    if (invalids.length) {
      warn(reqId, '❌ Parámetros inválidos:', invalids);
      console.timeEnd(`[verify][${reqId}] json total`);
      return NextResponse.json(
        { error: 'Parámetros inválidos', details: invalids },
        { status: 400 }
      );
    }

    // UPDATE pago
    console.time(`[verify][${reqId}] update pagos (json)`);
    const updated = await db
      .update(pagos)
      .set({
        receiptVerified: verified,
        receiptVerifiedAt: verified ? new Date() : null,
        receiptVerifiedBy: verified ? verifiedBy : null, // puede ser null
      })
      .where(
        and(
          eq(pagos.userId, userId),
          programId === null
            ? isNull(pagos.programaId)
            : eq(pagos.programaId, programId),
          eq(pagos.nroPago, nroPago)
        )
      )
      .returning();
    console.timeEnd(`[verify][${reqId}] update pagos (json)`);

    if (updated.length === 0) {
      warn(reqId, '⚠️ Pago no encontrado para actualizar', {
        userId,
        programId,
        nroPago,
      });
      console.timeEnd(`[verify][${reqId}] json total`);
      return NextResponse.json(
        { error: 'Pago no encontrado' },
        { status: 404 }
      );
    }
    log(reqId, '✅ Pago actualizado (json):', safe(updated[0]));

    // LOG intermedio
    console.time(`[verify][${reqId}] insert pago_verificaciones (json)`);
    await db.insert(pagoVerificaciones).values({
      pagoId: updated[0].id,
      verifiedBy: verifiedBy ?? null,
      notes: notes ?? null,
    });
    console.timeEnd(`[verify][${reqId}] insert pago_verificaciones (json)`);
    log(reqId, '🧾 Log de verificación (json) insertado');

    console.timeEnd(`[verify][${reqId}] json total`);
    return NextResponse.json({ ok: true, pago: updated[0] });
  } catch (e) {
    err(reqId, '💥 Error en verify:', e);
    return NextResponse.json(
      { error: 'Error interno', reqId },
      { status: 500 }
    );
  } finally {
    const endedAt = new Date();
    log(reqId, '⏹ Fin petición', {
      endedAt: endedAt.toISOString(),
      ms: endedAt.getTime() - startedAt.getTime(),
    });
  }
}
