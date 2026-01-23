import { NextResponse } from 'next/server';

import { updateUserInClerk } from '~/server/queries/queries';

export async function PATCH(req: Request) {
  try {
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

    console.log('📦 Datos recibidos en PATCH /api/super-admin/udateUser:', {
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
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Error desconocido';

    console.error('❌ Error en la API de actualización:', errorMessage);

    return NextResponse.json(
      { error: `Error interno del servidor: ${errorMessage}` },
      { status: 500 }
    );
  }
}
