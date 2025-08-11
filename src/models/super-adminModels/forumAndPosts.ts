import { eq } from 'drizzle-orm';

import { db } from '../../server/db/index';
import { courses, forums, posts, users } from '../../server/db/schema';

interface Post {
  id: number;
  forumId: number;
  userId: {
    id: string;
    name: string | null;
  };
  content: string;
  createdAt: string | number | Date;
  updatedAt: string | number | Date;
}

interface Foru {
  id: number;
  courseId: {
    id: number;
    title: string | null;
    descripcion: string | null;
    instructor: string | null;
    coverImageKey: string | null;
  };
  title: string;
  description: string;
  userId: {
    id: string;
    name: string;
  };
}

// Crear un nuevo foro para un curso específico
export async function createForum(
  courseId: number,
  title: string,
  description: string,
  userId: string
) {
  const newForum = await db.insert(forums).values({
    courseId,
    title,
    description,
    userId,
  });
  return newForum;
}

// Obtener un foro por su id
export async function getForumById(forumId: number): Promise<Foru | null> {
  try {
    const forumRecord = await db
      .select({
        id: forums.id,
        courseId: forums.courseId,
        title: forums.title,
        description: forums.description,
        userId: forums.userId,
        courseTitle: courses.title,
        courseDescription: courses.description,
        courseInstructor: courses.instructor,
        userName: users.name,
        courseCoverImageKey: courses.coverImageKey,
      })
      .from(forums)
      .leftJoin(courses, eq(forums.courseId, courses.id)) // Unir con la tabla de cursos
      .leftJoin(users, eq(forums.userId, users.id)) // Unir con la tabla de usuarios
      .where(eq(forums.id, forumId));

    if (forumRecord.length === 0) return null;

    const forum = forumRecord[0];
    if (!forum) {
      return null;
    }

    return {
      id: forum.id,
      courseId: {
        id: forum.courseId,
        title: forum.courseTitle,
        descripcion: forum.courseDescription,
        instructor: forum.courseInstructor,
        coverImageKey: forum.courseCoverImageKey,
      },
      userId: {
        id: forum.userId,
        name: forum.userName ?? '',
      },
      title: forum.title,
      description: forum.description ?? '',
    };
  } catch (error: unknown) {
    console.error(error);
    return null;
  }
}

//obtener foro por id de curso
export async function getForumByCourseId(courseId: number) {
  try {
    const forum = await db
      .select({
        id: forums.id,
        courseId: forums.courseId,
        title: forums.title,
        description: forums.description,
        userId: forums.userId,
        courseTitle: courses.title,
        courseDescription: courses.description,
        courseInstructor: courses.instructor,
        courseCoverImageKey: courses.coverImageKey,
        userName: users.name, // Unir con la tabla de usuarios para obtener el nombre del usuario
      })
      .from(forums)
      .leftJoin(courses, eq(forums.courseId, courses.id)) // Unir con la tabla de cursos
      .leftJoin(users, eq(forums.userId, users.id)) // Unir con la tabla de usuarios
      .where(eq(forums.courseId, courseId));

    if (!forum) {
      throw new Error('Foro no encontrado');
    }

    if (forum.length === 0) {
      throw new Error('Foro no encontrado');
    }

    const forumData = forum[0];
    if (!forumData) {
      throw new Error('Foro no encontrado');
    }

    return {
      id: forumData.id,
      courseId: {
        id: forumData.courseId,
        title: forumData.courseTitle,
        description: forumData.courseDescription,
        instructor: forumData.courseInstructor,
        coverImageKey: forumData.courseCoverImageKey,
      },
      title: forumData.title,
      description: forumData.description ?? '',
      userId: {
        id: forumData.userId,
        name: forumData.userName ?? '', // Manejar el caso en que el nombre del usuario sea nulo
      },
    };
  } catch (error: unknown) {
    console.error(error);
    return null;
  }
}

// Obtener foros por id de usuario
export async function getForumByUserId(userId: string) {
  try {
    const forumsRecords = await db
      .select({
        id: forums.id,
        courseId: forums.courseId,
        title: forums.title,
        description: forums.description,
        userId: forums.userId,
        courseTitle: courses.title,
        courseDescription: courses.description,
        courseInstructor: courses.instructor,
        courseCoverImageKey: courses.coverImageKey,
        userName: users.name,
      })
      .from(forums)
      .leftJoin(courses, eq(forums.courseId, courses.id)) // Unir con la tabla de cursos
      .leftJoin(users, eq(forums.userId, users.id)) // Unir con la tabla de usuarios
      .where(eq(forums.userId, userId));

    return forumsRecords.map((forum) => ({
      id: forum.id,
      courseId: {
        id: forum.courseId,
        title: forum.courseTitle,
        descripcion: forum.courseDescription,
        instructor: forum.courseInstructor,
        coverImageKey: forum.courseCoverImageKey,
      },
      userId: {
        id: forum.userId,
        name: forum.userName ?? '',
      },
      title: forum.title,
      description: forum.description ?? '',
    }));
  } catch (error: unknown) {
    console.error(error);
    return [];
  }
}

//delete forum by id
export async function deleteForumById(forumId: number) {
  // Primero elimina los registros relacionados en la tabla 'posts'
  await db.delete(posts).where(eq(posts.forumId, forumId));
  // Luego elimina el foro
  await db.delete(forums).where(eq(forums.id, forumId));
}

//delete forum by course id
export async function deleteForumByCourseId(courseId: number) {
  await db.delete(posts).where(eq(posts.forumId, courseId));
  await db.delete(forums).where(eq(forums.courseId, courseId));
}

//update forum by id
export async function updateForumById(
  forumId: number,
  title: string,
  description: string
) {
  await db
    .update(forums)
    .set({ title, description })
    .where(eq(forums.id, forumId));
}

//create post
export async function createPost(
  forumId: number,
  userId: string,
  content: string
) {
  const nuevoPost = await db.insert(posts).values({
    forumId,
    userId,
    content,
  }); // Devuelve todos los datos del post recién creado

  return nuevoPost;
}

// Obtener todos los posts de un foro específico
export async function getPostsByForo(forumId: number): Promise<Post[]> {
  try {
    const postRecords = await db
      .select({
        id: posts.id,
        forumId: posts.forumId,
        userId: posts.userId,
        content: posts.content,
        createdAt: posts.createdAt,
        updatedAt: posts.updatedAt,
        userName: users.name, // Seleccionar el nombre del usuario
      })
      .from(posts)
      .leftJoin(users, eq(posts.userId, users.id)) // Unir con la tabla de usuarios
      .where(eq(posts.forumId, forumId));

    const typedPosts: Post[] = postRecords.map((post) => ({
      id: post.id,
      forumId: post.forumId,
      userId: {
        id: post.userId,
        name: post.userName,
      },
      content: post.content,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    }));

    return typedPosts;
  } catch (error: unknown) {
    console.error(error);
    return [];
  }
}
