import { clerkClient, type User } from '@clerk/nextjs/server';
import { formatInTimeZone } from 'date-fns-tz';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { EmailTemplate } from '~/components/estudiantes/layout/EmailTemplate';
import { db } from '~/server/db';
import { users } from '~/server/db/schema';
import { generateCalendarEvent } from '~/utils/email/calendarEvent';
import { sendNotification } from '~/utils/email/notifications';

// Definir constantes de tiempo
const SUBSCRIPTION_DURATION = 5 * 60 * 1000; // 5 minutos
const NOTIFICATION_BEFORE = 2 * 60 * 1000; // 2 minutos antes de expirar

interface PaymentData {
	email_buyer: string;
	state_pol: string;
}

async function scheduleNotification(email: string, expirationDate: Date) {
	const timeUntilNotification = SUBSCRIPTION_DURATION - NOTIFICATION_BEFORE;

	console.log(`⏰ Programando notificación para ${email}`);
	console.log(
		`📅 Tiempo hasta notificación: ${timeUntilNotification / 1000} segundos`
	);

	return new Promise((resolve) => {
		const timer = setTimeout(async () => {
			try {
				console.log(`🔔 Ejecutando notificación para ${email}`);

				const emailContent = EmailTemplate({
					userName: email,
					message: `Tu suscripción expirará en 2 minutos.\n
            Fecha de expiración: ${formatInTimeZone(
							expirationDate,
							'America/Bogota',
							'yyyy-MM-dd HH:mm:ss'
						)} (hora de Bogotá)`,
				});

				const sent = await sendNotification(
					email,
					'⚠️ Tu suscripción está por expirar - Artiefy',
					emailContent,
					[
						{
							filename: 'calendar-event.ics',
							content: generateCalendarEvent(expirationDate), // Implementar esta función
							contentType: 'text/calendar',
						},
					]
				);

				console.log(`✉️ Resultado del envío: ${sent ? 'Exitoso' : 'Fallido'}`);
				resolve(sent);
			} catch (error) {
				console.error('❌ Error en notificación:', error);
				resolve(false);
			}
		}, timeUntilNotification);

		// Asegurarse de que el timer no impida que Node.js se cierre
		timer.unref();
	});
}

export async function updateUserSubscription(paymentData: PaymentData) {
	const { email_buyer, state_pol } = paymentData;
	console.log('📩 Recibido pago de:', email_buyer, 'con estado:', state_pol);

	if (state_pol !== '4') {
		console.warn(
			`⚠️ Pago con estado ${state_pol}, no se actualizo la suscripción.`
		);
		return;
	}

	// 🗓️ Calcular fecha de expiración en zona horaria de Bogotá
	const bogotaDate = new Date(
		formatInTimeZone(new Date(), 'America/Bogota', 'yyyy-MM-dd HH:mm:ss')
	);
	const subscriptionEndDate = new Date(
		bogotaDate.getTime() + SUBSCRIPTION_DURATION
	);

	try {
		// 🔍 Buscar usuario en la base de datos
		const existingUser = await db.query.users.findFirst({
			where: eq(users.email, email_buyer),
		});

		let userId = existingUser?.id;

		if (!existingUser) {
			// 🆕 Si el usuario no existe, crearlo con un ID único
			userId = uuidv4();
			await db.insert(users).values({
				id: userId,
				email: email_buyer,
				role: 'student',
				subscriptionStatus: 'active',
				// Aquí el cambio: pasar directamente el objeto Date
				subscriptionEndDate: subscriptionEndDate,
				createdAt: new Date(),
				updatedAt: new Date(),
			});
			console.log(`✅ Usuario creado en la base de datos: ${email_buyer}`);
		} else {
			// 🔄 Si el usuario ya existe, actualizar su estado de suscripción
			await db
				.update(users)
				.set({
					subscriptionStatus: 'active',
					// Aquí también: pasar directamente el objeto Date
					subscriptionEndDate: subscriptionEndDate,
					updatedAt: new Date(),
				})
				.where(eq(users.email, email_buyer));

			console.log(`✅ Usuario existente actualizado a activo: ${email_buyer}`);
		}

		// 🔍 Buscar usuario en Clerk y actualizar `publicMetadata`
		const clerkClientInstance = await clerkClient();
		const clerkUsers = await clerkClientInstance.users.getUserList({
			emailAddress: [email_buyer],
		});

		if (clerkUsers.data.length > 0) {
			const clerkUser = clerkUsers.data[0] as User | undefined;
			if (!clerkUser) {
				console.warn(`⚠️ Usuario no encontrado en Clerk: ${email_buyer}`);
				return;
			}

			// Para Clerk, sí necesitamos la fecha en formato ISO string
			await clerkClientInstance.users.updateUser(clerkUser.id, {
				publicMetadata: {
					subscriptionStatus: 'active',
					subscriptionEndDate: subscriptionEndDate.toISOString(),
				},
			});

			console.log(`✅ Clerk metadata actualizado para ${email_buyer}`);
		} else {
			console.warn(`⚠️ Usuario no encontrado en Clerk: ${email_buyer}`);
		}

		// Calcular tiempo para notificación
		const timeUntilNotification = SUBSCRIPTION_DURATION - NOTIFICATION_BEFORE;

		// Usar scheduleNotification en lugar del setTimeout directo
		void scheduleNotification(email_buyer, subscriptionEndDate);

		console.log(
			`📅 Inicio suscripción (Bogotá): ${formatInTimeZone(
				bogotaDate,
				'America/Bogota',
				'yyyy-MM-dd HH:mm:ss'
			)}`
		);
		console.log(
			`📅 Fin suscripción (Bogotá): ${formatInTimeZone(subscriptionEndDate, 'America/Bogota', 'yyyy-MM-dd HH:mm:ss')}`
		);
		console.log(`⏰ Notificación en: ${timeUntilNotification / 1000} segundos`);
	} catch (error) {
		if (error instanceof Error) {
			console.error(`❌ Error en updateUserSubscription: ${error.message}`);
		} else {
			console.error('❌ Error desconocido en updateUserSubscription');
		}
		throw error;
	}
}
