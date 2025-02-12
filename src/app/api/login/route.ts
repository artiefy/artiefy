import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const publicKey = process.env.EPAYCO_PUBLIC_KEY;
    const privateKey = process.env.EPAYCO_PRIVATE_KEY;

    const authHeader = Buffer.from(`${publicKey}:${privateKey}`).toString('base64');

    const response = await fetch('https://apify.epayco.co/login', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authHeader}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      throw new Error('Error al autenticar');
    }

    const data = await response.json();
    console.log('Token JWT generado:', data.token);

    return NextResponse.json({ token: data.token });
  } catch (error) {
    console.error('Error al hacer la solicitud:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
