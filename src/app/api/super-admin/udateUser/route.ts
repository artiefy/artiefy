import { NextResponse } from 'next/server';

import { updateUserInClerk } from '~/server/queries/queries';
import { authorizeRole } from '~/server/utils/apiAuth';

export async function PATCH(req: Request) {
  try {
    // Security best practice: editing users (including their role) is restricted
    // to admin/super-admin. Without this, an anonymous caller could PATCH any
    // user's role and escalate to super-admin.
    const authz = await authorizeRole(['admin', 'super-admin']);
    if (!authz.ok) {
      return NextResponse.json(
        { error: authz.status === 401 ? 'No autorizado' : 'Acceso denegado' },
        { status: authz.status }
      );
    }

    const {
      userId,
      firstName,
      lastName,
      role,
      status,
      permissions,
      subscriptionEndDate,
      planType,
      profesion,
      descripcion,
      profileImageKey,
    } = (await req.json()) as {
      userId: string;
      firstName: string;
      lastName: string;
      role: string;
      status: string;
      permissions: string[];
      subscriptionEndDate?: string;
      planType?: string;
      profesion?: string;
      descripcion?: string;
      profileImageKey?: string;
    };

    if (!userId || !firstName?.trim() || !lastName?.trim()) {
      return NextResponse.json(
        { error: 'Faltan datos obligatorios: userId, firstName o lastName' },
        { status: 400 }
      );
    }

    const updateSuccess = await updateUserInClerk({
      userId,
      firstName,
      lastName,
      role,
      status,
      permissions,
      subscriptionEndDate,
      planType,
      profesion,
      descripcion,
      profileImageKey,
    });

    if (!updateSuccess) {
      return NextResponse.json(
        { error: 'Error al actualizar usuario en Clerk' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Usuario actualizado correctamente en Clerk',
      updatedUser: {
        userId,
        firstName,
        lastName,
        role,
        status,
        permissions,
        subscriptionEndDate,
        planType,
        profesion,
        descripcion,
        profileImageKey,
      },
    });
  } catch {
    // Security best practice: return a generic message; do not leak the raw
    // exception text to the client.
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
