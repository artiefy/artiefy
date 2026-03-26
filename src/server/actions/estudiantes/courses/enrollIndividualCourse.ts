'use server';

import { clerkClient } from '@clerk/nextjs/server';
import { and, eq, inArray } from 'drizzle-orm';
import { randomBytes } from 'node:crypto';

import { sendTicketEmail } from '~/lib/emails/ticketEmails';
import { db } from '~/server/db';
import {
  enrollments,
  lessons,
  userLessonsProgress,
  users,
} from '~/server/db/schema';
import { sortLessons } from '~/utils/lessonSorting';

type ClerkProvisionResult = {
  clerkUserId: string;
  wasCreated: boolean;
  temporaryPassword?: string;
};

function generateSecurePassword(length = 14): string {
  const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lowercase = 'abcdefghijkmnopqrstuvwxyz';
  const numbers = '23456789';
  const symbols = '!@#$%*_-';
  const all = uppercase + lowercase + numbers + symbols;

  const pick = (chars: string) =>
    chars[randomBytes(1)[0] % Math.max(chars.length, 1)] ?? 'A';

  const required = [
    pick(uppercase),
    pick(lowercase),
    pick(numbers),
    pick(symbols),
  ];

  while (required.length < length) {
    required.push(pick(all));
  }

  // Fisher-Yates para mezclar
  for (let i = required.length - 1; i > 0; i -= 1) {
    const j = randomBytes(1)[0] % (i + 1);
    [required[i], required[j]] = [required[j]!, required[i]!];
  }

  return required.join('');
}

function buildNamesFromEmail(email: string) {
  const local = email.split('@')[0] ?? 'estudiante';
  const cleaned = local.replace(/[^a-zA-Z0-9._-]/g, ' ').trim();
  const parts = cleaned
    .split(/[._\-\s]+/)
    .map((p) => p.trim())
    .filter(Boolean);

  const firstNameRaw = parts[0] ?? 'Estudiante';
  const lastNameRaw = parts.slice(1).join(' ') || 'Artiefy';

  const toTitle = (value: string) =>
    value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();

  return {
    firstName: toTitle(firstNameRaw.slice(0, 40)),
    lastName: toTitle(lastNameRaw.slice(0, 60)),
  };
}

async function ensureClerkUserByEmail(
  normalizedEmail: string
): Promise<ClerkProvisionResult> {
  const clerk = await clerkClient();
  const clerkUsers = await clerk.users.getUserList({
    emailAddress: [normalizedEmail],
  });

  if (clerkUsers.totalCount > 0) {
    return {
      clerkUserId: clerkUsers.data[0]!.id,
      wasCreated: false,
    };
  }

  const { firstName, lastName } = buildNamesFromEmail(normalizedEmail);
  const temporaryPassword = generateSecurePassword();
  const base = normalizedEmail
    .split('@')[0]
    ?.toLowerCase()
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, 16);
  const username = `payu_${base || 'student'}_${Date.now().toString(36)}`;

  const created = await clerk.users.createUser({
    firstName,
    lastName,
    username: username.slice(0, 40),
    password: temporaryPassword,
    emailAddress: [normalizedEmail],
    publicMetadata: {
      role: 'estudiante',
      mustChangePassword: true,
      subscriptionStatus: 'inactive',
      createdFrom: 'payu_course_payment',
    },
  });

  return {
    clerkUserId: created.id,
    wasCreated: true,
    temporaryPassword,
  };
}

async function sendCourseAccessCredentialsEmail(params: {
  to: string;
  temporaryPassword: string;
  courseId: number;
}) {
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, '') ||
    'https://artiefy.com';
  const signInUrl = `${baseUrl}/sign-in`;
  const courseUrl = `${baseUrl}/estudiantes/cursos/${params.courseId}`;

  await sendTicketEmail({
    to: params.to,
    subject: 'Tu acceso a Artiefy y a tu curso ya está listo',
    html: `
      <div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.5;">
        <h2 style="margin: 0 0 12px;">Compra confirmada</h2>
        <p>Ya registramos tu compra del curso. Creamos una cuenta para que ingreses con este mismo correo:</p>
        <p style="margin: 12px 0;"><strong>Correo:</strong> ${params.to}</p>
        <p style="margin: 12px 0;"><strong>Contraseña temporal:</strong> ${params.temporaryPassword}</p>
        <p style="margin: 12px 0;">Al entrar, cambia tu contraseña desde tu perfil o usando “Olvidé mi contraseña”.</p>
        <p style="margin: 16px 0;">
          <a href="${signInUrl}" style="display: inline-block; background: #22c4d3; color: #00111f; padding: 10px 14px; border-radius: 999px; text-decoration: none; font-weight: 700;">
            Ingresar a Artiefy
          </a>
        </p>
        <p style="margin: 12px 0;">Tu curso estará disponible en: <a href="${courseUrl}">${courseUrl}</a></p>
      </div>
    `,
  });
}

