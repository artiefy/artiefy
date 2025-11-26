import { NextResponse } from 'next/server';

import {
  type FullUserUpdateInput,
  updateFullUser,
} from '~/server/queries/queriesSuperAdmin';

export async function PATCH(req: Request) {
  try {
    const body = (await req.json()) as FullUserUpdateInput;

    console.log(
      '📥 [updateUserDinamic] Body recibido:',
      JSON.stringify(body, null, 2)
    );
    console.log('📧 [updateUserDinamic] Email en body:', body.email);
    console.log('🔑 [updateUserDinamic] UserId:', body.userId);

    const result = await updateFullUser(body);

    console.log('✅ [updateUserDinamic] Resultado de updateFullUser:', result);

    if (!result) {
      console.error(
        '❌ [updateUserDinamic] updateFullUser retornó null/undefined'
      );
      return NextResponse.json(
        { error: 'Error al actualizar usuario' },
        { status: 500 }
      );
    }

    console.log('🎉 [updateUserDinamic] Usuario actualizado exitosamente');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ [updateUserDinamic] Error capturado:', error);
    console.error(
      '❌ [updateUserDinamic] Stack trace:',
      error instanceof Error ? error.stack : 'N/A'
    );
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
