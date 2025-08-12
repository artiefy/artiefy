<<<<<<< HEAD
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
=======
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
  return new Date(local.getTime() - local.getTimezoneOffset() * 60000);
}

function generateClassDates(
  startDate: Date,
  daysOfWeek: string[],
  totalCount: number
): Date[] {
  const result: Date[] = [];
  const targetDays = daysOfWeek.map((d) => d.toLowerCase());
  const current = new Date(startDate);

  while (result.length < totalCount) {
    const weekday = current
      .toLocaleDateString('es-CO', { weekday: 'long' }) // ← clave
      .toLowerCase();

    if (targetDays.includes(weekday)) {
      result.push(new Date(current));
    }

    current.setDate(current.getDate() + 1);
  }

  return result;
}

export async function POST(req: Request) {
  try {
    console.log('🔵 [START] Iniciando función POST');

    interface CreateMeetingRequest {
      courseId: number;
      title: string;
      startDateTime: string;
      durationMinutes: number;
      repeatCount: number;
      daysOfWeek: string[];
      customTitles?: string[];
    }

    const {
      courseId,
      title,
      startDateTime,
      durationMinutes,
      repeatCount,
      daysOfWeek,
      customTitles,
    } = (await req.json()) as CreateMeetingRequest;

    console.log('🕒 startDateTime recibido:', startDateTime);

    const firstStartDate = new Date(startDateTime);
    if (isNaN(firstStartDate.getTime())) {
      throw new Error(
        `[Fecha inválida] El campo 'startDateTime' no es una fecha válida: ${startDateTime}`
      );
    }

    console.log('📥 Request recibido con:', {
      courseId,
      title,
      startDateTime,
      durationMinutes,
      repeatCount,
      daysOfWeek,
      customTitles,
    });

    console.log('🟡 [TOKEN] Solicitando token de Microsoft Graph...');
    const token = await getGraphToken();

    const firstEndDate = new Date(
      firstStartDate.getTime() + durationMinutes * 60000
    );
    const startForApi = formatLocalDate(firstStartDate);
    const endForApi = formatLocalDate(firstEndDate);

    console.log('🟡 [BD] Consultando estudiantes matriculados...');
    const enrolledStudents = await db.query.enrollments.findMany({
      where: (enr, { eq }) => eq(enr.courseId, courseId),
      with: {
        user: {
          columns: { email: true, name: true },
        },
      },
    });
    console.log('✅ Estudiantes encontrados:', enrolledStudents.length);

    const attendees = enrolledStudents.map((enr) => ({
      emailAddress: {
        address: enr.user.email,
        name: enr.user.name ?? enr.user.email,
      },
      type: 'required',
    }));

    console.log('🟡 [TEAMS] Creando evento principal...');
    const res = await fetch(
      'https://graph.microsoft.com/v1.0/users/0843f2fa-3e0b-493f-8bb9-84b0aa1b2417/events',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject: `${title} (Reunión General)`,
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
          attendees,
        }),
      }
    );

    interface GraphEventResponse {
      error?: { message?: string };
      onlineMeeting?: { joinUrl?: string; id?: string };
    }

    const eventData = (await res.json()) as unknown as GraphEventResponse;

    if (!res.ok) {
      console.error('[❌ ERROR TEAMS]', eventData);
      throw new Error(
        `[Teams] Error creando reunión principal: ${eventData.error?.message ?? 'Desconocido'}`
      );
    }

    const joinUrl = eventData.onlineMeeting?.joinUrl ?? '';
    const meetingId = eventData.onlineMeeting?.id ?? '';

    console.log('✅ Reunión creada con éxito en Teams.');

    const totalClasses = repeatCount * daysOfWeek.length;
    const classDates = generateClassDates(
      firstStartDate,
      daysOfWeek,
      totalClasses
    );

    console.log(`📅 Generadas ${classDates.length} fechas de clase:`);
    classDates.forEach((d, i) => {
      console.log(`→ Clase ${i + 1}: ${d.toISOString()}`);
    });

    if (customTitles && customTitles.length !== totalClasses) {
      console.warn(
        `[⚠️ Advertencia] Se esperaban ${totalClasses} títulos pero llegaron ${customTitles.length}`
      );
    }

    console.log('🟡 [MAPPING] Preparando reuniones para guardar...');
    const meetings = classDates.map((startDate, index) => {
      const endDate = new Date(startDate.getTime() + durationMinutes * 60000);
      let displayTitle: string;

      if (Array.isArray(customTitles) && customTitles[index]) {
        const custom = customTitles[index].trim();
        displayTitle = custom
          ? `${title} (${custom})`
          : `${title} (Clase ${index + 1})`;
      } else {
        displayTitle = `${title} (Clase ${index + 1})`;
      }

      console.log(`🧠 Título para clase ${index + 1}:`, displayTitle);

      return {
        courseId: Number(courseId),
        title: displayTitle,
        startDateTime: parseLocalDateTimeToUTC(formatLocalDate(startDate)),
        endDateTime: parseLocalDateTimeToUTC(formatLocalDate(endDate)),
        joinUrl,
        weekNumber: Math.floor(index / daysOfWeek.length) + 1,
        meetingId,
      };
    });

    console.log('[🗃️ Reuniones preparadas para insertar]:', meetings);

    console.log('🟡 [BD] Insertando reuniones en la base de datos...');
    await db.insert(classMeetings).values(meetings);
    console.log('[✅ BD] Reuniones insertadas:', meetings.length);

    console.log('📧 [EMAIL] Preparando notificación...');
    const toRecipients = enrolledStudents.map((enr) => ({
      emailAddress: {
        address: enr.user.email,
        name: enr.user.name ?? enr.user.email,
      },
    }));

    const _diasUnicos = [
      ...new Set(
        classDates.map((date) =>
          date.toLocaleDateString('es-CO', { weekday: 'long' })
        )
      ),
    ].join(', ');

    const clasesListadoHTML = classDates
      .map((fecha, i) => {
        const nombreClase = customTitles?.[i]?.trim() ?? `Clase ${i + 1}`;
        const fechaStr = fecha.toLocaleDateString('es-CO', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });

        const horaStr = fecha.toLocaleTimeString('es-CO', {
          hour: '2-digit',
          minute: '2-digit',
        });

        return `<li><strong>${nombreClase}</strong>: ${fechaStr} a las ${horaStr}</li>`;
      })
      .join('');

    console.log('📤 [EMAIL] Enviando correo...');
    await fetch(
      'https://graph.microsoft.com/v1.0/users/0843f2fa-3e0b-493f-8bb9-84b0aa1b2417/sendMail',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: {
            subject: `Invitación: ${title} (Teams)`,
            body: {
              contentType: 'HTML',
              content: `
          <p>Hola,</p>
          <p>Has sido invitado a una clase en Microsoft Teams.</p>
          <p><strong>Título:</strong> ${title}</p>
          <p><strong>Fecha:</strong> ${firstStartDate.toLocaleString('es-CO')}</p>
          <p><strong>Enlace para unirte:</strong> <a href="${joinUrl}">${joinUrl}</a></p>
          <p>Nos vemos pronto.</p>
            <p>Clases programadas:</p>
  <ul>
    ${clasesListadoHTML}
  </ul>
        `,
            },
            toRecipients,
          },
        }),
      }
    );
    console.log('✅ [EMAIL] Correo enviado correctamente');

    return NextResponse.json({ meetings });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('[❌ Error en el endpoint /teams]', err.message);
    return NextResponse.json(
      { error: err.message ?? 'Error interno' },
      { status: 500 }
    );
  }
}
>>>>>>> dev/miguel
