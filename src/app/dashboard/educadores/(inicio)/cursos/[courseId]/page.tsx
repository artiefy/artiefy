import CourseDetail from './CourseDetail';

export default function CourseDetailPage({
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
