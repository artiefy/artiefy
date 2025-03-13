import { type NextApiRequest, type NextApiResponse } from 'next';

import { getTotalEstudiantes } from '~/lib/db'; // Asegúrate de que esta ruta sea correcta

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse
) {
	try {
		const total = await getTotalEstudiantes();
		res.status(200).json({ total });
	} catch (error) {
		console.error('Error al obtener el número de estudiantes:', error);
		res
			.status(500)
			.json({ error: 'Error al obtener el número de estudiantes' });
	}
}
