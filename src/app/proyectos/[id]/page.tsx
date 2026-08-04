import { notFound } from 'next/navigation';

import Footer from '~/components/estudiantes/layout/Footer';
import { ProjectDetail } from '~/components/estudiantes/proyectos/ProjectDetail';
import { getProjectSocialById } from '~/components/estudiantes/proyectos/projectSocialData';

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

interface ProyectoDetallePageProps {
  params: Promise<{ id: string }>;
}

export default async function ProyectoDetallePage({
  params,
}: ProyectoDetallePageProps) {
  const { id } = await params;
  const projectId = Number(id);
  if (!Number.isFinite(projectId)) notFound();

  const item = await getProjectSocialById(projectId);
  if (!item) notFound();

  return (
    <>
      <ProjectDetail item={item} />
      <Footer />
    </>
  );
}
