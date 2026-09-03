import { notFound } from 'next/navigation';

import { auth } from '@clerk/nextjs/server';
import { and, eq } from 'drizzle-orm';

import { AgentChatWidget } from '~/components/agents/AgentChatWidget';
import Footer from '~/components/estudiantes/layout/Footer';
import { UserProjectWorkspace } from '~/components/estudiantes/proyectos/UserProjectWorkspace';
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

  const toAgentActivity = (activity: {
    id: number;
    descripcion: string;
    deliverableSubmittedAt?: string | null;
  }) => ({
    id: activity.id,
    name: activity.descripcion,
    // `project_activities` carries no completion column: having submitted the
    // deliverable is the only signal the schema offers.
    isCompleted: Boolean(activity.deliverableSubmittedAt),
  });

  const objectives = project.objetivos_especificos.map((objective) => ({
    id: objective.id,
    title: objective.description,
    activities: objective.actividades.map(toAgentActivity),
  }));

  // `project_activities.objective_id` es nullable, así que un proyecto puede
  // tener actividades que no cuelgan de ningún objetivo. Sin este grupo
  // desaparecerían del árbol, aunque el chat sí las recibe en su contexto.
  const assignedIds = new Set(
    project.objetivos_especificos.flatMap((objective) =>
      objective.actividades.map((activity) => activity.id)
    )
  );
  const unassigned = project.actividades.filter(
    (activity) => !assignedIds.has(activity.id)
  );

  if (unassigned.length > 0) {
    objectives.push({
      // Los ids de `specific_objectives` son seriales positivos, así que este
      // grupo sintético nunca choca con uno real.
      id: -1,
      title: 'Actividades sin objetivo',
      activities: unassigned.map(toAgentActivity),
    });
  }

  return (
    <>
      <UserProjectWorkspace project={project} canEdit={isOwner} />
      {/* El Coach solo acompaña a quien trabaja el proyecto: a un visitante la
          ruta del chat le respondería que el proyecto no es suyo. Por eso sigue
          montándose el lanzador general, pero sin el proyecto.
          `source: 'user'` es lo que impide que la ruta del chat resuelva el id
          contra `guided_projects`, cuya secuencia serial es independiente y
          puede repetir el número. */}
      <AgentChatWidget
        project={
          isOwner
            ? {
                id: project.id,
                title: project.name,
                source: 'user',
                objectives,
              }
            : undefined
        }
      />
      <Footer />
    </>
  );
}
