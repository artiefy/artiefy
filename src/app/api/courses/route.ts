import { type NextRequest, NextResponse } from "next/server";
import { createCourse, deleteCourse, getAllCourses, updateCourse } from "~/models/courseModels";
import { getUserById } from "~/models/userModels";

const respondWithError = (message: string, status: number) =>
  NextResponse.json({ error: message }, { status });

const validateUser = async (userId: string, role: string): Promise<boolean> => {
  const user = await getUserById(userId) as { role: string } | null;
  if (!user || user.role !== role) {
    return false;
  }
  return true;
};

// Obtener todos los cursos
export async function GET(): Promise<NextResponse> {
  try {
    const courses = await getAllCourses();
    return NextResponse.json(courses);
  } catch (error) {
    console.error("Error al obtener los cursos:", error);
    return respondWithError("Error al obtener los cursos", 500);
  }
}

// Crear un nuevo curso
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    type CourseRequestBody = { title: string; description: string; coverImageKey: string; category: string; instructor: string; rating: number; userId: string };
    const body: CourseRequestBody = await request.json() as CourseRequestBody;
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
export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    type UpdateCourseRequestBody = { id: number; title: string; description: string; coverImageKey: string; category: string; instructor: string; rating: number; userId: string };
    const body: UpdateCourseRequestBody = await request.json() as UpdateCourseRequestBody;
    const { id: idString, title, description, coverImageKey, category, instructor, rating, userId } = body;
    const id = Number(idString);

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
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    type DeleteCourseRequestBody = { id: number; userId: string };
    const { id, userId }: DeleteCourseRequestBody = await request.json() as DeleteCourseRequestBody;

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