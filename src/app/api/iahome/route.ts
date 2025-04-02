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

		const response = await fetch('http://18.117.124.192:5000/root_courses', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ prompt }),
		});

		const data = (await response.json()) as APIResponse;

		if (data?.result) {
			const searchTerms = prompt.toLowerCase().split(' ');

			// Diccionario de palabras relacionadas con diferentes temas
			const relatedTerms: Record<string, string[]> = {
				veterinaria: [
					'veterinaria',
					'animal',
					'mascota',
					'salud animal',
					'medicina veterinaria',
				],
				programacion: [
					'programacion',
					'codigo',
					'software',
					'desarrollo',
					'web',
				],
				marketing: ['marketing', 'ventas', 'publicidad', 'digital', 'mercadeo'],
				diseño: ['diseño', 'grafico', 'arte', 'visual', 'creatividad'],
				// Añade más categorías según sea necesario
			};

			// Encuentra la categoría relevante basada en los términos de búsqueda
			const relevantCategory = Object.entries(relatedTerms).find(([_, terms]) =>
				terms.some((term) =>
					searchTerms.some((searchTerm) => searchTerm.includes(term))
				)
			);

			const filteredResults = data.result.filter((course: string) => {
				const courseLower = course.toLowerCase();

				// Si encontramos una categoría relevante, usamos sus términos relacionados
				if (relevantCategory) {
					return relevantCategory[1].some((term) => courseLower.includes(term));
				}

				// Si no hay categoría específica, buscamos coincidencias directas
				return searchTerms.some((term) => courseLower.includes(term));
			});

			if (filteredResults.length === 0) {
				return NextResponse.json({
					response: `No encontré cursos relacionados con "${prompt}". 
                    ¿Te gustaría buscar en otra área o ser más específico?`,
				});
			}

			const formattedResponse = `He encontrado estos cursos relacionados con "${prompt}":\n\n${filteredResults
				.map((course: string, index: number) => `${index + 1}. ${course}`)
				.join(
					'\n'
				)}\n\n¿Te gustaría más información sobre alguno de estos cursos?`;

			return NextResponse.json({ response: formattedResponse });
		}

		return NextResponse.json({
			response: 'No se encontraron cursos que coincidan con tu búsqueda.',
		});
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
