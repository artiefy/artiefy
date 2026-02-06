import { NextResponse } from 'next/server';

import { DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { currentUser } from '@clerk/nextjs/server';
import { and, eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

import { db } from '~/server/db';
import { projectActivities, projects, projectsTaken } from '~/server/db/schema';

interface RequestBody {
  filename?: string;
  contentType?: string;
  description?: string;
}

const respondWithError = (message: string, status: number) =>
  NextResponse.json({ error: message }, { status });

export async function POST(
  request: Request,
  context: { params: Promise<{ activityId: string }> }
) {
  try {
    const user = await currentUser();
    if (!user?.id) return respondWithError('No autorizado', 401);

    const { activityId: activityIdParam } = await context.params;
    const activityId = Number(activityIdParam);
    if (Number.isNaN(activityId)) {
      return respondWithError('ID de actividad inválido', 400);
    }

    const body = (await request.json().catch(() => ({}))) as RequestBody;
    const { filename, contentType, description } = body;

    const activity = await db
      .select({
        id: projectActivities.id,
        projectId: projectActivities.projectId,
        ownerId: projects.userId,
      })
      .from(projectActivities)
      .innerJoin(projects, eq(projects.id, projectActivities.projectId))
      .where(eq(projectActivities.id, activityId))
      .limit(1);

    if (!activity[0]) {
      return respondWithError('Actividad no encontrada', 404);
    }

    const isOwner = activity[0].ownerId === user.id;
    const isParticipant = await db
      .select({ id: projectsTaken.id })
      .from(projectsTaken)
      .where(
        and(
          eq(projectsTaken.projectId, activity[0].projectId),
          eq(projectsTaken.userId, user.id)
        )
      )
      .limit(1);

    if (!isOwner && !isParticipant[0]) {
      return respondWithError('No autorizado para esta actividad', 403);
    }

    const updateData: Record<string, unknown> = {
      deliverableDescription: description?.trim() || null,
    };

    if (!filename || !contentType) {
      await db
        .update(projectActivities)
        .set(updateData)
        .where(eq(projectActivities.id, activityId));

      return NextResponse.json({ success: true });
    }

    if (!process.env.AWS_BUCKET_NAME || !process.env.AWS_REGION) {
      return respondWithError('Configuración de S3 incompleta', 500);
    }

    const client = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? '',
      },
    });

    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const key = `project-deliverables/${activityId}/${user.id}/${uuidv4()}-${safeName}`;

    const { url, fields } = await createPresignedPost(client, {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
      Conditions: [
        ['content-length-range', 0, 25 * 1024 * 1024],
        ['starts-with', '$Content-Type', contentType],
      ],
      Fields: {
        acl: 'public-read',
        'Content-Type': contentType,
      },
      Expires: 600,
    });

    const fileUrl = `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${key}`;

    const submittedAt = new Date();

    await db
      .update(projectActivities)
      .set({
        ...updateData,
        deliverableKey: key,
        deliverableUrl: fileUrl,
        deliverableName: filename,
        deliverableSubmittedAt: submittedAt,
      })
      .where(eq(projectActivities.id, activityId));

    return NextResponse.json({
      url,
      fields,
      key,
      fileUrl,
      submittedAt: submittedAt.toISOString(),
    });
  } catch (error) {
    console.error('Error uploading deliverable:', error);
    return respondWithError('Error al subir entregable', 500);
  }
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ activityId: string }> }
) {
  try {
    const user = await currentUser();
    if (!user?.id) return respondWithError('No autorizado', 401);

    const { activityId: activityIdParam } = await context.params;
    const activityId = Number(activityIdParam);
    if (Number.isNaN(activityId)) {
      return respondWithError('ID de actividad inválido', 400);
    }

    const activity = await db
      .select({
        id: projectActivities.id,
        projectId: projectActivities.projectId,
        ownerId: projects.userId,
        deliverableKey: projectActivities.deliverableKey,
        deliverableUrl: projectActivities.deliverableUrl,
        deliverableName: projectActivities.deliverableName,
        deliverableDescription: projectActivities.deliverableDescription,
        deliverableSubmittedAt: projectActivities.deliverableSubmittedAt,
      })
      .from(projectActivities)
      .innerJoin(projects, eq(projects.id, projectActivities.projectId))
      .where(eq(projectActivities.id, activityId))
      .limit(1);

    if (!activity[0]) {
      return respondWithError('Actividad no encontrada', 404);
    }

    const isOwner = activity[0].ownerId === user.id;
    const isParticipant = await db
      .select({ id: projectsTaken.id })
      .from(projectsTaken)
      .where(
        and(
          eq(projectsTaken.projectId, activity[0].projectId),
          eq(projectsTaken.userId, user.id)
        )
      )
      .limit(1);

    if (!isOwner && !isParticipant[0]) {
      return respondWithError('No autorizado para esta actividad', 403);
    }

    return NextResponse.json({
      success: true,
      data: {
        deliverableKey: activity[0].deliverableKey ?? null,
        deliverableUrl: activity[0].deliverableUrl ?? null,
        deliverableName: activity[0].deliverableName ?? null,
        deliverableDescription: activity[0].deliverableDescription ?? null,
        deliverableSubmittedAt: activity[0].deliverableSubmittedAt
          ? new Date(activity[0].deliverableSubmittedAt).toISOString()
          : null,
      },
    });
  } catch (error) {
    console.error('Error fetching deliverable:', error);
    return respondWithError('Error al obtener entregable', 500);
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ activityId: string }> }
) {
  try {
    const user = await currentUser();
    if (!user?.id) return respondWithError('No autorizado', 401);

    const { activityId: activityIdParam } = await context.params;
    const activityId = Number(activityIdParam);
    if (Number.isNaN(activityId)) {
      return respondWithError('ID de actividad inválido', 400);
    }

    const body = (await request.json().catch(() => ({}))) as RequestBody;
    const description = body.description?.trim() || null;

    const activity = await db
      .select({
        id: projectActivities.id,
        projectId: projectActivities.projectId,
        ownerId: projects.userId,
      })
      .from(projectActivities)
      .innerJoin(projects, eq(projects.id, projectActivities.projectId))
      .where(eq(projectActivities.id, activityId))
      .limit(1);

    if (!activity[0]) {
      return respondWithError('Actividad no encontrada', 404);
    }

    const isOwner = activity[0].ownerId === user.id;
    const isParticipant = await db
      .select({ id: projectsTaken.id })
      .from(projectsTaken)
      .where(
        and(
          eq(projectsTaken.projectId, activity[0].projectId),
          eq(projectsTaken.userId, user.id)
        )
      )
      .limit(1);

    if (!isOwner && !isParticipant[0]) {
      return respondWithError('No autorizado para esta actividad', 403);
    }

    await db
      .update(projectActivities)
      .set({ deliverableDescription: description })
      .where(eq(projectActivities.id, activityId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating deliverable description:', error);
    return respondWithError('Error al actualizar entregable', 500);
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ activityId: string }> }
) {
  try {
    const user = await currentUser();
    if (!user?.id) return respondWithError('No autorizado', 401);

    const { activityId: activityIdParam } = await context.params;
    const activityId = Number(activityIdParam);
    if (Number.isNaN(activityId)) {
      return respondWithError('ID de actividad inválido', 400);
    }

    const activity = await db
      .select({
        id: projectActivities.id,
        projectId: projectActivities.projectId,
        ownerId: projects.userId,
        deliverableKey: projectActivities.deliverableKey,
      })
      .from(projectActivities)
      .innerJoin(projects, eq(projects.id, projectActivities.projectId))
      .where(eq(projectActivities.id, activityId))
      .limit(1);

    if (!activity[0]) {
      return respondWithError('Actividad no encontrada', 404);
    }

    const isOwner = activity[0].ownerId === user.id;
    const isParticipant = await db
      .select({ id: projectsTaken.id })
      .from(projectsTaken)
      .where(
        and(
          eq(projectsTaken.projectId, activity[0].projectId),
          eq(projectsTaken.userId, user.id)
        )
      )
      .limit(1);

    if (!isOwner && !isParticipant[0]) {
      return respondWithError('No autorizado para esta actividad', 403);
    }

    if (
      activity[0].deliverableKey &&
      process.env.AWS_BUCKET_NAME &&
      process.env.AWS_REGION
    ) {
      const client = new S3Client({
        region: process.env.AWS_REGION,
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? '',
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? '',
        },
      });

      await client.send(
        new DeleteObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: activity[0].deliverableKey,
        })
      );
    }

    await db
      .update(projectActivities)
      .set({
        deliverableKey: null,
        deliverableUrl: null,
        deliverableName: null,
        deliverableSubmittedAt: null,
      })
      .where(eq(projectActivities.id, activityId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing deliverable:', error);
    return respondWithError('Error al eliminar entregable', 500);
  }
}
