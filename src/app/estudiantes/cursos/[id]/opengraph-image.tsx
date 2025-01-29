import { ImageResponse } from 'next/og';
import { getCourseById } from '~/server/actions/courses/getCourseById';

export const alt = 'Course Image';
export const size = {
	width: 1200,
	height: 630,
};
export const contentType = 'image/png';

export default async function Image({ params }: { params: { id: string } }) {
	const course = await getCourseById(Number(params.id));

	if (!course) {
		return new ImageResponse(
			(
				<div
					style={{
						fontSize: 48,
						background: 'white',
						width: '100%',
						height: '100%',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
					}}
				>
					Curso no encontrado
				</div>
			),
			{
				...size,
			}
		);
	}

	const coverImageUrl = course.coverImageKey
		? `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${course.coverImageKey}`
		: `https://placehold.co/600x400/01142B/3AF4EF?text=Artiefy&font=MONTSERRAT`;

	return new ImageResponse(
		(
			<div
				style={{
					fontSize: 48,
					background: 'white',
					width: '100%',
					height: '100%',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					flexDirection: 'column',
					padding: '20px',
					boxSizing: 'border-box',
				}}
			>
				<img
					src={coverImageUrl}
					alt={course.title}
					style={{ width: '100%', height: 'auto' }}
				/>
				<h1
					style={{
						margin: '20px 0 0 0',
						fontSize: '36px',
						textAlign: 'center',
					}}
				>
					{course.title}
				</h1>
				<p style={{ fontSize: '24px', textAlign: 'center' }}>
					{course.description ?? 'No hay descripción disponible.'}
				</p>
			</div>
		),
		{
			...size,
		}
	);
}
