import ResponsiveSidebar from '~/app/dashboard/super-admin/components/ResponsiveSidebar'; // El componente ResponsiveSidebar

import CourseDetail from './CourseDetail'; // El componente CourseDetail

export default async function Page({
  params,
}: {
  params: Promise<{ courseId: number }>;
}) {
  // Esperamos a que se resuelvan los parámetros
  const resolvedParams = await params;

  return (
    <ResponsiveSidebar>
      <CourseDetail courseId={resolvedParams.courseId} />
    </ResponsiveSidebar>
  );
}
