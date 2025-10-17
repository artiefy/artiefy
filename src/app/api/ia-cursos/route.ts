export async function POST(req: Request) {
  try {
    const { prompt, conversationId, messageHistory } = (await req.json()) as {
      prompt: string;
      conversationId?: number | string;
      messageHistory?: { sender: string; text: string }[];
    };

    console.log('📨 Recibido en /api/ia-cursos:', { prompt, conversationId });

    if (!prompt) {
      return new Response(JSON.stringify({ error: 'Prompt requerido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

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
    } catch (dbError) {
      console.warn('Error buscando cursos en BD:', dbError);
    }

    // NUEVO: Detectar entorno y usar webhook correspondiente
    const isLocal =
      process.env.NODE_ENV === 'development' ||
      process.env.NEXT_PUBLIC_BASE_URL?.includes('localhost');

    let n8nWebhookUrl: string;
    if (isLocal) {
      n8nWebhookUrl = process.env.N8N_WEBHOOK_LOCAL ?? '';
      console.log('🔧 Usando webhook local de n8n');
    } else {
      n8nWebhookUrl = process.env.N8N_WEBHOOK_PROD ?? '';
      console.log('🚀 Usando webhook de producción de n8n');
    }

    if (!n8nWebhookUrl) {
      console.error(
        '❌ Webhook de n8n no configurado para el entorno:',
        isLocal ? 'local' : 'producción'
      );
      console.error('Variables disponibles:', {
        N8N_WEBHOOK_LOCAL: process.env.N8N_WEBHOOK_LOCAL ? '✅' : '❌',
        N8N_WEBHOOK_PROD: process.env.N8N_WEBHOOK_PROD ? '✅' : '❌',
        NODE_ENV: process.env.NODE_ENV,
        BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
      });
      return new Response(
        JSON.stringify({ error: 'Config webhook n8n faltante' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('📡 Enviando a n8n:', {
      url: n8nWebhookUrl,
      prompt,
      cursosEncontrados: availableCourses.length,
      payload: {
        chatInput: prompt,
        sessionId:
          conversationId && String(conversationId).trim() !== ''
            ? String(conversationId)
            : `session-${Date.now()}`,
        // NUEVO: Debug del tipo de sessionId
        sessionIdType: typeof conversationId,
        sessionIdValue: conversationId,
        messageHistory: messageHistory?.length ?? 0,
        availableCourses: availableCourses.map((c) => ({
          id: c.id,
          title: c.title,
        })),
      },
    });

    const n8nRes = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chatInput: prompt,
        sessionId:
          conversationId && String(conversationId).trim() !== ''
            ? String(conversationId)
            : `session-${Date.now()}`, // <-- Generar un ID único si no existe
        messageHistory,
        availableCourses,
      }),
    });

    console.log('📨 Respuesta de n8n:', {
      status: n8nRes.status,
      ok: n8nRes.ok,
      url: n8nWebhookUrl, // NUEVO: Log del URL para debug
      headers: Object.fromEntries(n8nRes.headers.entries()),
    });

    if (!n8nRes.ok) {
      const errText = await n8nRes.text().catch(() => '');
      console.error('❌ Error en n8n:', {
        status: n8nRes.status,
        statusText: n8nRes.statusText,
        body: errText,
        url: n8nWebhookUrl, // NUEVO: Log del URL en error
      });

      // NUEVO: Instrucciones más detalladas para activar n8n
      if (n8nRes.status === 404 && errText.includes('not registered')) {
        console.error('🔧 PASOS PARA ACTIVAR N8N:');
        console.error('1. Abre http://localhost:5678 en tu navegador');
        console.error('2. Busca el workflow "My workflow 9"');
        console.error('3. Haz clic en el workflow para abrirlo');
        console.error(
          '4. Verifica que el nodo Webhook esté configurado correctamente'
        );
        console.error('5. Activa el workflow (toggle debe estar en ON/verde)');
        console.error(
          '6. Haz clic en "Execute Workflow" o "Save" para registrar el webhook'
        );
        console.error('7. Intenta de nuevo en el chatbot');

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
            webhookUrl: n8nWebhookUrl,
          }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      return new Response(
        JSON.stringify({
          error: 'Error llamando a n8n',
          details: `${n8nRes.status}: ${errText}`,
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const raw: unknown = await n8nRes.json();
    console.log('✅ Datos recibidos de n8n:', raw);

    // NUEVO: Log más detallado para ver estructura exacta
    try {
      console.log('Estructura de datos n8n:', JSON.stringify(raw, null, 2));
    } catch (_e) {
      console.log('No se pudo stringificar la estructura completa');
      void e;
    }

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

    console.log('📤 Enviando respuesta normalizada:', {
      prompt,
      n8nData: normalized ?? {},
    });

    // Siempre responde con objeto seguro
    return new Response(JSON.stringify({ prompt, n8nData: normalized ?? {} }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('💥 Error en ia-cursos:', err);
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
