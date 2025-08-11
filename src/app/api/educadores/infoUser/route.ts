import { NextResponse } from 'next/server';

interface ClerkUserResponse {
  id: string;
  first_name: string;
  last_name: string;
  email_addresses: { email_address: string }[];
  created_at: string;
  profile_image_url: string;
  last_login: string;
  public_metadata?: { role?: string; status?: string; permissions?: string[] };
}

const getClerkUser = async (userId: string) => {
  try {
    const res = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
      headers: {
        Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error(`Error al obtener usuario: ${res.statusText}`);
    }

    // Tipamos correctamente la respuesta de Clerk
    const userData: ClerkUserResponse = (await res.json()) as ClerkUserResponse;

    // Verificar el valor de created_at que llega de Clerk
    console.log('Fecha de creación recibida:', userData.created_at);

    // Asegurarnos de que la fecha sea válida
    const createdAt = new Date(userData.created_at);
    const formattedCreatedAt =
      createdAt instanceof Date && !isNaN(createdAt.getTime())
        ? createdAt.toLocaleDateString()
        : 'Fecha no disponible';
    console.log('Fecha formateada:', formattedCreatedAt);

    // Obtener rol y estado de los metadatos
    const role = userData.public_metadata?.role ?? 'Sin rol';
    const status = userData.public_metadata?.status ?? 'Activo';

    const permissions: string[] = Array.isArray(
      userData.public_metadata?.permissions
    )
      ? userData.public_metadata.permissions
      : [];

    const user = {
      id: userData.id,
      name: `${userData.first_name} ${userData.last_name}`,
      email: userData.email_addresses?.[0]?.email_address || 'Sin correo',
      createdAt: formattedCreatedAt,
      profileImage: userData.profile_image_url || '/default-avatar.png',
      lastLogin: userData.last_login,
      role,
      status,
      permissions,
    };

    return user;
  } catch (error) {
    console.error('Error al obtener usuario de Clerk:', error);
    return null;
  }
};

// API Route para obtener detalles de un usuario por ID
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('id');

    if (!userId) {
      return NextResponse.json(
        { error: 'Falta el ID del usuario' },
        { status: 400 }
      );
    }

    const user = await getClerkUser(userId);

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error en la API de usuario:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json(
      { error: `Error en el servidor: ${errorMessage}` },
      { status: 500 }
    );
  }
}
