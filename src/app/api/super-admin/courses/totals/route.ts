import { NextResponse } from 'next/server';

import { getAllCourses } from '~/models/super-adminModels/courseModelsSuperAdmin';
import { getTotalStudents } from '~/models/super-adminModels/studentModelSuperAdmin';

export async function GET() {
  try {
    // Obtener total de cursos
    const courses = await getAllCourses();
    const totalCourses = courses.length;

    // Obtener total de estudiantes inscritos en todos los cursos
    const totalStudents = await getTotalStudents();

    return NextResponse.json({ totalCourses, totalStudents });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al obtener totales' },
      { status: 500 }
    );
  }
}
