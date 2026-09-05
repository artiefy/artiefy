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

// ==========================================
// ✅ FUNCIONES DE VALIDACIÓN
// ==========================================

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

async function verifyUserExists(
  token: string,
  email: string
): Promise<boolean> {
  console.log(`🔍 [VERIFY USER] Verificando existencia de: ${email}`);
  try {
    const response = await fetch(
      `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(email)}`,
      {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    console.log(`📊 [VERIFY USER] Status: ${response.status} para ${email}`);

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`❌ [VERIFY USER] Error response:`, errorBody);
    }

    return response.ok;
  } catch (error) {
    console.error(`❌ [VERIFY USER] Exception:`, error);
    return false;
  }
}

async function getGraphToken() {
  console.log('🔐 [TOKEN] Iniciando obtención de token...');
  const tenant = process.env.NEXT_PUBLIC_TENANT_ID!;
  const clientId = process.env.NEXT_PUBLIC_CLIENT_ID!;
  const clientSecret = process.env.MS_GRAPH_CLIENT_SECRET!;
  void tenant;

  const params = new URLSearchParams();
  params.append('grant_type', 'client_credentials');
  params.append('client_id', clientId);
  params.append('client_secret', clientSecret);
  params.append('scope', 'https://graph.microsoft.com/.default');

  console.log('📤 [TOKEN] Enviando request a Microsoft...');
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
    console.error('❌ [TOKEN] Error:', data.error_description ?? data.error);
    throw new Error(
      `[Token] Error al obtener token: ${data.error_description ?? data.error}`
    );
  }

  console.log('✅ [TOKEN] Token obtenido exitosamente');
  return data.access_token;
}

/**
 * Convierte un instante a "YYYY-MM-DDTHH:mm:00" en hora de Bogotá.
 *
 * Antes usaba `getFullYear`/`getHours`, que devuelven la hora en la zona del
 * SERVIDOR. En Vercel eso es UTC, así que una clase de las 2:19 p. m. salía
 * como "19:19" y `parseBogotaLocalToUTC` le sumaba otras 5 horas: quedaba
 * guardada a las 7:19 p. m. Teams no se veía afectado porque recibe la zona
 * horaria en un campo aparte.
 */
function formatLocalDate(date: Date): string {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);

  const valor = (tipo: Intl.DateTimeFormatPartTypes) =>
    partes.find((p) => p.type === tipo)?.value ?? '00';

  // `hour` puede venir como "24" a medianoche en algunos entornos.
  const hora = valor('hour') === '24' ? '00' : valor('hour');

  return `${valor('year')}-${valor('month')}-${valor('day')}T${hora}:${valor('minute')}:00`;
}

// "YYYY-MM-DDTHH:mm:00" interpretado como hora local Bogotá
function parseBogotaLocalToUTC(dateStr: string): Date {
  return new Date(`${dateStr}-05:00`);
}

function generateClassDates(
  startDate: Date,
  daysOfWeek: string[],
  totalCount: number
): Date[] {
  console.log(
    `📅 [DATES] Generando ${totalCount} fechas desde ${startDate.toISOString()}`
  );
  const result: Date[] = [];
  const targetDays = daysOfWeek.map((d) => d.toLowerCase());

  const weekdayFmt = new Intl.DateTimeFormat('es-CO', {
    weekday: 'long',
    timeZone: 'America/Bogota',
  });

  const current = new Date(startDate);

  while (result.length < totalCount) {
    const weekday = weekdayFmt.format(current).toLowerCase();
    if (targetDays.includes(weekday)) {
      result.push(new Date(current));
      console.log(
        `  ✓ Fecha ${result.length}: ${current.toISOString()} (${weekday})`
      );
    }
    current.setDate(current.getDate() + 1);
  }

  console.log(`✅ [DATES] ${result.length} fechas generadas`);
  return result;
}

// ==========================================
// ✅ FUNCIÓN MEJORADA PARA CREAR EVENTOS
// ==========================================

