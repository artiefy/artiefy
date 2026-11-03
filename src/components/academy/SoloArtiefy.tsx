'use client';

import { useSelectedLayoutSegment } from 'next/navigation';

/**
 * Muestra su contenido solo en Artiefy. Las academias (<slug>.artiefy.com)
 * llegan reescritas a src/app/academia/[slug]/, y ahí la interfaz propia de
 * Artiefy (header, asistente, tour…) no aplica. Se usa en el layout raíz.
 */
export function SoloArtiefy({ children }: { children: React.ReactNode }) {
  const segmento = useSelectedLayoutSegment();
  return segmento === 'academia' ? null : children;
}
