import { NextResponse } from 'next/server';

import { eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { classMeetings } from '~/server/db/schema';

// Si en tu índice existe "name" del archivo, úsalo para un match extra
interface VideoIdxItem {
  meetingId: string;
  videoKey: string;
  videoUrl: string;
  createdAt?: string;
  name?: string; // opcional
  isSecondary?: boolean;
}

// ⚠️ el mismo userId (organizer) que ya usas para listar videos
const ORGANIZER_AAD_USER_ID = '0843f2fa-3e0b-493f-8bb9-84b0aa1b2417';

function toMs(v: string | Date): number {
  if (v instanceof Date) return v.getTime();
  // v puede venir como "2025-09-13 13:30:00" (sin zona) => Bogotá
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(v)) {
    return new Date(v.replace(' ', 'T') + '-05:00').getTime();
  }
  // intentos normales
  const t = new Date(v).getTime();
  return Number.isNaN(t) ? 0 : t;
}

function pickNearestByCreatedAt(videos: VideoIdxItem[], targetMs: number) {
  let best: VideoIdxItem | undefined;
  let bestDiff = Number.POSITIVE_INFINITY;
  for (const v of videos) {
    const t = v.createdAt ? new Date(v.createdAt).getTime() : Number.NaN;
    if (Number.isNaN(t)) continue;
    const diff = Math.abs(t - targetMs);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = v;
    }
  }
  return { best, bestDiff };
}

// (opcional) nombre “parecido”
function looseMatchName(
  videoName: string | undefined,
  classTitle: string
): boolean {
  if (!videoName) return true; // si no hay nombre no bloqueamos
  const vn = videoName.toLowerCase();
  const tn = classTitle.toLowerCase();
  // prueba simple: alguna palabra “larga” del título está en el nombre del video
  const tokens = tn.split(/\s+/).filter((w) => w.length >= 5);
  return tokens.some((t) => vn.includes(t));
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const courseId = Number(searchParams.get('courseId'));
    if (!courseId) {
      return NextResponse.json(
        { error: 'courseId requerido' },
        { status: 400 }
      );
    }

    // 1) leemos clases de BD
    const meetings = await db
      .select()
      .from(classMeetings)
      .where(eq(classMeetings.courseId, courseId));

    // 2) traemos índice de videos del mismo organizador (reutiliza tu ruta actual)
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/api/super-admin/teams/video?userId=${ORGANIZER_AAD_USER_ID}`,
      { cache: 'no-store' }
    );

    if (!res.ok) {
      const text = await res.text();
      console.error('❌ /teams/video fallo:', res.status, text);
      return NextResponse.json(
        { error: 'No se pudo obtener videos' },
        { status: 500 }
      );
    }

    const raw = (await res.json()) as { videos?: VideoIdxItem[] };
    const allVideos = Array.isArray(raw.videos) ? raw.videos : [];

    // ...
    const usedByMeeting = new Map<string, Set<string>>(); // meetingId -> Set<videoKey>

    const populated = meetings.map((mt) => {
      const targetMs = toMs(mt.startDateTime as unknown as string);

      const sameMeeting = allVideos.filter((v) => v.meetingId === mt.meetingId);
      const usedSet = usedByMeeting.get(mt.meetingId) ?? new Set<string>();

      // descarta videos ya usados para este meetingId
      const available = sameMeeting.filter((v) => !usedSet.has(v.videoKey));

      let chosen: VideoIdxItem | undefined;
      if (available.length) {
        const nameOk = available.filter((v) =>
          looseMatchName(v.name, mt.title)
        );
        const pool = nameOk.length ? nameOk : available;
        const { best } = pickNearestByCreatedAt(pool, targetMs);
        chosen = best;

        if (chosen) {
          usedSet.add(chosen.videoKey);
          if (!usedByMeeting.has(mt.meetingId)) {
            usedByMeeting.set(mt.meetingId, usedSet);
          }
        }
      }

      return {
        ...mt,
        video_key: chosen?.videoKey ?? mt.video_key ?? null,
        videoUrl: chosen?.videoUrl ?? null,
      };
    });

    // 4) ordenado por fecha y devuelto
    populated.sort(
      (a, b) =>
        toMs(a.startDateTime as unknown as string) -
        toMs(b.startDateTime as unknown as string)
    );

    return NextResponse.json({ meetings: populated });
  } catch (e) {
    console.error('❌ by-course error:', e);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
