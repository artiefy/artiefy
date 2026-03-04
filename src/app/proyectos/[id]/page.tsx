import { notFound } from 'next/navigation';

import Footer from '~/components/estudiantes/layout/Footer';
import { Header } from '~/components/estudiantes/layout/Header';
import { ProjectDetail } from '~/components/estudiantes/proyectos/ProjectDetail';
import { getProjectSocialById } from '~/components/estudiantes/proyectos/projectSocialData';

interface ProyectoDetallePageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = 'force-dynamic';

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
      <Header />
      <ProjectDetail item={item} />
      <Footer />
    </>
  );
}
