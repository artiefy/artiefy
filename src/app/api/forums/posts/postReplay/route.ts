import { type NextRequest, NextResponse } from 'next/server';

import { auth, clerkClient, currentUser } from '@clerk/nextjs/server';
import { eq, inArray } from 'drizzle-orm';
import nodemailer from 'nodemailer';

import {
  createPost,
  createPostReply,
  deletePostReplyById,
  getPostById,
  getPostRepliesByPostId,
  getPostReplyById,
  getPostsByForo,
  updatePostReplyById,
} from '~/models/educatorsModels/forumAndPosts';
import { db } from '~/server/db';
import { enrollments, forums, users } from '~/server/db/schema';

const respondWithError = (message: string, status: number) =>
  NextResponse.json({ error: message }, { status });

// GET replies
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const postIds = searchParams.get('postIds');
  if (!postIds) return respondWithError('IDs de posts no proporcionados', 400);

  try {
    const idsArray = postIds.split(',').map(Number);
    const replies = await Promise.all(
      idsArray.map((id) => getPostRepliesByPostId(id))
    );
    const allReplies = replies.flat();

    // Obtener roles de Clerk para cada usuario
    const repliesWithRoles = await Promise.all(
      allReplies.map(async (reply) => {
        try {
          const client = await clerkClient();
          const user = await client.users.getUser(reply.userId.id);
          const existingRole = (reply.userId as { role?: string }).role;
          const role =
            (user?.publicMetadata?.role as string) ??
            existingRole ??
            'estudiante';
          return {
            ...reply,
            userId: {
              ...reply.userId,
              role,
            },
          };
        } catch {
          return {
            ...reply,
            userId: {
              ...reply.userId,
              role: (reply.userId as { role?: string }).role ?? 'estudiante',
            },
          };
        }
      })
    );

    return NextResponse.json(repliesWithRoles);
  } catch (error) {
    console.error('Error al obtener respuestas:', error);
    return respondWithError('Error al obtener respuestas', 500);
  }
}

