import { NextRequest } from 'next/server';

const VERIFY_TOKEN = 'artiefy_webhook_123'; // Usa esto en el panel de Facebook

export function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 });
  } else {
    return new Response('Forbidden', { status: 403 });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  console.log('🔔 Webhook recibido:', JSON.stringify(body, null, 2));
  return new Response('EVENT_RECEIVED', { status: 200 });
}
