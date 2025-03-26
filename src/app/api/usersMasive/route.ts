import { NextResponse } from 'next/server';

import * as XLSX from 'xlsx';

import { db } from '~/server/db';
import { users } from '~/server/db/schema';
import { createUser } from '~/server/queries/queries';

export async function POST(request: Request) {
	try {
		// Recibir archivo
		const formData = await request.formData();
		const file = formData.get('file');

		if (!file || !(file instanceof Blob)) {
			return NextResponse.json(
				{ error: 'No se proporcionó un archivo válido' },
				{ status: 400 }
			);
		}

		// Leer archivo Excel
		const data = await file.arrayBuffer();
		const workbook = XLSX.read(data, { type: 'array' });
		const sheetName = workbook.SheetNames[0];
		const sheet = workbook.Sheets[sheetName];

		// Convertir datos a JSON
		const usersData: {
			firstName: string;
			lastName: string;
			email: string;
			role?: string;
		}[] = XLSX.utils.sheet_to_json(sheet);

		const createdUsers = [];

		for (const user of usersData) {
			const { firstName, lastName, email, role } = user;

			// Validación de campos
			if (!firstName || !lastName || !email) {
				console.error('Faltan campos obligatorios', user);
				continue;
			}

			// Crear usuario en Clerk
			const { user: createdUser, generatedPassword } = await createUser(
				firstName,
				lastName,
				email,
				role ?? 'estudiante'
			);

			// Asegurarse de que el rol sea uno válido, por defecto "estudiante"
			const validRole = (role ?? 'estudiante') as
				| 'estudiante'
				| 'educador'
				| 'admin'
				| 'super-admin';

			// Guardar en base de datos (sin la contraseña)
			await db.insert(users).values({
				id: createdUser.id,
				name: `${firstName} ${lastName}`,
				email,
				role: validRole,
				createdAt: new Date(),
				updatedAt: new Date(),
			});

			// Agregar usuario a la lista de respuesta
			createdUsers.push({
				id: createdUser.id,
				firstName,
				lastName,
				email,
				role: validRole,
				password: generatedPassword, // ⚠️ Devuelve la contraseña generada
			});
		}

		// ✅ **En lugar de devolver un archivo, devolvemos JSON con los usuarios creados**
		return NextResponse.json({
			message: 'Usuarios creados exitosamente',
			users: createdUsers, // Enviamos los usuarios en la respuesta
		});
	} catch (error) {
		console.error('Error al procesar el archivo:', error);

		// Captura de errores más detallada
		if (error instanceof Error) {
			return NextResponse.json({ error: error.message }, { status: 500 });
		}

		return NextResponse.json({ error: 'Error desconocido' }, { status: 500 });
	}
}

// Ruta para descargar la plantilla de usuarios en formato Excel
export function GET() {
	try {
		// Datos de ejemplo que representarán el formato de la plantilla
		const templateData = [
			{
				firstName: 'John',
				lastName: 'Doe',
				email: 'johndoe@example.com',
				role: 'estudiante', // Puedes omitir o personalizar según el formato requerido
			},
		];

		// Crear el archivo Excel
		const ws = XLSX.utils.json_to_sheet(templateData);
		const wb = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(wb, ws, 'Usuarios');

		const excelBuffer = XLSX.write(wb, {
			bookType: 'xlsx',
			type: 'array',
		}) as ArrayBuffer;

		// Retornamos el archivo Excel como respuesta
		return new NextResponse(excelBuffer, {
			headers: {
				'Content-Type':
					'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
				'Content-Disposition': 'attachment; filename=plantilla_usuarios.xlsx',
			},
		});
	} catch (error) {
		console.error('Error al generar la plantilla Excel:', error);
		return NextResponse.json(
			{ error: 'Error al generar la plantilla Excel' },
			{ status: 500 }
		);
	}
}
