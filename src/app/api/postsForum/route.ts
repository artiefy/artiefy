import { NextResponse } from 'next/server';
import {
  getPostsByForo,
  createPost,
} from '~/models/educatorsModels/forumAndPosts';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const forumId = url.searchParams.get('forumId');

    if (forumId) {
      const posts = await getPostsByForo(Number(forumId));
      return NextResponse.json(posts);
    } else {
      return NextResponse.json(
        { message: 'Se requiere el ID del foro' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error al obtener los posts:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      forumId: string;
      title: string;
      content: string;
      author: string;
    };
    const { forumId, title, content, author } = body;

    const newPost = await createPost(Number(forumId), title, content, author);
    return NextResponse.json(newPost);
  } catch (error) {
    console.error('Error al crear el post:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
