import { env } from '~/env';

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();
    if (!prompt) {
      return new Response(JSON.stringify({ error: 'Prompt requerido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Log del prompt recibido
    console.log('Prompt recibido:', prompt);

    // URL de producción del webhook de n8n
    const n8nWebhookUrl = `https://n8n.srv1000134.hstgr.cloud/webhook/${env.N8N_WEBHOOK_ID}`;

    // Llama al webhook de n8n con el prompt
    const n8nRes = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });

    if (!n8nRes.ok) {
      console.error('Error en llamada a n8n:', await n8nRes.text());
      return new Response(JSON.stringify({ error: 'Error llamando a n8n' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const n8nData = await n8nRes.json();

    // Log de la respuesta de n8n
    console.log('Respuesta de n8n:', n8nData);

    // Devuelve la respuesta de n8n directamente para procesarla en el cliente
    return new Response(JSON.stringify({ prompt, n8nData }), {
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
