'use server';

import { auth } from '@clerk/nextjs/server';

import {
  createGuidedObjective,
  deleteGuidedObjective,
  getGuidedObjectiveById,
  getObjectivesByProjectId,
  toggleObjectiveEnabled,
  updateGuidedObjective,
} from '~/models/super-adminModels/guidedProjectsModelsSuperAdmin';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const { searchParams } = new URL(request.url);
    const objectiveId = searchParams.get('id');

    if (objectiveId) {
      const objective = await getGuidedObjectiveById(parseInt(objectiveId));
      return Response.json(objective || { error: 'Not found' }, {
        status: objective ? 200 : 404,
      });
    }

    const objectives = await getObjectivesByProjectId(parseInt(projectId));
    return Response.json(objectives);
  } catch (error) {
    console.error('GET error:', error);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId } = await params;
    const data = await request.json();

    const objective = await createGuidedObjective({
      ...data,
      guidedProjectId: parseInt(projectId),
    });

    return Response.json(objective, { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const objectiveId = searchParams.get('id');

    if (!objectiveId) {
      return Response.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const data = await request.json();

    // Check if this is a toggle request (only has isEnabled)
    if (Object.keys(data).length === 1 && 'isEnabled' in data) {
      const objective = await toggleObjectiveEnabled(
        parseInt(objectiveId),
        data.isEnabled
      );
      return Response.json(JSON.parse(JSON.stringify(objective)));
    }

    const objective = await updateGuidedObjective(parseInt(objectiveId), data);
    return Response.json(JSON.parse(JSON.stringify(objective)));
  } catch (error) {
    console.error('PUT error:', error);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const objectiveId = searchParams.get('id');

    if (!objectiveId) {
      return Response.json({ error: 'Invalid ID' }, { status: 400 });
    }

    await deleteGuidedObjective(parseInt(objectiveId));
    return Response.json({ success: true });
  } catch (error) {
    console.error('DELETE error:', error);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}
