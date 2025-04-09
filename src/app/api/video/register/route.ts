export const runtime = 'nodejs';

import { NextResponse } from 'next/server';

import { auth } from '@clerk/nextjs/server';

import { updateLesson } from '~/models/educatorsModels/lessonsModels';

export async function POST(req: Request) {
	const { userId } = await auth();
	if (!userId) {
		return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
	}

	try {
		const { key, lessonId } = (await req.json()) as {
			key: string;
			lessonId: number;
		};

		if (!key || !lessonId) {
			return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
		}

		await updateLesson(lessonId, { coverVideoKey: key });

		return NextResponse.json({
			message: 'Video registrado correctamente',
			key,
		});
	} catch (error) {
		console.error('Error al registrar el video:', error);
		return NextResponse.json(
			{ error: 'Error al registrar el video' },
			{ status: 500 }
		);
	}
}
