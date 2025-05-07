import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url);
		const imageUrl = searchParams.get('url');

		if (!imageUrl) {
			return NextResponse.json({ error: 'Missing image URL' }, { status: 400 });
		}

		const response = await fetch(imageUrl, {
			next: { revalidate: 3600 }, // Cache for 1 hour
			headers: {
				Accept: 'image/*',
			},
		});

		if (!response.ok) {
			throw new Error(`Failed to fetch image: ${response.statusText}`);
		}

		const buffer = await response.arrayBuffer();
		const headers = new Headers(response.headers);

		return new NextResponse(buffer, {
			status: 200,
			headers: {
				'Content-Type': headers.get('Content-Type') ?? 'image/jpeg',
				'Cache-Control': 'public, max-age=3600, stale-while-revalidate=60',
			},
		});
	} catch (error) {
		console.error('Image proxy error:', error);
		return NextResponse.json(
			{ error: 'Failed to fetch image' },
			{ status: 500 }
		);
	}
}
