/* eslint-disable */
// app/api/create-subscription/route.ts (o pages/api/create-subscription.ts)

import { NextResponse } from 'next/server';
import { getAuthToken } from '~/utils/auth';

export async function POST(request: Request) {
	try {
		const { customerId, planId } = await request.json();

		const token = await getAuthToken();

		const response = await fetch(
			'https://apify.epayco.co/subscription/create',
			{
				method: 'POST',
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					customerId,
					planId,
				}),
			}
		);

		if (!response.ok) {
			throw new Error('Error al crear la suscripción');
		}

		const data = await response.json();
		console.log('Subscription created:', data.data.subscriptionId);
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
