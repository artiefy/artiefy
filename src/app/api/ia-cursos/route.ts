export async function POST(req: Request) {
  try {
    const { prompt, conversationId, messageHistory } = (await req.json()) as {
      prompt: string;
      conversationId?: number | string;
      messageHistory?: { sender: string; text: string }[];
    };

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

    const baseUrl = process.env.N8N_BASE_URL;
    const webhookPath = process.env.N8N_WEBHOOK_PATH;
    if (!baseUrl || !webhookPath) {
      console.error('N8N_BASE_URL / N8N_WEBHOOK_PATH no configurados');
      return new Response(JSON.stringify({ error: 'Config n8n faltante' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const n8nWebhookUrl = `${baseUrl.replace(/\/+$/, '')}/webhook/${webhookPath.replace(/^\/+/, '')}`;

    console.log('Prompt recibido:', prompt);
    console.log('Cursos reales encontrados:', availableCourses.length);

    const n8nRes = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chatInput: prompt, // Cambiado de 'prompt' a 'chatInput' para que coincida con el flujo
        conversationId,
        messageHistory,
        availableCourses, // Enviar cursos reales encontrados
      }),
    });

    if (!n8nRes.ok) {
      const errText = await n8nRes.text().catch(() => '');
      console.error('Error en n8n:', errText);
      return new Response(JSON.stringify({ error: 'Error llamando a n8n' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
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

      return payload;
    };

    const toN8nPayload = (data: unknown): N8nPayload | null => {
      if (!data || typeof data !== 'object') return null;
      const anyData = data as Record<string, unknown>;

      if (
        typeof (anyData as { n8nData?: unknown }).n8nData === 'object' &&
        (anyData as { n8nData?: unknown }).n8nData !== null
      ) {
        const nd = (anyData as { n8nData: Record<string, unknown> }).n8nData;
        if (typeof (nd as { output?: unknown }).output === 'string') {
          try {
            const parsed = JSON.parse(
              (nd as { output: string }).output
            ) as Record<string, unknown>;
            return pickPayload(parsed);
          } catch {
            return null;
          }
        }
        return pickPayload(nd);
      }

      if (typeof (anyData as { output?: unknown }).output === 'string') {
        try {
          const parsed = JSON.parse(
            (anyData as { output: string }).output
          ) as Record<string, unknown>;
          return pickPayload(parsed);
        } catch {
          return null;
        }
      }

      return pickPayload(anyData);
    };

    const normalized = toN8nPayload(raw);

    console.log('Respuesta de n8n:', raw);

    // Siempre responde con objeto seguro
    return new Response(JSON.stringify({ prompt, n8nData: normalized ?? {} }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Error en ia-cursos:', err);
    return new Response(JSON.stringify({ error: 'Error llamando a n8n' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
