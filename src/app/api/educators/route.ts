'use server';

import { auth } from '@clerk/nextjs/server';
import { clerkClient } from '@clerk/nextjs/server';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await clerkClient();

    // Obtener todos los usuarios
    const users = await client.users.getUserList({ limit: 100 });

    // Filtrar educadores (role = 'educador')
    const educators = users.data
      .filter((user) => user.publicMetadata?.role === 'educador')
      .map((user) => ({
        id: user.id,
        name:
          `${user.firstName || ''} ${user.lastName || ''}`.trim() ||
          user.emailAddresses[0]?.emailAddress ||
          'Sin nombre',
        email: user.emailAddresses[0]?.emailAddress,
      }));

    return Response.json(educators);
  } catch (error) {
    console.error('GET error:', error);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}
