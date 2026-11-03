'use client';

import { createContext, use } from 'react';

/**
 * Marca del sitio que se está viendo: Artiefy o una academia
 * (<slug>.artiefy.com). Los componentes de Artiefy (header, footer…) la leen
 * con useMarca() en vez de tener el logo y el nombre de Artiefy fijos; los
 * colores van aparte, como variables del tema (ver variablesDeMarca).
 */
export interface Marca {
  nombre: string;
  // null: el logo de Artiefy.
  logoUrl: string | null;
  esAcademia: boolean;
  // Color principal (#RRGGBB) para lo que no lee las variables CSS, como el
  // fondo 3D. null: los colores de Artiefy.
  colorPrimario: string | null;
}

const ARTIEFY: Marca = {
  nombre: 'Artiefy',
  logoUrl: null,
  esAcademia: false,
  colorPrimario: null,
};

const MarcaContext = createContext<Marca>(ARTIEFY);

export function MarcaProvider({
  marca,
  children,
}: {
  marca: Marca;
  children: React.ReactNode;
}) {
  return <MarcaContext value={marca}>{children}</MarcaContext>;
}

export const useMarca = () => use(MarcaContext);
