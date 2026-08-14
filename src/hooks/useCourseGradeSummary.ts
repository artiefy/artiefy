'use client';

import useSWR from 'swr';

/**
 * Live grade summary for one student in one course.
 *
 * The course detail, the course header modal and the lesson detail all read the
 * same endpoint, so they share this hook: one key shape means one SWR cache
 * entry and one in-flight request no matter how many components are mounted.
 */

/** Shape returned by `GET /api/grades/summary`. */
export interface CourseGradeSummary {
  finalGrade: number;
  parameters: {
    name: string;
    grade: number;
    weight: number;
    activities: {
      id: number;
      name: string;
      grade: number;
      weight?: number;
    }[];
  }[];
  isCompleted: boolean;
  hasParameters: boolean;
  isFullyGraded: boolean;
  totalParameterActivities: number;
  gradedParameterActivities: number;
  ungradedParameterActivities: number;
}

/**
 * Polling cadence. The endpoint runs several aggregate queries per call, so this
 * stays deliberately above the previous 5s: focus revalidation plus an explicit
 * `mutate()` after the student submits an activity already cover the cases where
 * an immediate refresh is actually perceptible.
 */
const REFRESH_INTERVAL_MS = 10_000;

/** Collapses the request burst produced when several views mount at once. */
const DEDUPING_INTERVAL_MS = 5_000;

/**
 * Shared cache key. Every caller must build it through this helper, otherwise
 * SWR treats the views as unrelated resources and polls once per view.
 */
export function buildGradeSummaryKey(
  courseId: number | null | undefined,
  userId: string | null | undefined
): string | null {
  if (!courseId || !userId) return null;
  return `/api/grades/summary?courseId=${courseId}&userId=${encodeURIComponent(
    userId
  )}`;
}

const fetchGradeSummary = async (url: string): Promise<CourseGradeSummary> => {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Error fetching ${url}: ${response.status}`);
  }
  return (await response.json()) as CourseGradeSummary;
};

export function useCourseGradeSummary(
  courseId: number | null | undefined,
  userId: string | null | undefined
) {
  const { data, error, isLoading, mutate } = useSWR<CourseGradeSummary>(
    buildGradeSummaryKey(courseId, userId),
    fetchGradeSummary,
    {
      refreshInterval: REFRESH_INTERVAL_MS,
      dedupingInterval: DEDUPING_INTERVAL_MS,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      // Avoids the modal flashing empty while a poll is in flight.
      keepPreviousData: true,
    }
  );

  return {
    gradeSummary: data ?? null,
    error,
    isLoading,
    /** Call after the student submits an activity for an instant refresh. */
    refreshGradeSummary: mutate,
  };
}
