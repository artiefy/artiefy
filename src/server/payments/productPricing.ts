import { eq } from 'drizzle-orm';

import { db } from '~/server/db';
import {
  courseCourseTypes,
  courses,
  courseTypes,
  guidedProjects,
} from '~/server/db/schema';

/**
 * Server-side source of truth for what a course or guided project costs.
 * Checkout routes price from here and confirmation webhooks compare against
 * it, so a value coming from the browser never decides an amount.
 */

export const PAYMENT_CURRENCY = 'COP';

/** Largest gap, in COP, tolerated between the paid value and the DB price. */
const AMOUNT_TOLERANCE = 0.01;

export interface ProductSale {
  title: string;
  /** Price in COP, 0 when the product has none. */
  amount: number;
  /** Published and sold on its own (not only through a plan). */
  isPurchasable: boolean;
}

export async function getCourseSale(
  courseId: number
): Promise<ProductSale | null> {
  const [row] = await db
    .select({
      title: courses.title,
      courseTypeId: courses.courseTypeId,
      isActive: courses.isActive,
      individualPrice: courses.individualPrice,
      typePrice: courseTypes.price,
      isPurchasableIndividually: courseTypes.isPurchasableIndividually,
    })
    .from(courses)
    .leftJoin(courseTypes, eq(courses.courseTypeId, courseTypes.id))
    .where(eq(courses.id, courseId))
    .limit(1);

  if (!row) return null;

  // A course can have several types: the primary `course_type_id` plus rows in
  // `course_course_types` (the course page offers "Comprar" when ANY of them
  // is purchasable on its own), so both are checked.
  const linkedTypes = await db
    .select({
      courseTypeId: courseCourseTypes.courseTypeId,
      isPurchasableIndividually: courseTypes.isPurchasableIndividually,
    })
    .from(courseCourseTypes)
    .leftJoin(courseTypes, eq(courseCourseTypes.courseTypeId, courseTypes.id))
    .where(eq(courseCourseTypes.courseId, courseId));

  // Course type 4 is this repo's "pago unitario" type; the flag on a course
  // type covers any other type marked purchasable on its own.
  const soldAlone =
    row.courseTypeId === 4 ||
    row.isPurchasableIndividually === true ||
    linkedTypes.some(
      (type) =>
        type.courseTypeId === 4 || type.isPurchasableIndividually === true
    );
  const amount = row.individualPrice ?? row.typePrice ?? 0;

  return {
    title: row.title,
    amount,
    isPurchasable: row.isActive !== false && soldAlone && amount > 0,
  };
}

export async function getGuidedProjectSale(
  projectId: number
): Promise<ProductSale | null> {
  const [row] = await db
    .select({
      title: guidedProjects.title,
      isActive: guidedProjects.isActive,
      individualPrice: guidedProjects.individualPrice,
    })
    .from(guidedProjects)
    .where(eq(guidedProjects.id, projectId))
    .limit(1);

  if (!row) return null;

  // The project page offers the purchase whenever a positive individual price
  // exists, so that is the rule enforced here too.
  const amount = row.individualPrice ?? 0;

  return {
    title: row.title,
    amount,
    isPurchasable: row.isActive !== false && amount > 0,
  };
}

/** True when a PayU `value` and `currency` match the expected sale. */
export function paidAmountMatches(
  value: string,
  currency: string,
  expectedAmount: number
): boolean {
  if (currency !== PAYMENT_CURRENCY) return false;
  const paid = Number(value);
  if (!Number.isFinite(paid)) return false;
  return Math.abs(paid - expectedAmount) <= AMOUNT_TOLERANCE;
}
