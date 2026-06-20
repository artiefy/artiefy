import { NextResponse } from 'next/server';

import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';

const TIMEOUT = 10000; // Reducido a 10 segundos
const MAX_RETRIES = 2;
const FALLBACK_CACHE_SECONDS = 600;
const DEFAULT_PUBLIC_S3_BASE_URL =
  'https://s3.us-east-2.amazonaws.com/artiefy-upload';
const PUBLIC_S3_BASE_URL = process.env.NEXT_PUBLIC_AWS_S3_URL ?? '';
const REGION = getRegionFromS3Url(PUBLIC_S3_BASE_URL) ?? 'us-east-2';
const BUCKET =
  process.env.AWS_BUCKET_NAME ??
  process.env.AWS_S3_BUCKET ??
  getBucketFromS3Url(PUBLIC_S3_BASE_URL) ??
  'artiefy-upload';
const EFFECTIVE_PUBLIC_S3_BASE_URL =
  PUBLIC_S3_BASE_URL ||
  (BUCKET ? `https://s3.${REGION}.amazonaws.com/${BUCKET}` : '') ||
  DEFAULT_PUBLIC_S3_BASE_URL;

function getRegionFromS3Url(value: string): string | null {
  if (!value) return null;

  try {
    const host = new URL(value).hostname;
    const match = /\.?s3[.-]([a-z0-9-]+)\.amazonaws\.com$/i.exec(host);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

function getBucketFromS3Url(value: string): string | null {
  if (!value) return null;

  try {
    const url = new URL(value);
    const virtualHostedMatch = /^(.+)\.s3[.-][a-z0-9-]+\.amazonaws\.com$/i.exec(
      url.hostname
    );

    if (virtualHostedMatch?.[1]) return virtualHostedMatch[1];

    if (/^s3[.-][a-z0-9-]+\.amazonaws\.com$/i.test(url.hostname)) {
      return url.pathname.split('/').filter(Boolean)[0] ?? null;
    }

    return null;
  } catch {
    return null;
  }
}

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

  if (EFFECTIVE_PUBLIC_S3_BASE_URL) {
    try {
      origins.add(new URL(EFFECTIVE_PUBLIC_S3_BASE_URL).origin);
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

  if (EFFECTIVE_PUBLIC_S3_BASE_URL) {
    try {
      const baseUrl = new URL(EFFECTIVE_PUBLIC_S3_BASE_URL);
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

async function getObjectFromS3(
  key: string
): Promise<{ body: ArrayBuffer; contentType: string }> {
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
  return {
    body: copy.buffer as ArrayBuffer,
    contentType: response.ContentType ?? 'image/jpeg',
  };
}

function isExpectedImageFallbackError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const record = error as Record<string, unknown>;
  const metadata = record.$metadata as Record<string, unknown> | undefined;
  const statusCode = metadata?.httpStatusCode;

  return (
    record.Code === 'NoSuchKey' ||
    record.Code === 'PermanentRedirect' ||
    record.Code === 'AccessDenied' ||
    record.name === 'NoSuchKey' ||
    record.name === 'PermanentRedirect' ||
    statusCode === 301 ||
    statusCode === 403 ||
    statusCode === 404
  );
}

function getFallbackImage(): Uint8Array {
  const svg = `
    <svg width="600" height="400" viewBox="0 0 600 400" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="600" height="400" fill="#01152D"/>
      <rect x="1" y="1" width="598" height="398" rx="28" stroke="#22C4D3" stroke-opacity="0.35" stroke-width="2"/>
      <text x="300" y="184" text-anchor="middle" fill="#3AF4EF" font-family="Arial, sans-serif" font-size="42" font-weight="700">Artiefy</text>
      <text x="300" y="232" text-anchor="middle" fill="#94A3B8" font-family="Arial, sans-serif" font-size="24">Imagen no disponible</text>
    </svg>
  `;

  return new TextEncoder().encode(svg);
}

function imageResponse(
  buffer: ArrayBuffer | Uint8Array,
  contentType: string,
  cacheSeconds: number
) {
  const body = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  const responseBody = new ArrayBuffer(body.byteLength);
  new Uint8Array(responseBody).set(body);

  return new NextResponse(responseBody, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Cache-Control': `public, max-age=${cacheSeconds}, immutable`,
      'Content-Length': body.byteLength.toString(),
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'X-Content-Type-Options': 'nosniff',
    },
  });
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
      cache: 'no-store',
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
    let contentType = 'image/jpeg';

    try {
      const response = await fetchWithTimeout(parsedImageUrl.toString());
      contentType = response.headers.get('content-type') ?? contentType;
      buffer = await response.arrayBuffer();
    } catch (error) {
      const key = getS3KeyFromUrl(parsedImageUrl);
      if (key && error instanceof Error && error.message.includes('status:')) {
        try {
          const s3Object = await getObjectFromS3(key);
          buffer = s3Object.body;
          contentType = s3Object.contentType;
        } catch (s3Error) {
          if (isExpectedImageFallbackError(s3Error) || s3Error) {
            console.warn('Image proxy using fallback for S3 key:', key);
            return imageResponse(
              getFallbackImage(),
              'image/svg+xml',
              FALLBACK_CACHE_SECONDS
            );
          }
          throw s3Error;
        }
      } else {
        throw error;
      }
    }

    return imageResponse(buffer, contentType, 31536000);
  } catch (error) {
    console.error('Image proxy error:', error);
    return imageResponse(
      getFallbackImage(),
      'image/svg+xml',
      FALLBACK_CACHE_SECONDS
    );
  }
}
