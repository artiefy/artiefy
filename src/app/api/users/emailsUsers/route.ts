import { NextResponse } from 'next/server';

import { clerkClient } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import nodemailer from 'nodemailer';

import { db } from '~/server/db';
import {
  credentialsDeliveryLogs,
  emailLogs,
  userCredentials,
} from '~/server/db/schema';

// Interfaces and types
interface MailOptions {
  from: string;
  to: string;
  subject: string;
  html: string;
}

interface Result {
  userId: string;
  status: 'success' | 'error';
  message: string;
  email?: string;
}

// Nodemailer transporter setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'direcciongeneral@artiefy.com',
    pass: process.env.PASS,
  },
});

// Función auxiliar para guardar logs de email - GARANTIZA persistencia
async function logEmail(data: {
  userId?: string;
  email: string;
  emailType: 'welcome' | 'academic_notification' | 'other';
  subject: string;
  status: 'success' | 'failed';
  errorMessage?: string;
  errorDetails?: unknown;
  recipientName?: string;
  metadata?: Record<string, unknown>;
}) {
  let logSuccessful = false;
  try {
    await db.insert(emailLogs).values({
      userId: data.userId ?? null,
      email: data.email,
      emailType: data.emailType,
      subject: data.subject,
      status: data.status,
      errorMessage: data.errorMessage ?? null,
      errorDetails: data.errorDetails
        ? JSON.parse(JSON.stringify(data.errorDetails))
        : null,
      recipientName: data.recipientName ?? null,
      metadata: data.metadata ?? null,
      createdAt: new Date(),
    });
    logSuccessful = true;
    console.log(
      `[EMAIL LOG] ✅ PERSISTIDO - ${data.status.toUpperCase()} - ${data.emailType} a ${data.email}`
    );
  } catch (logErr) {
    console.error('[EMAIL LOG] ❌ ERROR GUARDANDO LOG:', logErr);
    console.error('[EMAIL LOG] Datos que no se pudieron guardar:', {
      email: data.email,
      emailType: data.emailType,
      status: data.status,
    });
  }
  return logSuccessful;
}

// Función auxiliar para guardar logs de credenciales - GARANTIZA persistencia
async function logCredentialsDelivery(data: {
  userId: string;
  usuario: string;
  contrasena: string | null;
  correo: string;
  nota: string;
}) {
  let logSuccessful = false;
  try {
    const result = await db
      .insert(credentialsDeliveryLogs)
      .values({
        userId: data.userId,
        usuario: data.usuario,
        contrasena: data.contrasena,
        correo: data.correo,
        nota: data.nota,
      })
      .returning({ id: credentialsDeliveryLogs.id });

    logSuccessful = true;
    console.log(
      `[CRED LOG] ✅ PERSISTIDO - id: ${result[0]?.id}, usuario: ${data.usuario}, nota: ${data.nota}`
    );
  } catch (logErr) {
    console.error('[CRED LOG] ❌ ERROR GUARDANDO LOG:', logErr);
    console.error('[CRED LOG] Datos que no se pudieron guardar:', {
      userId: data.userId,
      usuario: data.usuario,
      correo: data.correo,
      nota: data.nota,
    });
  }
  return logSuccessful;
}

// Function to generate a random password
function generateRandomPassword(length = 12): string {
  const charset =
    'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}

// API Route Handler
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { userIds: string[] };
    const { userIds } = body;
    const results: Result[] = [];

    for (const userId of userIds) {
      try {
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

        const email =
          clerkUser.emailAddresses.find(
            (addr) => addr.id === clerkUser.primaryEmailAddressId
          )?.emailAddress ?? '';

        if (!email) {
          // Log que no hay email
          await logCredentialsDelivery({
            userId,
            usuario:
              `${clerkUser.firstName ?? ''} ${clerkUser.lastName ?? ''}`.trim(),
            contrasena: null,
            correo: 'desconocido',
            nota: 'error: email no encontrado',
          });

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
            await clerk.users.updateUser(userId, { password });

            await db.insert(userCredentials).values({
              userId,
              password,
              clerkUserId: userId,
              email,
            });
          } catch (credError) {
            const errorMsg =
              credError instanceof Error
                ? credError.message
                : 'Error desconocido';
            console.error(
              `Error creando credenciales para ${userId}:`,
              credError
            );

            // Log del error
            await logCredentialsDelivery({
              userId,
              usuario: username,
              contrasena: password,
              correo: email,
              nota: `error creando credenciales: ${errorMsg}`,
            });

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

        const mailOptions: MailOptions = {
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

        // ✅ Guardar logs
        await logEmail({
          userId,
          email,
          emailType: 'welcome',
          subject: '🎨 Credenciales de Acceso - Artiefy',
          status: 'success',
          recipientName: username,
        });

        await logCredentialsDelivery({
          userId,
          usuario: username,
          contrasena: password,
          correo: email,
          nota: 'exitoso',
        });

        results.push({
          userId,
          status: 'success',
          email,
          message: 'Credenciales enviadas correctamente',
        });
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : 'Error desconocido';
        console.error(`Error procesando usuario ${userId}:`, error);

        // Log básico de error (sin variables que podrían no existir)
        await logEmail({
          userId,
          email: 'sistema@artiefy.com',
          emailType: 'welcome',
          subject: '🎨 Error al enviar Credenciales',
          status: 'failed',
          errorMessage: errorMsg,
          errorDetails: error,
        }).catch((logErr) =>
          console.error('[EMAIL LOG] Error guardando log:', logErr)
        );

        await logCredentialsDelivery({
          userId,
          usuario: `usuario-${userId.substring(0, 8)}`,
          contrasena: null,
          correo: 'error@artiefy.com',
          nota: `error procesando usuario: ${errorMsg}`,
        }).catch((logErr) =>
          console.error('[CRED LOG] Error guardando log:', logErr)
        );

        results.push({
          userId,
          status: 'error',
          message: errorMsg,
        });
      }
    }

    return NextResponse.json({ results });
  } catch (error) {
    const errorMsg =
      error instanceof Error ? error.message : 'Error desconocido';
    console.error('Error en la ruta emailsUsers:', error);

    // Log del error global
    await logEmail({
      email: 'sistema@artiefy.com',
      emailType: 'other',
      subject: 'Error en ruta emailsUsers',
      status: 'failed',
      errorMessage: errorMsg,
      errorDetails: error,
    }).catch((err) => console.error('No se pudo guardar log de error:', err));

    return NextResponse.json(
      { error: 'Error al enviar los correos' },
      { status: 500 }
    );
  }
}
