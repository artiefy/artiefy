'use client';

import MyCoursesContent, {
  type Course,
  type Program,
  type RutasMisCursos,
} from '~/components/estudiantes/layout/MyCoursesContent';

// "Mi aprendizaje" del estudiante de una academia: el mismo componente de
// /estudiantes/myaccount de Artiefy con las rutas del área de la academia.

const RUTAS: RutasMisCursos = {
  curso: (id) => `/dashboard/student/cursos/${id}`,
  clase: (courseId, lessonId) =>
    `/dashboard/student/cursos/${courseId}/clases/${lessonId}`,
  // Las academias aún no tienen página de programa: lleva a sus cursos.
  programa: () => '/dashboard/student/mi-aprendizaje',
  catalogo: '/dashboard/student',
};

export function MiAprendizajeAula({
  courses,
  programs,
}: {
  courses: Course[];
  programs: Program[];
}) {
  return (
    <div className="mx-auto max-w-6xl px-4 pt-12 pb-8 sm:px-6">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-foreground">
          Mi Aprendizaje
        </h1>
        <p className="text-muted-foreground">Continúa donde lo dejaste</p>
      </div>
      <MyCoursesContent courses={courses} programs={programs} rutas={RUTAS} />
    </div>
  );
}
