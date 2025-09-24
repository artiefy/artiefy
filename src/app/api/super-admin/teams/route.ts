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

    // ➕ Asegurar que el cohost reciba invitación (aparece en su calendario)
const coHostUpn = (coHostEmail?.trim() || 'educadorsoftwarem@ponao.com.co').toLowerCase();
if (coHostUpn && !attendees.some(a => a.emailAddress.address.toLowerCase() === coHostUpn)) {
  attendees.push({
    emailAddress: { address: coHostUpn, name: coHostUpn },
    type: 'required',
  });
}


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
      start: { dateTime: startForApi, timeZone: 'America/Bogota' },
      end:   { dateTime: endForApi,   timeZone: 'America/Bogota' },
      isOnlineMeeting: true,
      onlineMeetingProvider: 'teamsForBusiness',
      attendees,
    }),
  }
);

type GraphEventResponse = {
  id: string;
  error?: { message?: string };
  onlineMeeting?: { joinUrl?: string; id?: string };
};

const eventData = (await res.json()) as GraphEventResponse;

if (!res.ok) {
  console.error('[❌ ERROR TEAMS]', eventData);
  throw new Error(
    `[Teams] Error creando reunión principal: ${eventData.error?.message ?? 'Desconocido'}`
  );
}

// 1) Tomar del payload
let joinUrl = eventData.onlineMeeting?.joinUrl ?? '';
let meetingId = eventData.onlineMeeting?.id ?? '';
const eventId = eventData.id;

// 2) Si falta info, hacer GET con $expand=onlineMeeting (leer el body SOLO una vez)
if (!meetingId || !joinUrl) {
  const evGet = await fetch(
    `https://graph.microsoft.com/v1.0/users/0843f2fa-3e0b-493f-8bb9-84b0aa1b2417/events/${encodeURIComponent(eventId)}?$expand=onlineMeeting`,
    { method: 'GET', headers: { Authorization: `Bearer ${token}` } }
  );

  if (evGet.ok) {
    const evFull = (await evGet.json()) as GraphEventResponse;
    meetingId = evFull.onlineMeeting?.id ?? meetingId;
    joinUrl   = evFull.onlineMeeting?.joinUrl ?? joinUrl;
  } else {
    const errTxt = await evGet.text(); // 👈 no se ha leído antes
    console.warn('[⚠️ TEAMS] No se pudo expandir onlineMeeting:', errTxt);
  }
}


console.log('✅ Reunión creada con éxito en Teams.', { meetingId, joinUrl });

// 3) PATCH para coorganizer y grabación (una sola vez y con guarda)
console.log('🟡 [TEAMS] Asignando coorganizer y habilitando grabación...');
if (!meetingId) {
  console.warn('[⚠️ TEAMS] meetingId vacío; no se puede asignar coorganizer.');
} else {
  const patchBody = {
    allowRecording: true,
    allowTranscription: true,
    participants: { attendees: [{ upn: coHostUpn, role: 'coorganizer' }] },
    // opcional:
    // recordAutomatically: true,
  };

  const patchRes = await fetch(
    `https://graph.microsoft.com/v1.0/users/0843f2fa-3e0b-493f-8bb9-84b0aa1b2417/onlineMeetings/${encodeURIComponent(meetingId)}`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(patchBody),
    }
  );

  if (!patchRes.ok) {
    const errTxt = await patchRes.text();
    console.warn('[⚠️ TEAMS] No se pudo asignar coorganizer o habilitar grabación:', errTxt);
  } else {
    console.log('✅ Coorganizer asignado y grabación habilitada.');
  }
}


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
  const startLocal = formatLocalDate(startDate);
  const endLocal = formatLocalDate(endDate);

  const startUTC = parseBogotaLocalToUTC(startLocal);
  const endUTC = parseBogotaLocalToUTC(endLocal);

  const displayTitle =
    Array.isArray(customTitles) && customTitles[index]?.trim()
      ? `${title} (${customTitles[index].trim()})`
      : `${title} (Clase ${index + 1})`;

  return {
    courseId: Number(courseId),
    title: displayTitle,
    startDateTime: startUTC, // ✅ UTC correcto
    endDateTime: endUTC,     // ✅ UTC correcto
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
