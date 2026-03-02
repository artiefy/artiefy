'use server';

import { addDays } from 'date-fns';
import { formatInTimeZone, toDate } from 'date-fns-tz';
import { and, eq, gte, inArray, isNotNull, lte, or } from 'drizzle-orm';

import { env } from '~/env';
import { sendProjectActivityDueEmail } from '~/server/actions/estudiantes/email/sendProjectActivityDueEmail';
import { createNotification } from '~/server/actions/estudiantes/notifications/createNotification';
import { db } from '~/server/db';
import {
  projectActivities,
  projectActivityDeliveries,
  projects,
  specificObjectives,
  users,
} from '~/server/db/schema';

const TIMEZONE = 'America/Bogota';
const ALERT_DAYS = new Set([5, 3, 1, 0]);
const MS_PER_DAY = 1000 * 60 * 60 * 24;
const START_HOUR = 6;

const toDateString = (value: unknown): string | null => {
  if (!value) return null;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (/^\d{4}-\d{2}-\d{2}$/u.test(trimmed)) {
      return trimmed;
    }
    const parsed = new Date(trimmed);
    if (Number.isNaN(parsed.getTime())) return null;
    return formatInTimeZone(parsed, TIMEZONE, 'yyyy-MM-dd');
  }
  if (value instanceof Date) {
    return formatInTimeZone(value, TIMEZONE, 'yyyy-MM-dd');
  }
  return null;
};

const dateStringToUtcMs = (dateStr: string) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return Date.UTC(year, month - 1, day);
};

const getBogotaHour = (date: Date) =>
  Number(formatInTimeZone(date, TIMEZONE, 'H'));

const getNextRunAt = (date: Date) => {
  const todayStr = formatInTimeZone(date, TIMEZONE, 'yyyy-MM-dd');
  const baseRun = toDate(`${todayStr} 06:00:00`, {
    timeZone: TIMEZONE,
  });

  if (getBogotaHour(date) < START_HOUR) {
    return baseRun;
  }

  return addDays(baseRun, 1);
};

interface CheckOptions {
  userId?: string;
  enforceAfterSix?: boolean;
}

