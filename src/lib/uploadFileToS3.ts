interface UploadResponse {
  uploadType: 'simple' | 'multipart' | 'put';
  url?: string;
  fields?: Record<string, string>;
  key: string;
  fileName: string;
  uploadId?: string;
  contentType: string;
  partSize?: number;
  totalParts?: number;
}

export interface UploadFileResult {
  key: string;
  fileName: string;
}

/**
 * Sube un archivo a S3 a través de /api/upload, replicando la estrategia
 * (simple/put/multipart) que ya usa ModalFormLessons.tsx para lecciones.
 */
export async function uploadFileToS3(
  file: File,
  onProgress?: (percent: number) => void
): Promise<UploadFileResult> {
  const initResponse = await fetch('/api/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contentType: file.type,
      fileSize: file.size,
      fileName: file.name,
    }),
  });

  if (!initResponse.ok) {
    throw new Error(`Error al iniciar la carga: ${initResponse.statusText}`);
  }

  const uploadData = (await initResponse.json()) as UploadResponse;

  if (uploadData.uploadType === 'multipart') {
    if (!uploadData.uploadId || !uploadData.partSize) {
      throw new Error('Respuesta multipart incompleta');
    }

    const partSize = uploadData.partSize;
    const totalParts = Math.ceil(file.size / partSize);
    const uploadedParts: { ETag: string; PartNumber: number }[] = [];

    try {
      for (let partNumber = 1; partNumber <= totalParts; partNumber += 1) {
        const start = (partNumber - 1) * partSize;
        const end = Math.min(file.size, start + partSize);
        const blob = file.slice(start, end);

        const partResponse = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'multipart-part',
            key: uploadData.key,
            uploadId: uploadData.uploadId,
            partNumber,
          }),
        });
        if (!partResponse.ok) {
          throw new Error('Error al obtener URL de parte');
        }
        const partData = (await partResponse.json()) as { url: string };

        const etag = await new Promise<string>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              const etagHeader =
                xhr.getResponseHeader('ETag') ?? xhr.getResponseHeader('etag');
              if (!etagHeader) {
                reject(new Error('No se recibió ETag del servidor'));
                return;
              }
              resolve(etagHeader.replace(/"/g, ''));
            } else {
              reject(new Error(`Error en la parte: ${xhr.status}`));
            }
          };
          xhr.onerror = () => reject(new Error('Upload failed'));
          xhr.open('PUT', partData.url);
          xhr.setRequestHeader('Content-Type', file.type);
          xhr.send(blob);
        });

        uploadedParts.push({ ETag: etag, PartNumber: partNumber });
        onProgress?.(Math.round((partNumber / totalParts) * 100));
      }

      const completeResponse = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'multipart-complete',
          key: uploadData.key,
          uploadId: uploadData.uploadId,
          parts: uploadedParts,
        }),
      });
      if (!completeResponse.ok) {
        throw new Error('Error al completar la subida multipart');
      }

      return { key: uploadData.key, fileName: uploadData.fileName };
    } catch (multipartError) {
      await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'multipart-abort',
          key: uploadData.key,
          uploadId: uploadData.uploadId,
        }),
      });
      throw multipartError;
    }
  }

  return new Promise<UploadFileResult>((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress?.(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve({ key: uploadData.key, fileName: uploadData.fileName });
      } else {
        reject(new Error(`Error en la carga: ${xhr.status}`));
      }
    };
    xhr.onerror = () => reject(new Error('Upload failed'));

    if (uploadData.uploadType === 'put') {
      if (!uploadData.url) {
        reject(new Error('URL de subida no disponible'));
        return;
      }
      xhr.open('PUT', uploadData.url);
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.send(file);
    } else {
      if (!uploadData.url) {
        reject(new Error('URL de subida no disponible'));
        return;
      }
      const body = new FormData();
      Object.entries(uploadData.fields ?? {}).forEach(([key, value]) => {
        body.append(key, value);
      });
      body.append('file', file);
      xhr.open('POST', uploadData.url);
      xhr.send(body);
    }
  });
}
