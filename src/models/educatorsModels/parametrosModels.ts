import { eq } from 'drizzle-orm';
import { db } from '~/server/db/index';
import { parametros } from '~/server/db/schema';

export interface Parametros {
	id: number;
	name: string;
	description: string;
	porcentaje: number;
	courseId: number;
}

// Crear un parámetro
export const createParametros = async ({
	name,
	description,
	porcentaje,
	courseId,
}: {
	name: string;
	description: string;
	porcentaje: number;
	courseId: number;
}) => {
	return db.insert(parametros).values({
		name,
		description,
		porcentaje,
		courseId,
	});
};

// Obtener parámetros
export async function getParametros() {
	const result: Parametros[] = await db.select().from(parametros);
	return result;
}

// Obtener parámetros por ID de curso
export async function getParametrosByCourseId(
	courseId: number
): Promise<Parametros[]> {
	try {
		const result: Parametros[] = await db
			.select()
			.from(parametros)
			.where(eq(parametros.courseId, courseId));
		return result;
	} catch (error) {
		console.error('Error al obtener los parámetros:', error);
		throw new Error('Error al obtener los parámetros');
	}
}

// Obtener parámetro por ID
export async function getParametroById(id: number) {
	const result: Parametros[] = await db
		.select()
		.from(parametros)
		.where(eq(parametros.id, id));
	return result;
}

// Actualizar un parámetro
export const updateParametro = async ({
	id,
	name,
	description,
	porcentaje,
	courseId,
}: {
	id: number;
	name: string;
	description: string;
	porcentaje: number;
	courseId: number;
}) => {
	try {
		const parametroActualizado = await db
			.update(parametros)
			.set({ name, description, porcentaje, courseId })
			.where(eq(parametros.id, id));
		return parametroActualizado;
	} catch (error) {
		console.error('Error al actualizar el parámetro:', error);
		throw error;
	}
};

// Eliminar un parámetro
export async function deleteParametro(id: number) {
	const parametroEliminado = await db
		.delete(parametros)
		.where(eq(parametros.id, id));
	return parametroEliminado;
}

// Eliminar parámetros por ID de curso
export const deleteParametroByCourseId = async (courseId: number) => {
	try {
		await db.delete(parametros).where(eq(parametros.courseId, courseId));
	} catch (error) {
		console.error('Error al eliminar los parámetros:', error);
		throw error;
	}
};