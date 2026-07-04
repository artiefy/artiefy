import { eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { activities } from '~/server/db/schema';

/**
 * Server-side enforcement of an activity's submission time window.
 *
 * An activity may define `fechaInicioActividad` (not available before this
 * instant) and/or `fechaMaximaEntrega` (not accepted after this instant).
 * When both are null the activity has no restriction and is always open.
 *
 * This mirrors the frontend gate in `LessonActivityModal`, but is the
 * authoritative check: the UI can be bypassed, the API cannot.
 */
export interface SubmissionWindowState {
  isOpen: boolean;
  notStarted: boolean;
  closed: boolean;
  message: string | null;
}

const toValidDate = (value: Date | string | null | undefined): Date | null => {
  if (!value) return null;
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatWindowDate = (date: Date): string =>
  new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);

export function getActivitySubmissionWindow(
  fechaInicioActividad: Date | string | null | undefined,
  fechaMaximaEntrega: Date | string | null | undefined
): SubmissionWindowState {
  const now = Date.now();
  const start = toValidDate(fechaInicioActividad);
  const deadline = toValidDate(fechaMaximaEntrega);

  const notStarted = start ? now < start.getTime() : false;
  const closed = deadline ? now > deadline.getTime() : false;

  let message: string | null = null;
  if (notStarted && start) {
    message = `Esta actividad estará disponible a partir del ${formatWindowDate(start)}.`;
  } else if (closed && deadline) {
    message = `El plazo de entrega venció el ${formatWindowDate(deadline)}.`;
  }

  return { isOpen: !notStarted && !closed, notStarted, closed, message };
}

/**
 * Fetches the activity's window dates and evaluates the window. If the activity
 * does not exist, returns an open state so the caller's own not-found handling
 * (if any) is not masked by a window error.
 */
export async function checkActivitySubmissionWindow(
  activityId: number
): Promise<SubmissionWindowState> {
  const activity = await db.query.activities.findFirst({
    where: eq(activities.id, activityId),
    columns: {
      fechaInicioActividad: true,
      fechaMaximaEntrega: true,
    },
  });

  if (!activity) {
    return { isOpen: true, notStarted: false, closed: false, message: null };
  }

  return getActivitySubmissionWindow(
    activity.fechaInicioActividad,
    activity.fechaMaximaEntrega
  );
}
