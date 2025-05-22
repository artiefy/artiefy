'use client';

export default function imageLoader({
	src,
	width,
	quality,
}: {
	src: string;
	width: number;
	quality?: number;
}) {
	// Si la URL ya es de nuestro proxy, la devolvemos sin cambios
	if (src.startsWith('/api/image-proxy')) {
		return src;
	}

	// Si es una URL de S3, la procesamos a través de nuestro proxy
	if (src.includes('s3.us-east-2.amazonaws.com')) {
		return `/api/image-proxy?url=${encodeURIComponent(src)}&w=${width}&q=${quality ?? 75}`;
	}

	// Para otras imágenes, devolvemos la URL original
	return src;
}
