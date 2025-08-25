import CourseDetail from './CourseDetail';

export default function CourseDetailPage({
  params,
}: {
  params: { id: string };
}) {
  // Renderiza el detallado del curso y se le pasa el id de este
  return (
    <>
      <CourseDetail courseId={parseInt(params.id)} />
    </>
  );
}