async function runProjectActivitiesDueCheck(options: CheckOptions = {}) {
  const now = new Date();
  const { userId, enforceAfterSix = false } = options;

  if (enforceAfterSix && getBogotaHour(now) < START_HOUR) {
    const nextRunAt = getNextRunAt(now);
    return {
      checked: 0,
      notified: 0,
      emailsSent: 0,
      skipped: true,
      reason: 'before-6am',
      nextRunAt: nextRunAt.toISOString(),
      timestamp: formatInTimeZone(now, TIMEZONE, 'yyyy-MM-dd HH:mm:ss zzz'),
    };
  }

  const todayStr = formatInTimeZone(now, TIMEZONE, 'yyyy-MM-dd');
  const maxDateStr = formatInTimeZone(addDays(now, 5), TIMEZONE, 'yyyy-MM-dd');

  const baseConditions = [
    isNotNull(projectActivities.endDate),
    gte(projectActivities.endDate, todayStr),
    lte(projectActivities.endDate, maxDateStr),
  ];

  if (typeof userId === 'string' && userId.length > 0) {
    const scopedUserId: string = userId;
    const userScopeClause = or(
      eq(projectActivities.responsibleUserId, scopedUserId),
      eq(projects.userId, scopedUserId)
    );

    if (userScopeClause) {
      baseConditions.push(userScopeClause);
    }
  }

  const whereClause = and(...baseConditions);
  if (!whereClause) {
    throw new Error(
      'No se pudieron construir condiciones para actividades del proyecto'
    );
  }

  const activitiesQuery = db
    .select({
      activityId: projectActivities.id,
      activityDescription: projectActivities.description,
      endDate: projectActivities.endDate,
      deliverableUrl: projectActivities.deliverableUrl,
      deliverableSubmittedAt: projectActivities.deliverableSubmittedAt,
      projectId: projects.id,
      projectName: projects.name,
      projectOwnerId: projects.userId,
      responsibleUserId: projectActivities.responsibleUserId,
      objectiveDescription: specificObjectives.description,
    })
    .from(projectActivities)
    .innerJoin(projects, eq(projects.id, projectActivities.projectId))
    .leftJoin(
      specificObjectives,
      eq(specificObjectives.id, projectActivities.objectiveId)
    )
    .where(whereClause);

  const activities = await activitiesQuery;

  const targetUserIds = new Set<string>();
  const activityIds = new Set<number>();

  const activitiesWithTargets = activities
    .map((activity) => {
      const targetUserId =
        userId ?? activity.responsibleUserId ?? activity.projectOwnerId;
      if (!targetUserId) return null;
      targetUserIds.add(targetUserId);
      activityIds.add(activity.activityId);
      return { ...activity, targetUserId };
    })
    .filter(Boolean) as Array<
    (typeof activities)[number] & { targetUserId: string }
  >;

  if (activitiesWithTargets.length === 0) {
    return {
      checked: 0,
      notified: 0,
      emailsSent: 0,
      skipped: false,
      timestamp: formatInTimeZone(now, TIMEZONE, 'yyyy-MM-dd HH:mm:ss zzz'),
    };
  }

  const userIds = [...targetUserIds];
  const userRows =
    userIds.length > 0
      ? await db
          .select({
            id: users.id,
            email: users.email,
            name: users.name,
          })
          .from(users)
          .where(inArray(users.id, userIds))
      : [];

  const userMap = new Map(userRows.map((user) => [user.id, user]));

  const deliveryRows =
    activityIds.size > 0 && userIds.length > 0
      ? await db
          .select({
            activityId: projectActivityDeliveries.activityId,
            userId: projectActivityDeliveries.userId,
            entregado: projectActivityDeliveries.entregado,
          })
          .from(projectActivityDeliveries)
          .where(
            and(
              inArray(projectActivityDeliveries.activityId, [...activityIds]),
              inArray(projectActivityDeliveries.userId, userIds)
            )
          )
      : [];

  const deliveryMap = new Map(
    deliveryRows.map((delivery) => [
      `${delivery.activityId}:${delivery.userId}`,
      delivery,
    ])
  );

  let notified = 0;
  let emailsSent = 0;

  for (const activity of activitiesWithTargets) {
    const endDateStr = toDateString(activity.endDate);
    if (!endDateStr) continue;

    const daysLeft = Math.round(
      (dateStringToUtcMs(endDateStr) - dateStringToUtcMs(todayStr)) / MS_PER_DAY
    );

    if (!ALERT_DAYS.has(daysLeft)) continue;

    const deliveryKey = `${activity.activityId}:${activity.targetUserId}`;
    const delivery = deliveryMap.get(deliveryKey);
    const hasGlobalDeliverable =
      Boolean(activity.deliverableUrl) ||
      Boolean(activity.deliverableSubmittedAt);
    if (hasGlobalDeliverable || delivery?.entregado) continue;

    const timeLeftText =
      daysLeft === 0 ? 'hoy' : daysLeft === 1 ? '1 día' : `${daysLeft} días`;

    const title =
      daysLeft === 0
        ? '¡Entrega vence hoy!'
        : `Entrega pendiente (${timeLeftText})`;

    const message =
      daysLeft === 0
        ? `La actividad "${activity.activityDescription}" del proyecto "${activity.projectName}" vence hoy.`
        : `Faltan ${timeLeftText} para entregar la actividad "${activity.activityDescription}" del proyecto "${activity.projectName}".`;

    const created = await createNotification({
      userId: activity.targetUserId,
      type: 'PROJECT_ACTIVITY_DUE',
      title,
      message,
      metadata: {
        projectId: activity.projectId,
        activityId: activity.activityId,
        projectName: activity.projectName,
        daysLeft,
        dueDate: endDateStr,
      },
    });

    if (created) {
      notified++;

      const user = userMap.get(activity.targetUserId);
      if (user?.email) {
        const projectUrl = `${env.NEXT_PUBLIC_BASE_URL}/estudiantes/projects/${activity.projectId}?activityId=${activity.activityId}`;
        const emailResult = await sendProjectActivityDueEmail({
          to: user.email,
          userName: user.name ?? '',
          projectName: activity.projectName,
          activityDescription: activity.activityDescription,
          objectiveDescription: activity.objectiveDescription ?? undefined,
          dueDate: endDateStr,
          timeLeft: timeLeftText,
          projectUrl,
        });

        if (emailResult.success) {
          emailsSent++;
        }
      }
    }
  }

  return {
    checked: activitiesWithTargets.length,
    notified,
    emailsSent,
    skipped: false,
    timestamp: formatInTimeZone(now, TIMEZONE, 'yyyy-MM-dd HH:mm:ss zzz'),
  };
}

export async function checkProjectActivitiesDue() {
  return runProjectActivitiesDueCheck();
}

export async function checkProjectActivitiesDueForUser(userId: string) {
  return runProjectActivitiesDueCheck({ userId, enforceAfterSix: true });
}
