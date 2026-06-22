const MAX_COVER_SIZE = 5 * 1024 * 1024; // 5 MB

export { MAX_COVER_SIZE };

/**
 * Builds the display URL for a stored cover image key.
 * Routes through /api/image-proxy because uploaded objects are not publicly
 * readable (bucket ACLs disabled) — direct S3 access returns 403, so the proxy
 * fetches them with server credentials, mirroring the rest of the app.
 */
export function coverKeyToUrl(key: string | null): string | null {
  if (!key) return null;
  const base = process.env.NEXT_PUBLIC_AWS_S3_URL;
  if (!base) return null;
  const s3Url = `${base}/${key}`;
  return `/api/image-proxy?url=${encodeURIComponent(s3Url)}`;
}

/**
 * Uploads the cover through the server (browser -> /api/.../cover -> S3) so it
 * never depends on the bucket CORS config or the AWS_REGION env. Returns the
 * stored object key.
 */
export async function uploadCoverToS3(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch('/api/estudiantes/profile/cover', {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new Error(data?.error ?? 'No se pudo subir la portada.');
  }

  const data = (await res.json()) as { key: string };
  return data.key;
}
