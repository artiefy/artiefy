import { count } from 'drizzle-orm';

import { db } from '~/server/db/index';
import { enrollments } from '~/server/db/schema';

// ✅ Obtener el número total de estudiantes inscritos en TODOS los cursos
export const getTotalStudents = async (): Promise<number> => {
	try {
		const result = await db
			.select({ totalStudents: count() }) // 🔹 Contar todos los registros en `enrollments`
			.from(enrollments);

		return result[0]?.totalStudents ?? 0;
	} catch (error) {
		console.error('Error al obtener el total de estudiantes:', error);
		return 0; // 🔥 Retornar 0 en caso de error
	}
};
