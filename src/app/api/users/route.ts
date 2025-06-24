// src/app/api/users/route.ts

import { NextResponse } from 'next/server';

import { eq } from 'drizzle-orm';
import nodemailer from 'nodemailer';

import { db } from '~/server/db';
import { userCredentials,users } from '~/server/db/schema';
import {
  createUser,
  getAdminUsers,
  deleteUser,
  setRoleWrapper,
  removeRole,
  updateUserInfo,
  updateUserStatus,
  updateMultipleUserStatus,
} from '~/server/queries/queries';

// 📌 Configuración de Nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'direcciongeneral@artiefy.com',
    pass: process.env.PASS, // ⚠️ Usa variables de entorno en producción
  },
});

// 📌 Función para enviar correo de bienvenida
async function sendWelcomeEmail(
  to: string,
  username: string,
  password: string
) {
  try {
    // Escapar caracteres especiales para HTML
    const safePassword = password
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    console.log('[sendWelcomeEmail] Contraseña original:', password);
    console.log('[sendWelcomeEmail] Contraseña escapada:', safePassword);

    const mailOptions = {
      from: `"Artiefy" <${process.env.EMAIL_USER}>`,
      to,
      subject: '🎨 Bienvenido a Artiefy - Tus Credenciales de Acceso',
      replyTo: 'direcciongeneral@artiefy.com',
      html: `
        <h2>¡Bienvenido a Artiefy, ${username}!</h2>
        <p>Estamos emocionados de tenerte con nosotros. A continuación, encontrarás tus credenciales de acceso:</p>
        <ul>
          <li><strong>Usuario:</strong> ${username}</li>
          <li><strong>Email:</strong> ${to}</li>
          <li><strong>Contraseña:</strong> <code>${safePassword}</code></li>
        </ul>
        <p>Por favor, inicia sesión en <a href="https://artiefy.com/" target="_blank">Artiefy</a> y cambia tu contraseña lo antes posible.</p>
        <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
        <hr>
        <p>Equipo de Artiefy 🎨</p>
      `,
      // Opción de texto plano como respaldo
      text: `
        ¡Bienvenido a Artiefy, ${username}!
        
        Tus credenciales de acceso:
        - Usuario: ${username}
        - Email: ${to}
        - Contraseña: ${password}
        
        Por favor, inicia sesión en https://artiefy.com/ y cambia tu contraseña lo antes posible.
        
        Equipo de Artiefy 🎨
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Correo de bienvenida enviado a ${to}: ${info.messageId}`);
    return { success: true, message: 'Correo enviado correctamente' };
  } catch (error) {
    console.error(`❌ Error al enviar correo de bienvenida a ${to}:`, error);
    return { success: false, message: 'Error al enviar el correo' };
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('search') ?? '';
    const users = await getAdminUsers(query);

    // 🔹 Recuperar el tiempo desde localStorage en el servidor no es posible directamente.
    // 🔹 Lo manejaremos desde el frontend.
    const usersWithTime = users.map((user) => ({
      ...user,
      timeSpent: 0, // El frontend lo llenará
    }));

    return NextResponse.json(usersWithTime);
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'Unknown error' }, { status: 500 });
  }
}

// Add this type near the top of the file
type AllowedRole = 'estudiante' | 'educador' | 'admin' | 'super-admin';

