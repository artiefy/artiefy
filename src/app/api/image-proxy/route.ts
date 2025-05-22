import { NextResponse } from 'next/server';

import sharp from 'sharp';

export const dynamic = 'force-dynamic';

const TIMEOUT = 10000; // Reducido a 10 segundos
const MAX_RETRIES = 2;

async function fetchWithTimeout(
	url: string,
	retryCount = 0
): Promise<Response> {
	try {
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

		const response = await fetch(url, {
			signal: controller.signal,
			next: { revalidate: 3600 },
			headers: {
				Accept: 'image/*',
				'Cache-Control': 'public, max-age=31536000', // 1 año
			},
		});

		clearTimeout(timeoutId);

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		return response;
	} catch (error) {
		if (retryCount < MAX_RETRIES) {
			// Espera exponencial entre reintentos
			await new Promise((resolve) =>
				setTimeout(resolve, Math.pow(2, retryCount) * 1000)
			);
			return fetchWithTimeout(url, retryCount + 1);
		}
		throw error;
	}
}

async function optimizeImageBuffer(buffer: ArrayBuffer): Promise<Buffer> {
	try {
		const sharpImage = sharp(Buffer.from(buffer));
		const metadata = await sharpImage.metadata();
		const width = metadata.width ? Math.min(metadata.width, 1000) : 1000;

		// Siempre optimizar la imagen, sin importar el tamaño
		return await sharpImage
			.resize(width, null, {
				withoutEnlargement: true,
				fit: 'inside',
			})
			.webp({
				quality: 75, // Calidad reducida para mejor compresión
				effort: 6, // Mayor esfuerzo de compresión
			})
			.toBuffer();
	} catch (error) {
		console.error('Error optimizing image:', error);
		return Buffer.from(buffer);
	}
}

export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url);
		const imageUrl = searchParams.get('url');

		if (!imageUrl) {
			return NextResponse.json({ error: 'Missing image URL' }, { status: 400 });
		}

		if (!imageUrl.includes('s3.us-east-2.amazonaws.com')) {
			return NextResponse.json(
				{ error: 'Invalid image source' },
				{ status: 403 }
			);
		}

		const response = await fetchWithTimeout(imageUrl);
		const buffer = await response.arrayBuffer();

		// Siempre optimizar imágenes
		const optimizedBuffer = await optimizeImageBuffer(buffer);

		const headers = new Headers({
			'Content-Type': 'image/webp',
			'Cache-Control': 'public, max-age=31536000, immutable',
			'Content-Length': optimizedBuffer.length.toString(),
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET',
			'X-Content-Type-Options': 'nosniff',
		});

		return new NextResponse(optimizedBuffer, {
			status: 200,
			headers,
		});
	} catch (error) {
		console.error('Image proxy error:', error);
		return NextResponse.json(
			{
				error: error instanceof Error ? error.message : 'Failed to fetch image',
				timeout: error instanceof Error && error.name === 'AbortError',
			},
			{
				status:
					error instanceof Error && error.name === 'AbortError' ? 504 : 500,
			}
		);
	}
}
