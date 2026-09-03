'use server';

import { eq } from 'drizzle-orm';

import { db } from '~/server/db';
import {
  guidedProjectInstructors,
  guidedProjects,
  userGuidedActivityProgress,
  userObjectiveProgress,
  users,
} from '~/server/db/schema';
import { getGuidedProjectContentAccess } from '~/server/services/guided-projects/guidedForumAccess';

import type {
  GuidedObjective,
  GuidedObjectiveActivity,
  GuidedProject,
  GuidedProjectInstructor,
} from '~/types';

export async function getGuidedProjectById(
  guidedProjectId: number | string,
  userId: string | null = null
): Promise<GuidedProject | null> {
  try {
    const parsedProjectId = Number(guidedProjectId);
    if (isNaN(parsedProjectId)) {
      console.error('Invalid guided project ID:', guidedProjectId);
      return null;
    }

    const project = await db.query.guidedProjects.findFirst({
      where: eq(guidedProjects.id, parsedProjectId),
      with: {
        instructorUser: true,
        category: true,
        modalidad: true,
        nivel: true,
        objectives: {
          with: {
            activities: {
              columns: {
                id: true,
                name: true,
                description: true,
                objectiveId: true,
                revisada: true,
                parametroId: true,
                porcentaje: true,
                fechaMaximaEntrega: true,
                lastUpdated: true,
                typeId: true,
                startDate: true,
                endDate: true,
                weekNumber: true,
                instructionVideoKey: true,
                instructionText: true,
              },
            },
          },
        },
        enrollments: true,
      },
    });

    if (!project) {
      return null;
    }

    const contentAccess = userId
      ? await getGuidedProjectContentAccess({
          projectId: parsedProjectId,
          userId,
        })
      : null;
    const canAccessContent = contentAccess?.success ?? false;

    const instructorRows = await db
      .select({
        id: users.id,
        name: users.name,
        profesion: users.profesion,
        descripcion: users.descripcion,
        profileImageKey: users.profileImageKey,
      })
      .from(guidedProjectInstructors)
      .innerJoin(users, eq(guidedProjectInstructors.instructorId, users.id))
      .where(eq(guidedProjectInstructors.guidedProjectId, parsedProjectId));

    const instructors: GuidedProjectInstructor[] =
      instructorRows.length > 0
        ? instructorRows
        : project.instructorUser
          ? [
              {
                id: project.instructorUser.id,
                name: project.instructorUser.name,
                profesion: project.instructorUser.profesion,
                descripcion: project.instructorUser.descripcion,
                profileImageKey: project.instructorUser.profileImageKey,
              },
            ]
          : [];

    // If userId exists, get progress data
    const userObjectivesProgressData = userId
      ? await db.query.userObjectiveProgress.findMany({
          where: eq(userObjectiveProgress.userId, userId),
        })
      : [];

    const userActivitiesProgressData = userId
      ? await db.query.userGuidedActivityProgress.findMany({
          where: eq(userGuidedActivityProgress.userId, userId),
        })
      : [];

    const isUserEnrolled = userId
      ? project.enrollments.some((e) => e.userId === userId)
      : false;

    // A permanent enrollment is a single PayU purchase of this project: it must
    // keep working even when the buyer has no active Pro/Premium subscription.
    const hasPermanentEnrollment = userId
      ? project.enrollments.some((e) => e.userId === userId && e.isPermanent)
      : false;

    const transformedObjectives: GuidedObjective[] = project.objectives
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map((objective) => {
        const { resourceKey, resourceNames, ...publicObjective } = objective;
        const objectiveProgress = userObjectivesProgressData.find(
          (progress) => progress.objectiveId === objective.id
        );

        const activities: GuidedObjectiveActivity[] =
          objective.activities?.map((activity) => {
            const activityProgress = userActivitiesProgressData.find(
              (p) => p.activityId === activity.id
            );
            return {
              id: activity.id,
              name: activity.name,
              description: activity.description,
              objectiveId: objective.id,
              isCompleted: activityProgress?.isCompleted ?? false,
              userProgress: activityProgress?.progress ?? 0,
              revisada: activity.revisada ?? false,
              porcentaje: activity.porcentaje ?? 0,
              parametroId: activity.parametroId,
              fechaMaximaEntrega: activity.fechaMaximaEntrega,
              typeId: activity.typeId,
              startDate: activity.startDate,
              endDate: activity.endDate,
              weekNumber: activity.weekNumber,
              lastUpdated: activity.lastUpdated,
              instructionVideoKey: activity.instructionVideoKey,
              instructionText: activity.instructionText,
              attemptCount: activityProgress?.attemptCount ?? 0,
              finalGrade: activityProgress?.finalGrade,
              lastAttemptAt: activityProgress?.lastAttemptAt,
            } as GuidedObjectiveActivity;
          }) ?? [];

        return {
          ...publicObjective,
          ...(canAccessContent ? { resourceKey, resourceNames } : {}),
          isLocked: !objective.isEnabled,
          isCompleted: objectiveProgress?.isCompleted ?? false,
          userProgress: objectiveProgress?.progress ?? 0,
          lastPositionSeconds: objectiveProgress?.lastPositionSeconds ?? 0,
          isNew: objectiveProgress?.isNew ?? true,
          activities,
        } as GuidedObjective;
      });

    // Calculate total project progress
    const totalActivities = transformedObjectives.reduce(
      (acc, obj) => acc + (obj.activities?.length ?? 0),
      0
    );
    const completedActivities = transformedObjectives.reduce(
      (acc, obj) =>
        acc + (obj.activities?.filter((act) => act.isCompleted).length ?? 0),
      0
    );

    const porcentajecompletado =
      totalActivities > 0
        ? Math.round((completedActivities / totalActivities) * 100)
        : 0;

    return {
      id: project.id,
      title: project.title,
      subtitle: project.subtitle,
      description: project.description,
      coverImageKey: project.coverImageKey,
      coverVideoKey: project.coverVideoKey,
      categoryId: project.categoryId,
      instructor: project.instructor,
      instructors,
      instructorName:
        instructors
          .map((i) => i.name)
          .filter(Boolean)
          .join(', ') || project.instructor,
      instructorProfesion: project.instructorUser?.profesion ?? null,
      instructorDescripcion: project.instructorUser?.descripcion ?? null,
      instructorProfileImageKey:
        project.instructorUser?.profileImageKey ?? null,
      creatorId: project.creatorId,
      rating: project.rating,
      modalidadId: project.modalidadId,
      nivelId: project.nivelId,
      nivelName: project.nivel?.name ?? null,
      courseTypeId: project.courseTypeId,
      certificationTypeId: project.certificationTypeId,
      individualPrice: project.individualPrice,
      requiresProgram: project.requiresProgram,
      isActive: project.isActive,
      isTop: project.isTop,
      isFeatured: project.isFeatured,
      visibility: project.visibility,
      metaPixelId: project.metaPixelId,
      problemStatement: project.problemStatement,
      howItWorks: project.howItWorks,
      whatYouWillBuild: project.whatYouWillBuild,
      prerequisites: project.prerequisites,
      techStack: project.techStack,
      deliverablesDescription: project.deliverablesDescription,
      // Real enrolled students, not the seeded `students_count` column, so the
      // stat shown on the detail page reflects actual enrollments.
      studentsCount: project.enrollments.length,
      contentHours: project.contentHours,
      repositoryUrl: project.repositoryUrl,
      certificateDescription: project.certificateDescription,
      faqItems: project.faqItems,
      slug: project.slug,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      category: project.category ?? undefined,
      modalidad: project.modalidad ?? undefined,
      nivel: project.nivel ?? undefined,
      objectives: transformedObjectives,
      porcentajecompletado,
      enrolled: isUserEnrolled,
      canAccessContent,
      hasPermanentEnrollment,
    } as GuidedProject;
  } catch (error) {
    console.error('Error fetching guided project:', error);
    throw error;
  }
}
