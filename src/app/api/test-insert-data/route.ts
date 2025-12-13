import { NextResponse } from 'next/server';

import { db } from '~/server/db';
import {
    certificationTypes,
    scheduleOptions,
    spaceOptions,
} from '~/server/db/schema';

export async function GET() {
    try {
        console.log('🧪 Insertando datos de prueba...\n');

        // Insert certification type
        const certInsert = await db
            .insert(certificationTypes)
            .values({
                name: 'Certificado de Completación',
                description: 'Certificado estándar de completación del curso',
                isActive: true,
            })
            .onConflictDoNothing()
            .returning();
        console.log('✅ certificationTypes insert:', certInsert);

        // Insert schedule option
        const scheduleInsert = await db
            .insert(scheduleOptions)
            .values({
                name: 'Mañana (8:00 - 12:00)',
                description: 'Horario matutino',
                startTime: '08:00',
                endTime: '12:00',
                isActive: true,
            })
            .onConflictDoNothing()
            .returning();
        console.log('✅ scheduleOptions insert:', scheduleInsert);

        // Insert space option
        const spaceInsert = await db
            .insert(spaceOptions)
            .values({
                name: 'Sede Central',
                description: 'Sede principal de la institución',
                location: 'Calle 10 # 5-50, Bogotá',
                capacity: 50,
                isActive: true,
            })
            .onConflictDoNothing()
            .returning();
        console.log('✅ spaceOptions insert:', spaceInsert);

        return NextResponse.json({
            message: 'Datos de prueba insertados',
            certInsert,
            scheduleInsert,
            spaceInsert,
        });
    } catch (error) {
        console.error('❌ Error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
