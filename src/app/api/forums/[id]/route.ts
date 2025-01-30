import { NextResponse } from 'next/server';

import { getForumById } from '~/models/educatorsModels/forumAndPosts';

// export async function GET(request: Request) {
//   try {
//     const url = new URL(request.url);
//     const courseId = url.searchParams.get('courseId');

//     if (courseId) {
//       const forum = await getForumById(Number(courseId));
//       return NextResponse.json(forum);
//     }
//   } catch (error) {
//     console.error('Error al obtener el foros:', error);
//     return NextResponse.json(
//       { message: 'Error interno del servidor' },
//       { status: 500 }
//     );
//   }
// }

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const courseId = parseInt(resolvedParams.id);
    if (isNaN(courseId)) {
      return NextResponse.json(
        { error: 'ID de curso inválido' },
        { status: 400 }
      );
    }

    const forum = await getForumById(courseId);
    if (!forum) {
      return NextResponse.json(
        { error: 'Curso no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(forum);
  } catch (error) {
    console.error('Error al obtener el foro:', error);
    return NextResponse.json(
      { error: 'Error al obtener el foro' },
      { status: 500 }
    );
  }
}

// export async function GET(request: Request) {
//   try {
//     const url = new URL(request.url);
//     const courseId = url.searchParams.get('courseId');
//     const forumId = url.searchParams.get('forumId');

//     if (courseId) {
//       const forum = await getForumByCourseId(Number(courseId));
//       return NextResponse.json(forum);
//     } else if (forumId) {
//       const forum = await getForumById(Number(forumId));
//       return NextResponse.json(forum);
//     } else {
//       const allForums = await db.select().from(forums);
//       return NextResponse.json(allForums);
//     }
//   } catch (error) {
//     console.error('Error al obtener los foros:', error);
//     return NextResponse.json(
//       { message: 'Error interno del servidor' },
//       { status: 500 }
//     );
//   }
// }
