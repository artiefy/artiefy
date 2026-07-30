import { NextResponse } from 'next/server';

import { eq } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import nodemailer from 'nodemailer';

import {
  createForum,
  createPost,
  deleteForumById,
  updateForumById,
} from '~/models/educatorsModels/forumAndPosts';
import { db } from '~/server/db';
import { courses, forums, guidedProjects, users } from '~/server/db/schema';
import { uploadMediaToS3 } from '~/server/lib/s3-upload';

export async function POST(req: Request) {
  try {
    console.log('📥 Iniciando POST /api/forums');

    const formData = await req.formData();
    console.log('✅ formData recibido');

    const courseId = formData.get('courseId') as string | null;
    const guidedProjectId = formData.get('guidedProjectId') as string | null;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const userId = formData.get('userId') as string;
    const coverImage = formData.get('coverImage') as File | null;
    const documentFile = formData.get('documentFile') as File | null;

    console.log('📝 Datos recibidos:', {
      courseId,
      guidedProjectId,
      title,
      description,
      userId,
      coverImage,
      documentFile,
    });

    if ((!courseId && !guidedProjectId) || !title || !userId) {
      console.error('❌ Falta algún campo obligatorio');
      return NextResponse.json(
        { message: 'Campos requeridos faltantes' },
        { status: 400 }
      );
    }

    if (courseId && guidedProjectId) {
      return NextResponse.json(
        {
          message:
            'Un foro debe pertenecer a un curso o a un proyecto guiado, no a ambos',
        },
        { status: 400 }
      );
    }

    // Validar que el id del dueño sea un número válido
    const courseIdNum = courseId ? Number(courseId) : null;
    const guidedProjectIdNum = guidedProjectId ? Number(guidedProjectId) : null;
    if (
      (courseIdNum !== null && (isNaN(courseIdNum) || courseIdNum <= 0)) ||
      (guidedProjectIdNum !== null &&
        (isNaN(guidedProjectIdNum) || guidedProjectIdNum <= 0))
    ) {
      console.error('❌ id de propietario inválido:', {
        courseId,
        guidedProjectId,
      });
      return NextResponse.json(
        {
          message:
            'El ID del curso o proyecto guiado debe ser un número válido',
        },
        { status: 400 }
      );
    }

    // Carpeta S3 de referencia para el upload (solo usado para namespacing,
    // uploadMediaToS3 no lo persiste en ningún lado).
    const ownerFolderId = courseIdNum ?? guidedProjectIdNum ?? 0;

    let coverImageKey = '';
    let documentKey = '';

    // Función para guardar un archivo
    if (coverImage?.name) {
      try {
        const uploadResult = await uploadMediaToS3(
          coverImage,
          'image',
          userId,
          ownerFolderId
        );
        coverImageKey = uploadResult.key;
      } catch (uploadError) {
        return NextResponse.json(
          {
            message:
              uploadError instanceof Error
                ? uploadError.message
                : 'No se pudo subir la imagen de portada',
          },
          { status: 400 }
        );
      }
    }

    if (documentFile?.name) {
      // Para documentos PDF/Word, usamos audio como fallback en uploadMediaToS3
      // Mejor crear un caso especial o usar un método más genérico
      try {
        const uploadResult = await uploadMediaToS3(
          documentFile,
          'audio',
          userId,
          ownerFolderId
        );
        documentKey = uploadResult.key;
      } catch {
        // Si falla con audio, intentar subirlo como está
        console.warn('Advertencia: documento no se subió como expected');
      }
    }

    // Crear el foro
    const newForum = await createForum(
      courseIdNum
        ? { courseId: courseIdNum }
        : { guidedProjectId: guidedProjectIdNum! },
      title,
      description,
      userId,
      coverImageKey,
      documentKey
    );
    console.log('✅ Foro creado:', newForum);

    // Crear post inicial real usando el título del foro (para que estudiantes puedan responder)
    try {
      await createPost(newForum.id, userId, title || '');
      console.log('✅ Post inicial creado para el foro');
    } catch (createPostError) {
      console.error(
        '❌ No se pudo crear el post inicial del foro:',
        createPostError
      );
    }

    // Obtener estudiantes inscritos (solo aplica a foros de curso; los
    // foros de proyecto guiado no notifican por correo por ahora)
    const enrolledStudents = courseIdNum
      ? await db.query.enrollments.findMany({
          where: (enrollments, { eq }) => eq(enrollments.courseId, courseIdNum),
          with: { user: true },
        })
      : [];

    const studentEmails = enrolledStudents
      .map((enroll) => enroll.user?.email)
      .filter((email) => email && email !== userId);

    console.log('📧 Estudiantes a notificar:', studentEmails);

    // Enviar correos
    if (studentEmails.length > 0) {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'direcciongeneral@artiefy.com',
          pass: process.env.PASS,
        },
      });

      await transporter.sendMail({
        from: '"Foros Artiefy" <direcciongeneral@artiefy.com>',
        to: studentEmails.join(','),
        subject: `📢 Nuevo foro creado: ${title}`,
        html: `
<div style="font-family: 'Segoe UI', Roboto, sans-serif; background-color: #f7f7f7; padding: 20px;">
  <div style="max-width: 600px; margin: auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
    <div style="background-color: #000; padding: 16px 24px;">
      <h1 style="color: #fff; margin: 0;">🖌️ Foro de Artiefy</h1>
    </div>
    <div style="padding: 24px;">
      <h2 style="color: #333;">¡Nuevo foro creado!</h2>
      <p style="color: #444; font-size: 15px;">Se ha creado un nuevo foro en uno de tus cursos:</p>
      <p style="font-size: 16px;"><strong>📌 Título:</strong> ${title}</p>
      <p style="font-size: 16px;"><strong>📘 Descripción:</strong> ${description}</p>
      <div style="margin: 30px 0;">
        <a href="https://artiefy.com/" style="display: inline-block; padding: 12px 24px; background-color: #22c55e; color: white; font-weight: 600; text-decoration: none; border-radius: 6px;">
          Ir a Artiefy
        </a>
      </div>
      <p style="font-size: 13px; color: #888;">No respondas directamente a este mensaje. Para más información, visita <a href="https://artiefy.com" style="color: #22c55e;">Artiefy</a>.</p>
    </div>
  </div>
</div>
`,
      });
      console.log('📨 Correos enviados con éxito');
    }

    return NextResponse.json(newForum);
  } catch (error) {
    console.error('❌ Error al crear el foro:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor', error: String(error) },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');
    const guidedProjectId = searchParams.get('guidedProjectId');

    const instructorUser = alias(users, 'instructorUser');

    let query = db
      .select({
        id: forums.id,
        title: forums.title,
        description: forums.description,
        coverImageKey: forums.coverImageKey,
        documentKey: forums.documentKey,
        courseId: forums.courseId,
        guidedProjectId: forums.guidedProjectId,
        createdAt: forums.createdAt,
        updatedAt: forums.updatedAt,
        course: {
          id: courses.id,
          title: courses.title,
          descripcion: courses.description,
          coverImageKey: courses.coverImageKey,
        },
        guidedProject: {
          id: guidedProjects.id,
          title: guidedProjects.title,
          coverImageKey: guidedProjects.coverImageKey,
        },
        instructor: {
          id: instructorUser.id,
          name: instructorUser.name,
        },
        user: {
          id: users.id,
          name: users.name,
        },
      })
      .from(forums)
      .leftJoin(courses, eq(forums.courseId, courses.id))
      .leftJoin(guidedProjects, eq(forums.guidedProjectId, guidedProjects.id))
      .leftJoin(users, eq(forums.userId, users.id))
      .leftJoin(instructorUser, eq(courses.instructor, instructorUser.id));

    // Si se proporciona courseId o guidedProjectId, filtrar por ese dueño
    if (courseId) {
      const courseIdNum = Number(courseId);
      if (!isNaN(courseIdNum)) {
        query = query.where(eq(forums.courseId, courseIdNum)) as typeof query;
      }
    } else if (guidedProjectId) {
      const guidedProjectIdNum = Number(guidedProjectId);
      if (!isNaN(guidedProjectIdNum)) {
        query = query.where(
          eq(forums.guidedProjectId, guidedProjectIdNum)
        ) as typeof query;
      }
    }

    const results = await query;

    // Obtener conteo de posts para cada foro
    const forumsWithCounts = await Promise.all(
      results.map(async (forum) => {
        const postCount = await db.query.posts.findMany({
          where: (posts, { eq }) => eq(posts.forumId, forum.id),
        });

        return {
          id: forum.id,
          title: forum.title,
          description: forum.description ?? '',
          coverImageKey: forum.coverImageKey ?? '',
          documentKey: forum.documentKey ?? '',
          courseId: forum.courseId,
          guidedProjectId: forum.guidedProjectId,
          createdAt: forum.createdAt,
          updatedAt: forum.updatedAt,
          course: forum.courseId ? forum.course : null,
          guidedProject: forum.guidedProjectId ? forum.guidedProject : null,
          user: forum.user,
          instructor: forum.instructor,
          _count: {
            posts: postCount.length,
          },
        };
      })
    );

    return NextResponse.json(forumsWithCounts);
  } catch (error) {
    console.error('Error al obtener los foros:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as {
      forumId: string;
      title: string;
      description: string;
    };
    const { forumId, title, description } = body;

    await updateForumById(Number(forumId), title, description);
    return NextResponse.json({ message: 'Foro actualizado exitosamente' });
  } catch (error) {
    console.error('Error al actualizar el foro:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const forumId = url.searchParams.get('id'); // Cambiar 'forumId' a 'id'

    if (forumId) {
      await deleteForumById(Number(forumId));
      return NextResponse.json({ message: 'Foro eliminado exitosamente' });
    } else {
      return NextResponse.json(
        { message: 'Se requiere el ID del foro' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error al eliminar el foro:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