async function createTeamsEventForDate(params: {
  token: string;
  userId: string;
  subject: string;
  startLocal: string;
  endLocal: string;
  attendees: {
    emailAddress: { address: string; name?: string };
    type?: 'required' | 'optional';
  }[];
  coHostUpn: string;
}) {
  const { token, userId, subject, startLocal, endLocal, attendees, coHostUpn } =
    params;

  console.log('\n🎯 [CREATE EVENT] Iniciando creación de evento...');
  console.log(`   📌 Subject: ${subject}`);
  console.log(`   📌 Start: ${startLocal}`);
  console.log(`   📌 End: ${endLocal}`);
  console.log(`   📌 Co-Host: ${coHostUpn}`);
  console.log(`   📌 Attendees: ${attendees.length}`);

  // ✅ VALIDAR EMAIL DEL CO-HOST
  if (!isValidEmail(coHostUpn)) {
    console.error(`❌ [CREATE EVENT] Email inválido: ${coHostUpn}`);
    throw new Error(`Email inválido: ${coHostUpn}`);
  }

  // ✅ VERIFICAR QUE EL USUARIO EXISTE EN AZURE AD
  const userExists = await verifyUserExists(token, coHostUpn);
  if (!userExists) {
    console.error(
      `❌ [CREATE EVENT] Usuario no encontrado en Azure AD: ${coHostUpn}`
    );
    throw new Error(`Usuario no encontrado en Azure AD: ${coHostUpn}`);
  }

  console.log(`✅ [CREATE EVENT] Usuario verificado en Azure AD: ${coHostUpn}`);

  // 1) Crear el evento con Teams habilitado
  console.log('📤 [CREATE EVENT] Creando evento en calendario...');
  const createRes = await fetch(
    `https://graph.microsoft.com/v1.0/users/${userId}/events`,
    {
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
    }
  );

  interface GraphEventResponse {
    id?: string;
    onlineMeeting?: { joinUrl?: string; id?: string };
    error?: { message?: string };
  }

  const created = (await createRes.json()) as GraphEventResponse;

  if (!createRes.ok || !created?.id) {
    console.error(
      '❌ [CREATE EVENT] Error al crear evento:',
      created?.error?.message
    );
    throw new Error(
      `[Teams] Error creando evento: ${created?.error?.message ?? 'Desconocido'}`
    );
  }

  console.log(`✅ [CREATE EVENT] Evento creado con ID: ${created.id}`);

  let joinUrl = created.onlineMeeting?.joinUrl ?? '';
  let meetingIdShort = created.onlineMeeting?.id ?? '';
  let meetingIdChat = '';
  const eventId = created.id;

  // 2) Si falta info, expandir con $expand
  if (!joinUrl || !meetingIdShort) {
    console.log('🔍 [CREATE EVENT] Expandiendo información de reunión...');
    const evGet = await fetch(
      `https://graph.microsoft.com/v1.0/users/${userId}/events/${encodeURIComponent(eventId)}?$expand=onlineMeeting`,
      { method: 'GET', headers: { Authorization: `Bearer ${token}` } }
    );
    if (evGet.ok) {
      const evFull = (await evGet.json()) as GraphEventResponse;
      joinUrl = evFull.onlineMeeting?.joinUrl ?? joinUrl;
      meetingIdShort = evFull.onlineMeeting?.id ?? meetingIdShort;
      console.log(`✅ [CREATE EVENT] Información expandida obtenida`);
    } else {
      console.warn('[⚠️ CREATE EVENT] No se pudo expandir onlineMeeting');
    }
  }

  if (joinUrl) {
    try {
      const match = /\/19%3a(meeting_[^%/]+)%40thread\.v2\//.exec(joinUrl);
      if (match?.[1]) {
        meetingIdChat = `19:${decodeURIComponent(match[1])}@thread.v2`;
        console.log(`✅ [CREATE EVENT] MeetingId del chat: ${meetingIdChat}`);
      }
    } catch (err) {
      console.warn('[⚠️ CREATE EVENT] No se pudo extraer meetingId:', err);
    }
  }

  console.log(`📊 [CREATE EVENT] Estado actual:`, {
    joinUrl: joinUrl ? 'OK' : 'MISSING',
    meetingIdShort: meetingIdShort ? 'OK' : 'MISSING',
    meetingIdChat: meetingIdChat ? 'OK' : 'MISSING',
  });

  // 3) PATCH para coorganizer/grabación
  if (meetingIdShort) {
    const patchBody = {
      allowRecording: true,
      allowTranscription: true,
      recordAutomatically: true, // 👈 ESTA LÍNEA ES LA CLAVE
      // Clase abierta tipo universidad: cualquiera entra directo, sin sala de
      // espera. `scope: 'everyone'` incluye a invitados anónimos (entran
      // escribiendo su nombre, sin iniciar sesión). Requiere además que el
      // tenant permita "usuarios anónimos" en el Centro de administración de
      // Teams; si está desactivado allí, Teams seguirá pidiendo login.
      lobbyBypassSettings: {
        scope: 'everyone',
        isDialInBypassEnabled: true,
      },
      // Los asistentes entran como asistentes; solo organizador/co-organizador
      // presentan y graban.
      allowedPresenters: 'organization',
      participants: {
        attendees: [
          {
            upn: coHostUpn,
            role: 'coorganizer',
          },
        ],
      },
    };

    console.log('🔄 [PATCH] Asignando co-organizador...');
    console.log('📋 [PATCH] Body:', JSON.stringify(patchBody, null, 2));

    const patchRes = await fetch(
      `https://graph.microsoft.com/v1.0/users/${userId}/onlineMeetings/${encodeURIComponent(meetingIdShort)}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(patchBody),
      }
    );

    console.log(`📊 [PATCH] Response status: ${patchRes.status}`);

    if (!patchRes.ok) {
      const errText = await patchRes.text();
      console.error('❌ [PATCH] Error completo:', {
        status: patchRes.status,
        statusText: patchRes.statusText,
        body: errText,
        coHostUpn,
        meetingIdShort,
      });

      console.warn(
        `⚠️ [PATCH] No se pudo asignar co-organizador. El evento se creó pero sin permisos.`
      );
    } else {
      console.log(
        `✅ [PATCH] Co-organizador ${coHostUpn} asignado correctamente`
      );
    }
  } else {
    console.warn(
      '[⚠️ PATCH] No se pudo asignar coorganizer porque falta meetingIdShort'
    );
  }

  console.log('✅ [CREATE EVENT] Evento completado exitosamente\n');
  return { eventId, meetingId: meetingIdChat, joinUrl };
}

// ==========================================
// ✅ ENDPOINT POST PRINCIPAL
// ==========================================

export async function POST(req: Request) {
  try {
    console.log('\n\n🔵 ====================================');
    console.log('🔵 [START] POST /api/super-admin/teams');
    console.log('🔵 ====================================\n');

    interface CreateMeetingRequest {
      courseId: number;
      title: string;
      startDateTime: string;
      durationMinutes: number;
      repeatCount: number;
      daysOfWeek: string[];
      customTitles?: string[];
      coHostEmail?: string;
    }

    const body = (await req.json()) as CreateMeetingRequest;
    const {
      courseId,
      title,
      startDateTime,
      durationMinutes,
      repeatCount,
      daysOfWeek,
      customTitles,
      coHostEmail,
    } = body;

    console.log('📥 [REQUEST] Datos recibidos:');
    console.log('   - courseId:', courseId);
    console.log('   - title:', title);
    console.log('   - startDateTime:', startDateTime);
    console.log('   - durationMinutes:', durationMinutes);
    console.log('   - repeatCount:', repeatCount);
    console.log('   - daysOfWeek:', daysOfWeek);
    console.log('   - customTitles:', customTitles?.length ?? 0);
    console.log('   - coHostEmail:', coHostEmail ?? 'no proporcionado');

    // ✅ VALIDAR Y NORMALIZAR EMAIL DEL CO-HOST
    const coHostUpn = (
      coHostEmail?.trim() ?? 'educadorsoftwarem@ponao.com.co'
    ).toLowerCase();
    console.log(`\n📧 [VALIDATION] Co-host email: ${coHostUpn}`);

    if (!isValidEmail(coHostUpn)) {
      console.error(`❌ [VALIDATION] Email inválido: ${coHostUpn}`);
      return NextResponse.json(
        { error: `Email inválido para co-organizador: ${coHostUpn}` },
        { status: 400 }
      );
    }

    console.log('✅ [VALIDATION] Email tiene formato válido');

    // ✅ VALIDAR FECHA
    //
    // El modal envía la hora tal como la escribió el usuario, sin zona
    // ("2026-09-02T14:19"). `new Date()` la interpretaría en la zona del
    // SERVIDOR: en Vercel eso es UTC y la clase se corría 5 horas. Se
    // interpreta explícitamente como hora de Bogotá.
    const firstStartDate = /[Zz]|[+-]\d{2}:\d{2}$/.test(startDateTime)
      ? new Date(startDateTime)
      : parseBogotaLocalToUTC(startDateTime.slice(0, 16));
    if (isNaN(firstStartDate.getTime())) {
      console.error(`❌ [VALIDATION] Fecha inválida: ${startDateTime}`);
      throw new Error(
        `[Fecha inválida] El campo 'startDateTime' no es una fecha válida: ${startDateTime}`
      );
    }

    console.log(
      `✅ [VALIDATION] Fecha válida: ${firstStartDate.toISOString()}`
    );

    // ✅ OBTENER TOKEN
    const token = await getGraphToken();

    // ✅ VERIFICAR QUE EL CO-HOST EXISTE EN AZURE AD
    console.log('\n🔍 [VERIFICATION] Verificando co-host en Azure AD...');
    const coHostExists = await verifyUserExists(token, coHostUpn);

    if (!coHostExists) {
      console.error(`❌ [VERIFICATION] Usuario no encontrado: ${coHostUpn}`);
      return NextResponse.json(
        {
          error: `El usuario ${coHostUpn} no existe en Azure AD. Por favor verifica el correo.`,
          suggestion:
            'Asegúrate de que el correo pertenece a tu organización Microsoft 365.',
          testedEmail: coHostUpn,
        },
        { status: 404 }
      );
    }

    console.log(`✅ [VERIFICATION] Co-host existe en Azure AD: ${coHostUpn}`);

    // ✅ CONSULTAR ESTUDIANTES
    console.log('\n🔍 [DATABASE] Consultando estudiantes matriculados...');
    const enrolledStudents = await db.query.enrollments.findMany({
      where: (enr, { eq }) => eq(enr.courseId, courseId),
      with: {
        user: {
          columns: { email: true, name: true },
        },
      },
    });
    console.log(
      `✅ [DATABASE] Estudiantes encontrados: ${enrolledStudents.length}`
    );

    const attendees: GraphAttendee[] = enrolledStudents.map((enr) => ({
      emailAddress: {
        address: enr.user.email,
        name: enr.user.name ?? enr.user.email,
      },
      type: 'required' as const,
    }));

    // ➕ Asegurar que el cohost reciba invitación
    if (
      !attendees.some((a) => a.emailAddress.address.toLowerCase() === coHostUpn)
    ) {
      console.log(
        `📧 [ATTENDEES] Agregando co-host a lista de asistentes: ${coHostUpn}`
      );
      attendees.push({
        emailAddress: { address: coHostUpn, name: coHostUpn },
        type: 'required' as const,
      });
    } else {
      console.log(`✅ [ATTENDEES] Co-host ya está en lista de estudiantes`);
    }

    const totalClasses = repeatCount * daysOfWeek.length;
    console.log(`\n📊 [CALCULATION] Total de clases a crear: ${totalClasses}`);

    const classDates = generateClassDates(
      firstStartDate,
      daysOfWeek,
      totalClasses
    );

    if (customTitles && customTitles.length !== totalClasses) {
      console.warn(
        `⚠️ [WARNING] Se esperaban ${totalClasses} títulos pero llegaron ${customTitles.length}`
      );
    }

    console.log('\n🔄 [CREATION] Iniciando creación de eventos en Teams...');

    const userIdOwner = '0843f2fa-3e0b-493f-8bb9-84b0aa1b2417';
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

      console.log(
        `\n📝 [CREATION] Clase ${index + 1}/${classDates.length}: ${displayTitle}`
      );

      try {
        const created = await createTeamsEventForDate({
          token,
          userId: userIdOwner,
          subject: displayTitle,
          startLocal,
          endLocal,
          attendees,
          coHostUpn,
        });

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

        console.log(`✅ [CREATION] Clase ${index + 1} creada exitosamente`);
      } catch (error) {
        console.error(`❌ [CREATION] Error en clase ${index + 1}:`, error);
        throw error;
      }
    }

    console.log(`\n✅ [CREATION] Todas las clases creadas: ${meetings.length}`);

    console.log('\n💾 [DATABASE] Insertando reuniones en BD...');
    await db.insert(classMeetings).values(meetings);
    console.log('✅ [DATABASE] Reuniones insertadas correctamente');

    console.log('\n📧 [EMAIL] Preparando notificación...');
    const toRecipients = enrolledStudents.map((enr) => ({
      emailAddress: {
        address: enr.user.email,
        name: enr.user.name ?? enr.user.email,
      },
    }));

    const clasesListadoHTML = meetings
      .map((m, i) => {
        const nombreClase = customTitles?.[i]?.trim() ?? `Clase ${i + 1}`;
        const fechaLocal = new Date(
          m.startDateTime.getTime() - 5 * 60 * 60 * 1000
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
        const link = m.joinUrl
          ? `<a href="${m.joinUrl}">Unirse</a>`
          : '(enlace no disponible)';
        return `<li><strong>${nombreClase}</strong>: ${fechaStr} a las ${horaStr} — ${link}</li>`;
      })
      .join('');

    console.log('📤 [EMAIL] Enviando correo a estudiantes...');
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

    console.log('\n🟢 ====================================');
    console.log('🟢 [SUCCESS] Proceso completado');
    console.log('🟢 ====================================\n');

    return NextResponse.json({
      success: true,
      meetings,
      totalCreated: meetings.length,
      coHost: coHostUpn,
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('\n❌ ====================================');
    console.error('❌ [ERROR] Error en el endpoint /teams');
    console.error('❌ ====================================');
    console.error('Error:', err.message);
    console.error('Stack:', error);
    console.error('❌ ====================================\n');

    return NextResponse.json(
      { error: err.message ?? 'Error interno' },
      { status: 500 }
    );
  }
}
