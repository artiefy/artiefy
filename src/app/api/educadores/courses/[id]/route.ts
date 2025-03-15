import { NextResponse } from 'next/server';
import { getProgramById } from '~/server/actions/superAdmin/program/getProgramById';

export async function GET(request: Request, { params }: { params: { id: string } }) {
    try {
        const programId = params.id;
        const program = await getProgramById(programId);
        if (!program) {
            return NextResponse.json({ error: 'Program not found' }, { status: 404 });
        }
        return NextResponse.json(program);
    } catch (error) {
        console.error('Error fetching program:', error);
        return NextResponse.json({ error: 'Error fetching program' }, { status: 500 });
    }
}