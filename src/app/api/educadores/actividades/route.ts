import { auth, currentUser } from '@clerk/nextjs/server';
import { type NextRequest, NextResponse } from 'next/server';
import { createActivity } from '~/models/educatorsModels/activitiesModels';
import { ratelimit } from '~/server/ratelimit/ratelimit';

function respondWithError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

// POST endpoint para crear cursos
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return respondWithError('No autorizado', 403);
    }

    // Implement rate limiting
    const ip = request.headers.get('x-forwarded-for') ?? '127.0.0.1';
    const { success } = await ratelimit.limit(ip);
    if (!success) {
      return respondWithError('Demasiadas solicitudes', 429);
    }

    const clerkUser = await currentUser();
    if (!clerkUser) {
      return respondWithError(
        'No se pudo obtener información del usuario',
        500
      );
    }

    const body = (await request.json()) as {
      id: number;
      name: string;
      description: string;
      lessonsId: number;
      typeid: number;
    };

    const { name, description, lessonsId, typeid } = body;

    await createActivity({
      name,
      description,
      typeid,
      lessonsId: lessonsId,
    });

    console.log('Datos enviados al servidor:', {
      name,
      description,
      lessonsId,
      typeid,
    });

    return NextResponse.json({ message: 'Curso creado exitosamente' });
  } catch (error: unknown) {
    console.error('Error al crear el curso:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Error desconocido';
    return respondWithError(`Error al crear el curso: ${errorMessage}`, 500);
  }
}
