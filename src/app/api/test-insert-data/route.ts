import { NextResponse } from 'next/server';

import { db } from '~/server/db';
import {
  certificationTypes,
  scheduleOptions,
  spaceOptions,
} from '~/server/db/schema';

export async function GET() {
  // Security best practice: dev-only test endpoint. It writes to the database,
  // so it must never be reachable in production.
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
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

    return NextResponse.json({
      message: 'Datos de prueba insertados',
      certInsert,
      scheduleInsert,
      spaceInsert,
    });
  } catch {
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
