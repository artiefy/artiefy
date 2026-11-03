import type { CSSProperties } from 'react';

// Marca de una academia: logo (en S3) y colores. Los colores se exponen como
// variables CSS (--ac-primario, --ac-fondo, ...) para que cualquier componente
// los use con clases tipo bg-[var(--ac-primario)].

export const COLORES_POR_DEFECTO = {
  primario: '#22C4D3',
  fondo: '#01142B',
} as const;

// Se usa en cliente y servidor: ~/env no se puede importar en componentes de
// cliente, así que se lee la variable pública directo (Next la inlinea en el
// build), igual que el resto de componentes que muestran archivos de S3.
export function urlLogo(logoKey: string | null | undefined): string | null {
  return logoKey ? `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${logoKey}` : null;
}

/** Mezcla un color hex con blanco/negro (factor -1..1) para tonos derivados. */
function ajustar(hex: string, factor: number): string {
  const n = Number.parseInt(hex.slice(1), 16);
  const canal = (c: number) => {
    const v = factor >= 0 ? c + (255 - c) * factor : c * (1 + factor);
    return Math.round(Math.min(255, Math.max(0, v)))
      .toString(16)
      .padStart(2, '0');
  };
  return `#${canal(n >> 16)}${canal((n >> 8) & 255)}${canal(n & 255)}`;
}

/** Texto legible (oscuro o claro) sobre el color primario. */
function textoSobre(hex: string): string {
  const n = Number.parseInt(hex.slice(1), 16);
  const [r, g, b] = [n >> 16, (n >> 8) & 255, n & 255];
  return 0.299 * r + 0.587 * g + 0.114 * b > 150 ? '#04101F' : '#FFFFFF';
}

/**
 * Variables CSS de la marca. Sobrescribe los tokens del tema de Artiefy
 * (src/styles/globals.css, @theme) dentro de la academia: así los mismos
 * componentes y clases de Artiefy (bg-background, text-primary, bg-card…) se
 * ven con los colores de la academia. --ac-* son alias para código propio.
 */
export function variablesDeMarca(
  colorPrimario: string,
  colorFondo: string
): CSSProperties {
  const superficie = ajustar(colorFondo, 0.06);
  const borde = ajustar(colorFondo, 0.16);
  return {
    // Tokens del tema de Artiefy.
    '--color-primary': colorPrimario,
    '--color-background': colorFondo,
    '--color-secondary': colorFondo,
    '--color-card': superficie,
    '--color-muted': borde,
    '--color-border': borde,
    '--color-input': borde,
    '--color-holo-surface': superficie,
    '--color-holo-surface2': ajustar(colorFondo, 0.1),
    // Alias propios.
    '--ac-primario': colorPrimario,
    '--ac-primario-texto': textoSobre(colorPrimario),
    '--ac-fondo': colorFondo,
    '--ac-superficie': superficie,
    '--ac-borde': borde,
  } as CSSProperties;
}

/**
 * Las mismas variables como regla `:root { … }`. Lo usa el layout de la
 * academia para que también las tomen los portales (modales, popovers,
 * menús) que se montan en <body>, fuera del contenedor de la academia. Los
 * colores llegan validados como #RRGGBB (academias.ts), así que el CSS es
 * seguro de insertar.
 */
export function cssDeMarca(colorPrimario: string, colorFondo: string): string {
  const reglas = Object.entries(variablesDeMarca(colorPrimario, colorFondo))
    .map(([k, v]) => `${k}:${String(v)}`)
    .join(';');
  return `:root{${reglas}}`;
}
