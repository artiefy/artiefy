import { type NextRequest, NextResponse } from "next/server";
import { createCourse, deleteCourse, getAllCourses, updateCourse } from "~/models/courseModels";
import { getUserById, createUser } from "~/models/userModels";
import { auth } from "@clerk/nextjs/server";

const respondWithError = (message: string, status: number) =>
  NextResponse.json({ error: message }, { status });

const validateUser = async (userId: string, role: string) => {
  const user = await getUserById(userId);
  if (!user || user.role !== role) {
    return false;
  }
  return true;
};

// Obtener todos los cursos
export async function GET() {
  try {
    const courses = await getAllCourses();
    return NextResponse.json(courses);
  } catch (error) {
    console.error("Error al obtener los cursos:", error);
    return respondWithError("Error al obtener los cursos", 500);
  }
}

// Crear un nuevo curso
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    const user = await auth();
    if (!userId || !user) {
      return respondWithError("No autorizado", 403);
    }

    type CourseRequestBody = {
      title: string;
      description: string;
      coverImageKey: string;
      category: string;
      instructor: string;
      rating: number;
    };

    const body: CourseRequestBody = await request.json() as CourseRequestBody;
    const { title, description, coverImageKey, category, instructor, rating } = body;

    // Check if the user exists, if not, create the user
    let existingUser = await getUserById(userId);
    if (!existingUser) {
      await createUser({
        id: userId,
        role: "profesor",
        name: user.fullName,
        email: user.primaryEmailAddress?.emailAddress ?? "",
      });
      existingUser = await getUserById(userId);
    }

    if (!existingUser || existingUser.role !== "profesor") {
      return respondWithError("No autorizado", 403);
    }

    await createCourse({
      title,
      description,
      creatorId: userId,
      coverImageKey,
      category,
      instructor,
      rating,
    });

    return NextResponse.json({ message: "Curso creado exitosamente" });
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

    const body = await request.json() as { id: number, title: string, description: string, coverImageKey: string, category: string, instructor: string, rating: number };
    const { id, title, description, coverImageKey, category, instructor, rating } = body;

    const isValidUser = await validateUser(userId, "profesor");
    if (!isValidUser) {
      return respondWithError("No autorizado", 403);
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

    const { id }: { id: number } = await request.json() as { id: number };

    const isValidUser = await validateUser(userId, "profesor");
    if (!isValidUser) {
      return respondWithError("No autorizado", 403);
    }

    await deleteCourse(id);

    return NextResponse.json({ message: "Curso eliminado exitosamente" });
  } catch (error) {
    console.error("Error al eliminar el curso:", error);
    return respondWithError("Error al eliminar el curso", 500);
  }
}