export async function enrollUserInCourse(userEmail: string, courseId: number) {
  const normalizedEmail = userEmail.trim().toLowerCase();
  console.log('📝 Starting enrollment process:', {
    userEmail: normalizedEmail,
    courseId,
  });

  try {
    // Buscar usuario en la base de datos
    let user = await db.query.users.findFirst({
      where: and(
        eq(users.email, normalizedEmail),
        eq(users.role, 'estudiante')
      ),
    });

    const clerkProvision = await ensureClerkUserByEmail(normalizedEmail);

    if (!user) {
      try {
        await db.insert(users).values({
          id: clerkProvision.clerkUserId,
          email: normalizedEmail,
          name: normalizedEmail.split('@')[0],
          role: 'estudiante',
          subscriptionStatus: 'inactive',
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        // Verificar que el usuario se creó correctamente
        user = await db.query.users.findFirst({
          where: and(
            eq(users.email, normalizedEmail),
            eq(users.role, 'estudiante')
          ),
        });

        if (!user) {
          throw new Error('Error al crear el usuario en la base de datos');
        }

        console.log('✅ New user created:', { id: user.id, email: user.email });
      } catch (error) {
        console.error('❌ Error creating user:', error);
        throw new Error('Error al crear el usuario en la base de datos');
      }
    } else if (user.id !== clerkProvision.clerkUserId) {
      console.error('❌ Usuario legacy desalineado entre DB y Clerk.', {
        email: normalizedEmail,
        dbUserId: user.id,
        clerkUserId: clerkProvision.clerkUserId,
      });
      throw new Error(
        'Conflicto de identidad detectado: el usuario existe con distinto ID en DB y Clerk. Requiere reconciliación para evitar desalineación de acceso.'
      );
    }

    if (clerkProvision.wasCreated && clerkProvision.temporaryPassword) {
      await sendCourseAccessCredentialsEmail({
        to: normalizedEmail,
        temporaryPassword: clerkProvision.temporaryPassword,
        courseId,
      });
      console.log('📧 Credenciales enviadas al comprador:', normalizedEmail);
    }

    if (!user) {
      throw new Error('No se pudo resolver el usuario estudiante');
    }

    console.log('✅ Found student user:', {
      id: user.id,
      email: user.email,
      role: user.role,
    });

    // Verificar inscripción existente con el ID correcto
    const existingEnrollment = await db.query.enrollments.findFirst({
      where: and(
        eq(enrollments.userId, user.id),
        eq(enrollments.courseId, courseId)
      ),
    });

    if (existingEnrollment) {
      console.log('ℹ️ User already enrolled:', { userEmail, courseId });
      return { success: true, message: 'Usuario ya inscrito' };
    }

    // Crear inscripción con el ID del usuario estudiante
    await db.insert(enrollments).values({
      userId: user.id,
      courseId: courseId,
      enrolledAt: new Date(),
      completed: false,
      isPermanent: true,
    });

    // Obtener lecciones
    const courseLessons = await db.query.lessons.findMany({
      where: eq(lessons.courseId, courseId),
    });

    // Ordenar lecciones usando nuestra utilidad de ordenamiento compartida
    const sortedLessons = sortLessons(courseLessons);

    // Buscar específicamente la lección con orderIndex = 1
    const firstLessonWithOrderIndex = courseLessons.find(
      (lesson) => lesson.orderIndex === 1
    );
    const firstLessonId = firstLessonWithOrderIndex?.id ?? null;

    console.log('🔓 Primera lección a desbloquear (orderIndex=1):', {
      firstLessonId,
      lessonTitle: firstLessonWithOrderIndex?.title,
      orderIndex: firstLessonWithOrderIndex?.orderIndex,
    });

    // Obtener IDs de lecciones en el orden correcto
    const lessonIds = sortedLessons.map((lesson) => lesson.id);

    // Obtener registros de progreso existentes para este usuario y estas lecciones específicas
    const existingProgress = await db.query.userLessonsProgress.findMany({
      where: and(
        eq(userLessonsProgress.userId, user.id),
        inArray(userLessonsProgress.lessonId, lessonIds)
      ),
    });

    // Crear un conjunto de progreso de lecciones existentes para una búsqueda más rápida
    const existingProgressSet = new Set(
      existingProgress.map((progress) => progress.lessonId)
    );

    // Procesar cada lección: insertar nuevas o actualizar existentes
    let createdCount = 0;
    let updatedCount = 0;

    for (const lesson of sortedLessons) {
      const isFirstLesson =
        firstLessonId !== null && lesson.id === firstLessonId;
      const isNew = !existingProgressSet.has(lesson.id);

      if (isNew) {
        // Insertar nueva lección
        await db.insert(userLessonsProgress).values({
          userId: user.id,
          lessonId: lesson.id,
          progress: 0,
          isCompleted: false,
          isLocked: !isFirstLesson,
          isNew: isFirstLesson,
          lastUpdated: new Date(),
        });
        createdCount++;

        console.log('📝 Lección INSERTADA:', {
          lessonId: lesson.id,
          title: lesson.title,
          orderIndex: lesson.orderIndex,
          isFirstLesson,
          isLocked: !isFirstLesson,
        });
      } else {
        // Actualizar lección existente: cambiar isLocked según si es la primera
        await db
          .update(userLessonsProgress)
          .set({
            isLocked: !isFirstLesson,
            isNew: isFirstLesson,
            lastUpdated: new Date(),
          })
          .where(
            and(
              eq(userLessonsProgress.userId, user.id),
              eq(userLessonsProgress.lessonId, lesson.id)
            )
          );
        updatedCount++;

        console.log('🔄 Lección ACTUALIZADA:', {
          lessonId: lesson.id,
          title: lesson.title,
          orderIndex: lesson.orderIndex,
          isFirstLesson,
          isLocked: !isFirstLesson,
        });
      }
    }

    console.log('✅ Enrollment successful for student:', {
      userId: user.id,
      email: user.email,
      courseId,
      totalLessonsProcessed: sortedLessons.length,
      createdCount,
      updatedCount,
      clerkAccountCreated: clerkProvision.wasCreated,
    });

    return {
      success: true,
      message: 'Inscripción exitosa',
      clerkAccountCreated: clerkProvision.wasCreated,
      credentialsSent: clerkProvision.wasCreated,
    };
  } catch (error) {
    console.error('❌ Enrollment error:', error);
    throw error;
  }
}
