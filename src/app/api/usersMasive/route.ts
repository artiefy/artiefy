/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
import { NextResponse } from 'next/server';

import nodemailer from 'nodemailer';
import * as XLSX from 'xlsx';

import { db } from '~/server/db';
import { users } from '~/server/db/schema';
import { createUser } from '~/server/queries/queries';

interface UserInput {
	firstName: string;
	lastName: string;
	email: string;
	role?: string;
}

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
		const formData = await request.formData();
		const file = formData.get('file');

		if (!file || !(file instanceof Blob)) {
			return NextResponse.json(
				{ error: 'No se proporcionó un archivo válido' },
				{ status: 400 }
			);
		}

		const data = await file.arrayBuffer();
		const workbook = XLSX.read(data, { type: 'array' });
		const sheetName = workbook.SheetNames[0];
		const sheet = workbook.Sheets[sheetName];
		const usersData = XLSX.utils.sheet_to_json(sheet) as UserInput[];

		const successfulUsers = [];
		const emailErrors = [];
		console.log(`Processing ${usersData.length} users...`);

		for (const userData of usersData) {
			try {
				console.log(`Creating user: ${userData.email}`);
				const result = await createUser(
					userData.firstName.trim(),
					userData.lastName.trim(),
					userData.email.trim(),
					userData.role ?? 'estudiante'
				);

				const generatedPassword = result?.generatedPassword ?? '12345678'; // Default password if not generated

				// Always send welcome email, regardless of user creation status
				let emailSent = false;
				for (let attempts = 0; attempts < 3 && !emailSent; attempts++) {
					emailSent = await sendWelcomeEmail(
						userData.email.trim(),
						`${userData.firstName} ${userData.lastName}`.trim(),
						generatedPassword
					);
					if (!emailSent) {
						console.log(
							`Retry ${attempts + 1} sending email to ${userData.email}`
						);
						await new Promise((r) => setTimeout(r, 1000));
					}
				}

				if (!emailSent) {
					emailErrors.push(userData.email);
				}

				// Add to database and successful users only if the user was created
				if (result?.user) {
					const { user: createdUser } = result;

					await db.insert(users).values({
						id: createdUser.id,
						name: `${userData.firstName.trim()} ${userData.lastName.trim()}`,
						email: userData.email.trim(),
						role: (userData.role ?? 'estudiante') as
							| 'estudiante'
							| 'educador'
							| 'admin'
							| 'super-admin',
						createdAt: new Date(),
						updatedAt: new Date(),
					});

					successfulUsers.push({
						id: createdUser.id,
						firstName: userData.firstName,
						lastName: userData.lastName,
						email: userData.email,
						role: userData.role ?? 'estudiante',
						status: 'activo',
						isNew: true,
					});

					console.log(`✅ User ${userData.email} created successfully`);
				}
			} catch (error) {
				console.log(`❌ Error creating user ${userData.email}:`, error);
				continue;
			}
		}

		return NextResponse.json({
			message: 'Proceso completado',
			users: successfulUsers,
			emailErrors,
			summary: {
				total: usersData.length,
				created: successfulUsers.length,
				failed: usersData.length - successfulUsers.length,
				emailErrors: emailErrors.length,
			},
		});
	} catch (error) {
		console.error('Error al procesar el archivo:', error);
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : 'Error desconocido' },
			{ status: 500 }
		);
	}
}

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
