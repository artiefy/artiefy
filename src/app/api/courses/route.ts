import { type NextRequest, NextResponse } from "next/server";
import { createCourse, deleteCourse, getAllCourses, updateCourse } from "~/models/courseModels";
import { getUserById } from "~/models/userModels";
import { CourseModel, CourseFormProps } from "~/types";

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
    const courses: CourseModel[] = await getAllCourses();
    return NextResponse.json(courses);
  } catch (error) {
    console.error("Error al obtener los cursos:", error);
    return respondWithError("Error al obtener los cursos", 500);
  }
}

// Crear un nuevo curso
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as CourseFormProps;
    const { title, description, coverImageKey, category, instructor, rating, userId } = body;

    const isValidUser = await validateUser(userId, "profesor");
    if (!isValidUser) {
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
    const body: CourseFormProps = await request.json();
    const { id, title, description, coverImageKey, category, instructor, rating, userId } = body;

    const isValidUser = await validateUser(userId, "profesor");
    if (!isValidUser) {
      return respondWithError("No autorizado", 403);
    }

    await updateCourse(id, { title, description, coverImageKey, category, instructor, rating });

    return NextResponse.json({ message: "Curso actualizado exitosamente" });
  } catch (error) {
    console.error("Error al actualizar el curso:", error);
    return respondWithError("Error al actualizar el curso", 500);
  }
}

// Eliminar un curso
export async function DELETE(request: NextRequest) {
  try {
    const { id, userId } = await request.json();

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
