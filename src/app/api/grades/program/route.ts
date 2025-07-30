import { type NextRequest, NextResponse } from 'next/server';

import { eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { materiaGrades, materias } from '~/server/db/schema';

export const dynamic = 'force-dynamic';

interface MateriaWithGrade {
  id: number;
  title: string;
  grade: number;
  courseTitle: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const programId = searchParams.get('programId');

    if (!userId || !programId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Busca todas las materias del programa
    const programMaterias = await db.query.materias.findMany({
      where: eq(materias.programaId, parseInt(programId)),
      with: {
        curso: {
          columns: {
            title: true,
          },
        },
      },
    });

    // Busca las notas del usuario para esas materias
    const materiasGrades = await db
      .select({
        materiaId: materiaGrades.materiaId,
        grade: materiaGrades.grade,
      })
      .from(materiaGrades)
      .where(eq(materiaGrades.userId, userId));

    // Formatea el resultado agrupando por curso
    const formattedResults: MateriaWithGrade[] = programMaterias.map(
      (materia) => {
        const gradeRecord = materiasGrades.find(
          (g) => g.materiaId === materia.id
        );
        return {
          id: materia.id,
          title: materia.title,
          grade: Number((gradeRecord?.grade ?? 0).toFixed(2)),
          courseTitle: materia.curso?.title ?? 'Curso sin nombre',
        };
      }
    );

    return NextResponse.json({ materias: formattedResults });
  } catch (_error) {
    return NextResponse.json(
      { error: 'Failed to fetch program grades' },
      { status: 500 }
    );
  }
}
