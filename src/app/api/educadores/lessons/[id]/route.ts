import { type NextRequest, NextResponse } from "next/server";
import { getLessonById } from "~/models/educatorsModels/lessonsModels";

const respondWithError = (message: string, status: number) =>
  NextResponse.json({ error: message }, { status });

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lessonId = searchParams.get("lessonId");
  const courseId = searchParams.get("courseId");

  try {
    if (lessonId) {
      const lesson = await getLessonById(Number(lessonId));
      if (!lesson) {
        return respondWithError("Lección no encontrada", 404);
      }
      return NextResponse.json(lesson);
    } else {
      return respondWithError(
        "Se requiere el ID de la lección o del curso",
        400,
      );
    }
  } catch (error) {
    console.error("Error:", error);
    return respondWithError("Error al obtener las lecciones", 500);
  }
}

// export async function PUT(
//   request: Request,
//   { params }: { params: Promise<{ id: string }> },
// ) {
//   try {
//     const { userId } = await auth();
//     if (!userId) {
//       return NextResponse.json({ error: "No autorizado" }, { status: 403 });
//     }

//     const resolvedParams = await params;
//     const lessonsId = parseInt(resolvedParams.id);
//     const data = await request.json();

//     await updateLesson(lessonsId, {
//       title: data.title,
//       description: data.description,
//       coverImageKey: data.coverImageKey,
//       categoryid: data.categoryId,
//       instructor: data.instructor,
//       modalidadesid: data.modalidadesid,
//     });

//     // Obtener el curso actualizado
//     const updatedCourse = await getLessonsByCourseId(lessonsId);
//     return NextResponse.json(updatedCourse);
//   } catch (error) {
//     console.error("Error al actualizar el curso:", error);
//     return NextResponse.json(
//       { error: "Error al actualizar el curso" },
//       { status: 500 },
//     );
//   }
// }
