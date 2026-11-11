import { auth } from '@clerk/nextjs/server';

import { ratelimit } from '~/server/ratelimit/ratelimit';

const MAX_PROMPT_CHARS = 2000;
const MAX_HISTORY_MESSAGES = 20;
const MAX_HISTORY_TEXT_CHARS = 2000;
const MAX_CONVERSATION_ID_CHARS = 100;

function jsonError(error: string, status: number) {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return jsonError('Debes iniciar sesión para usar el asistente', 401);
    }

    const { success } = await ratelimit.limit(`ia-cursos:user:${userId}`);
    if (!success) {
      return jsonError(
        'Demasiadas solicitudes. Intenta de nuevo en un momento.',
        429
      );
    }

    const { prompt, conversationId, messageHistory } = (await req.json()) as {
      prompt: string;
      conversationId?: number | string;
      messageHistory?: { sender: string; text: string }[];
    };

    if (!prompt || typeof prompt !== 'string') {
      return jsonError('Prompt requerido', 400);
    }
    if (prompt.length > MAX_PROMPT_CHARS) {
      return jsonError('El mensaje es demasiado largo', 413);
    }

    // The n8n memory key is bound to the caller so nobody can address another
    // user's conversation by guessing a conversation id.
    const clientConversationId =
      conversationId !== undefined && String(conversationId).trim() !== ''
        ? String(conversationId).slice(0, MAX_CONVERSATION_ID_CHARS)
        : `session-${Date.now()}`;
    const sessionId = `${userId}:${clientConversationId}`;

    const safeHistory = Array.isArray(messageHistory)
      ? messageHistory
          .slice(-MAX_HISTORY_MESSAGES)
          .flatMap((m) =>
            m && typeof m.text === 'string'
              ? [{ ...m, text: m.text.slice(0, MAX_HISTORY_TEXT_CHARS) }]
              : []
          )
      : undefined;

    // NUEVO: Buscar cursos reales de la BD usando la API de búsqueda
    let availableCourses: {
      id: number;
      title: string;
      modalidad?: string;
      modalidadId?: number;
    }[] = [];
    try {
      const searchRes = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/courses/search`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: prompt, limit: 5 }),
        }
      );

      if (searchRes.ok) {
        const searchData = (await searchRes.json()) as {
          courses: {
            id: number;
            title: string;
            modalidad?: string;
            modalidadId?: number;
          }[];
        };
        availableCourses = searchData.courses || [];
      }
    } catch {
      // Course search is optional context; the chat continues without it.
    }

    // NUEVO: Detectar entorno y usar webhook correspondiente
    const isLocal =
      process.env.NODE_ENV === 'development' ||
      process.env.NEXT_PUBLIC_BASE_URL?.includes('localhost');

    let n8nWebhookUrl: string;
    if (isLocal) {
      n8nWebhookUrl = process.env.N8N_WEBHOOK_LOCAL ?? '';
    } else {
      n8nWebhookUrl = process.env.N8N_WEBHOOK_PROD ?? '';
    }

    if (!n8nWebhookUrl) {
      return jsonError('Config webhook n8n faltante', 500);
    }

    let n8nRes: Response;
    try {
      n8nRes = await fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatInput: prompt,
          sessionId,
          messageHistory: safeHistory,
          availableCourses,
        }),
      });
    } catch (err) {
      return new Response(
        JSON.stringify({
          prompt,
          n8nData: {
            intent: 'n8n_unavailable',
            mensaje:
              'Estamos teniendo problemas para conectar con el motor IA. Inténtalo de nuevo en unos minutos o contacta al soporte si el problema continúa.',
            courses: [],
            error: err instanceof Error ? err.message : 'network_error',
          },
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    if (!n8nRes.ok) {
      const errText = await n8nRes.text().catch(() => '');
      // NUEVO: Instrucciones más detalladas para activar n8n
      if (n8nRes.status === 404 && errText.includes('not registered')) {
        return new Response(
          JSON.stringify({
            error: 'Workflow de n8n no está activo',
            details:
              'El webhook no está registrado. Activa el workflow en n8n.',
            instructions: [
              '1. Abre http://localhost:5678',
              '2. Busca "My workflow 9"',
              '3. Activa el workflow (toggle ON)',
              '4. Haz clic en "Execute Workflow"',
              '5. Intenta de nuevo',
            ],
          }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      return new Response(
        JSON.stringify({
          prompt,
          n8nData: {
            intent: 'n8n_unavailable',
            mensaje:
              'Estamos teniendo problemas para conectar con el motor IA. Inténtalo de nuevo en unos minutos o contacta al soporte si el problema continúa.',
            courses: [],
            error: `n8n_status_${n8nRes.status}`,
          },
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const raw: unknown = await n8nRes.json();

    interface CourseData {
      id: number;
      title: string;
      modalidadId?: number;
      modalidad?: string;
    }
    interface N8nPayload {
      mensaje_inicial?: string;
      mensaje?: string;
      courses?: CourseData[];
      courseDescription?: string;
      courseId?: number;
      projectPrompt?: boolean;
      intent?: string;

      // NUEVO: posibles campos del borrador de proyecto
      projectName?: string;
      planteamiento?: string;
      justificacion?: string;
      objetivoGeneral?: string;
      objetivosEspecificos?: string[];
      actividades?: (string | { descripcion: string })[];
      categoryId?: number;
      typeProject?: string;
    }

    const getStr = (
      obj: Record<string, unknown>,
      key: string
    ): string | undefined =>
      typeof obj[key] === 'string' ? (obj[key] as string) : undefined;
    const getNum = (
      obj: Record<string, unknown>,
      key: string
    ): number | undefined =>
      typeof obj[key] === 'number' ? (obj[key] as number) : undefined;
    const getBool = (
      obj: Record<string, unknown>,
      key: string
    ): boolean | undefined =>
      typeof obj[key] === 'boolean' ? (obj[key] as boolean) : undefined;

    const pickPayload = (obj: Record<string, unknown>): N8nPayload => {
      const payload: N8nPayload = {};
      const mi = getStr(obj, 'mensaje_inicial');
      if (mi) payload.mensaje_inicial = mi;
      const msg = getStr(obj, 'mensaje');
      if (msg) payload.mensaje = msg;

      // dot-notation segura con type guards
      if (Array.isArray((obj as { courses?: unknown }).courses)) {
        const rawCourses = (obj as { courses: unknown[] }).courses;
        payload.courses = rawCourses
          .filter((c): c is Record<string, unknown> => {
            if (!c || typeof c !== 'object') return false;
            const o = c as Record<string, unknown>;
            return typeof o.id === 'number' && typeof o.title === 'string';
          })
          .map((cObj) => {
            const o = cObj as Record<string, unknown>;
            return {
              id: o.id as number,
              title: o.title as string,
              modalidadId:
                typeof o.modalidadId === 'number'
                  ? (o.modalidadId as number)
                  : undefined,
              modalidad:
                typeof o.modalidad === 'string'
                  ? (o.modalidad as string)
                  : undefined,
            };
          });
      }

      const courseDescription = getStr(obj, 'courseDescription');
      if (courseDescription) payload.courseDescription = courseDescription;

      const courseId = getNum(obj, 'courseId');
      if (typeof courseId === 'number') payload.courseId = courseId;

      const projectPrompt = getBool(obj, 'projectPrompt');
      if (typeof projectPrompt === 'boolean')
        payload.projectPrompt = projectPrompt;

      const intent = getStr(obj, 'intent');
      if (intent) payload.intent = intent;

      // NUEVO: mapear campos de borrador de proyecto con alias tolerantes
      const str = (k: string) =>
        typeof obj[k] === 'string' ? (obj[k] as string) : undefined;
      const num = (k: string) =>
        typeof obj[k] === 'number' ? (obj[k] as number) : undefined;
      const arr = (k: string) =>
        Array.isArray(obj[k]) ? (obj[k] as unknown[]) : undefined;

      payload.projectName =
        str('projectName') ??
        str('project_name') ??
        str('nombreProyecto') ??
        str('tituloProyecto');

      payload.planteamiento =
        str('planteamiento') ??
        str('problemStatement') ??
        str('project_description') ??
        str('descripcionProyecto');

      payload.justificacion = str('justificacion') ?? str('justification');

      payload.objetivoGeneral =
        str('objetivoGeneral') ??
        str('objetivo_general') ??
        str('generalObjective');

      const objEsps =
        arr('objetivosEspecificos') ??
        arr('objetivos_especificos') ??
        arr('specificObjectives') ??
        arr('objectives');

      if (objEsps) {
        payload.objetivosEspecificos = objEsps
          .map((o) =>
            typeof o === 'string'
              ? o
              : typeof o === 'object' &&
                  o &&
                  'title' in o &&
                  typeof (o as { title?: unknown }).title === 'string'
                ? (o as { title: string }).title
                : undefined
          )
          .filter((x): x is string => typeof x === 'string' && x.trim() !== '');
      }

      const acts = arr('actividades') ?? arr('tasks');
      if (acts) {
        payload.actividades = acts
          .map((a) =>
            typeof a === 'string'
              ? a
              : typeof a === 'object' &&
                  a &&
                  'descripcion' in a &&
                  typeof (a as { descripcion?: unknown }).descripcion ===
                    'string'
                ? { descripcion: (a as { descripcion: string }).descripcion }
                : typeof a === 'object' &&
                    a &&
                    'task_name' in a &&
                    typeof (a as { task_name?: unknown }).task_name === 'string'
                  ? { descripcion: (a as { task_name: string }).task_name }
                  : undefined
          )
          .filter((x): x is string | { descripcion: string } => Boolean(x));
      }

      payload.categoryId =
        num('categoryId') ?? num('categoriaId') ?? num('category');
      payload.typeProject =
        str('typeProject') ?? str('project_type') ?? str('tipoProyecto');

      return payload;
    };

    const toN8nPayload = (data: unknown): N8nPayload | null => {
      if (!data || typeof data !== 'object') return null;
      const anyData = data as Record<string, unknown>;

      // Caso n8nData.output
      if (
        typeof (anyData as { n8nData?: unknown }).n8nData === 'object' &&
        (anyData as { n8nData?: unknown }).n8nData !== null
      ) {
        const nd = (anyData as { n8nData: Record<string, unknown> }).n8nData;
        if (typeof (nd as { output?: unknown }).output === 'string') {
          const output = (nd as { output: string }).output;
          if (output === null || output === 'null') {
            // Si output es null, responde con mensaje claro
            return {
              mensaje:
                'No se encontraron cursos. Intenta con otra idea o revisa la oferta actual.',
            };
          }
          try {
            return pickPayload(
              JSON.parse(output as string) as Record<string, unknown>
            );
          } catch {
            return { mensaje: output };
          }
        }
        // Si output es null (no string), responde con mensaje claro
        if ((nd as { output?: unknown }).output === null) {
          return {
            mensaje:
              'No se encontraron cursos. Intenta con otra idea o revisa la oferta actual.',
          };
        }
        return pickPayload(nd as Record<string, unknown>);
      }

      // Caso output directo
      if (typeof (anyData as { output?: unknown }).output === 'string') {
        const output = (anyData as { output: string }).output;
        if (output === null || output === 'null') {
          return {
            mensaje:
              'No se encontraron cursos. Intenta con otra idea o revisa la oferta actual.',
          };
        }
        try {
          return pickPayload(
            JSON.parse(output as string) as Record<string, unknown>
          );
        } catch {
          return { mensaje: output };
        }
      }
      if ((anyData as { output?: unknown }).output === null) {
        return {
          mensaje:
            'No se encontraron cursos. Intenta con otra idea o revisa la oferta actual.',
        };
      }

      // Si no hay output, intenta normalizar el objeto
      return pickPayload(anyData as Record<string, unknown>);
    };

    const normalized = toN8nPayload(raw);

    // NUEVO: Asegurar que siempre haya algún texto para mostrar
    if (normalized && !normalized.mensaje && !normalized.mensaje_inicial) {
      if (typeof raw === 'object' && raw !== null) {
        // Intentar extraer mensaje del objeto raw si está disponible
        const anyRaw = raw as Record<string, unknown>;
        if (typeof anyRaw.message === 'string') {
          normalized.mensaje = anyRaw.message;
        } else if (typeof anyRaw.text === 'string') {
          normalized.mensaje = anyRaw.text;
        } else if (
          raw &&
          typeof raw === 'object' &&
          'output' in (raw as object)
        ) {
          const output = (raw as Record<string, unknown>).output;
          if (typeof output === 'string') {
            normalized.mensaje = output;
          }
        }
      }

      // Si aún no hay mensaje, poner uno genérico
      if (!normalized.mensaje && !normalized.mensaje_inicial) {
        normalized.mensaje =
          'He procesado tu consulta. ¿Puedo ayudarte con algo más?';
      }
    }

    // Siempre responde con objeto seguro
    return new Response(JSON.stringify({ prompt, n8nData: normalized ?? {} }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: 'Error llamando a n8n',
        details: err instanceof Error ? err.message : 'Error desconocido',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
