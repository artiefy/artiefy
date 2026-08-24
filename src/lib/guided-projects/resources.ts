/**
 * Utilidades compartidas para los recursos de proyectos guiados.
 *
 * Los recursos se guardan como dos listas paralelas separadas por coma
 * (`resourceKey` y `resourceNames`), mismo patrón que usan las lecciones de
 * curso. Cada elemento puede ser un archivo subido a S3 (key relativa) o un
 * enlace externo pegado tal cual (URL completa).
 */

import { FileSpreadsheet, FileText, Presentation } from 'lucide-react';

export interface ParsedResource {
  key: string;
  name: string;
  isLink: boolean;
}

/**
 * Quita el prefijo `uploads/` y el sufijo de timestamp + uuid que agrega la
 * subida, para mostrar el nombre original del archivo.
 */
export function prettifyResourceName(name: string): string {
  const withoutPrefix = name.replace(/^uploads\//, '');
  return withoutPrefix.replace(
    /-\d{10,}-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(?=\.[^./]+$)/i,
    ''
  );
}

const RESOURCE_ICON_BY_EXTENSION: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  xls: FileSpreadsheet,
  xlsx: FileSpreadsheet,
  csv: FileSpreadsheet,
  ppt: Presentation,
  pptx: Presentation,
};

export function getResourceIcon(name: string) {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  return RESOURCE_ICON_BY_EXTENSION[ext] ?? FileText;
}

/** Un enlace externo se distingue del archivo por venir con protocolo. */
export function isLinkResource(key: string): boolean {
  return /^https?:\/\//i.test(key);
}

/**
 * Convierte el par de listas separadas por coma en una lista de recursos.
 */
export function parseResources(
  resourceKey: string | null | undefined,
  resourceNames: string | null | undefined
): ParsedResource[] {
  const keys = (resourceKey ?? '')
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean);
  const names = (resourceNames ?? '')
    .split(',')
    .map((n) => n.trim())
    .filter(Boolean);

  return keys.map((key, idx) => {
    const isLink = isLinkResource(key);
    return {
      key,
      name: isLink
        ? (names[idx] ?? key)
        : prettifyResourceName(names[idx] ?? key),
      isLink,
    };
  });
}

/**
 * Descarga real del recurso.
 *
 * Un `<a download>` normal no fuerza la descarga en enlaces cross-origin a
 * S3 (el navegador simplemente abre el archivo), así que se trae como blob y
 * se dispara la descarga desde ahí.
 */
export async function downloadResource(
  url: string,
  fileName: string
): Promise<boolean> {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('descarga fallida');
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(blobUrl);
    return true;
  } catch {
    return false;
  }
}
