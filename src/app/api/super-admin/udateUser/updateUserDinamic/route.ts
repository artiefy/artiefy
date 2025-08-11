import { NextResponse } from 'next/server';

import {
  type FullUserUpdateInput,
  updateFullUser,
} from '~/server/queries/queriesSuperAdmin';

export async function PATCH(req: Request) {
  try {
    const body = (await req.json()) as FullUserUpdateInput;
    const result = await updateFullUser(body);
    if (!result) {
      return NextResponse.json(
        { error: 'Error al actualizar usuario' },
        { status: 500 }
      );
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Error en updateUserDinamic:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
