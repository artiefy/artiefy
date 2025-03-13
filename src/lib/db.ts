import { sql } from 'drizzle-orm';
import { drizzle, type MySql2Database } from 'drizzle-orm/mysql2';
import { createPool, type Pool } from 'mysql2/promise';

// Configura tu conexión a la base de datos
let pool: Pool | undefined;
try {
	pool = createPool({
		host: 'localhost',
		user: 'root',
		password: 'password',
		database: 'database_name', // Asegúrate de especificar el nombre de tu base de datos
	});
} catch (error) {
	console.error('Error al crear el pool de conexiones:', error);
	throw new Error('Failed to create the pool');
}

if (!pool) {
	throw new Error('Pool was not created');
}

const db: MySql2Database = drizzle(pool);

export async function getTotalEstudiantes() {
	try {
		const result = await db.execute(sql`
			SELECT COUNT(*) as total
			FROM users
			INNER JOIN roles ON users.role_id = roles.id
			WHERE roles.name IN ('student', 'estudiante')
		`); // Ejecuta la consulta

		if (Array.isArray(result) && result.length > 0) {
			// Verifica si hay resultados
			return ((result[0] as unknown) as { total: number }).total || 0; // Devuelve el total de estudiantes
		} else {
			// Si no hay resultados
			return 0; // Devuelve 0
		}
	} catch (error) {
		// Captura errores
		console.error('Error al obtener el número de estudiantes:', error);
		throw error;
	}
}
