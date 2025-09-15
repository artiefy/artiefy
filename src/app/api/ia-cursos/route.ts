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

    // URL de tu webhook de n8n
    const n8nWebhookUrl =
      'http://localhost:5678/webhook-test/f71bd676-9eb3-4da9-beb8-8aab1c8dcdb7';

    // Llama al webhook de n8n con el prompt
    const n8nRes = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });

    if (!n8nRes.ok) {
      return new Response(JSON.stringify({ error: 'Error llamando a n8n' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const n8nData = await n8nRes.json();

    // Log de la respuesta de n8n
    console.log('Respuesta de n8n:', n8nData);

    // Devuelve la respuesta de n8n y el prompt para depuración
    return new Response(JSON.stringify({ prompt, n8nData }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (_err) {
    return new Response(JSON.stringify({ error: 'Error llamando a n8n' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
