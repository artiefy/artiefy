import { NextResponse } from 'next/server';

import { db } from '~/server/db';
import {
    certificationTypes,
    scheduleOptions,
    spaceOptions,
} from '~/server/db/schema';

export async function GET() {
    try {
        console.log('\n🧪 SETUP: Creando datos de prueba si no existen...\n');

        // Check and insert certification type
        const existingCerts = await db
            .select({ id: certificationTypes.id })
            .from(certificationTypes)
            .limit(1);

        if (existingCerts.length === 0) {
            console.log('➕ Insertando certification_types...');
            await db.insert(certificationTypes).values([
                {
                    name: 'Certificado de Completación',
                    description: 'Certificado estándar',
                    isActive: true,
                },
                {
                    name: 'Diploma',
                    description: 'Diploma oficial',
                    isActive: true,
                },
            ]);
            console.log('✅ certification_types creados');
        } else {
            console.log('✅ certification_types ya existen');
        }

        // Check and insert schedule options
        const existingSchedules = await db
            .select({ id: scheduleOptions.id })
            .from(scheduleOptions)
            .limit(1);

        if (existingSchedules.length === 0) {
            console.log('➕ Insertando schedule_options...');
            await db.insert(scheduleOptions).values([
                {
                    name: 'Mañana (8:00 - 12:00)',
                    description: 'Horario matutino',
                    startTime: '08:00',
                    endTime: '12:00',
                    isActive: true,
                },
                {
                    name: 'Tarde (2:00 - 6:00)',
                    description: 'Horario vespertino',
                    startTime: '14:00',
                    endTime: '18:00',
                    isActive: true,
                },
            ]);
            console.log('✅ schedule_options creados');
        } else {
            console.log('✅ schedule_options ya existen');
        }

        // Check and insert space options
        const existingSpaces = await db
            .select({ id: spaceOptions.id })
            .from(spaceOptions)
            .limit(1);

        if (existingSpaces.length === 0) {
            console.log('➕ Insertando space_options...');
            await db.insert(spaceOptions).values([
                {
                    name: 'Sede Central',
                    description: 'Sede principal',
                    location: 'Calle 10 # 5-50, Bogotá',
                    capacity: 50,
                    isActive: true,
                },
                {
                    name: 'Sede Norte',
                    description: 'Sede en el norte',
                    location: 'Calle 100 # 15-30, Bogotá',
                    capacity: 30,
                    isActive: true,
                },
            ]);
            console.log('✅ space_options creados');
        } else {
            console.log('✅ space_options ya existen');
        }

        // Now read everything back
        const allCerts = await db.select().from(certificationTypes);
        const allSchedules = await db.select().from(scheduleOptions);
        const allSpaces = await db.select().from(spaceOptions);

        console.log('\n📊 Datos actuales:');
        console.log('certificationTypes:', allCerts);
        console.log('scheduleOptions:', allSchedules);
        console.log('spaceOptions:', allSpaces);

        return NextResponse.json({
            status: 'success',
            certificationTypes: allCerts,
            scheduleOptions: allSchedules,
            spaceOptions: allSpaces,
        });
    } catch (error) {
        console.error('❌ Error durante setup:', error);
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : 'Unknown error',
                details: error instanceof Error ? error.stack : undefined,
            },
            { status: 500 }
        );
    }
}
