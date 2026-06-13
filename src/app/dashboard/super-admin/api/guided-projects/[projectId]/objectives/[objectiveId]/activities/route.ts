'use server';

import { auth } from '@clerk/nextjs/server';

import {
  createGuidedActivity,
  deleteGuidedActivity,
  getActivitiesByObjectiveId,
  getGuidedActivityById,
  updateGuidedActivity,
} from '~/models/super-adminModels/guidedProjectsModelsSuperAdmin';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string; objectiveId: string }> }
) {
  try {
    const { objectiveId } = await params;
    const { searchParams } = new URL(request.url);
    const activityId = searchParams.get('id');

    if (activityId) {
      const activity = await getGuidedActivityById(parseInt(activityId));
      return Response.json(activity || { error: 'Not found' }, {
        status: activity ? 200 : 404,
      });
    }

    const activities = await getActivitiesByObjectiveId(parseInt(objectiveId));
    return Response.json(activities);
  } catch (error) {
    console.error('GET error:', error);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string; objectiveId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { objectiveId } = await params;
    const data = await request.json();

    const activity = await createGuidedActivity({
      ...data,
      objectiveId: parseInt(objectiveId),
    });

    return Response.json(activity, { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ projectId: string; objectiveId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const activityId = url.pathname.split('/').pop();

    if (!activityId) {
      return Response.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const data = await request.json();
    const activity = await updateGuidedActivity(parseInt(activityId), data);

    return Response.json(activity);
  } catch (error) {
    console.error('PUT error:', error);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ projectId: string; objectiveId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const activityId = url.pathname.split('/').pop();

    if (!activityId) {
      return Response.json({ error: 'Invalid ID' }, { status: 400 });
    }

    await deleteGuidedActivity(parseInt(activityId));
    return Response.json({ success: true });
  } catch (error) {
    console.error('DELETE error:', error);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}
