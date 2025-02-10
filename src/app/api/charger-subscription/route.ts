/* eslint-disable */
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id_plan, customer, token_card, doc_type, doc_number, ip } = body;

    const response = await fetch('https://api.secure.epayco.co/v1/charge', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.EPAYCO_PRIVATE_API_KEY}`,
      },
      body: JSON.stringify({
        id_plan,
        customer,
        token_card,
        doc_type,
        doc_number,
        ip,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error al cobrar la suscripción:', errorData);
      return NextResponse.json({ error: errorData }, { status: response.status });
    }

    const charge = await response.json();
    return NextResponse.json(charge, { status: 200 });
  } catch (error) {
    console.error('Error en la solicitud:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
