'use server';

import { eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { courses } from '~/server/db/schema';

import type { Course } from '~/types';

/**
 * Get featured courses from the database
 * @returns Array of courses marked as featured
 */
export async function getFeaturedCourses(): Promise<Course[]> {
  try {
    const featuredCourses = await db.query.courses.findMany({
      where: eq(courses.is_featured, true),
      with: {
        category: true,
        modalidad: true,
      },
      limit: 5,
    });

    // Map database results to Course type with required defaults
    return featuredCourses.map((course) => ({
      ...course,
      totalStudents: 0, // Default value
      lessons: [], // Default empty array
      requiresProgram: false, // Default value
      isActive: course.isActive ?? false, // Use nullable value or default to false
    })) as Course[];
  } catch (error) {
    console.error('Error fetching featured courses:', error);
    return [];
  }
}

/**
 * Get top courses from the database
 * @returns Array of courses marked as top
 */
export async function getTopCourses(): Promise<Course[]> {
  try {
    const topCourses = await db.query.courses.findMany({
      where: eq(courses.is_top, true),
      with: {
        category: true,
        modalidad: true,
      },
      limit: 10,
    });

    // Map database results to Course type with required defaults
    return topCourses.map((course) => ({
      ...course,
      totalStudents: 0, // Default value
      lessons: [], // Default empty array
      requiresProgram: false, // Default value
      isActive: course.isActive ?? false, // Use nullable value or default to false
    })) as Course[];
  } catch (error) {
    console.error('Error fetching top courses:', error);
    return [];
  }
}

/**
 * Get both featured and top courses
 * @returns Object containing featured and top courses
 */
export async function getFeaturedAndTopCourses(): Promise<{
  featuredCourses: Course[];
  topCourses: Course[];
}> {
  const [featured, top] = await Promise.all([
    getFeaturedCourses(),
    getTopCourses(),
  ]);

  return {
    featuredCourses: featured,
    topCourses: top,
  };
}
