// Sube el logo de una academia a S3 con el flujo existente de /api/upload
// (presigned POST) y devuelve su key.

const TIPOS = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];
const MAX_BYTES = 2 * 1024 * 1024;

interface RespuestaUpload {
  url: string;
  fields?: Record<string, string>;
  key: string;
  uploadType: 'simple' | 'put';
  error?: string;
}

export async function subirLogo(file: File): Promise<string> {
  if (!TIPOS.includes(file.type)) {
    throw new Error('El logo debe ser PNG, JPG, WEBP o SVG.');
  }
  if (file.size > MAX_BYTES) throw new Error('El logo no puede pasar de 2 MB.');

  const res = await fetch('/api/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contentType: file.type,
      fileSize: file.size,
      fileName: file.name,
    }),
  });
  const datos = (await res.json()) as RespuestaUpload;
  if (!res.ok || !datos.key) {
    throw new Error(datos.error ?? 'No se pudo preparar la subida del logo.');
  }

  if (datos.uploadType === 'simple') {
    const form = new FormData();
    Object.entries(datos.fields ?? {}).forEach(([k, v]) => form.append(k, v));
    form.append('file', file);
    const subida = await fetch(datos.url, { method: 'POST', body: form });
    if (!subida.ok) throw new Error('No se pudo subir el logo.');
  } else {
    const subida = await fetch(datos.url, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file,
    });
    if (!subida.ok) throw new Error('No se pudo subir el logo.');
  }
  return datos.key;
}
