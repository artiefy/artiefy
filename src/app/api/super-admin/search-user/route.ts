import { NextRequest, NextResponse } from 'next/server';

import { and, eq, ilike, isNull } from 'drizzle-orm';

import { db } from '~/server/db';
import { accessLogs, users } from '~/server/db/schema';

// Definir tipos para el body de la petición
interface SearchRequestBody {
  searchTerm: string;
  searchType: 'email' | 'document' | 'name';
}

// Validar que el body tenga la estructura correcta
function isValidSearchBody(body: unknown): body is SearchRequestBody {
  return (
    typeof body === 'object' &&
    body !== null &&
    'searchTerm' in body &&
    'searchType' in body &&
    typeof (body as SearchRequestBody).searchTerm === 'string' &&
    ['email', 'document', 'name'].includes(
      (body as SearchRequestBody).searchType
    )
  );
}

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();

    // Validar estructura del body
    if (!isValidSearchBody(body)) {
      return NextResponse.json(
        { error: 'Parámetros de búsqueda requeridos o inválidos' },
        { status: 400 }
      );
    }

    const { searchTerm, searchType } = body;

    // Validar que searchTerm no esté vacío
    if (!searchTerm.trim()) {
      return NextResponse.json(
        { error: 'El término de búsqueda no puede estar vacío' },
        { status: 400 }
      );
    }

    // Construir la consulta según el tipo de búsqueda
    let user;

    switch (searchType) {
      case 'email': {
        const emailToSearch = searchTerm.toLowerCase().trim();
        user = await db.query.users.findFirst({
          where: eq(users.email, emailToSearch),
          columns: {
            id: true,
            name: true,
            email: true,
            document: true,
            subscriptionStatus: true,
            subscriptionEndDate: true,
          },
        });
        break;
      }

      case 'document': {
        const documentToSearch = searchTerm.trim();
        user = await db.query.users.findFirst({
          where: eq(users.document, documentToSearch),
          columns: {
            id: true,
            name: true,
            email: true,
            document: true,
            subscriptionStatus: true,
            subscriptionEndDate: true,
          },
        });
        break;
      }

      case 'name': {
        const nameToSearch = searchTerm.trim();
        // Búsqueda por nombre (case-insensitive)
        user = await db.query.users.findFirst({
          where: ilike(users.name, `%${nameToSearch}%`),
          columns: {
            id: true,
            name: true,
            email: true,
            document: true,
            subscriptionStatus: true,
            subscriptionEndDate: true,
          },
        });
        break;
      }

      default:
        return NextResponse.json(
          { error: 'Tipo de búsqueda inválido' },
          { status: 400 }
        );
    }

    if (!user) {
      return NextResponse.json({
        found: false,
        message: 'No se encontró ningún usuario con los datos proporcionados',
      });
    }

    // Verificar si el usuario tiene una entrada sin cerrar (exitTime es null)
    const openEntry = await db.query.accessLogs.findFirst({
      where: and(eq(accessLogs.userId, user.id), isNull(accessLogs.exitTime)),
      orderBy: (logs) => [logs.entryTime],
    });

    const hasOpenEntry = !!openEntry;

    // Calcular días restantes si tiene suscripción activa
    let daysRemaining: number | undefined;

    if (user.subscriptionStatus === 'active' && user.subscriptionEndDate) {
      const endDate = new Date(user.subscriptionEndDate);
      const today = new Date();
      const diffTime = endDate.getTime() - today.getTime();
      daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // Si los días son negativos, la suscripción está vencida
      if (daysRemaining < 0) {
        daysRemaining = 0;
      }
    }

    return NextResponse.json({
      found: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        document: user.document,
        subscriptionStatus: user.subscriptionStatus,
        subscriptionEndDate: user.subscriptionEndDate?.toISOString(),
        daysRemaining,
        hasOpenEntry,
      },
    });
  } catch (error) {
    console.error('Error en búsqueda de usuario:', error);
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}
