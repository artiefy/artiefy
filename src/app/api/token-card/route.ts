/* eslint-disable */
import { NextResponse } from 'next/server';
import { getAuthToken } from '~/utils/auth';

export async function POST(request: Request) {
  try {
    console.log('Received request to generate token card');
    const { cardNumber, cardExpYear, cardExpMonth, cardCvc } = await request.json();

    console.log('Request payload:', {
      cardNumber,
      cardExpYear,
      cardExpMonth,
      cardCvc,
    });

    const token = await getAuthToken();
    console.log('Auth token obtained:', token);

    const response = await fetch('https://apify.epayco.co/token/card', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cardNumber,
        cardExpYear,
        cardExpMonth,
        cardCvc,
      }),
    });

    console.log('Response from token card API:', response);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error al generar el token de la tarjeta:', errorData);
      throw new Error('Error al generar el token de la tarjeta');
    }

    const data = await response.json();
    console.log('Token card generated:', data.data.id);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error en la solicitud:', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    } else {
      return NextResponse.json({ error: 'Unknown error' }, { status: 500 });
    }
  }
}
