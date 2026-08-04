import CourseDetail from './CourseDetail'; // El componente CourseDetail

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default async function Page({
  params,
}: {
  params: Promise<{ courseId: number }>;
}) {
  // Esperamos a que se resuelvan los parámetros
  const resolvedParams = await params;

  return (
    <>
      <CourseDetail courseId={resolvedParams.courseId} />
    </>
  );
}
