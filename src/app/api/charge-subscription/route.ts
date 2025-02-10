/* eslint-disable */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthToken } from '~/utils/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id_plan, customer, token_card, doc_type, doc_number, ip } = body;

    const token = await getAuthToken();
    console.log('Auth token:', token);

    const response = await fetch('https://api.secure.epayco.co/v1/charge', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
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
      return NextResponse.json({ error: errorData }, { status: response.status });
    }

    const charge = await response.json();
    console.log('Subscription charged:', charge.data.id);
    return NextResponse.json(charge, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
