import { auth, currentUser } from "@clerk/nextjs/server";
import { type NextRequest, NextResponse } from "next/server";
import {
  createCourse,
  deleteCourse,
  getAllCourses,
  getCourseById,
  getCoursesByUserId,
  updateCourse,
} from "~/models/courseModels";
import { getUserById } from "~/models/userModels";
import { ratelimit } from "~/server/ratelimit/ratelimit";

export const dynamic = "force-dynamic";

const respondWithError = (message: string, status: number) =>
  NextResponse.json({ error: message }, { status });

// GET endpoint para obtener cursos
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    let courses;
    if (userId) {
      courses = await getCoursesByUserId(userId);
    } else {
      courses = await getAllCourses();
    }

    const coursesWithCreators = await Promise.all(
      courses.map(async (course) => {
        const creator = await getUserById(course.creatorId);
        return { ...course, creator };
      }),
    );

    return NextResponse.json(coursesWithCreators);
  } catch (error) {
    console.error("Error al obtener los cursos:", error);
    return respondWithError("Error al obtener los cursos", 500);
  }
}

// POST endpoint para crear cursos
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return respondWithError("No autorizado", 403);
    }

    // Implement rate limiting
    const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";
    const { success } = await ratelimit.limit(ip);
    if (!success) {
      return respondWithError("Demasiadas solicitudes", 429);
    }

    const clerkUser = await currentUser();
    if (!clerkUser) {
      return respondWithError(
        "No se pudo obtener información del usuario",
        500,
      );
    }

    const body = await request.json();
    console.log("Datos recibidos en el servidor:", body);

    const {
      title,
      description,
      coverImageKey,
      categoryid,
      instructor,
      rating,
    } = body;

    await createCourse({
      title,
      description,
      creatorId: userId,
      coverImageKey,
      categoryid,
      instructor,
      rating,
    });

    console.log("Datos enviados al servidor:", {
      title,
      description,
      coverImageKey,
      categoryid,
      instructor,
      rating,
    });

    return NextResponse.json({ message: "Curso creado exitosamente" });
  } catch (error: unknown) {
    console.error("Error al crear el curso:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Error desconocido";
    return respondWithError(`Error al crear el curso: ${errorMessage}`, 500);
  }
}

// Actualizar un curso
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return respondWithError("No autorizado", 403);
    }

    const body = (await request.json()) as {
      id: number;
      title: string;
      description: string;
      coverImageKey: string;
      categoryid: number;
      instructor: string;
      rating: number;
    };
    const {
      id,
      title,
      description,
      coverImageKey,
      categoryid,
      instructor,
      rating,
    } = body;

    const course = await getCourseById(id);
    if (!course) {
      return respondWithError("Curso no encontrado", 404);
    }

    if (course.creatorId !== userId) {
      return respondWithError("No autorizado para actualizar este curso", 403);
    }

    await updateCourse(id, {
      title,
      description,
      coverImageKey,
      categoryid,
      instructor,
      rating,
    });

    return NextResponse.json({ message: "Curso actualizado exitosamente" });
  } catch (error) {
    console.error("Error al actualizar el curso:", error);
    return respondWithError("Error al actualizar el curso", 500);
  }
}

// Eliminar un curso
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "ID no proporcionado" },
        { status: 400 },
      );
    }

    const courseId = parseInt(id);
    await deleteCourse(courseId);
    return NextResponse.json({ message: "Curso eliminado exitosamente" });
  } catch (error) {
    console.error("Error al eliminar el curso:", error);
    return NextResponse.json(
      { error: "Error al eliminar el curso" },
      { status: 500 },
    );
  }
}