export async function POST(request: Request) {
  try {
    interface RequestBody {
      firstName: string;
      lastName: string;
      email: string;
      role: AllowedRole;
    }

    const body = (await request.json()) as RequestBody;
    console.log('🔍 [POST /api/users] Body recibido:', JSON.stringify(body));

    const { firstName, lastName, email, role } = body;

    // Validar que el rol sea uno de los permitidos
    const allowedRoles: AllowedRole[] = [
      'estudiante',
      'educador',
      'admin',
      'super-admin',
    ];
    if (!allowedRoles.includes(role)) {
      return NextResponse.json(
        {
          error:
            'Rol no válido. Debe ser: estudiante, educador, admin o super-admin',
        },
        { status: 400 }
      );
    }

    // 2. Crear usuario en Clerk
    console.log('🔍 [POST /api/users] Llamando a createUser...');

    const result = await createUser(firstName, lastName, email, role);
    if (!result) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 400 }
      );
    }
    const { user, generatedPassword } = result;

    // 3. Guardar usuario en la base de datos con Drizzle
    console.log('🔍 [POST /api/users] Insertando usuario en BD:', user.id);

    await db
      .insert(users)
      .values({
        id: user.id,
        role: role as 'estudiante' | 'educador' | 'admin' | 'super-admin',
        name: `${firstName} ${lastName}`,
        email:
          user.emailAddresses.find(
            (addr) => addr.id === user.primaryEmailAddressId
          )?.emailAddress ?? email,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [users.email, users.role],
        set: {
          id: user.id,
          name: `${firstName} ${lastName}`,
          updatedAt: new Date(),
        },
      });

    console.log('✅ Usuario guardado en la BD correctamente');
    // 🔹 Enviar correo con credenciales

    // 4. Preparar usuario seguro para la respuesta
    const safeUser = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username ?? 'usuario',
      email: user.emailAddresses.find(
        (addr) => addr.id === user.primaryEmailAddressId
      )?.emailAddress,
      role: user.publicMetadata?.role ?? 'estudiante',
    };

    // Guardar credenciales
    const existingCredentials = await db
      .select()
      .from(userCredentials)
      .where(eq(userCredentials.userId, user.id))
      .limit(1);

    if (existingCredentials.length > 0) {
      // Update existing credentials
      await db
        .update(userCredentials)
        .set({
          password: generatedPassword,
          clerkUserId: user.id,
          email: email,
        })
        .where(eq(userCredentials.userId, user.id));
    } else {
      // Insert new credentials
      await db.insert(userCredentials).values({
        userId: user.id,
        password: generatedPassword,
        clerkUserId: user.id,
        email: email,
      });
    }

    await sendWelcomeEmail(email, safeUser.username, generatedPassword);

    return NextResponse.json({
      user: safeUser,
      generatedPassword,
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Error al registrar usuario:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Unknown error' }, { status: 400 });
  }
}

// DELETE /api/users?id=xxx (para eliminar usuario)
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');
    if (!userId) {
      return NextResponse.json(
        { error: 'Falta el parámetro id' },
        { status: 400 }
      );
    }
    await deleteUser(userId);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Unknown error' }, { status: 400 });
  }
}

// PATCH /api/users (para actualizar algo: rol, nombre, etc.)
export async function PATCH(request: Request) {
  try {
    interface RequestBody {
      action: string;
      id: string;
      role?: string;
      firstName?: string;
      lastName?: string;
      userIds?: string[];
      status?: string;
    }
    const body: RequestBody = (await request.json()) as RequestBody;
    const { action, id, role, firstName, lastName, userIds, status } = body;

    if (action === 'setRole') {
      if (!role) {
        return NextResponse.json(
          { error: 'Role is required' },
          { status: 400 }
        );
      }
      await setRoleWrapper({ id, role });
      return NextResponse.json({ success: true });
    }
    if (action === 'removeRole') {
      const { userIds } = body;
      if (!userIds || !Array.isArray(userIds)) {
        return NextResponse.json(
          { error: 'Faltan userIds o no es un array' },
          { status: 400 }
        );
      }

      for (const userId of userIds) {
        await removeRole(userId);
      }

      return NextResponse.json({ success: true });
    }

    if (action === 'updateUserInfo') {
      if (firstName && lastName) {
        await updateUserInfo(id, firstName, lastName);
        return NextResponse.json({ success: true });
      } else {
        return NextResponse.json(
          { error: 'First name and last name are required' },
          { status: 400 }
        );
      }
    }

    if (action === 'updateStatus') {
      if (typeof status === 'string') {
        await updateUserStatus(id, status);
        return NextResponse.json({ success: true });
      } else {
        return NextResponse.json(
          { error: 'Status is required and must be a string' },
          { status: 400 }
        );
      }
    }

    if (action === 'updateMultipleStatus') {
      if (userIds) {
        if (typeof status === 'string') {
          await updateMultipleUserStatus(userIds, status);
        } else {
          return NextResponse.json(
            { error: 'Status is required and must be a string' },
            { status: 400 }
          );
        }
      } else {
        return NextResponse.json(
          { error: 'userIds is required' },
          { status: 400 }
        );
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Acción desconocida' }, { status: 400 });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Unknown error' }, { status: 400 });
  }
}
