import { NextResponse } from 'next/server';
import { getProgramById } from '~/server/actions/superAdmin/program/getProgramById';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 👇 ahora sí: params es Promise
    const { id } = await params;

    const programData = await getProgramById(id);

    if (!programData) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 });
    }

    return NextResponse.json(programData);
  } catch (error) {
    console.error('Error fetching program:', error);
    return NextResponse.json(
      { error: 'Error fetching program' },
      { status: 500 }
    );
  }
}
