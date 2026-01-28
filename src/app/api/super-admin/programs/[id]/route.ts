import { NextResponse } from 'next/server';

import { getProgramById } from '~/server/actions/superAdmin/program/getProgramById';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 👇 ahora sí: params es Promise
    const { id } = await params;
    console.log('[API] GET /super-admin/programs/[id] - id:', id);

    const programData = await getProgramById(id);
    console.log('[API] getProgramById result:', programData);

    if (!programData) {
      console.log('[API] Program not found for id:', id);
      return NextResponse.json({ error: 'Program not found' }, { status: 404 });
    }

    return NextResponse.json(programData);
  } catch (error) {
    console.error('[API] Error fetching program:', error);
    return NextResponse.json(
      { error: 'Error fetching program' },
      { status: 500 }
    );
  }
}
