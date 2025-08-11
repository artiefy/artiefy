import { NextResponse } from 'next/server';

// ✅ Definimos la interfaz para los datos de usuario que esperamos de Clerk
interface ClerkUserResponse {
  id: string;
  first_name: string;
  last_name: string;
  email_addresses: { email_address: string }[];
  created_at: string; // La fecha de creación en formato string
  profile_image_url: string; // URL de la imagen de perfil
  public_metadata?: {
    role?: string;
    status?: string;
    permissions?: string[];
    subscriptionEndDate?: string;
    planType?: 'none' | 'Pro' | 'Premium' | 'Enterprise';
  };
}

const getUser = async (userId: string) => {
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

    // ✅ Tipamos correctamente la respuesta de Clerk
    const userData: ClerkUserResponse = (await res.json()) as ClerkUserResponse;

    // ✅ Extraer `firstName` y `lastName`
    const firstName = userData.first_name ?? 'Sin nombre';
    const lastName = userData.last_name ?? 'Sin apellido';

    // ✅ Obtener rol y estado de los metadatos
    const role = userData.public_metadata?.role ?? 'Sin rol';
    const status = userData.public_metadata?.status ?? 'Activo'; // Usamos "Activo" si no existe un estado

    // Extraer permisos y asegurarse de que es un array de strings
    const permissions: string[] = Array.isArray(
      userData.public_metadata?.permissions
    )
      ? userData.public_metadata.permissions
      : [];

    const subscriptionEndDate =
      userData.public_metadata?.subscriptionEndDate ?? null;

    const planType = userData.public_metadata?.planType ?? 'none';

    const user = {
      id: userData.id,
      firstName, // ✅ Ahora enviamos `firstName` correctamente
      lastName, // ✅ Ahora enviamos `lastName` correctamente
      email: userData.email_addresses?.[0]?.email_address || 'Sin correo',
      createdAt: new Date(userData.created_at).toLocaleDateString(),
      profileImage: userData.profile_image_url || '/default-avatar.png',
      role,
      status,
      password: 'No disponible', // Clerk no expone la contraseña
      permissions, // Ahora es seguro y correctamente tipado
      subscriptionEndDate,
      planType,
    };

    return user;
  } catch (error) {
    console.error('Error al obtener usuario de Clerk:', error);
    return null;
  }
};

// ✅ API Route para obtener detalles de un usuario por ID
export async function GET(request: Request) {
  try {
    const url = new URL(request.url); // Accede a la URL de la solicitud
    const userId = url.searchParams.get('id'); // Extrae el parámetro "id" desde la URL

    console.log('ID recibido:', userId); // Agregar un log para verificar que el parámetro está presente

    if (!userId) {
      return NextResponse.json(
        { error: 'Falta el ID del usuario' },
        { status: 400 }
      );
    }

    const user = await getUser(userId);

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
