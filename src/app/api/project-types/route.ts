import { NextResponse } from 'next/server';

import { getProjectTypes } from '~/server/actions/project/getProjectTypes';

export async function GET() {
  try {
    const projectTypes = await getProjectTypes();
    return NextResponse.json(projectTypes);
  } catch (error) {
    console.error('Error fetching project types:', error);
    return NextResponse.json(
      { error: 'Error al obtener tipos de proyecto' },
      { status: 500 }
    );
  }
}
