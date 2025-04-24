import { NextResponse } from 'next/server';
 import { clerkClient } from '@clerk/nextjs/server';
 import nodemailer from 'nodemailer';
 
 import { db } from '~/server/db';
 import { userCredentials } from '~/server/db/schema';
 import { eq } from 'drizzle-orm';
 
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
 		const { userIds } = await request.json();
 		const results = [];
 
 		for (const userId of userIds) {
 			try {
 				// Get user from Clerk with proper initialization
 				const clerk = await clerkClient();
 				const clerkUser = await clerk.users.getUser(userId);
 
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
 					clerkUser.username ||
 					`${clerkUser.firstName} ${clerkUser.lastName}`.trim();
 				let password;
 
 				// Get existing credentials or generate new ones
 				let credentials = await db
 					.select()
 					.from(userCredentials)
 					.where(eq(userCredentials.userId, userId));
 
 				if (credentials.length === 0) {
 					// Si no hay credenciales, generamos nueva contraseña y actualizamos Clerk
 					password = generateRandomPassword();
 					try {
 						await clerk.users.updateUser(userId, {
 							password: password,
 						});
 
 						await db.insert(userCredentials).values({
 							userId: userId,
 							password: password,
 							clerkUserId: userId,
 							email: email,
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
 					// Si ya existen credenciales, usamos la contraseña almacenada
 					password = credentials[0].password;
 				}
 
 				try {
 					const mailOptions = {
 						from: '"Artiefy" <direcciongeneral@artiefy.com>',
 						to: email,
 						subject: '🎨 Credenciales de Acceso - Artiefy',
 						html: `
               <h2>¡Hola ${username}!</h2>
               <p>Aquí están tus credenciales de acceso para Artiefy:</p>
               <ul>
                 <li><strong>Usuario:</strong> ${username}</li>
                 <li><strong>Email:</strong> ${email}</li>
                 <li><strong>Contraseña:</strong> ${password}</li>
               </ul>
               <p>Por favor, inicia sesión en <a href="https://artiefy.com/" target="_blank">Artiefy</a></p>
               <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
               <hr>
               <p>Equipo de Artiefy 🎨</p>
             `,
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