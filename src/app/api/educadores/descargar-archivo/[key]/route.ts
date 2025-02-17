import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';

const redis = new Redis({
	url: process.env.UPSTASH_REDIS_REST_URL!,
	token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function GET(
	request: Request,
	{ params }: { params: { key: string } }
) {
	try {
		const key = params.key;
		const respuesta = await redis.hgetall(key);

		if (!respuesta || !respuesta.fileContent) {
			return NextResponse.json(
				{ error: 'Archivo no encontrado' },
				{ status: 404 }
			);
		}

		const buffer = Buffer.from(respuesta.fileContent as string, 'base64');

		return new NextResponse(buffer, {
			headers: {
				'Content-Type': 'application/octet-stream',
				'Content-Disposition': `attachment; filename="${respuesta.fileName}"`,
			},
		});
	} catch (error) {
		console.error('Error al descargar archivo:', error);
		return NextResponse.json(
			{ error: 'Error al descargar el archivo' },
			{ status: 500 }
		);
	}
}
