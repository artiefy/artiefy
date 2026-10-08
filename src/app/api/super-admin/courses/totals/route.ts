import { NextResponse } from 'next/server';

import { count } from 'drizzle-orm';

import { getTotalStudents } from '~/models/super-adminModels/studentModelSuperAdmin';
import { db } from '~/server/db';
import { courses } from '~/server/db/schema';

export async function GET() {
  try {
    // Antes esto llamaba getAllCourses(), que trae TODOS los cursos y hace una
    // consulta de instructores por cada curso (N+1). Con muchos cursos saturaba
    // el pool de conexiones de Neon y el endpoint terminaba en timeout/500.
    // Para los totales basta con contar: una consulta barata en vez de N+1.
    const [courseCountRows, totalStudents] = await Promise.all([
      db.select({ total: count() }).from(courses),
      getTotalStudents(),
    ]);

    const totalCourses = courseCountRows[0]?.total ?? 0;

    return NextResponse.json({ totalCourses, totalStudents });
  } catch (error) {
    console.error('Error al obtener totales:', error);
    return NextResponse.json(
      { error: 'Error al obtener totales' },
      { status: 500 }
    );
  }
}
