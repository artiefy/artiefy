import CourseDetail from './CourseDetailProgram'; // El componente CourseDetail

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
