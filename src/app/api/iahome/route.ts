import { NextResponse } from 'next/server';

interface RequestBody {
	prompt: string;
}

interface ExternalApiResponse {
	result: { id: number; title: string }[];
}

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
	try {
		const body = (await request.json()) as RequestBody;
		const { prompt } = body;

		console.log('🔍 Searching for:', prompt);

		// Añadir reintentos
		let retries = 3;
		let lastError: Error | null = null;

		while (retries > 0) {
			try {
				const response = await fetch(
					'http://18.117.124.192:5000/root_courses',
					{
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
						},
						body: JSON.stringify({ prompt: prompt.toLowerCase().trim() }),
					}
				);

				// Si la respuesta es 500, reintentamos
				if (response.status === 500) {
					lastError = new Error(
						`API responded with status: ${response.status}`
					);
					retries--;
					if (retries > 0) {
						await new Promise((resolve) => setTimeout(resolve, 1000)); // Esperar 1 segundo entre intentos
						continue;
					}
					throw lastError;
				}

				if (!response.ok) {
					throw new Error(`API responded with status: ${response.status}`);
				}

				const apiData = (await response.json()) as ExternalApiResponse;
				console.log('Raw API Response:', apiData);

				// Verificar respuesta válida
				if (!apiData?.result || !Array.isArray(apiData.result)) {
					return NextResponse.json({
						response: `Lo siento, no pude procesar la búsqueda para "${prompt}". Por favor, intenta con otros términos.`,
						courses: [],
					});
				}

				// Si no hay resultados
				if (apiData.result.length === 0) {
					return NextResponse.json({
						response: `No encontré cursos relacionados con "${prompt}". Por favor, intenta con otros términos.`,
						courses: [],
					});
				}

				// Formato de respuesta exitosa
				const formattedResponse = `He encontrado estos cursos relacionados con "${prompt}":\n\n${apiData.result
					.map((course, idx) => `${idx + 1}. ${course.title}|${course.id}`)
					.join('\n\n')}`;

				return NextResponse.json({
					response: formattedResponse,
					courses: apiData.result,
				});
			} catch (error) {
				lastError = error as Error;
				retries--;
				if (retries > 0) {
					await new Promise((resolve) => setTimeout(resolve, 1000));
					continue;
				}
			}
		}

		// Si llegamos aquí, todos los intentos fallaron
		console.error('All retries failed:', lastError);
		return NextResponse.json(
			{
				response:
					'Lo siento, el servicio de búsqueda no está disponible en este momento. Por favor, intenta más tarde.',
				courses: [],
			},
			{ status: 503 }
		); // Service Unavailable
	} catch (error) {
		console.error('Search Error:', error);
		return NextResponse.json(
			{
				response:
					'Error al buscar cursos. Por favor, intenta de nuevo en unos momentos.',
				courses: [],
			},
			{ status: 500 }
		);
	}
}
