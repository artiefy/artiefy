import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const WABA_ID = process.env.WHATSAPP_WABA_ID!;
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN!;

export async function GET() {
  try {
    // 1) Pide plantillas (si responde, el token sirve)
    const urlTpl = `https://graph.facebook.com/v22.0/${WABA_ID}/message_templates?limit=1`;
    const resTpl = await fetch(urlTpl, {
      headers: { Authorization: `Bearer ${ACCESS_TOKEN}` },
      cache: 'no-store',
    });
    const jsonTpl = await resTpl.json();

    // 2) Opcional: info del WABA
    const urlAcct = `https://graph.facebook.com/v22.0/${WABA_ID}?fields=id,name,verification_status`;
    const resAcct = await fetch(urlAcct, {
      headers: { Authorization: `Bearer ${ACCESS_TOKEN}` },
      cache: 'no-store',
    });
    const jsonAcct = await resAcct.json();

    return NextResponse.json({
      ok: resTpl.ok && resAcct.ok,
      templates_ok: resTpl.ok,
      account_ok: resAcct.ok,
      account: jsonAcct,
      templates_hint: resTpl.ok ? 'OK' : jsonTpl,
    });
  } catch (e) {
    console.error('[WA-HEALTH] Error:', e);
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
