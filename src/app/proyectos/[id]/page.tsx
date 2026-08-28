import { notFound } from 'next/navigation';

import { auth } from '@clerk/nextjs/server';

import Footer from '~/components/estudiantes/layout/Footer';
import { ProjectDetail } from '~/components/estudiantes/proyectos/ProjectDetail';
import { getProjectSocialById } from '~/components/estudiantes/proyectos/projectSocialData';
import { getProjectById } from '~/server/actions/project/getProjectById';

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

interface ProyectoDetallePageProps {
  params: Promise<{ id: string }>;
}

/**
 * ¿Puede esta persona ver un proyecto que NO es público?
 *
 * Solo su dueño y quien administra la plataforma. Los proyectos de curso
 * nacen privados, y sin esto el panel del curso no podía abrirlos.
 */
async function puedeVerProyectoPrivado(
  propietarioId: string
): Promise<boolean> {
  const { userId, sessionClaims } = await auth();
  if (!userId) return false;

  if (userId === propietarioId) return true;

  const role = String(sessionClaims?.metadata?.role ?? '');
  return role === 'super-admin' || role === 'admin' || role === 'educador';
}

export default async function ProyectoDetallePage({
  params,
}: ProyectoDetallePageProps) {
  const { id } = await params;
  const projectId = Number(id);
  if (!Number.isFinite(projectId)) notFound();

  // Camino normal: proyecto público, visible para cualquiera.
  let item = await getProjectSocialById(projectId);

  // Si no es público, todavía puede verlo su dueño o quien administra.
  if (!item) {
    const proyecto = await getProjectById(projectId);
    if (!proyecto) notFound();

    if (!(await puedeVerProyectoPrivado(proyecto.userId))) notFound();

    item = await getProjectSocialById(projectId, true);
  }

  if (!item) notFound();

  return (
    <>
      <ProjectDetail item={item} />
      <Footer />
    </>
  );
}
