'use server';

import { auth } from '@clerk/nextjs/server';

import {
  getStudentsProgressForActivity,
  updateGuidedActivityProgress,
} from '~/models/super-adminModels/guidedProjectsModelsSuperAdmin';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ activityId: string }> }
) {
  try {
    const { activityId } = await params;
    const progress = await getStudentsProgressForActivity(parseInt(activityId));
    return Response.json(progress);
  } catch (error) {
    console.error('GET error:', error);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ activityId: string }> }
) {
  try {
    const { userId: adminId } = await auth();
    if (!adminId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { activityId } = await params;
    const data = (await request.json()) as {
      userId?: string;
      finalGrade?: number;
      revisada?: boolean;
    };

    if (!data.userId) {
      return Response.json({ error: 'userId is required' }, { status: 400 });
    }

    const updated = await updateGuidedActivityProgress(
      parseInt(activityId),
      data.userId,
      { finalGrade: data.finalGrade, revisada: data.revisada }
    );

    if (!updated) {
      return Response.json(
        { error: 'No hay progreso registrado para este estudiante' },
        { status: 404 }
      );
    }

    return Response.json(updated);
  } catch (error) {
    console.error('PATCH error:', error);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}
