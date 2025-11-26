import { NextResponse } from 'next/server';

import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { and, eq, inArray, sql } from 'drizzle-orm';

import { db } from '~/server/db';
import {
  courses,
  enrollmentPrograms,
  enrollments,
  lessons,
  pagos,
  programas,
  userCartera,
  userLessonsProgress,
  users,
} from '~/server/db/schema';
import { sortLessons } from '~/utils/lessonSorting';

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

async function uploadToS3(file: File, userId: string) {
  const buf = Buffer.from(await file.arrayBuffer());
  const ext = file.type?.includes('pdf')
    ? '.pdf'
    : file.type?.includes('png')
      ? '.png'
      : file.type?.includes('jpeg')
        ? '.jpg'
        : '';

  const key = `documents/cartera/${userId}/${Date.now()}${ext}`;
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

// Última gestión de cartera por usuario
const latestCarteraDates = db
  .select({
    userId: userCartera.userId,
    latestUpdatedAt: sql`MAX(${userCartera.updatedAt})`.as('latestUpdatedAt'),
  })
  .from(userCartera)
  .groupBy(userCartera.userId)
  .as('latest_cartera_dates');

const latestCartera = db
  .select({
    userId: userCartera.userId,
    status: userCartera.status,
    receiptKey: userCartera.receiptKey,
    updatedAt: userCartera.updatedAt,
  })
  .from(userCartera)
  .innerJoin(
    latestCarteraDates,
    and(
      eq(userCartera.userId, latestCarteraDates.userId),
      eq(userCartera.updatedAt, latestCarteraDates.latestUpdatedAt)
    )
  )
  .as('latest_cartera');

interface EnrollBody {
  userIds: string[];
  courseIds: string[];
}
interface UpdateCarteraBody {
  action: 'updateCartera';
  userId: string;
  status: 'activo' | 'inactivo';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === 'string');
}
function isEnrollBody(v: unknown): v is EnrollBody {
  if (!isRecord(v)) return false;
  const { userIds, courseIds } = v;
  return isStringArray(userIds) && isStringArray(courseIds);
}
function isUpdateCarteraBody(v: unknown): v is UpdateCarteraBody {
  if (!isRecord(v)) return false;
  const { action, userId, status } = v;
  return (
    action === 'updateCartera' &&
    typeof userId === 'string' &&
    (status === 'activo' || status === 'inactivo')
  );
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const programId = url.searchParams.get('programId');
  const userId = url.searchParams.get('userId');

  try {
    const latestDates = db
      .select({
        userId: enrollmentPrograms.userId,
        latestEnrolledAt: sql`MAX(${enrollmentPrograms.enrolledAt})`.as(
          'latestEnrolledAt'
        ),
      })
      .from(enrollmentPrograms)
      .groupBy(enrollmentPrograms.userId)
      .as('latest_dates');

    const latestEnrollments = db
      .select({
        userId: enrollmentPrograms.userId,
        programaId: enrollmentPrograms.programaId,
        enrolledAt: enrollmentPrograms.enrolledAt,
      })
      .from(enrollmentPrograms)
      .innerJoin(
        latestDates,
        and(
          eq(enrollmentPrograms.userId, latestDates.userId),
          eq(enrollmentPrograms.enrolledAt, latestDates.latestEnrolledAt)
        )
      )
      .as('latest_enrollments');

    const allEnrollments = await db
      .select({
        userId: enrollmentPrograms.userId,
        programTitle: programas.title,
      })
      .from(enrollmentPrograms)
      .innerJoin(programas, eq(enrollmentPrograms.programaId, programas.id));

    // Agrupar programas por estudiante
    const programsMap = new Map<string, string[]>();
    for (const enrollment of allEnrollments) {
      if (!programsMap.has(enrollment.userId)) {
        programsMap.set(enrollment.userId, []);
      }
      programsMap.get(enrollment.userId)!.push(enrollment.programTitle);
    }
    // 1) Fechas máximas de inscripción a cursos
    const latestCourseDates = db
      .select({
        userId: enrollments.userId,
        latestEnrolledAt: sql`MAX(${enrollments.enrolledAt})`.as(
          'latestEnrolledAt'
        ),
      })
      .from(enrollments)
      .groupBy(enrollments.userId)
      .as('latest_course_dates');

    // 2) Únete a esa subconsulta para quedarte sólo con la fila más reciente
    const latestCourseEnrollments = db
      .select({
        userId: enrollments.userId,
        courseId: enrollments.courseId,
        enrolledAt: enrollments.enrolledAt,
      })
      .from(enrollments)
      .innerJoin(
        latestCourseDates,
        and(
          eq(enrollments.userId, latestCourseDates.userId),
          eq(enrollments.enrolledAt, latestCourseDates.latestEnrolledAt)
        )
      )
      .as('latest_course_enrollments');

    const students = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        address: users.address,
        country: users.country,
        city: users.city,
        birthDate: users.birthDate,
        subscriptionStatus: users.subscriptionStatus,
        subscriptionEndDate: users.subscriptionEndDate,
        planType: users.planType,
        role: users.role,
        purchaseDate: users.purchaseDate,

        // campos que ya estabas usando
        document: users.document,
        modalidad: users.modalidad,
        inscripcionValor: users.inscripcionValor,
        paymentMethod: users.paymentMethod,
        cuota1Fecha: users.cuota1Fecha,
        cuota1Metodo: users.cuota1Metodo,
        cuota1Valor: users.cuota1Valor,
        valorPrograma: users.valorPrograma,
        inscripcionOrigen: users.inscripcionOrigen,

        // 🆕 campos migrados desde user_inscription_details
        identificacionTipo: users.identificacionTipo,
        identificacionNumero: users.identificacionNumero,
        nivelEducacion: users.nivelEducacion,
        tieneAcudiente: users.tieneAcudiente,
        acudienteNombre: users.acudienteNombre,
        acudienteContacto: users.acudienteContacto,
        acudienteEmail: users.acudienteEmail,

        programa: users.programa,
        fechaInicio: users.fechaInicio,
        comercial: users.comercial,
        sede: users.sede,
        horario: users.horario,
        numeroCuotas: users.numeroCuotas,
        pagoInscripcion: users.pagoInscripcion,
        pagoCuota1: users.pagoCuota1,

        // claves S3
        idDocKey: users.idDocKey,
        utilityBillKey: users.utilityBillKey,
        diplomaKey: users.diplomaKey,
        pagareKey: users.pagareKey,
      })
      .from(users)
      // ⬇️ dejamos los joins para que el filtro por programId siga funcionando, aunque no traigamos columnas externas
      .leftJoin(latestEnrollments, eq(users.id, latestEnrollments.userId))
      .leftJoin(programas, eq(latestEnrollments.programaId, programas.id))
      .leftJoin(
        latestCourseEnrollments,
        eq(users.id, latestCourseEnrollments.userId)
      )
      .leftJoin(courses, eq(latestCourseEnrollments.courseId, courses.id))
      .leftJoin(latestCartera, eq(users.id, latestCartera.userId))
      .where(
        and(
          eq(users.role, 'estudiante'),
          programId ? eq(programas.id, Number(programId)) : sql`true`
        )
      );

    const enrichedStudents = students.map((student) => ({
      ...student,
      programTitles: programsMap.get(student.id) ?? [],
    }));

    const coursesList = await db
      .select({
        id: sql<string>`CAST(${courses.id} AS TEXT)`.as('id'),
        title: courses.title,
      })
      .from(courses);

    // Reemplaza tu versión actual por esta:
    const enrolledUsers = Array.from(programsMap.entries()).map(
      ([id, titles]) => ({
        id,
        programTitle: titles[0] ?? null, // ← string | null
      })
    );

    // --- PRECIO DEL PROGRAMA Y PAGOS ---
    type PagoRow = typeof pagos.$inferSelect;

    let programaPrice: number | null = null;
    let pagosUsuarioPrograma: PagoRow[] = [];
    let totalPagado = 0;
    let deuda: number | null = null;

    if (userId && programId) {
      // Traer precio del programa
      const programaRows = await db
        .select()
        .from(programas)
        .where(eq(programas.id, Number(programId)));

      const programa = programaRows[0];
      programaPrice = programa?.price ?? null;

      // Traer pagos del usuario para ese programa
      pagosUsuarioPrograma = await db
        .select()
        .from(pagos)
        .where(
          and(eq(pagos.userId, userId), eq(pagos.programaId, Number(programId)))
        );

      // Sumar pagos de forma segura
      totalPagado = pagosUsuarioPrograma.reduce<number>(
        (acc, p) => acc + (p.valor ?? 0),
        0
      );

      deuda =
        programaPrice !== null
          ? Math.max(programaPrice - totalPagado, 0)
          : null;
    }

    return NextResponse.json({
      students: enrichedStudents,
      enrolledUsers,
      courses: coursesList,
      programaPrice,
      pagosUsuarioPrograma,
      totalPagado,
      deuda,
    });
  } catch (error) {
    console.error('❌ Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get('content-type') ?? '';

    if (contentType.includes('multipart/form-data')) {
      const form = await req.formData();

      const actionEntry = form.get('action');
      const action = typeof actionEntry === 'string' ? actionEntry : null;

      if (action === 'uploadCarteraReceipt') {
        const userIdEntry = form.get('userId');
        if (typeof userIdEntry !== 'string' || userIdEntry.trim() === '') {
          return NextResponse.json(
            { error: 'userId inválido' },
            { status: 400 }
          );
        }
        const userId = userIdEntry;

        const fileEntry = form.get('receipt');
        if (!(fileEntry instanceof File)) {
          return NextResponse.json(
            { error: 'Archivo faltante o inválido' },
            { status: 400 }
          );
        }
        const file = fileEntry; // ✔️ ya es File

        const { key, url } = await uploadToS3(file, userId);

        await db.insert(userCartera).values({
          userId,
          status: 'activo',
          receiptKey: key,
          receiptName: file.name ?? 'comprobante', // ✔️ sin any
          receiptUrl: url,
        });

        return NextResponse.json({
          ok: true,
          status: 'activo',
          receiptUrl: url,
        });
      }
    }

    if (contentType.includes('application/json')) {
      const raw: unknown = await req.json().catch(() => null);

      // matriculación
      if (isEnrollBody(raw)) {
        const { userIds, courseIds } = raw;

        if (userIds.length === 0 || courseIds.length === 0) {
          return NextResponse.json(
            { error: 'Faltan parámetros' },
            { status: 400 }
          );
        }

        const insertData: { userId: string; courseId: number }[] = [];

        for (const userId of userIds) {
          for (const courseId of courseIds) {
            const existingEnrollment = await db
              .select()
              .from(enrollments)
              .where(
                and(
                  eq(enrollments.userId, userId),
                  eq(enrollments.courseId, Number(courseId))
                )
              )
              .limit(1);

            if (existingEnrollment.length === 0) {
              insertData.push({ userId, courseId: Number(courseId) });
            }
          }
        }

        if (insertData.length > 0) {
          await db.insert(enrollments).values(insertData);

          for (const { userId, courseId } of insertData) {
            const courseLessons = await db.query.lessons.findMany({
              where: eq(lessons.courseId, courseId),
            });
            const sortedLessons = sortLessons(courseLessons);
            const lessonIds = sortedLessons.map((l) => Number(l.id));
            if (lessonIds.length === 0) continue;

            const existingProgress =
              await db.query.userLessonsProgress.findMany({
                where: and(
                  eq(userLessonsProgress.userId, userId),
                  inArray(userLessonsProgress.lessonId, lessonIds)
                ),
              });
            const existingProgressSet = new Set(
              existingProgress.map((p) => p.lessonId)
            );

            for (const [index, lesson] of sortedLessons.entries()) {
              if (!existingProgressSet.has(lesson.id)) {
                const isFirstOrWelcome =
                  index === 0 ||
                  lesson.title.toLowerCase().includes('bienvenida') ||
                  lesson.title.toLowerCase().includes('clase 1');

                await db.insert(userLessonsProgress).values({
                  userId,
                  lessonId: lesson.id,
                  progress: 0,
                  isCompleted: false,
                  isLocked: !isFirstOrWelcome,
                  isNew: true,
                  lastUpdated: new Date(),
                });
              }
            }
          }
        }

        return NextResponse.json({ success: true });
      }

      // actualizar estado de cartera
      if (isUpdateCarteraBody(raw)) {
        const { userId, status } = raw;
        await db.insert(userCartera).values({ userId, status });
        return NextResponse.json({ ok: true, status });
      }
    }

    // Si no coinciden condiciones anteriores:
    return NextResponse.json(
      { error: 'Parámetros inválidos' },
      { status: 400 }
    );
  } catch (error) {
    console.error('❌ Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
