import { type NextRequest, NextResponse } from 'next/server';

import { auth, currentUser } from '@clerk/nextjs/server';
import { eq, inArray } from 'drizzle-orm';
import nodemailer from 'nodemailer';

import {
  deletePostById,
  getPostById,
  getPostsByForo,
} from '~/models/educatorsModels/forumAndPosts';
import { db } from '~/server/db';
import { enrollments, forums, posts, users } from '~/server/db/schema';
import { deleteMediaFromS3, uploadMediaToS3 } from '~/server/lib/s3-upload';
import { ratelimit } from '~/server/ratelimit/ratelimit';

const respondWithError = (message: string, status: number) =>
  NextResponse.json({ error: message }, { status });

// GET endpoint para obtener posts por foro
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const foroId = searchParams.get('foroId');

  try {
    const posts = foroId ? await getPostsByForo(Number(foroId)) : [];
    return NextResponse.json(posts);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Error al obtener los posts' },
      { status: 500 }
    );
  }
}

// POST endpoint para crear posts
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return respondWithError('No autorizado', 403);
    }

    // Implement rate limiting
    const ip = request.headers.get('x-forwarded-for') ?? '127.0.0.1';
    const { success } = await ratelimit.limit(ip);
    if (!success) {
      return respondWithError('Demasiadas solicitudes', 429);
    }

    const clerkUser = await currentUser();
    if (!clerkUser) {
      return respondWithError(
        'No se pudo obtener información del usuario',
        500
      );
    }

    const contentType = request.headers.get('content-type') ?? '';
    let content: string = '';
    let foroId: number = 0;
    let imageKey: string | null = null;
    let audioKey: string | null = null;
    let videoKey: string | null = null;

    // Verificar si es multipart (con archivos) o JSON
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      content = (formData.get('content') as string) || '';
      foroId = Number(formData.get('foroId') as string) || 0;

      const image = formData.get('image') as File | null;
      const audio = formData.get('audio') as File | null;
      const video = formData.get('video') as File | null;

      // Subir archivos a S3
      if (image) {
        try {
          const result = await uploadMediaToS3(image, 'image', userId, foroId);
          imageKey = result.key;
        } catch (error) {
          console.error('Error subiendo imagen:', error);
          return respondWithError(
            `Error subiendo imagen: ${error instanceof Error ? error.message : 'desconocido'}`,
            400
          );
        }
      }

      if (audio) {
        try {
          const result = await uploadMediaToS3(audio, 'audio', userId, foroId);
          audioKey = result.key;
        } catch (error) {
          console.error('Error subiendo audio:', error);
          return respondWithError(
            `Error subiendo audio: ${error instanceof Error ? error.message : 'desconocido'}`,
            400
          );
        }
      }

      if (video) {
        try {
          const result = await uploadMediaToS3(video, 'video', userId, foroId);
          videoKey = result.key;
        } catch (error) {
          console.error('Error subiendo video:', error);
          return respondWithError(
            `Error subiendo video: ${error instanceof Error ? error.message : 'desconocido'}`,
            400
          );
        }
      }
    } else {
      // Es JSON
      const body = (await request.json()) as {
        content: string;
        foroId: number;
        userId: string;
      };
      content = body.content;
      foroId = body.foroId;
    }

    if (!content || !foroId) {
      return respondWithError('El contenido y foroId son obligatorios', 400);
    }

    console.log('[FORO][POST] ✅ Post creado:', {
      foroId,
      userId,
      hasImage: !!imageKey,
      hasAudio: !!audioKey,
      hasVideo: !!videoKey,
    });

    try {
      // 1. Obtener el foro para acceder al courseId y userId del instructor
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
        console.warn('[FORO][POST] ⚠️ Foro no encontrado.');
        return NextResponse.json({
          message: 'Post creado, pero foro no encontrado',
        });
      }
      console.log('[FORO][POST] 🧩 Foro obtenido:', foro);

      // 2. Obtener userIds de estudiantes inscritos en ese curso
      const enrollmentResults = await db
        .select({ userId: enrollments.userId })
        .from(enrollments)
        .where(eq(enrollments.courseId, foro.courseId))
        .execute();

      const enrolledUserIds = enrollmentResults.map((e) => e.userId);
      console.log('[FORO][POST] 🧑‍🎓 Estudiantes inscritos:', enrolledUserIds);

      // 3. Obtener correos de esos userIds
      const usersResult = await db
        .select({
          id: users.id,
          email: users.email,
        })
        .from(users)
        .where(inArray(users.id, enrolledUserIds))
        .execute();
      console.log(
        '[FORO][POST] 🧾 Correos recuperados de usuarios:',
        usersResult
      );

      const senderEmail = clerkUser.emailAddresses[0]?.emailAddress ?? '';
      const senderRole = clerkUser.publicMetadata?.role;
      console.log('[FORO][POST] ✍️ Usuario que crea el post:', {
        email: senderEmail,
        role: senderRole,
      });

      const recipients = new Set<string>();

      if (senderRole === 'admin' || senderRole === 'educador') {
        // 4A. Si es educador, notificar a estudiantes inscritos
        for (const student of usersResult) {
          console.log('[FORO][POST] Verificando correo:', {
            studentEmail: student.email,
            senderEmail,
            match: student.email !== senderEmail,
          });
          if (student.email && student.email !== senderEmail) {
            recipients.add(student.email);
          }
        }
      } else {
        // 4B. Si no es educador (estudiante, admin, etc), notificar al instructor
        const instructorResult = await db
          .select({
            id: users.id,
            email: users.email,
          })
          .from(users)
          .where(eq(users.id, foro.instructorId))
          .execute();

        const instructor = instructorResult[0];
        if (instructor?.email && instructor.email !== senderEmail) {
          recipients.add(instructor.email);
        }
      }

      console.log('[FORO][POST] 📬 Correos a notificar:', [...recipients]);

      // 5. Enviar correos si hay destinatarios
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
          subject: `📝 Nuevo post en el foro: ${foro.title}`,
          html: `
  <div style="font-family: 'Segoe UI', Roboto, sans-serif; background-color: #f7f7f7; padding: 20px;">
    <div style="max-width: 600px; margin: auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
      <div style="background-color: #000; padding: 16px 24px;">
        <h1 style="color: #fff; margin: 0;">💬 Nuevo mensaje en el foro</h1>
      </div>
      <div style="padding: 24px;">
        <h2 style="color: #333;">📌 Foro: <strong>${foro.title}</strong></h2>
        <p style="color: #444; font-size: 15px; margin-bottom: 20px;">
          <strong>${clerkUser.fullName}</strong> escribió:
        </p>
        <blockquote style="border-left: 4px solid #22c55e; margin: 0 0 20px 0; padding-left: 16px; color: #222; font-size: 15px;">
          ${content}
        </blockquote>

        <div style="margin: 30px 0;">
          <a href="https://artiefy.com/dashboard/educadores/foro/${foro.id}" style="display: inline-block; padding: 12px 24px; background-color: #22c55e; color: white; font-weight: 600; text-decoration: none; border-radius: 6px;">
            Ver en Artiefy
          </a>
        </div>

        <p style="font-size: 13px; color: #888;">No respondas directamente a este mensaje. Para más información, visita <a href="https://artiefy.com" style="color: #22c55e;">artiefy.com</a>.</p>
      </div>
    </div>
  </div>
`,
        });
        console.log('[FORO][POST] ✅ Correos enviados exitosamente.');
      } else {
        console.log('[FORO][POST] ⚠️ No hay destinatarios para el correo.');
      }
    } catch (err) {
      console.error(
        '[FORO][POST] ❌ Error en lógica de envío de correos:',
        err
      );
    }

    console.log('Datos enviados al servidor:', {
      content,
      userId,
      foroId,
    });

    // Guardar el post en la BD
    try {
      const result = await db
        .insert(posts)
        .values({
          forumId: foroId,
          userId,
          content,
          imageKey: imageKey || null,
          audioKey: audioKey || null,
          videoKey: videoKey || null,
        })
        .returning();
      console.log('[FORO][POST] 💾 Post insertado en BD:', result[0]);
    } catch (insertError) {
      console.error(
        '[FORO][POST] ❌ Error insertando post en BD:',
        insertError
      );
      return respondWithError(
        `Error guardando post: ${insertError instanceof Error ? insertError.message : 'desconocido'}`,
        500
      );
    }

    return NextResponse.json({ message: 'Post creado exitosamente' });
  } catch (error: unknown) {
    console.error('Error al crear el post:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Error desconocido';
    return respondWithError(`Error al crear el post: ${errorMessage}`, 500);
  }
}

// Eliminar un post
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return respondWithError('No autorizado', 403);
    }

    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('postId');

    if (!postId) {
      return respondWithError('ID no proporcionado', 400);
    }

    const parsedPostId = parseInt(postId);
    const post = await getPostById(parsedPostId);
    if (!post) {
      return respondWithError('Post no encontrado', 404);
    }

    if (post.userId !== userId) {
      return respondWithError('No autorizado para eliminar este post', 403);
    }

    // Eliminar archivos de S3 si existen
    if (post.imageKey) {
      try {
        await deleteMediaFromS3(post.imageKey);
      } catch (error) {
        console.error('Error al eliminar imagen:', error);
      }
    }
    if (post.audioKey) {
      try {
        await deleteMediaFromS3(post.audioKey);
      } catch (error) {
        console.error('Error al eliminar audio:', error);
      }
    }
    if (post.videoKey) {
      try {
        await deleteMediaFromS3(post.videoKey);
      } catch (error) {
        console.error('Error al eliminar video:', error);
      }
    }

    await deletePostById(parsedPostId);
    return NextResponse.json({ message: 'Post eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar el post:', error);
    return respondWithError('Error al eliminar el post', 500);
  }
}
