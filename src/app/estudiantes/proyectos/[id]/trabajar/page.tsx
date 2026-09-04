import { notFound } from 'next/navigation';

import { auth } from '@clerk/nextjs/server';
import { and, eq } from 'drizzle-orm';

import { AgentChatWidget } from '~/components/agents/AgentChatWidget';
import Footer from '~/components/estudiantes/layout/Footer';
import { UserProjectWorkspace } from '~/components/estudiantes/proyectos/UserProjectWorkspace';
import { toAgentProject } from '~/lib/agents/agentProject';
import { getProjectById } from '~/server/actions/project/getProjectById';
import { db } from '~/server/db';
import { projectsTaken } from '~/server/db/schema';

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
  if (!project) notFound();

  const isOwner = project.userId === userId;

  // Un colaborador invitado sigue entrando a trabajar el proyecto.
  let isCollaborator = false;
  if (!isOwner) {
    const [taken] = await db
      .select({ id: projectsTaken.id })
      .from(projectsTaken)
      .where(
        and(
          eq(projectsTaken.projectId, projectId),
          eq(projectsTaken.userId, userId)
        )
      )
      .limit(1);
    isCollaborator = Boolean(taken);
  }

  // Un proyecto público lo puede abrir cualquiera, pero solo de lectura.
  // Uno privado sigue respondiendo notFound() a quien no tiene relación con
  // él, para no delatar que existe.
  if (!isOwner && !isCollaborator && !project.isPublic) notFound();

  // El mismo mapeo que usa el chat cuando sigue un proyecto recién guardado
  // desde el asistente, para que el árbol se arme igual en los dos casos.
  const agentProject = toAgentProject(project);

  return (
    <>
      <UserProjectWorkspace project={project} canEdit={isOwner} />
      {/* El Coach solo acompaña a quien trabaja el proyecto: a un visitante la
          ruta del chat le respondería que el proyecto no es suyo. Por eso sigue
          montándose el lanzador general, pero sin el proyecto.
          `source: 'user'` es lo que impide que la ruta del chat resuelva el id
          contra `guided_projects`, cuya secuencia serial es independiente y
          puede repetir el número. */}
      <AgentChatWidget project={isOwner ? agentProject : undefined} />
      <Footer />
    </>
  );
}
