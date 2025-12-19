'use server';

import { eq, isNull, or } from 'drizzle-orm';

import { db } from '~/server/db';
import { courses } from '~/server/db/schema';

export type CourseTypeCounts = {
  premium: number;
  pro: number;
  free: number;
  individual: number;
};

type CourseTypeInfo = {
  requiredSubscriptionLevel: string | null;
  isPurchasableIndividually: boolean | null;
};

const baseCounts: CourseTypeCounts = {
  premium: 0,
  pro: 0,
  free: 0,
  individual: 0,
};

export async function getCourseTypeCounts(): Promise<CourseTypeCounts> {
  try {
    const [baseCourseTypes, relatedCourseTypes] = await Promise.all([
      db.query.courses.findMany({
        columns: { id: true, isActive: true },
        with: {
          courseType: {
            columns: {
              requiredSubscriptionLevel: true,
              isPurchasableIndividually: true,
            },
          },
        },
        where: or(eq(courses.isActive, true), isNull(courses.isActive)),
      }),
      db.query.courseCourseTypes.findMany({
        with: {
          course: {
            columns: { id: true, isActive: true },
          },
          courseType: {
            columns: {
              requiredSubscriptionLevel: true,
              isPurchasableIndividually: true,
            },
          },
        },
      }),
    ]);

    const typeMap = new Map<number, CourseTypeInfo[]>();

    const appendType = (courseId: number, info: CourseTypeInfo | null) => {
      if (!info) return;
      const arr = typeMap.get(courseId) ?? [];
      arr.push(info);
      typeMap.set(courseId, arr);
    };

    baseCourseTypes.forEach((course) => {
      if (course.isActive === false) return;
      appendType(course.id, course.courseType ?? null);
    });

    relatedCourseTypes.forEach((relation) => {
      const courseId = relation.course?.id;
      const isActive = relation.course?.isActive;
      if (!courseId || isActive === false) return;
      appendType(courseId, relation.courseType ?? null);
    });

    const counts: CourseTypeCounts = { ...baseCounts };

    for (const [, types] of typeMap.entries()) {
      const hasPremium = types.some(
        (t) => t.requiredSubscriptionLevel === 'premium'
      );
      const hasPro = types.some((t) => t.requiredSubscriptionLevel === 'pro');
      const hasFree = types.some(
        (t) =>
          t.requiredSubscriptionLevel === 'none' &&
          t.isPurchasableIndividually === false
      );
      const hasIndividual = types.some(
        (t) => t.isPurchasableIndividually === true
      );

      if (hasPremium) counts.premium += 1;
      if (hasPro) counts.pro += 1;
      if (hasFree) counts.free += 1;
      if (hasIndividual) counts.individual += 1;
    }

    return counts;
  } catch (error) {
    console.error('Error obteniendo conteos de cursos por tipo:', error);
    return { ...baseCounts };
  }
}

export default getCourseTypeCounts;
