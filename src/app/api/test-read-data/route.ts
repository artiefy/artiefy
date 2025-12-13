import { NextResponse } from 'next/server';

import { db } from '~/server/db';
import {
    certificationTypes,
    scheduleOptions,
    spaceOptions,
} from '~/server/db/schema';

export async function GET() {
    try {
        console.log('🧪 Leyendo datos de las tablas...\n');

        const certs = await db.select().from(certificationTypes);
        console.log('✅ certificationTypes:', certs);

        const schedules = await db.select().from(scheduleOptions);
        console.log('✅ scheduleOptions:', schedules);

        const spaces = await db.select().from(spaceOptions);
        console.log('✅ spaceOptions:', spaces);

        return NextResponse.json({
            certificationTypes: certs,
            scheduleOptions: schedules,
            spaceOptions: spaces,
        });
    } catch (error) {
        console.error('❌ Error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
