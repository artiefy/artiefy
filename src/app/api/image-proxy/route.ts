import { NextResponse } from 'next/server';

import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import sharp from 'sharp';

const TIMEOUT = 10000; // Reducido a 10 segundos
const MAX_RETRIES = 2;
const REGION = process.env.AWS_REGION ?? 'us-east-2';
const BUCKET = process.env.AWS_BUCKET_NAME ?? process.env.AWS_S3_BUCKET ?? '';
const PUBLIC_S3_BASE_URL =
  process.env.NEXT_PUBLIC_AWS_S3_URL ??
  (BUCKET ? `https://s3.${REGION}.amazonaws.com/${BUCKET}` : '');

const s3Client = new S3Client({
  region: REGION,
  credentials:
    process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
      ? {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        }
      : undefined,
});

function getAllowedS3Origins(): Set<string> {
  const origins = new Set<string>([
    `https://s3.${REGION}.amazonaws.com`,
    `https://${BUCKET}.s3.${REGION}.amazonaws.com`,
  ]);

  if (PUBLIC_S3_BASE_URL) {
    try {
      origins.add(new URL(PUBLIC_S3_BASE_URL).origin);
    } catch {
      // ignore invalid optional env value
    }
  }

  return origins;
}

function getS3KeyFromUrl(url: URL): string | null {
  if (!BUCKET) return null;

  const virtualHostedHost = `${BUCKET}.s3.${REGION}.amazonaws.com`;
  if (url.hostname === virtualHostedHost) {
    return decodeURIComponent(url.pathname.replace(/^\/+/, ''));
  }

  if (url.hostname === `s3.${REGION}.amazonaws.com`) {
    const parts = url.pathname.split('/').filter(Boolean);
    if (parts[0] !== BUCKET) return null;
    return decodeURIComponent(parts.slice(1).join('/'));
  }

  if (PUBLIC_S3_BASE_URL) {
    try {
      const baseUrl = new URL(PUBLIC_S3_BASE_URL);
      if (url.origin === baseUrl.origin) {
        const basePath = baseUrl.pathname.replace(/\/+$/, '');
        if (basePath && !url.pathname.startsWith(`${basePath}/`)) return null;
        const keyPath = basePath
          ? url.pathname.slice(basePath.length)
          : url.pathname;
        return decodeURIComponent(keyPath.replace(/^\/+/, ''));
      }
    } catch {
      return null;
    }
  }

  return null;
}

function validateImageUrl(imageUrl: string): URL | null {
  try {
    const url = new URL(imageUrl);
    if (url.protocol !== 'https:') return null;
    if (!getAllowedS3Origins().has(url.origin)) return null;
    if (!getS3KeyFromUrl(url)) return null;
    return url;
  } catch {
    return null;
  }
}

async function getObjectFromS3(key: string): Promise<ArrayBuffer> {
  if (!BUCKET) {
    throw new Error('AWS bucket is not configured');
  }

  const response = await s3Client.send(
    new GetObjectCommand({
      Bucket: BUCKET,
      Key: key,
    })
  );

  const byteArray = await response.Body?.transformToByteArray();
  if (!byteArray) {
    throw new Error('Empty S3 object body');
  }

  const copy = new Uint8Array(byteArray);
  return copy.buffer as ArrayBuffer;
}

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

    // Siempre optimizar imágenes para reducir el tamaño y mejorar la caché
    const width = metadata.width ? Math.min(metadata.width, 1000) : 1000;

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

    const parsedImageUrl = validateImageUrl(imageUrl);
    if (!parsedImageUrl) {
      return NextResponse.json(
        { error: 'Invalid image source' },
        { status: 403 }
      );
    }

    let buffer: ArrayBuffer;
    try {
      const response = await fetchWithTimeout(parsedImageUrl.toString());
      buffer = await response.arrayBuffer();
    } catch (error) {
      const key = getS3KeyFromUrl(parsedImageUrl);
      if (
        key &&
        error instanceof Error &&
        error.message.includes('status: 403')
      ) {
        buffer = await getObjectFromS3(key);
      } else {
        throw error;
      }
    }

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

    return new NextResponse(new Uint8Array(optimizedBuffer), {
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
