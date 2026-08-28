import { notFound } from 'next/navigation';

import { auth } from '@clerk/nextjs/server';

import Footer from '~/components/estudiantes/layout/Footer';
import { UserProjectWorkspace } from '~/components/estudiantes/proyectos/UserProjectWorkspace';
import { getProjectById } from '~/server/actions/project/getProjectById';

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

interface TrabajarProyectoPageProps {
  params: Promise<{ id: string }>;
}

export default async function TrabajarProyectoPage({
  params,
}: TrabajarProyectoPageProps) {
  const { id } = await params;
  const projectId = Number(id);
  if (!Number.isFinite(projectId)) notFound();

  const { userId } = await auth();
  if (!userId) notFound();

  const project = await getProjectById(projectId);
  // Owner-only: do not leak whether the project exists to a non-owner —
  // missing project and wrong owner both fall through to the same notFound().
  if (!project || project.userId !== userId) notFound();

  return (
    <>
      <UserProjectWorkspace project={project} />
      <Footer />
    </>
  );
}
