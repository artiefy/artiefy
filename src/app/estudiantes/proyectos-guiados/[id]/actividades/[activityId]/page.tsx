import { type Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';

import { auth, currentUser } from '@clerk/nextjs/server';
import { format, isValid } from 'date-fns';
import { es } from 'date-fns/locale';

import { Header } from '~/components/estudiantes/layout/Header';
import { GuidedActivityDetails } from '~/components/estudiantes/proyectos/GuidedActivityDetails';
import { coverKeyToUrl, storageKeyToUrl } from '~/lib/profileCover';
import { getGuidedProjectById } from '~/server/actions/estudiantes/guided-projects/getGuidedProjectById';

import type {
  GuidedObjective,
  GuidedObjectiveActivity,
} from '~/types/guided-projects';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageProps {
  params: Promise<{
    id: string;
    activityId: string;
  }>;
}

const parseId = (value: string) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const toCalendarDate = (value: Date | string | null) => {
  if (!value) return null;
  if (typeof value === 'string') {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) return null;
    const [, year, month, day] = match;
    const parsedYear = Number(year);
    const parsedMonth = Number(month) - 1;
    const parsedDay = Number(day);
    const parsed = new Date(parsedYear, parsedMonth, parsedDay);
    return isValid(parsed) &&
      parsed.getFullYear() === parsedYear &&
      parsed.getMonth() === parsedMonth &&
      parsed.getDate() === parsedDay
      ? parsed
      : null;
  }

  if (!isValid(value)) return null;
  const usesUtcCalendar =
    value.getUTCHours() === 0 &&
    value.getUTCMinutes() === 0 &&
    value.getUTCSeconds() === 0;
  return usesUtcCalendar
    ? new Date(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate())
    : new Date(value.getFullYear(), value.getMonth(), value.getDate());
};

const formatActivityDates = (
  startDate: Date | string | null,
  endDate: Date | string | null
) => {
  const start = toCalendarDate(startDate);
  const end = toCalendarDate(endDate);
  const formattedStart =
    start && isValid(start)
      ? format(start, 'd MMM yyyy', { locale: es })
      : null;
  const formattedEnd =
    end && isValid(end) ? format(end, 'd MMM yyyy', { locale: es }) : null;

  if (formattedStart && formattedEnd) {
    return `${formattedStart} – ${formattedEnd}`;
  }
  return formattedStart ?? formattedEnd;
};

const compareActivities = (
  first: GuidedObjectiveActivity,
  second: GuidedObjectiveActivity
) => {
  const weekDifference =
    (first.weekNumber ?? Number.MAX_SAFE_INTEGER) -
    (second.weekNumber ?? Number.MAX_SAFE_INTEGER);
  if (weekDifference !== 0) return weekDifference;

  const firstDate =
    toCalendarDate(first.startDate)?.getTime() ?? Number.MAX_SAFE_INTEGER;
  const secondDate =
    toCalendarDate(second.startDate)?.getTime() ?? Number.MAX_SAFE_INTEGER;
  const dateDifference = firstDate - secondDate;
  return dateDifference !== 0 ? dateDifference : first.id - second.id;
};

const resolveImageUrl = (key: string | null) => {
  if (!key) return null;
  return /^https?:\/\//i.test(key) || key.startsWith('/')
    ? storageKeyToUrl(key)
    : coverKeyToUrl(key);
};

const parseResources = (objective: GuidedObjective) => {
  const keys = (objective.resourceKey ?? '')
    .split(',')
    .map((key) => key.trim())
    .filter(Boolean);
  const names = (objective.resourceNames ?? '')
    .split(',')
    .map((name) => name.trim());

  return keys.flatMap((key, index) => {
    const url = storageKeyToUrl(key);
    if (!url) return [];
    return [
      {
        name: names[index] || key.split('/').pop() || `Recurso ${index + 1}`,
        url,
      },
    ];
  });
};

export default async function GuidedActivityPage({ params }: PageProps) {
  const { id, activityId } = await params;
  const projectId = parseId(id);
  const parsedActivityId = parseId(activityId);

  if (!projectId || !parsedActivityId) {
    notFound();
  }

  const { userId, redirectToSignIn } = await auth();
  if (!userId) {
    return redirectToSignIn();
  }

  const project = await getGuidedProjectById(projectId, userId);
  if (!project?.enrolled) {
    notFound();
  }

  const user = await currentUser();
  const planType = String(user?.publicMetadata?.planType ?? '').toLowerCase();
  const subscriptionStatus = user?.publicMetadata?.subscriptionStatus;
  const subscriptionEndDate = user?.publicMetadata?.subscriptionEndDate as
    string | null | undefined;
  const hasValidPlan = ['pro', 'premium', 'enterprise'].includes(planType);
  const isSubscriptionValid =
    subscriptionStatus === 'active' &&
    (!subscriptionEndDate || new Date(subscriptionEndDate) > new Date());

  if (!hasValidPlan || !isSubscriptionValid) {
    redirect('/planes?subscription_expired=1');
  }

  const objectives = project.objectives ?? [];
  const currentObjective = objectives.find(
    (objective) =>
      objective.isEnabled &&
      objective.activities?.some((activity) => activity.id === parsedActivityId)
  );
  const activity = currentObjective?.activities?.find(
    (item) => item.id === parsedActivityId
  );

  if (!currentObjective || !activity) {
    notFound();
  }

  const navigationObjectives = objectives
    .filter((objective) => objective.isEnabled)
    .sort(
      (first, second) =>
        first.orderIndex - second.orderIndex || first.id - second.id
    )
    .map((objective) => ({
      id: objective.id,
      title: objective.title,
      orderIndex: objective.orderIndex,
      activities: [...(objective.activities ?? [])]
        .sort(compareActivities)
        .map((item) => ({
          id: item.id,
          name: item.name,
          isCompleted: item.isCompleted ?? false,
        })),
    }));
  const hasCurrentActivity = navigationObjectives.some((objective) =>
    objective.activities.some((item) => item.id === activity.id)
  );

  if (!hasCurrentActivity) {
    notFound();
  }

  const visibleActivities = navigationObjectives.flatMap(
    (objective) => objective.activities
  );
  const visibleCompletedActivities = visibleActivities.filter(
    (item) => item.isCompleted
  ).length;
  const visibleProgress =
    visibleActivities.length === 0
      ? 0
      : Math.round(
          (visibleCompletedActivities / visibleActivities.length) * 100
        );

  const coverImageKey =
    currentObjective.coverImageKey ?? project.coverImageKey ?? null;
  const coverVideoKey =
    currentObjective.coverVideoKey ?? project.coverVideoKey ?? null;

  return (
    <>
      <Header />
      <GuidedActivityDetails
        key={activity.id}
        projectId={project.id}
        projectTitle={project.title}
        currentObjectiveId={currentObjective.id}
        objectiveTitle={currentObjective.title}
        objectiveDescription={currentObjective.description}
        activity={{
          id: activity.id,
          name: activity.name,
          description: activity.description,
          weekNumber: activity.weekNumber,
          dateLabel: formatActivityDates(activity.startDate, activity.endDate),
          instructionText: activity.instructionText,
        }}
        coverImageUrl={resolveImageUrl(coverImageKey)}
        instructionVideoKey={activity.instructionVideoKey}
        coverVideoKey={coverVideoKey}
        resources={parseResources(currentObjective)}
        objectives={navigationObjectives}
        progress={visibleProgress}
      />
    </>
  );
}
