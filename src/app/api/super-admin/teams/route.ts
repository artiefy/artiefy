import { NextResponse } from 'next/server';

import { db } from '~/server/db';
import { classMeetings } from '~/server/db/schema';

interface TokenResponse {
  access_token: string;
  error?: string;
  error_description?: string;
}

// Tipado para asistentes de Graph (asegura que 'type' sea un literal)
interface GraphAttendee {
  emailAddress: { address: string; name?: string };
  type?: 'required' | 'optional';
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

// "YYYY-MM-DDTHH:mm:00" interpretado como hora local Bogotá
function parseBogotaLocalToUTC(dateStr: string): Date {
  // truco simple y robusto: explícita la zona -05:00
  return new Date(`${dateStr}-05:00`);
}


function generateClassDates(
  startDate: Date,
  daysOfWeek: string[],
  totalCount: number
): Date[] {
  const result: Date[] = [];
  const targetDays = daysOfWeek.map((d) => d.toLowerCase());

  const weekdayFmt = new Intl.DateTimeFormat('es-CO', {
    weekday: 'long',
    timeZone: 'America/Bogota',
  });

  const current = new Date(startDate); // cursor

  while (result.length < totalCount) {
    const weekday = weekdayFmt.format(current).toLowerCase();
    if (targetDays.includes(weekday)) {
      result.push(new Date(current));
    }
    current.setDate(current.getDate() + 1);
  }

  return result;
}

// Crea un evento de Teams para una fecha concreta y devuelve joinUrl y meetingId
async function createTeamsEventForDate(params: {
  token: string;
  userId: string; // propietario del calendario (GUID)
  subject: string;
  startLocal: string; // "YYYY-MM-DDTHH:mm:00" hora local
  endLocal: string;   // "YYYY-MM-DDTHH:mm:00" hora local
  attendees: { emailAddress: { address: string; name?: string }, type?: 'required' | 'optional' }[];
  coHostUpn: string;
}) {
  const { token, userId, subject, startLocal, endLocal, attendees, coHostUpn } = params;

  // 1) Crear el evento con Teams habilitado
  const createRes = await fetch(`https://graph.microsoft.com/v1.0/users/${userId}/events`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      subject,
      start: { dateTime: startLocal, timeZone: 'America/Bogota' },
      end: { dateTime: endLocal, timeZone: 'America/Bogota' },
      isOnlineMeeting: true,
      onlineMeetingProvider: 'teamsForBusiness',
      attendees,
    }),
  });

  interface GraphEventResponse {
    id?: string;
    onlineMeeting?: { joinUrl?: string; id?: string };
    error?: { message?: string };
  }

  const created = (await createRes.json()) as GraphEventResponse;

  if (!createRes.ok || !created?.id) {
    throw new Error(`[Teams] Error creando evento: ${created?.error?.message ?? 'Desconocido'}`);
  }

  let joinUrl = created.onlineMeeting?.joinUrl ?? '';
  let meetingId = created.onlineMeeting?.id ?? '';
  const eventId = created.id;

  // 2) Si falta info, expandir
  if (!joinUrl || !meetingId) {
    const evGet = await fetch(
      `https://graph.microsoft.com/v1.0/users/${userId}/events/${encodeURIComponent(eventId)}?$expand=onlineMeeting`,
      { method: 'GET', headers: { Authorization: `Bearer ${token}` } }
    );
    if (evGet.ok) {
      const evFull = (await evGet.json()) as GraphEventResponse;
      joinUrl = evFull.onlineMeeting?.joinUrl ?? joinUrl;
      meetingId = evFull.onlineMeeting?.id ?? meetingId;
    } else {
      console.warn('[⚠️ TEAMS] No se pudo expandir onlineMeeting para obtener joinUrl/meetingId');
    }
  }

  // 3) PATCH para coorganizer/grabación (best-effort)
  if (meetingId) {
    const patchBody = {
      allowRecording: true,
      allowTranscription: true,
      participants: { attendees: [{ upn: coHostUpn, role: 'coorganizer' }] },
    };

    const patchRes = await fetch(
      `https://graph.microsoft.com/v1.0/users/${userId}/onlineMeetings/${encodeURIComponent(meetingId)}`,
      {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(patchBody),
      }
    );

    if (!patchRes.ok) {
      const errTxt = await patchRes.text();
      console.warn('[⚠️ TEAMS] No se pudo asignar coorganizer o habilitar grabación:', errTxt);
    }
  }

  return { eventId, meetingId, joinUrl };
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
      coHostEmail?: string; // 👈 NUEVO

    }

    const {
      courseId,
      title,
      startDateTime,
      durationMinutes,
      repeatCount,
      daysOfWeek,
      customTitles,
      coHostEmail, // 👈 NUEVO

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

    const attendees: GraphAttendee[] = enrolledStudents.map((enr) => ({
      emailAddress: {
        address: enr.user.email,
        name: enr.user.name ?? enr.user.email,
      },
      type: 'required' as const,
    }));

    // ➕ Asegurar que el cohost reciba invitación (aparece en su calendario)
    const coHostUpn = (coHostEmail?.trim() ?? 'educadorsoftwarem@ponao.com.co').toLowerCase();
    if (coHostUpn && !attendees.some(a => a.emailAddress.address.toLowerCase() === coHostUpn)) {
      attendees.push({
        emailAddress: { address: coHostUpn, name: coHostUpn },
        type: 'required' as const,
      });
    }


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

    console.log('🟡 [MAPPING + TEAMS] Creando una reunión por cada clase y preparando para guardar...');

    const userIdOwner = '0843f2fa-3e0b-493f-8bb9-84b0aa1b2417'; // mismo owner del calendario
    const meetings: {
      courseId: number;
      title: string;
      startDateTime: Date;
      endDateTime: Date;
      joinUrl: string;
      weekNumber: number;
      meetingId: string;
    }[] = [];

    for (let index = 0; index < classDates.length; index++) {
      const startDate = classDates[index]!;
      const endDate = new Date(startDate.getTime() + durationMinutes * 60000);

      const startLocal = formatLocalDate(startDate);
      const endLocal = formatLocalDate(endDate);

      const displayTitle =
        Array.isArray(customTitles) && customTitles[index]?.trim()
          ? `${title} (${customTitles[index]!.trim()})`
          : `${title} (Clase ${index + 1})`;

      // Crear evento individual en Teams para esta clase
      const created = await createTeamsEventForDate({
        token,
        userId: userIdOwner,
        subject: displayTitle,
        startLocal,
        endLocal,
        attendees,    // los mismos asistentes para cada clase
        coHostUpn,    // coorganizer
      });

      // Convertir a UTC correcto para almacenar
      const startUTC = parseBogotaLocalToUTC(startLocal);
      const endUTC = parseBogotaLocalToUTC(endLocal);

      meetings.push({
        courseId: Number(courseId),
        title: displayTitle,
        startDateTime: startUTC,
        endDateTime: endUTC,
        joinUrl: created.joinUrl ?? '',
        weekNumber: Math.floor(index / daysOfWeek.length) + 1,
        meetingId: created.meetingId ?? '',
      });

      console.log(`✅ Clase ${index + 1}: creada en Teams ->`, {
        meetingId: created.meetingId,
        joinUrl: created.joinUrl,
        start: startLocal,
        end: endLocal,
      });
    }

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


    // Usar los meetings (uno por clase) para listar fecha/hora y link individual
    const clasesListadoHTML = meetings
      .map((m, i) => {
        const nombreClase = customTitles?.[i]?.trim() ?? `Clase ${i + 1}`;

        const fechaLocal = new Date(
          // convertir UTC guardado a string legible local
          m.startDateTime.getTime() - (5 * 60 * 60 * 1000) // ajustar visual -05 si lo deseas
        );

        const fechaStr = fechaLocal.toLocaleDateString('es-CO', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });

        const horaStr = fechaLocal.toLocaleTimeString('es-CO', {
          hour: '2-digit',
          minute: '2-digit',
        });

        const link = m.joinUrl ? `<a href="${m.joinUrl}">Unirse</a>` : '(enlace no disponible)';
        return `<li><strong>${nombreClase}</strong>: ${fechaStr} a las ${horaStr} — ${link}</li>`;
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
    <p>Has sido invitado(a) a clases en Microsoft Teams.</p>
    <p><strong>Curso:</strong> ${title}</p>
    <p>A continuación encuentras la lista de clases con su enlace de acceso individual:</p>
    <ul>
      ${clasesListadoHTML}
    </ul>
    <p>Nos vemos pronto.</p>
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
