export interface CourseRating {
	ratingValue: number;
	ratingCount: number;
	bestRating: number;
	worstRating: number;
}

export interface CourseReview {
	author: string;
	reviewRating: {
		ratingValue: number;
		worstRating: number;
		bestRating: number;
	};
	reviewBody: string;
	datePublished: string;
}

export const generateCourseStructuredData = (
	course: {
		id: number;
		title: string;
		description: string | null;
		instructor: string;
		rating: number | null;
		individualPrice?: number | null;
		totalStudents?: number;
	},
	reviews?: CourseReview[]
) => {
	return {
		'@context': 'https://schema.org',
		'@type': 'Course',
		'@id': `https://artiefy.com/estudiantes/cursos/${course.id}`,
		name: course.title,
		description: course.description,
		provider: {
			'@type': 'Organization',
			name: 'Artiefy',
			sameAs: 'https://artiefy.com',
		},
		instructor: {
			'@type': 'Person',
			name: course.instructor,
		},
		...(course.individualPrice && {
			offers: {
				'@type': 'Offer',
				price: course.individualPrice,
				priceCurrency: 'COP',
				availability: 'https://schema.org/InStock',
			},
		}),
		...(course.rating &&
			course.totalStudents && {
				aggregateRating: {
					'@type': 'AggregateRating',
					ratingValue: course.rating,
					ratingCount: course.totalStudents,
					bestRating: 5,
					worstRating: 1,
				},
			}),
		...(reviews &&
			reviews.length > 0 && {
				review: reviews.map((review) => ({
					'@type': 'Review',
					author: {
						'@type': 'Person',
						name: review.author,
					},
					reviewRating: {
						'@type': 'Rating',
						...review.reviewRating,
					},
					reviewBody: review.reviewBody,
					datePublished: review.datePublished,
				})),
			}),
	};
};
