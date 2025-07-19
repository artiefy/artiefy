import { NextResponse } from 'next/server';

import { and, eq, inArray,sql } from 'drizzle-orm';

import { db } from '~/server/db';
import {
  courses,
  enrollmentPrograms,
  enrollments,
  lessons,
  programas,
  userCustomFields,
  userLessonsProgress,
  users,
} from '~/server/db/schema';
import { sortLessons } from '~/utils/lessonSorting';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const programId = url.searchParams.get('programId');

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

    // Traer los campos dinámicos
    const customFields = await db
      .select({
        userId: userCustomFields.userId,
        fieldKey: userCustomFields.fieldKey,
        fieldValue: userCustomFields.fieldValue,
      })
      .from(userCustomFields);

    const customFieldsMap = new Map<string, Record<string, string>>();
    for (const row of customFields) {
      if (!customFieldsMap.has(row.userId)) {
        customFieldsMap.set(row.userId, {});
      }
      customFieldsMap.get(row.userId)![row.fieldKey] = row.fieldValue;
    }

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
        programTitle: programas.title,
        courseTitle: courses.title,
        enrolledAt: latestEnrollments.enrolledAt,
        nivelNombre: sql<string>`(SELECT n.name FROM nivel n
			JOIN courses c ON c.nivelid = n.id
			JOIN enrollments e ON e.course_id = c.id
			WHERE e.user_id = ${users.id}
			LIMIT 1)`.as('nivelNombre'),
      })
      .from(users)
      .innerJoin(latestEnrollments, eq(users.id, latestEnrollments.userId))
      .innerJoin(programas, eq(latestEnrollments.programaId, programas.id))
      .innerJoin(
        latestCourseEnrollments,
        eq(users.id, latestCourseEnrollments.userId)
      )
      .innerJoin(courses, eq(latestCourseEnrollments.courseId, courses.id))
      .where(
        programId
          ? and(
              eq(users.role, 'estudiante'),
              eq(programas.id, Number(programId))
            )
          : eq(users.role, 'estudiante')
      );

    // Agregar los campos dinámicos a cada estudiante
    const enrichedStudents = students.map((student) => ({
      ...student,
      programTitles: programsMap.get(student.id) ?? [],
      customFields: customFieldsMap.get(student.id) ?? {},
    }));

    const coursesList = await db
      .select({
        id: sql<string>`CAST(${courses.id} AS TEXT)`.as('id'),
        title: courses.title,
      })
      .from(courses);

    const enrolledUsers = enrichedStudents.map((s) => ({
      id: s.id,
      programTitle: s.programTitle,
    }));

    return NextResponse.json({
      students: enrichedStudents,
      enrolledUsers,
      courses: coursesList,
    });
  } catch (error) {
    console.error('❌ Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

interface EnrollmentRequestBody {
  userIds: string[];
  courseIds: string[];
}

export async function POST(req: Request) {
  try {
    const rawBody = (await req.json()) as unknown;

    if (
      !rawBody ||
      typeof rawBody !== 'object' ||
      !('userIds' in rawBody) ||
      !('courseIds' in rawBody) ||
      !Array.isArray((rawBody as EnrollmentRequestBody).userIds) ||
      !Array.isArray((rawBody as EnrollmentRequestBody).courseIds)
    ) {
      return NextResponse.json(
        { error: 'Parámetros inválidos' },
        { status: 400 }
      );
    }

    const body = rawBody as EnrollmentRequestBody;
    const { userIds, courseIds } = body;

    if (!userIds || !courseIds) {
      return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 });
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
              eq(enrollments.courseId, parseInt(courseId, 10))
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

      // Crear progreso de lecciones por cada (userId, courseId) insertado
      for (const { userId, courseId } of insertData) {
        const courseLessons = await db.query.lessons.findMany({
          where: eq(lessons.courseId, courseId),
        });

        const sortedLessons = sortLessons(courseLessons);

        const lessonIds: (string | number)[] = sortedLessons.map(
          (lesson) => lesson.id
        );

        // Verificación defensiva
        if (lessonIds.length === 0) {
          continue;
        }

        const existingProgress = await db.query.userLessonsProgress.findMany({
          where: and(
            eq(userLessonsProgress.userId, userId),
            inArray(userLessonsProgress.lessonId, lessonIds)
          ),
        });

        const existingProgressSet = new Set(
          existingProgress.map((progress) => progress.lessonId)
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
  } catch (error) {
    console.error('Error al matricular estudiantes:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
