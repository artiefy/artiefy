import CourseDetail from "./CourseDetail";

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const resolvedParams = await params;
  return <CourseDetail courseId={resolvedParams.courseId} />;
}
