import CourseDetail from './CourseDetail';

export default async function CourseDetailPage({
	params,
}: {
	params: { id: string };
}) {
	return (
		<>
			<CourseDetail courseId={parseInt(params.id)} />
		</>
	);
}
