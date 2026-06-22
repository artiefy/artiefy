'use client';

import MyCoursesContent, {
  type Course,
  type Program,
} from '~/components/estudiantes/layout/MyCoursesContent';

interface MyCoursesStudentClientProps {
  courses: Course[];
  programs: Program[];
}

export default function MyCoursesStudentClient({
  courses,
  programs,
}: MyCoursesStudentClientProps) {
  return (
    <div
      className="
        mx-auto max-w-6xl px-4 pt-24 pb-8
        sm:px-6
      "
    >
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-foreground">
          Mi Aprendizaje
        </h1>
        <p className="text-muted-foreground">Continúa donde lo dejaste</p>
      </div>

      <MyCoursesContent courses={courses} programs={programs} />
    </div>
  );
}
