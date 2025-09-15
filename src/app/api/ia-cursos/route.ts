export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();
    if (!prompt) {
      return new Response(JSON.stringify({ error: 'Prompt requerido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 👉 Llama directamente a n8n
    const n8nWebhookUrl =
      'http://localhost:5678/webhook-test/f71bd676-9eb3-4da9-beb8-8aab1c8dcdb7';

    const n8nRes = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });

    const n8nData = await n8nRes.json();

    // Aquí simplemente devuelves lo que n8n ya armó
    return new Response(JSON.stringify(n8nData), {
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
