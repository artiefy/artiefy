/* eslint-disable */

import { NextResponse } from 'next/server';
import { getAuthToken } from '~/utils/auth';

export async function POST(request: Request) {
	try {
		console.log('Received request to create customer');
		const {
			docType,
			docNumber,
			name,
			lastName,
			email,
			cellPhone,
			phone,
			cardTokenId,
		} = await request.json();

		console.log('Request data:', {
			docType,
			docNumber,
			name,
			lastName,
			email,
			cellPhone,
			phone,
			cardTokenId,
		});

		const token = await getAuthToken();
		console.log('Auth token received');

		const response = await fetch('https://apify.epayco.co/token/customer', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${token}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				docType,
				docNumber,
				name,
				lastName,
				email,
				cellPhone,
				phone,
				cardTokenId,
			}),
		});

		console.log('Response received from customer creation API');

		if (!response.ok) {
			throw new Error('Error al crear el cliente');
		}

		const data = await response.json();
		console.log('Customer created:', data.data.customerId);
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
