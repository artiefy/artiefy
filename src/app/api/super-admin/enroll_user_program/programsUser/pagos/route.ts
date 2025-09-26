import { NextResponse } from 'next/server';

import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { clerkClient } from '@clerk/nextjs/server';
import { and, eq, isNull } from 'drizzle-orm';

import { db } from '~/server/db';
import { pagos, users } from '~/server/db/schema';

export const planPrices: Record<string, number> = {
  Pro: 20000,       
  Premium: 35000,
  Enterprise: 60000,
};


function formatDateToClerk(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}



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
  programId: number | null,
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

  const programFolder = programId === null ? 'no-program' : String(programId);


  const key = `documents/pagos/${userId}/${programFolder}/${nroPago}-${Date.now()}${ext}`;
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

const parseProgramId = (v: unknown): number | null => {
  if (v === undefined || v === null) return null;

  // normalizar strings vacíos / 'null' / '0'
  if (typeof v === 'string') {
    const s = v.trim().toLowerCase();
    if (s === '' || s === 'null' || s === '0') return null;
  }

  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return n === 0 ? null : n;
};
  

// GET /api/super-admin/enroll_user_program/programsUser/pagos?userId=...&programId=...
export async function GET(req: Request) {
  const url = new URL(req.url);
  const userId = url.searchParams.get('userId');
  const programId = parseProgramId(url.searchParams.get('programId'));

  if (!userId) {
    return NextResponse.json({ error: 'Falta userId' }, { status: 400 });
  }

  try {
    const [dbUser] = await db.select().from(users).where(eq(users.id, userId));
    if (!dbUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }
    // LOG INICIAL DE PARAMS
console.info('[PAGOS][GET] params', {
  url: req.url,
  userId,
  rawProgramId: new URL(req.url).searchParams.get('programId'),
});

console.info('[PAGOS][GET] parsed', {
  parsedProgramId: programId,
  branch: programId === null ? 'IS NULL' : 'EQUALS',
});

console.info('[PAGOS][GET] parsed', {
  parsedProgramId: programId,
  branch: programId === null ? 'IS NULL' : 'EQUALS',
});



    const pagosUsuarioPrograma = await db
  .select()
  .from(pagos)
  .where(
    and(
      eq(pagos.userId, userId),
      programId ? eq(pagos.programaId, programId) : undefined
    )
  );

  console.info('[PAGOS][GET] resultados', {
  count: pagosUsuarioPrograma.length,
  sample: pagosUsuarioPrograma.slice(0, 5).map(p => ({
    nroPago: p.nroPago,
    programaId: p.programaId ?? null,
    valor: p.valor,
    fecha: p.fecha,
    receipt: Boolean(p.receiptUrl),
  })),
});


    const planType = dbUser.planType && dbUser.planType !== 'none'
      ? dbUser.planType
      : 'Premium';

    const programaPrice = planPrices[planType] ?? planPrices.Premium;
    console.info('[PAGOS][GET] plan y precio', {
  userPlanTypeInDB: dbUser.planType,
  resolvedPlanType: planType,
  programaPrice,
});


    return NextResponse.json({
      pagos: pagosUsuarioPrograma,
      planType,
      programaPrice,
    });
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
const programIdEntry = fd.get('programId'); // puede venir vacío/ausente
const indexEntry = fd.get('index');         // opcional (0..11)
const nroPagoEntry = fd.get('nro_pago');    // opcional
const file = fd.get('receipt');

// ✅ No exigimos programId aquí
if (typeof userIdEntry !== 'string' || !(file instanceof File)) {
  return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 });
}

const userId = userIdEntry.trim();
const programId = parseProgramId(programIdEntry); // number | null

const index =
  typeof indexEntry === 'string' && indexEntry !== ''
    ? Number(indexEntry)
    : undefined;

const nroPago =
  typeof nroPagoEntry === 'string' && nroPagoEntry !== ''
    ? Number(nroPagoEntry)
    : (index ?? NaN) + 1;

if (!userId || !Number.isFinite(nroPago)) {
  return NextResponse.json({ error: 'nro_pago/index inválido' }, { status: 400 });
}

// S3
const { key, url } = await uploadToS3(file, userId, programId, nroPago);

// ✅ WHERE compatible con NULL
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
      programId === null ? isNull(pagos.programaId) : eq(pagos.programaId, programId),
      eq(pagos.nroPago, nroPago)
    )
  )
  .returning();

if (updated.length === 0) {
  return NextResponse.json(
    { error: 'No existe esa cuota. Guarda la cuota antes de subir comprobante.' },
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
const programId = parseProgramId(body.programId); // number | null
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
if (!userId || !Number.isFinite(nroPago)) {
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
    programId === null ? isNull(pagos.programaId) : eq(pagos.programaId, programId),
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
    programId === null ? isNull(pagos.programaId) : eq(pagos.programaId, programId),
    eq(pagos.nroPago, nroPago)
  )
)
;
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

    // ──────────────────────────────
// 🔄 Actualizar plan en Clerk y en la BD
// ──────────────────────────────
// ──────────────────────────────
// 🔄 Calcular fecha fin a partir de la primera cuota
// ──────────────────────────────
const firstPayment = await db
  .select()
  .from(pagos)
.where(
  and(
    eq(pagos.userId, userId),
    programId === null ? isNull(pagos.programaId) : eq(pagos.programaId, programId)
  )
)
  .orderBy(pagos.nroPago) // cuota más antigua
  .limit(1);

if (firstPayment.length === 0) {
  return NextResponse.json(
    { error: 'No existe cuota inicial para este usuario' },
    { status: 400 }
  );
}

const firstDate = new Date(firstPayment[0].fecha); // ej: 2025-09-01
const cutoffDay = firstDate.getDate(); // 1

// Fecha del último pago
const lastPaymentDate = new Date(fecha);

// Calcular fecha fin en el mes del pago
let subscriptionEndDate = new Date(
  lastPaymentDate.getFullYear(),
  lastPaymentDate.getMonth(),
  cutoffDay
);

// Si esa fecha ya pasó respecto al pago → mover al siguiente mes
if (subscriptionEndDate <= lastPaymentDate) {
  subscriptionEndDate = new Date(
    subscriptionEndDate.getFullYear(),
    subscriptionEndDate.getMonth() + 1,
    cutoffDay
  );
}

try {
  // Usuario en tu BD
  const dbUser = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!dbUser?.id) {
    throw new Error("El usuario no tiene clerkId guardado");
  }

  // Plan actual o default Premium
  const normalizedPlanType = dbUser.planType && dbUser.planType !== 'none'
    ? dbUser.planType
    : 'Premium';


const clerk = await clerkClient(); // tu wrapper
await clerk.users.updateUserMetadata(dbUser.id, {
  publicMetadata: {
    planType: normalizedPlanType,
    subscriptionStatus: 'active',
    subscriptionEndDate: formatDateToClerk(subscriptionEndDate),
  },
});
  // BD
  await db
    .update(users)
    .set({
      planType: normalizedPlanType,
      subscriptionStatus: 'active',
      subscriptionEndDate,
    })
    .where(eq(users.id, userId));
} catch (err) {
  console.error('Error actualizando plan en Clerk/DB:', err);
}



    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error al guardar pago:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
