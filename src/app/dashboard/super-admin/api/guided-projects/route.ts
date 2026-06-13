'use server';

import { auth } from '@clerk/nextjs/server';

import {
  createGuidedProject,
  deleteGuidedProject,
  getAllGuidedProjects,
  getGuidedProjectById,
  getGuidedProjectsByUserId,
  updateGuidedProject,
} from '~/models/super-adminModels/guidedProjectsModelsSuperAdmin';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('id');
    const creatorId = searchParams.get('creatorId');

    if (projectId) {
      const project = await getGuidedProjectById(parseInt(projectId));
      return Response.json(project || { error: 'Not found' }, {
        status: project ? 200 : 404,
      });
    }

    if (creatorId) {
      const projects = await getGuidedProjectsByUserId(creatorId);
      return Response.json(projects);
    }

    const projects = await getAllGuidedProjects();
    return Response.json(projects);
  } catch (error) {
    console.error('GET error:', error);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const project = await createGuidedProject({
      ...data,
      creatorId: userId,
    });

    return Response.json(project, { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const projectId = url.pathname.split('/').pop();

    if (!projectId) {
      return Response.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const data = await request.json();
    const project = await updateGuidedProject(parseInt(projectId), data);

    return Response.json(project);
  } catch (error) {
    console.error('PUT error:', error);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const projectId = url.pathname.split('/').pop();

    if (!projectId) {
      return Response.json({ error: 'Invalid ID' }, { status: 400 });
    }

    await deleteGuidedProject(parseInt(projectId));

    return Response.json({ success: true });
  } catch (error) {
    console.error('DELETE error:', error);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}
