import { NextResponse } from 'next/server';

import { clerkClient } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import nodemailer from 'nodemailer';

import { db } from '~/server/db';
import { userCredentials } from '~/server/db/schema';

const transporter = nodemailer.createTransport({
	service: 'gmail',
	auth: {
		user: 'direcciongeneral@artiefy.com',
		pass: process.env.PASS,
	},
});

// Función para generar contraseña aleatoria
function generateRandomPassword(length = 12) {
	const charset =
		'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
	let password = '';
	for (let i = 0; i < length; i++) {
		password += charset.charAt(Math.floor(Math.random() * charset.length));
	}
	return password;
}

export async function POST(request: Request) {
	try {
		const { userIds }: { userIds: string[] } = await request.json();
		type Result =
			| {
					userId: string;
					status: 'error';
					message: string;
			  }
			| {
					userId: string;
					status: 'success';
					email: string;
					message: string;
			  };

		const results: Result[] = [];

		for (const userId of userIds) {
			try {
				const client = await clerkClient();
				const clerkUser = await client.users.getUser(userId);

				if (!clerkUser) {
					results.push({
						userId,
						status: 'error',
						message: 'Usuario no encontrado',
					});
					continue;
				}

				const email = clerkUser.emailAddresses.find(
					(addr) => addr.id === clerkUser.primaryEmailAddressId
				)?.emailAddress;

				if (!email) {
					results.push({
						userId,
						status: 'error',
						message: 'Email no encontrado',
					});
					continue;
				}

				const username =
					clerkUser.username ??
					`${clerkUser.firstName ?? ''} ${clerkUser.lastName ?? ''}`.trim();

				let password: string;

				const credentials = await db
					.select()
					.from(userCredentials)
					.where(eq(userCredentials.userId, userId));

				if (credentials.length === 0) {
					password = generateRandomPassword();
					try {
						await clerkClient.users.updateUser(userId, { password });

						await db.insert(userCredentials).values({
							userId,
							password,
							clerkUserId: userId,
							email,
						});
					} catch (error) {
						console.error(`Error creating credentials for ${userId}:`, error);
						results.push({
							userId,
							status: 'error',
							message: 'Error al crear credenciales',
						});
						continue;
					}
				} else {
					password = credentials[0].password;
				}

				try {
					const mailOptions: nodemailer.SendMailOptions = {
						from: '"Artiefy" <direcciongeneral@artiefy.com>',
						to: email,
						subject: '🎨 Credenciales de Acceso - Artiefy',
						html: `...`,
					};

					await transporter.sendMail(mailOptions);
					results.push({
						userId,
						status: 'success',
						email,
						message: 'Credenciales enviadas correctamente',
					});
				} catch (emailError) {
					console.error(`Error enviando email a ${email}:`, emailError);
					results.push({
						userId,
						status: 'error',
						message: 'Error al enviar el correo',
					});
				}
			} catch (error) {
				console.error(`Error procesando usuario ${userId}:`, error);
				results.push({
					userId,
					status: 'error',
					message: error instanceof Error ? error.message : 'Error desconocido',
				});
			}
		}

		return NextResponse.json({ results });
	} catch (error) {
		console.error('Error in emailsUsers route:', error);
		return NextResponse.json(
			{ error: 'Error al enviar los correos' },
			{ status: 500 }
		);
	}
}
