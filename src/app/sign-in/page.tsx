import { pageMetadata } from '~/lib/metadata/config';

import type { Metadata } from 'next';

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export const metadata: Metadata = pageMetadata({
  title: 'Iniciar sesión',
  description:
    'Inicia sesión en Artiefy para continuar tus cursos, programas y proyectos guiados de ciencia y tecnología desde cualquier dispositivo.',
});

export { default } from './[...sign-in]/page';
