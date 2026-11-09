import { cache } from 'react';

import { cacheLife, cacheTag } from 'next/cache';

import { auth } from '@clerk/nextjs/server';

import { academiaPorSlug } from '~/server/academy/academias';
import { membresia } from '~/server/academy/usuarios';

import 'server-only';

/** Tag del caché de la academia; se invalida al editarla (academias.ts). */
export const tagAcademia = (slug: string) => `academia-${slug}`;

/**
 * Datos públicos de la academia del subdominio (marca, nombre…), cacheados:
 * no leen la sesión, así que son iguales para todos los visitantes y el slug
 * es toda la clave. Los usan el layout y generateMetadata de cada página.
 */
export async function academiaDeLaPagina(slug: string) {
  'use cache';
  cacheLife('minutes');
  cacheTag('academias', tagAcademia(slug));

  return academiaPorSlug(slug);
}

/**
 * Academia del slug y la cuenta de la sesión en ella. `cuenta` es null si no
 * hay sesión, si la sesión no es de esta academia o si la cuenta está
 * desactivada (`desactivada`). Deduplicado por petición.
 */
export const sesionEnAcademia = cache(async (slug: string) => {
  const academia = await academiaDeLaPagina(slug);
  if (!academia) return null;
  const { userId } = await auth();
  const fila = userId ? await membresia(academia.id, userId) : null;
  const desactivada = fila?.activo === false;
  return {
    academia,
    userId,
    cuenta: desactivada ? null : fila,
    desactivada,
  };
});
