import type { ProjectSocialItem } from './types';

/** Where a project is published: its course page or its own public page. */
export const getPublishHref = (item: ProjectSocialItem) => {
  if (item.courseId) {
    return `/estudiantes/cursos/${item.courseId}?projectId=${item.id}&view=projects`;
  }
  return `/estudiantes/proyectos/${item.id}`;
};

/** "Trabajar" opens the course workspace for a course-linked project, or
 *  the courseless owner-only workspace otherwise. */
export const getWorkHref = (item: ProjectSocialItem) => {
  if (item.courseId) {
    return `/estudiantes/cursos/${item.courseId}?projectId=${item.id}&view=projects`;
  }
  return `/estudiantes/proyectos/${item.id}/trabajar`;
};
