import { NextResponse } from 'next/server';

import { db } from '~/server/db';
import { classMeetings } from '~/server/db/schema';

interface TokenResponse {
  access_token: string;
  error?: string;
  error_description?: string;
}

async function getGraphToken() {
  const tenant = process.env.NEXT_PUBLIC_TENANT_ID!;
  const clientId = process.env.NEXT_PUBLIC_CLIENT_ID!;
  const clientSecret = process.env.MS_GRAPH_CLIENT_SECRET!;
  void tenant;
  const params = new URLSearchParams();
  params.append('grant_type', 'client_credentials');
  params.append('client_id', clientId);
  params.append('client_secret', clientSecret);
  params.append('scope', 'https://graph.microsoft.com/.default');

  const res = await fetch(
    'https://login.microsoftonline.com/060f4acf-9732-441b-80f7-425de7381dd1/oauth2/v2.0/token',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    }
  );

  const data = (await res.json()) as TokenResponse;

  if (!res.ok) {
    throw new Error(
      `[Token] Error al obtener token: ${data.error_description ?? data.error}`
    );
  }

  console.log('[TOKEN OK]', data.access_token);
  return data.access_token;
}

// convierte Date a string local sin "Z"
function formatLocalDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${d}T${h}:${min}:00`;
}

function parseLocalDateTimeToUTC(dateStr: string): Date {
  const [datePart, timePart] = dateStr.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hour, minute] = timePart.split(':').map(Number);

  const local = new Date(year, month - 1, day, hour, minute);

  // Ajustar manualmente zona horaria local a UTC (ej. -5 para Bogotá)
  const utc = new Date(local.getTime() - local.getTimezoneOffset() * 60000);
  return utc;
}

export async function POST(req: Request) {
  try {
    interface CreateMeetingRequest {
      courseId: number;
      title: string;
      startDateTime: string;
      durationMinutes: number;
      repeatCount: number;
    }

    const { courseId, title, startDateTime, durationMinutes, repeatCount } =
      (await req.json()) as CreateMeetingRequest;

    const token = await getGraphToken();
    const meetings = [];
    for (let i = 0; i < repeatCount; i++) {
      console.log(`\n[Clase ${i + 1}] Generando fechas...`);

      // Parseamos manualmente
      const [datePart, timePart] = startDateTime.split('T');
      const [year, month, day] = datePart.split('-').map(Number);
      const [hour, minute] = timePart.split(':').map(Number);

      const startForDb = new Date(year, month - 1, day + i * 7, hour, minute);
      const endForDb = new Date(
        startForDb.getTime() + durationMinutes * 60 * 1000
      );

      const startForApi = formatLocalDate(startForDb);
      const endForApi = formatLocalDate(endForDb);

      console.log(
        `[Clase ${i + 1}] → Local para API (Teams):`,
        startForApi,
        '→',
        endForApi
      );
      console.log(
        `[Clase ${i + 1}] → Fecha en objeto Date (para BD):`,
        startForDb,
        '→',
        endForDb
      );

      const res = await fetch(
        'https://graph.microsoft.com/v1.0/users/0843f2fa-3e0b-493f-8bb9-84b0aa1b2417/events',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            subject: `${title} (Clase ${i + 1})`,
            start: {
              dateTime: startForApi,
              timeZone: 'America/Bogota',
            },
            end: {
              dateTime: endForApi,
              timeZone: 'America/Bogota',
            },
            isOnlineMeeting: true,
            onlineMeetingProvider: 'teamsForBusiness',
          }),
        }
      );

      const text = await res.text();
      interface TeamsMeetingResponse {
        id: string;
        subject: string;
        onlineMeeting?: {
          joinUrl?: string;
          id?: string;
        };
        error?: {
          message?: string;
        };
      }

      let data: TeamsMeetingResponse | string;

      try {
        data = JSON.parse(text) as TeamsMeetingResponse;
      } catch {
        data = text;
      }

      if (!res.ok) {
        console.error('[Graph Error]', {
          status: res.status,
          url: res.url,
          response: data,
        });

        throw new Error(
          `[Teams] Error creando evento. Status ${res.status}: ${
            typeof data === 'object'
              ? (data.error?.message ?? JSON.stringify(data))
              : data
          }`
        );
      }

      if (typeof data === 'string') {
        throw new Error(`[Teams] Respuesta inesperada: ${data}`);
      }

      console.log(`[Clase ${i + 1}] ✅ Evento creado en Teams`, {
        subject: data.subject,
        joinUrl: data.onlineMeeting?.joinUrl ?? null,
      });

      meetings.push({
        id: data.id,
        subject: data.subject,
        joinUrl: data.onlineMeeting?.joinUrl ?? null,
        startDateTime: startForDb,
        endDateTime: endForDb,
        meetingId: data.onlineMeeting?.id ?? null,
      });
    }

    console.log('\n[BD] Insertando reuniones en la base de datos...');
    await db.insert(classMeetings).values(
      meetings.map((m, i) => ({
        courseId: Number(courseId),
        title: m.subject,
        startDateTime: parseLocalDateTimeToUTC(
          formatLocalDate(m.startDateTime)
        ),
        endDateTime: parseLocalDateTimeToUTC(formatLocalDate(m.endDateTime)),
        joinUrl: m.joinUrl,
        weekNumber: i + 1,
        meetingId: m.meetingId ?? '', // O un valor string por defecto
      }))
    );

    console.log('[BD] ✅ Reuniones insertadas:', meetings.length);

    return NextResponse.json({ meetings });
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json(
      { error: err.message ?? 'Error interno' },
      { status: 500 }
    );
  }
}
