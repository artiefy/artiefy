import { ImageResponse } from 'next/og';

import { auth } from '@clerk/nextjs/server';

import { getCourseById } from '~/server/actions/estudiantes/courses/getCourseById';

export const alt = 'Course Image';
export const size = {
	width: 1200,
	height: 630,
};
export const contentType = 'image/png';

export default async function Image({ params }: { params: { id: string } }) {
	try {
		const { userId } = await auth();
		const course = await getCourseById(Number(params.id), userId);

		if (!course) {
			return new ImageResponse(
				(
					<div
						style={{
							fontSize: '48px',
							background: 'black',
							width: '1200px',
							height: '630px',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
						}}
					>
						Curso no encontrado
					</div>
				),
				{ ...size }
			);
		}

		const coverImageUrl = course.coverImageKey
			? `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${course.coverImageKey}`
			: `https://placehold.co/1200x630/01142B/3AF4EF?text=Artiefy&font=MONTSERRAT`;

		// Load Montserrat font
		const montserrat = await fetch(
			'https://fonts.gstatic.com/s/montserrat/v15/JTURjIg1_i6t8kCHKm45_dJE3gnD-w.ttf'
		).then((res) => res.arrayBuffer());

		return new ImageResponse(
			(
				<div
					style={{
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						justifyContent: 'flex-start',
						width: `${size.width}px`,
						height: `${size.height}px`,
						backgroundImage: `url(${coverImageUrl})`,
						backgroundSize: `${size.width}px ${size.height}px`,
						backgroundPosition: 'center',
						paddingTop: '50px',
					}}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 1425.83 417.61"
						width="300"
						height="87.5"
					>
						<rect
							x="43.779"
							y="14.057"
							width="1347.11"
							height="380.757"
							fill="#01142B"
							rx="28.115"
							ry="28.115"
						/>
						<g transform="matrix(0.726766, 0, 0, 0.661497, 199.200717, 66.296296)">
							<polygon
								points="144.99 218.15 192.75 201.16 194.56 201.83 194.83 117.23 144.99 218.15"
								fill="#FFFFFF"
							/>
							<polygon
								points="107.13 343.13 194.11 343.13 194.48 225.93 194.12 225.42 107.13 343.13"
								fill="#FFFFFF"
							/>
							<path
								d="M457.67,203.07l-.73-36.93h-51.4V344.4h55.7V286.81c0-14.06,4.71-28.94,12.21-40.83,16.23-25.72,43.6-33,53.83-31.71l1.86-56.11C489.67,165.14,462.8,192.76,457.67,203.07Z"
								fill="#FFFFFF"
							/>
							<polygon
								points="648.47 87.82 593.28 87.82 593.28 165.32 560.77 165.32 560.77 209.79 592.36 209.79 592.36 344.4 648.47 344.4 648.47 209.79 689.86 209.79 689.86 165.32 648.47 165.32 648.47 87.82"
								fill="#FFFFFF"
							/>
							<rect
								x="733.51"
								y="166.14"
								width="57.11"
								height="178.26"
								fill="#FFFFFF"
							/>
							<path
								d="M994,179.81q-24.69-22.23-63-22.24-28.56,0-51.81,12.85a101.84,101.84,0,0,0-37.12,34.47q-13.87,21.63-13.87,48.55,0,28.14,11.83,49.76a83.59,83.59,0,0,0,34.47,33.86q22.65,12.24,55.28,12.24a109.72,109.72,0,0,0,31.2-4.9c11-3.26,23.71-10,33.23-15.48l-27.72-40a97.48,97.48,0,0,1-17.34,8.56A51.57,51.57,0,0,1,931,300.76,49,49,0,0,1,907.33,295a39.64,39.64,0,0,1-11.72-9.56L1026,244.05Q1018.69,202.05,994,179.81Zm-109.45,74c-.05-1.19-.08-2.38-.08-3.61q0-14.68,5.1-25.49A38.36,38.36,0,0,1,904.27,208,41.49,41.49,0,0,1,926.5,202q16.72,0,25.09,8a42.66,42.66,0,0,1,11.22,17.39Z"
								fill="#FFFFFF"
							/>
							<path
								d="M1146,78.84q7.76-8.15,20-8.16a33,33,0,0,1,10.4,1.84,20.11,20.11,0,0,1,9.59,7.14L1210,38.46a69.71,69.71,0,0,0-24.68-11.22,107.67,107.67,0,0,0-25.5-3.47q-38.34,0-58.54,22.24t-20.19,57.31v62H1051v50.59h30.18V346.4h57.11V215.91h77.37l-24.31-50.59h-53.06V105Q1138.24,87,1146,78.84Z"
								fill="#FFFFFF"
							/>
							<polygon
								points="200.47 0 0 343.13 4.28 343.1 195.13 35.63 194.83 117.23 195.02 116.84 241.6 219.25 194.56 201.83 194.48 225.93 278.95 343.13 368.19 343.13 200.47 0"
								fill="#FFFFFF"
							/>
							<polygon
								points="790.62 90.26 763.06 90.26 733.5 90.26 733.5 142.22 763.06 132.19 790.62 142.22 790.62 90.26"
								fill="#FFFFFF"
							/>
							<path
								d="M1374.44,166.14l-48.26,111.05-46-111h-64s83.31,167.18,83.28,167.48c-2.17,18-15.7,32.88-15.7,32.88a33.36,33.36,0,0,1-10.67,6.94,41.16,41.16,0,0,1-20.32,2.65,43.62,43.62,0,0,1-14.9-4.37c-4.69-2.35-8.35-5.26-12.81-8.74l-25.92,32.29c7.47,5.42,15.66,10.91,24.59,14.64a92.33,92.33,0,0,0,25.68,6.91q6.15.68,11.95.77,19.89.33,35.42-6a53.85,53.85,0,0,0,10.62-6.25,88.38,88.38,0,0,0,28.79-36l89.67-203.21Z"
								fill="#FFFFFF"
							/>
						</g>
					</svg>
					<div
						style={{
							fontSize: '40px',
							fontWeight: 'bold',
							color: 'black',
							textAlign: 'center',
							textShadow: '2px 4px 8px rgba(0, 0, 0, 0.5)',
							maxWidth: '90%',
							overflowWrap: 'break-word',
							marginTop: '20px',
							WebkitTextStroke: '7px white',
						}}
					>
						{course.title}
					</div>
				</div>
			),
			{
				...size,
				emoji: 'fluent',
				fonts: [
					{
						name: 'Montserrat',
						data: montserrat,
						style: 'normal',
						weight: 700,
					},
				],
			}
		);
	} catch (error) {
		console.error('Error generating image:', error);
		return new ImageResponse(
			(
				<div
					style={{
						fontSize: '48px',
						background: 'white',
						width: '1200px',
						height: '630px',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
					}}
				>
					Error al generar la imagen
				</div>
			),
			{ ...size }
		);
	}
}
