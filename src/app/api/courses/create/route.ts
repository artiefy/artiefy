// import { NextResponse } from 'next/server';
// import { POST as createCourse } from '~/server/actions/courses/coursesCreate';

// export async function POST(request: Request) {
// 	try {
// 		// Validar si el request tiene cuerpo
// 		if (!request.body) {
// 			return NextResponse.json(
// 				{ error: 'Cuerpo vacío en la solicitud' },
// 				{ status: 400 }
// 			);
// 		}

// 		// Leer el cuerpo del request
// 		interface CourseRequestBody {
// 			title: string;
// 			description: string;
// 			// Add other expected fields here
// 		}

// 		const body: CourseRequestBody = await request.json() as CourseRequestBody;

// 		// Enviar la solicitud a coursesCreate.ts
// 		const { NextRequest } = await import('next/server');
// 		const nextRequest = new NextRequest(request, { body: JSON.stringify(body) });
// 		const response = await createCourse(nextRequest);

// 		return response;
// 	} catch (error) {
// 		console.error(error);
// 		return NextResponse.json(
// 			{ error: 'Error interno del servidor' },
// 			{ status: 500 }
// 		);
// 	}
// }