// POST nueva respuesta
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return respondWithError('No autorizado', 403);

    const clerkUser = await currentUser();
    if (!clerkUser) return respondWithError('Usuario no encontrado', 500);

    const body = (await request.json()) as {
      content: string;
      postId: number;
      userId: string;
      imageKey?: string;
    };

    const { content, postId, imageKey } = body;

    // Si el postId es negativo, significa que viene del pseudo-post inicial del foro
    let targetPostId = postId;
    if (postId < 0) {
      const forumId = Math.abs(postId);

      // Buscar foro
      const foroResult = await db
        .select({
          id: forums.id,
          title: forums.title,
          description: forums.description,
          userId: forums.userId,
        })
        .from(forums)
        .where(eq(forums.id, forumId))
        .execute();

      const foro = foroResult[0];
      if (!foro) return respondWithError('Foro no encontrado', 404);

      // Reusar un post existente si ya hay posts reales
      const existingPosts = await getPostsByForo(forumId);
      if (existingPosts.length > 0) {
        targetPostId = existingPosts[0].id;
      } else {
        // Crear un post real con el título o descripción del foro, asignado al creador del foro
        const seedContent = foro.title || foro.description || '';
        const basePost = await createPost(forumId, foro.userId, seedContent);
        targetPostId = basePost.id;
      }
    }

    await createPostReply(targetPostId, userId, content, imageKey ?? null);

    console.log('[FORO][REPLY] ✅ Respuesta creada:', {
      postId,
      userId,
      content,
      imageKey,
    });

    try {
      const post = await getPostById(targetPostId);
      if (!post || typeof post.forumId !== 'number') {
        console.error('[FORO][REPLY] ❌ Post inválido o sin forumId:', post);
        return respondWithError('Post o forumId no válido', 400);
      }

      const foroId = post.forumId; // 👈 este es el nombre correcto según el objeto que recibiste

      // Obtener foro
      const foroResult = await db
        .select({
          id: forums.id,
          title: forums.title,
          courseId: forums.courseId,
          instructorId: forums.userId,
        })
        .from(forums)
        .where(eq(forums.id, foroId))
        .execute();

      const foro = foroResult[0];
      if (!foro) {
        console.warn('[FORO][REPLY] ⚠️ Foro no encontrado.');
        return NextResponse.json({
          message: 'Respuesta creada, pero foro no encontrado',
        });
      }
      console.log('[FORO][REPLY] 🧩 Foro obtenido:', foro);

      const enrollmentResults = await db
        .select({ userId: enrollments.userId })
        .from(enrollments)
        .where(eq(enrollments.courseId, foro.courseId))
        .execute();

      const enrolledUserIds = enrollmentResults.map((e) => e.userId);
      const usersResult = await db
        .select({ id: users.id, email: users.email })
        .from(users)
        .where(inArray(users.id, enrolledUserIds))
        .execute();

      const senderEmail = clerkUser.emailAddresses[0]?.emailAddress ?? '';
      const senderRole = clerkUser.publicMetadata?.role;
      console.log('[FORO][REPLY] ✍️ Quien responde:', {
        senderEmail,
        senderRole,
      });

      const recipients = new Set<string>();

      if (senderRole === 'educador') {
        for (const student of usersResult) {
          if (student.email && student.email !== senderEmail) {
            recipients.add(student.email);
          }
        }
      } else {
        const instructorResult = await db
          .select({ id: users.id, email: users.email })
          .from(users)
          .where(eq(users.id, foro.instructorId))
          .execute();

        const instructor = instructorResult[0];
        if (instructor?.email && instructor.email !== senderEmail) {
          recipients.add(instructor.email);
        }
      }

      console.log('[FORO][REPLY] 📬 Correos a notificar:', [...recipients]);

      if (recipients.size > 0) {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: 'direcciongeneral@artiefy.com',
            pass: process.env.PASS,
          },
        });

        await transporter.sendMail({
          from: '"Artiefy Foros" <direcciongeneral@artiefy.com>',
          to: Array.from(recipients).join(','),
          subject: `💬 Nueva respuesta en el foro: ${foro.title}`,
          html: `
  <div style="font-family: 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6; padding: 30px;">
    <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 10px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); overflow: hidden;">
      <div style="background-color: #111827; padding: 20px 30px;">
        <h1 style="color: #ffffff; font-size: 22px; margin: 0;">💬 Nueva respuesta en el foro</h1>
      </div>
      <div style="padding: 30px;">
        <h2 style="color: #1f2937; font-size: 18px; margin-bottom: 10px;">
          📌 Foro: <strong>${foro.title}</strong>
        </h2>

        <p style="color: #4b5563; font-size: 15px; margin-bottom: 20px;">
          <strong style="color: #111827;">${clerkUser.fullName}</strong> respondió a la pregunta:
        </p>

        <div style="background-color: #f3f4f6; border-left: 4px solid #6366f1; padding: 12px 18px; margin-bottom: 20px; color: #374151; font-style: italic;">
          ${post.content}
        </div>

        <p style="color: #4b5563; font-size: 15px; margin-bottom: 10px;">
          Su respuesta fue:
        </p>

        <div style="background-color: #f9fafb; border-left: 4px solid #22c55e; padding: 16px 20px; margin-bottom: 30px; color: #1f2937; font-size: 15px; line-height: 1.6;">
          ${content}
        </div>

        <a href="https://artiefy.com/dashboard/educadores/foro/${foro.id}" 
           style="display: inline-block; background-color: #22c55e; color: white; padding: 12px 20px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px;">
          Ver en Artiefy
        </a>

        <p style="margin-top: 30px; font-size: 12px; color: #9ca3af;">
          No respondas directamente a este mensaje. Para más información, visita 
          <a href="https://artiefy.com" style="color: #22c55e; text-decoration: none;">artiefy.com</a>.
        </p>
      </div>
    </div>
  </div>
`,
        });
        console.log('[FORO][REPLY] ✅ Correos enviados exitosamente.');
      } else {
        console.log('[FORO][REPLY] ⚠️ No hay destinatarios para notificar.');
      }
    } catch (err) {
      console.error('[FORO][REPLY] ❌ Error al enviar correo:', err);
    }

    return NextResponse.json({ message: 'Respuesta creada exitosamente' });
  } catch (error) {
    console.error('Error al crear respuesta:', error);
    return respondWithError('Error al crear respuesta', 500);
  }
}

// PUT actualizar respuesta
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return respondWithError('No autorizado', 403);

    const { id, content } = (await request.json()) as {
      id: number;
      content: string;
    };

    const reply = await getPostReplyById(id);
    if (!reply) return respondWithError('Respuesta no encontrada', 404);
    if (reply.userId !== userId) return respondWithError('No autorizado', 403);

    await updatePostReplyById(id, content);
    return NextResponse.json({ message: 'Respuesta actualizada' });
  } catch (error) {
    console.error('Error actualizando respuesta:', error);
    return respondWithError('Error actualizando respuesta', 500);
  }
}

// DELETE eliminar respuesta
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return respondWithError('No autorizado', 403);

    const replyId = new URL(request.url).searchParams.get('replyId');
    if (!replyId) return respondWithError('ID no proporcionado', 400);

    const parsedId = parseInt(replyId);
    const reply = await getPostReplyById(parsedId);
    if (!reply) return respondWithError('Respuesta no encontrada', 404);
    if (reply.userId !== userId) return respondWithError('No autorizado', 403);

    await deletePostReplyById(parsedId);
    return NextResponse.json({ message: 'Respuesta eliminada' });
  } catch (error) {
    console.error('Error eliminando respuesta:', error);
    return respondWithError('Error eliminando respuesta', 500);
  }
}
