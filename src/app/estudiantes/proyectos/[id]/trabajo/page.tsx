import { notFound } from 'next/navigation';

import Footer from '~/components/estudiantes/layout/Footer';

import { EspacioProyecto } from './EspacioProyecto';

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default async function EspacioProyectoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const projectId = Number(id);
  if (!Number.isFinite(projectId)) notFound();

  return (
    <>
      <EspacioProyecto projectId={projectId} />
      <Footer />
    </>
  );
}
