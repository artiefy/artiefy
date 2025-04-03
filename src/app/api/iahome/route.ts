import { NextResponse } from 'next/server';

interface APIResponse {
	result: string[];
}

interface RequestBody {
	prompt: string;
}

export async function POST(request: Request) {
	try {
		const body = (await request.json()) as RequestBody;
		const { prompt } = body;

		// Using new AbortController to handle timeout
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

		try {
			const response = await fetch('http://18.117.124.192:5000/root_courses', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ prompt }),
				signal: controller.signal,
			});

			clearTimeout(timeoutId);

			const data = (await response.json()) as APIResponse;
			const results = data?.result?.slice(0, 5).filter(Boolean) ?? [];

			if (results.length === 0) {
				return NextResponse.json({
					response: `No encontré cursos relacionados con "${prompt}". ¿Podrías intentar con otros términos?`,
				});
			}

			const formattedResponse = `Encontré estos cursos relacionados con "${prompt}":\n\n${results
				.map((course, index) => `${index + 1}. ${course}`)
				.join('\n\n')}`;

			return NextResponse.json({ response: formattedResponse });
		} catch (fetchError) {
			clearTimeout(timeoutId);
			throw fetchError;
		}
	} catch (error) {
		console.error('Error in IA search:', error);
		return NextResponse.json(
			{
				response:
					'Lo siento, hubo un error al procesar tu solicitud. Por favor, intenta de nuevo.',
			},
			{ status: 200 }
		);
	}
}
