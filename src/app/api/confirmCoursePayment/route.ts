import { type NextRequest, NextResponse } from 'next/server';

import { enrollInCourse } from '~/server/actions/estudiantes/courses/enrollInCourse';

export async function POST(req: NextRequest) {
	try {
		const formData = await req.formData();
		const state = formData.get('state_pol');
		const referenceCode = formData.get('reference_sale') as string;

		if (state === '4') {
			// Pago aprobado
			const courseId = Number(referenceCode.split('_')[1]);
			if (!isNaN(courseId)) {
				await enrollInCourse(courseId);
				return NextResponse.json({ success: true });
			}
		}

		return NextResponse.json({ success: false });
	} catch (error) {
		console.error('Error in course payment confirmation:', error);
		return NextResponse.json(
			{ error: 'Payment confirmation failed' },
			{ status: 500 }
		);
	}
}
