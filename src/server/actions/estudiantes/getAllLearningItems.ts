'use server';

import { and, desc, eq, isNull, or } from 'drizzle-orm';

import { db } from '~/server/db';
import {
  categories,
  courses,
  courseTypes,
  guidedProjects,
  modalidades,
  nivel,
  typesCourses,
  users,
} from '~/server/db/schema';
import { withRetry } from '~/server/db/withRetry';

import type { Course } from '~/types';

export type UnifiedItem = Course & { isGuidedProject?: boolean };

export async function getAllLearningItems(): Promise<UnifiedItem[]> {
  try {
    // 1. Fetch Courses
    const coursesData = await withRetry(() =>
      db
        .select({
          id: courses.id,
          title: courses.title,
          description: courses.description,
          coverImageKey: courses.coverImageKey,
          categoryid: courses.categoryid,
          instructor: courses.instructor,
          instructorName: users.name,
          creatorId: courses.creatorId,
          createdAt: courses.createdAt,
          updatedAt: courses.updatedAt,
          rating: courses.rating,
          modalidadesid: courses.modalidadesid,
          nivelid: courses.nivelid,
          categoryName: categories.name,
          modalidadName: modalidades.name,
          nivelName: nivel.name,
          courseTypeId: courses.courseTypeId,
          courseTypeName: courseTypes.name,
          isActive: courses.isActive,
          individualPrice: courses.individualPrice,
          is_featured: courses.is_featured,
          is_top: courses.is_top,
          visibility: courses.visibility,
          typeCourseId: typesCourses.id,
          typeCourseType: typesCourses.type,
        })
        .from(courses)
        .leftJoin(categories, eq(courses.categoryid, categories.id))
        .leftJoin(modalidades, eq(courses.modalidadesid, modalidades.id))
        .leftJoin(nivel, eq(courses.nivelid, nivel.id))
        .leftJoin(courseTypes, eq(courses.courseTypeId, courseTypes.id))
        .leftJoin(users, eq(courses.instructor, users.id))
        .leftJoin(typesCourses, eq(courses.idTypesCourses, typesCourses.id))
        .where(
          and(
            eq(courses.requiresProgram, false),
            or(isNull(courses.visibility), eq(courses.visibility, true))
          )
        )
        .orderBy(desc(courses.createdAt))
    );

    // 2. Fetch Guided Projects
    const projectsData = await withRetry(() =>
      db
        .select({
          id: guidedProjects.id,
          title: guidedProjects.title,
          description: guidedProjects.description,
          coverImageKey: guidedProjects.coverImageKey,
          coverVideoKey: guidedProjects.coverVideoKey,
          categoryId: guidedProjects.categoryId,
          instructor: guidedProjects.instructor,
          instructorName: users.name,
          creatorId: guidedProjects.creatorId,
          createdAt: guidedProjects.createdAt,
          updatedAt: guidedProjects.updatedAt,
          rating: guidedProjects.rating,
          modalidadId: guidedProjects.modalidadId,
          nivelId: guidedProjects.nivelId,
          categoryName: categories.name,
          modalidadName: modalidades.name,
          nivelName: nivel.name,
          isActive: guidedProjects.isActive,
          individualPrice: guidedProjects.individualPrice,
          requiresProgram: guidedProjects.requiresProgram,
          isFeatured: guidedProjects.isFeatured,
          isTop: guidedProjects.isTop,
          visibility: guidedProjects.visibility,
          typeCourseId: typesCourses.id,
          typeCourseType: typesCourses.type,
        })
        .from(guidedProjects)
        .leftJoin(categories, eq(guidedProjects.categoryId, categories.id))
        .leftJoin(modalidades, eq(guidedProjects.modalidadId, modalidades.id))
        .leftJoin(nivel, eq(guidedProjects.nivelId, nivel.id))
        .leftJoin(
          typesCourses,
          eq(guidedProjects.typeCourseId, typesCourses.id)
        )
        .leftJoin(users, eq(guidedProjects.instructor, users.id))
        .where(
          or(
            isNull(guidedProjects.visibility),
            eq(guidedProjects.visibility, true)
          )
        )
        .orderBy(desc(guidedProjects.createdAt))
    );

    // 3. Transform and Unify
    const unifiedItems: UnifiedItem[] = [
      ...coursesData.map(
        (c) =>
          ({
            ...c,
            isGuidedProject: false,
            totalStudents: 0,
            lessons: [],
            category: {
              id: c.categoryid,
              name: c.categoryName ?? '',
              description: '',
              is_featured: false,
            },
            modalidad: { name: c.modalidadName ?? '' },
            nivel: { name: c.nivelName ?? '' },
            requiresProgram: false,
            isActive: c.isActive ?? false,
            is_featured: c.is_featured ?? false,
            is_top: c.is_top ?? false,
            individualPrice: c.individualPrice,
            typeCourse: c.typeCourseId
              ? { id: c.typeCourseId, type: c.typeCourseType ?? '' }
              : null,
          }) as UnifiedItem
      ),
      ...projectsData.map(
        (p) =>
          ({
            ...p,
            isGuidedProject: true,
            categoryid: p.categoryId,
            instructorName: p.instructorName ?? p.instructor,
            creatorId: p.creatorId,
            modalidadesid: p.modalidadId,
            nivelid: p.nivelId,
            courseTypeId: p.typeCourseId,
            totalStudents: 0,
            lessons: [],
            category: {
              id: p.categoryId,
              name: p.categoryName ?? '',
              description: '',
              is_featured: false,
            },
            modalidad: { name: p.modalidadName ?? '' },
            nivel: { name: p.nivelName ?? '' },
            requiresProgram: p.requiresProgram ?? false,
            isActive: p.isActive ?? false,
            is_featured: p.isFeatured ?? false,
            is_top: p.isTop ?? false,
            individualPrice: p.individualPrice,
            typeCourse: p.typeCourseId
              ? { id: p.typeCourseId, type: p.typeCourseType ?? '' }
              : null,
          }) as UnifiedItem
      ),
    ];

    // Sort by createdAt desc
    return unifiedItems.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch (err) {
    console.error('Error in getAllLearningItems:', err);
    return [];
  }
}
