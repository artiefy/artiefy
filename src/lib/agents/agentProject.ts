/**
 * The project tree the Coach shows inside the chat, and the mapping from the
 * shape `getProjectById` returns into it.
 *
 * It lives here rather than in `AgentChatWidget` so a server component, the
 * chat bus and the widget itself all speak the same shape without importing a
 * two-thousand-line client component.
 */

export interface AgentActivity {
  id: number;
  name: string;
  isCompleted: boolean;
}

export interface AgentObjective {
  id: number;
  title: string;
  activities?: AgentActivity[];
}

export interface AgentProject {
  id: number;
  title: string;
  objectives: AgentObjective[];
  /**
   * Which table the id belongs to. `guidedProjects` and `projects` have
   * independent serial sequences, so the chat route needs this to know which
   * one to look up. Absent means guided, exactly like every mount before user
   * projects were supported.
   */
  source?: 'guided' | 'user';
}

/** The slice of an activity row the tree needs. */
interface ProjectActivityDetails {
  id: number;
  descripcion: string;
  deliverableSubmittedAt?: string | null;
}

/**
 * The slice of `getProjectById` (and of `GET /api/projects/[id]?details=true`,
 * which returns it verbatim) that the tree is built from.
 */
export interface UserProjectDetails {
  id: number;
  name: string;
  objetivos_especificos: {
    id: number;
    description: string;
    actividades: ProjectActivityDetails[];
  }[];
  actividades: ProjectActivityDetails[];
}

/**
 * The synthetic group that collects activities hanging off no objective. Ids
 * in `specific_objectives` are positive serials, so it never collides with a
 * real one.
 */
export const UNASSIGNED_OBJECTIVE_ID = -1;

const toAgentActivity = (activity: ProjectActivityDetails): AgentActivity => ({
  id: activity.id,
  name: activity.descripcion,
  // `project_activities` carries no completion column: having submitted the
  // deliverable is the only signal the schema offers.
  isCompleted: Boolean(activity.deliverableSubmittedAt),
});

/** Builds the objectives tree, including the unassigned-activities group. */
export function toAgentObjectives(
  project: UserProjectDetails
): AgentObjective[] {
  const objectives: AgentObjective[] = project.objetivos_especificos.map(
    (objective) => ({
      id: objective.id,
      title: objective.description,
      activities: objective.actividades.map(toAgentActivity),
    })
  );

  // `project_activities.objective_id` is nullable, so a project can hold
  // activities that hang off no objective. Without this group they would
  // vanish from the tree, even though the chat does receive them in context.
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
      id: UNASSIGNED_OBJECTIVE_ID,
      title: 'Actividades sin objetivo',
      activities: unassigned.map(toAgentActivity),
    });
  }

  return objectives;
}

/**
 * `source: 'user'` names the `projects` table, not the `type` column: a
 * project created from a course wizard is a row there too, so every project
 * that goes through `getProjectById` opens the chat the same way.
 */
export function toAgentProject(project: UserProjectDetails): AgentProject {
  return {
    id: project.id,
    title: project.name,
    source: 'user',
    objectives: toAgentObjectives(project),
  };
}
