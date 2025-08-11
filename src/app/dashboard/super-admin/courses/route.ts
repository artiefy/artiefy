import { type NextRequest, NextResponse } from "next/server";

import { auth } from "@clerk/nextjs/server";

import {
  createCourse,
  deleteCourse,
  getAllCourses,
  getCourseById,
  getCoursesByUserId,
  getModalidadById,
  updateCourse,
} from "~/models/super-adminModels/courseModelsSuperAdmin";

// Adjust the import path as necessary
export const dynamic = "force-dynamic";

const respondWithError = (message: string, status: number) =>
  NextResponse.json({ error: message }, { status });

// GET endpoint para obtener cursos
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  try {
    let courses;
    if (userId) {
      courses = await getCoursesByUserId(userId);
    } else {
      courses = await getAllCourses();
    }
    return NextResponse.json(courses);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Error al obtener los cursos" },
      { status: 500 },
    );
  }
}

interface CourseData {
  title: string;
  description: string;
  coverImageKey: string;
  categoryid: number;
  modalidadesid: number;
  nivelid: number;
  instructor: string;
  creatorId: string;
  rating: number;
}

// POST endpoint para crear cursos
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      console.log("Usuario no autorizado");
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // Parsear los datos del cuerpo de la solicitud
    const data = (await request.json()) as CourseData & {
      modalidadesid: number[];
    };
    console.log("Datos recibidos:", data);

    // Validar los datos recibidos
    if (
      !data.title ||
      !data.description ||
      !data.modalidadesid ||
      data.modalidadesid.length === 0
    ) {
      console.log("Datos inválidos:", data);
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }

    const createdCourses = [];

    // Iterar sobre cada modalidadId y crear un curso
    for (const modalidadId of data.modalidadesid) {
      console.log(`Procesando modalidadId: ${modalidadId}`);

      // Obtener la modalidad por ID
      const modalidad = await getModalidadById(modalidadId);
      console.log(
        `Modalidad obtenida para modalidadId ${modalidadId}:`,
        modalidad,
      );

      // Concatenar el nombre de la modalidad al título
      const newTitle = modalidad
        ? `${data.title} - ${modalidad.name}`
        : data.title;
      console.log(
        `Título modificado para modalidadId ${modalidadId}: ${newTitle}`,
      );

      // Crear el curso con el título modificado
      const newCourse = await createCourse({
        ...data,
        title: newTitle, // Usar el título modificado
        modalidadesid: modalidadId, // Asignar el ID de la modalidad actual
      });
      console.log(`Curso creado para modalidadId ${modalidadId}:`, newCourse);

      // Agregar el curso creado a la lista
      createdCourses.push(newCourse);
    }

    console.log("Cursos creados:", createdCourses);

    // Devolver todos los cursos creados
    return NextResponse.json(createdCourses, { status: 201 });
  } catch (error) {
    console.error("Error al crear el curso:", error);
    return NextResponse.json(
      { error: "Error al crear el curso" },
      { status: 500 },
    );
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
      modalidadesid: number;
      nivelid: number;
      instructor: string;
    };
    const {
      id,
      title,
      description,
      coverImageKey,
      modalidadesid,
      nivelid,
      categoryid,
      instructor,
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
      modalidadesid,
      instructor,
      nivelid,
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
    const courseId = searchParams.get("courseId");

    if (!courseId) {
      return NextResponse.json(
        { error: "ID no proporcionado" },
        { status: 400 },
      );
    }

    const parsedCourseId = parseInt(courseId);
    await deleteCourse(parsedCourseId);
    return NextResponse.json({ message: "Curso eliminado exitosamente" });
  } catch (error) {
    console.error("Error al eliminar el curso:", error);
    return NextResponse.json(
      { error: "Error al eliminar el curso" },
      { status: 500 },
    );
  }
}
