import { type NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import {
  createCourse,
  getAllCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
} from "~/models/courseModels";
import { getUserById, createUser } from "~/models/userModels";

const respondWithError = (message: string, status: number) =>
  NextResponse.json({ error: message }, { status });

// Obtener todos los cursos con datos del creador
export async function GET() {
  try {
    const courses = await getAllCourses();

    const coursesWithCreators = await Promise.all(
      courses.map(async (course) => {
        const creator = await getUserById(course.creatorId);
        return { ...course, creator };
      })
    );

    return NextResponse.json(coursesWithCreators);
  } catch (error) {
    console.error("Error al obtener los cursos:", error);
    return respondWithError("Error al obtener los cursos", 500);
  }
}

// Crear un nuevo curso
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return respondWithError("No autorizado", 403);
    }

    const clerkUser = await currentUser();
    if (!clerkUser) {
      return respondWithError("No se pudo obtener información del usuario", 500);
    }

    const userName: string = clerkUser.fullName ?? clerkUser.firstName ?? "Usuario sin nombre";
    const userEmail: string = clerkUser.emailAddresses[0]?.emailAddress ?? "";

    let existingUser = await getUserById(userId);
    if (!existingUser) {
      await createUser(userId, "profesor", userName, userEmail);
      existingUser = await getUserById(userId);
    }

    if (!existingUser || existingUser.role !== "profesor") {
      return respondWithError("No autorizado para crear cursos", 403);
    }

    const body = await request.json() as {
      title: string;
      description: string;
      coverImageKey: string;
      category: string;
      instructor: string;
      rating: number;
    };
    const { title, description, coverImageKey, category, instructor, rating } = body;

    await createCourse({
      title,
      description,
      creatorId: userId,
      coverImageKey,
      category,
      instructor,
      rating,
    });

    return NextResponse.json({
      message: "Curso creado exitosamente",
      creator: existingUser,
    });
  } catch (error) {
    console.error("Error al crear el curso:", error);
    return respondWithError("Error al crear el curso", 500);
  }
}

// Actualizar un curso
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return respondWithError("No autorizado", 403);
    }

    const body = await request.json() as {
      id: number;
      title: string;
      description: string;
      coverImageKey: string;
      category: string;
      instructor: string;
      rating: number;
    };
    const { id, title, description, coverImageKey, category, instructor, rating } = body;

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
      category,
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
    const { userId } = await auth();
    if (!userId) {
      return respondWithError("No autorizado", 403);
    }

    const body = await request.json() as { id: number };
    const { id } = body;

    const course = await getCourseById(id);
    if (!course) {
      return respondWithError("Curso no encontrado", 404);
    }

    if (course.creatorId !== userId) {
      return respondWithError("No autorizado para eliminar este curso", 403);
    }

    await deleteCourse(id);

    return NextResponse.json({ message: "Curso eliminado exitosamente" });
  } catch (error) {
    console.error("Error al eliminar el curso:", error);
    return respondWithError("Error al eliminar el curso", 500);
  }
}
