import { notFound } from 'next/navigation';

import ProjectDetailView from '~/components/estudiantes/projects/ProjectDetailView';
import { getProjectById } from '~/server/actions/project/getProjectById';

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const projectId = parseInt(id);

  if (isNaN(projectId)) {
    notFound();
  }

  const project = await getProjectById(projectId);

  if (!project) {
    notFound();
  }

  return <ProjectDetailView project={project} />;
}
