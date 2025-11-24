import { NextResponse } from 'next/server';

import { eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { classMeetings } from '~/server/db/schema';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const courseId = Number(searchParams.get('courseId'));

    if (!courseId) {
        return NextResponse.json({ error: 'courseId requerido' }, { status: 400 });
    }

    const meetings = await db
        .select()
        .from(classMeetings)
        .where(eq(classMeetings.courseId, courseId));

    const debug = meetings.map(m => ({
        id: m.id,
        title: m.title,
        meetingId: m.meetingId,
        joinUrl: m.joinUrl,
        video_key: m.video_key,
        video_key_2: m.video_key_2,
        hasJoinUrl: !!m.joinUrl,
        hasMeetingId: !!m.meetingId,
    }));

    console.log('📊 Debug meetings:', JSON.stringify(debug, null, 2));

    return NextResponse.json({ meetings: debug });
}
