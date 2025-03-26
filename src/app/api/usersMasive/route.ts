/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
import { NextResponse } from 'next/server';

import nodemailer from 'nodemailer';
import * as XLSX from 'xlsx';

import { db } from '~/server/db';
import { users } from '~/server/db/schema';
import { createUser } from '~/server/queries/queries';

// Configuración de Nodemailer usando variables de entorno
const transporter = nodemailer.createTransport({
	service: 'gmail',
	auth: {
		user: 'direcciongeneral@artiefy.com',
		pass: process.env.PASS,
	},
});

// Función para enviar correo de bienvenida
async function sendWelcomeEmail(
	to: string,
	username: string,
	password: string
) {
	try {
		const mailOptions = {
			from: '"Artiefy" <direcciongeneral@artiefy.com>',
			to,
			subject: '🎨 Bienvenido a Artiefy - Tus Credenciales de Acceso',
			html: `
				<h2>¡Bienvenido a Artiefy, ${username}!</h2>
				<p>Estamos emocionados de tenerte con nosotros. A continuación, encontrarás tus credenciales de acceso:</p>
				<ul>
					<li><strong>Usuario:</strong> ${username}</li>
					<li><strong>Email:</strong> ${to}</li>
					<li><strong>Contraseña:</strong> ${password}</li>
				</ul>
				<p>Por favor, inicia sesión en <a href="https://artiefy.com/" target="_blank">Artiefy</a> y cambia tu contraseña lo antes posible.</p>
				<p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
				<hr>
				<p>Equipo de Artiefy 🎨</p>
			`,
		};

		const info = await transporter.sendMail(mailOptions);
		console.log(`✅ Correo de bienvenida enviado a ${to}: ${info.messageId}`);
		return true;
	} catch (error) {
		console.error(`❌ Error al enviar correo de bienvenida a ${to}:`, error);
		return false;
	}
}

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
		}[] = XLSX.utils.sheet_to_json(sheet) as {
			firstName: string;
			lastName: string;
			email: string;
			role?: string;
		}[];

		const createdUsers = [];
		const emailErrors = [];
		const creationErrors = [];

		for (const user of usersData) {
			const { firstName, lastName, email, role } = user;

			// Validación de campos
			if (!firstName || !lastName || !email) {
				console.error('Faltan campos obligatorios', user);
				creationErrors.push({
					email: email || 'Sin email',
					error: 'Campos incompletos',
				});
				continue;
			}

			try {
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
				password: generatedPassword, // ⚠ Devuelve la contraseña generada
			});
				// Guardar en base de datos
				await db.insert(users).values({
					id: createdUser.id,
					email,
					role: (role ?? 'estudiante') as 'estudiante' | 'educador' | 'admin' | 'super-admin',
					createdAt: new Date(),
					updatedAt: new Date(),
				});

				// Enviar correo de bienvenida
				const emailSent = await sendWelcomeEmail(
					email,
					`${firstName} ${lastName}`,
					generatedPassword
				);

				if (!emailSent) {
					emailErrors.push(email);
				}

				// Agregar usuario creado a la lista
				createdUsers.push({
					id: createdUser.id,
					firstName,
					lastName,
					email,
					role: role ?? 'estudiante',
					password: generatedPassword,
					emailSent,
				});
			} catch (error) {
				console.error(`Error al crear usuario ${email}:`, error);
				creationErrors.push({
					email,
					error: error instanceof Error ? error.message : 'Error desconocido',
				});
				continue; // Continuar con el siguiente usuario
			}
		}

		return NextResponse.json({
			message: 'Proceso completado',
			users: createdUsers,
			emailErrors: emailErrors.length > 0 ? emailErrors : undefined,
			creationErrors: creationErrors.length > 0 ? creationErrors : undefined,
			summary: {
				total: usersData.length,
				created: createdUsers.length,
				failed: creationErrors.length,
				emailErrors: emailErrors.length,
			},
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
