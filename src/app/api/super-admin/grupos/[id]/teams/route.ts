/**
 * POST /api/super-admin/grupos/[id]/teams
 *
 * Crea (o guarda) el enlace de reunión de Teams del grupo.
 *
 * - Si el cuerpo trae `joinUrl`, se guarda ese enlace tal cual (pegar uno
 *   externo).
 * - Si no, se genera una reunión de Teams vía Microsoft Graph bajo la cuenta
 *   organizadora de Artiefy, con el lobby abierto (cualquiera entra directo),
 *   igual que las clases.
 *
 * El enlace se guarda apuntando al dominio nuevo `teams.cloud.microsoft` para
 * que el staff, que tiene la sesión ahí, entre sin que le pida login.
 */

import { type NextRequest, NextResponse } from 'next/server';

import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { and } from 'drizzle-orm';

import { getGraphToken } from '~/lib/getGraphToken';
import { db } from '~/server/db';
import { grupoCursos, grupos } from '~/server/db/schema';

const ORGANIZADOR = '0843f2fa-3e0b-493f-8bb9-84b0aa1b2417';

const alDominioNuevo = (url: string): string =>
  url.replace(
    /^https:\/\/teams\.microsoft\.com\//i,
    'https://teams.cloud.microsoft/'
  );

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId, sessionClaims } = await auth();
  const role = String(sessionClaims?.metadata?.role ?? '');
  if (!userId || (role !== 'super-admin' && role !== 'admin')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const grupoId = Number((await params).id);
  if (!Number.isFinite(grupoId)) {
    return NextResponse.json({ error: 'Id inválido' }, { status: 400 });
  }

  const body = (await request.json().catch(() => null)) as {
    joinUrl?: string;
    courseId?: number;
  } | null;

  const courseId = Number(body?.courseId);
  const esHoja = Number.isFinite(courseId);

  const guardar = async (joinUrl: string, meetingId: string | null) => {
    if (esHoja) {
      // Enlace por HOJA (curso) del grupo.
      await db
        .update(grupoCursos)
        .set({ teamsJoinUrl: joinUrl, teamsMeetingId: meetingId })
        .where(
          and(
            eq(grupoCursos.grupoId, grupoId),
            eq(grupoCursos.courseId, courseId)
          )
        );
      return;
    }
    await db
      .update(grupos)
      .set({
        teamsJoinUrl: joinUrl,
        teamsMeetingId: meetingId,
        updatedAt: new Date(),
      })
      .where(eq(grupos.id, grupoId));
  };

  try {
    // Opción 1: guardar un enlace externo pegado por el operador.
    const manual = body?.joinUrl?.trim();
    if (manual) {
      await guardar(alDominioNuevo(manual), null);
      return NextResponse.json({ ok: true, joinUrl: alDominioNuevo(manual) });
    }

    // Opción 2: generar una reunión con Graph para el grupo.
    const [grupo] = await db
      .select({ nombre: grupos.nombre })
      .from(grupos)
      .where(eq(grupos.id, grupoId))
      .limit(1);
    if (!grupo) {
      return NextResponse.json(
        { error: 'Grupo no encontrado' },
        { status: 404 }
      );
    }

    const token = await getGraphToken();
    const ahora = new Date();
    const fin = new Date(ahora.getTime() + 60 * 60 * 1000);

    const res = await fetch(
      `https://graph.microsoft.com/v1.0/users/${ORGANIZADOR}/onlineMeetings`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDateTime: ahora.toISOString(),
          endDateTime: fin.toISOString(),
          subject: `Grupo: ${grupo.nombre}`,
          lobbyBypassSettings: {
            scope: 'everyone',
            isDialInBypassEnabled: true,
          },
        }),
      }
    );

    const data: unknown = await res.json().catch(() => null);
    if (!res.ok) {
      console.error('[GRUPOS] teams graph error:', data);
      return NextResponse.json(
        { error: 'No se pudo crear la reunión de Teams' },
        { status: 502 }
      );
    }

    const meeting = data as { id?: string; joinWebUrl?: string };
    const joinUrl = meeting.joinWebUrl
      ? alDominioNuevo(meeting.joinWebUrl)
      : null;

    if (joinUrl) await guardar(joinUrl, meeting.id ?? null);

    return NextResponse.json({ ok: true, joinUrl });
  } catch (error) {
    console.error('[GRUPOS] teams:', error);
    return NextResponse.json(
      { error: 'No se pudo generar el enlace de Teams' },
      { status: 500 }
    );
  }
}
