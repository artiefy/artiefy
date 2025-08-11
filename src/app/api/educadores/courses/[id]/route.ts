import { NextResponse } from 'next/server';

import { auth } from '@clerk/nextjs/server';
import { and, eq, ne as neq } from 'drizzle-orm';

import {
  createCourse,
  deleteCourse,
  getAllCourses,
  getCourseById,
  getModalidadById,
  updateCourse,
} from '~/models/educatorsModels/courseModelsEducator';
import { db } from '~/server/db';
import {
  classMeetings,
  courseCourseTypes,
  courses,
  courseTypes,
  materias,
} from '~/server/db/schema';

// Agregamos una interfaz para el cuerpo de la solicitud PUT

interface VideoData {
  videos: {
    meetingId: string;
    videoUrl: string;
  }[];
}

interface PutRequestBody {
  title?: string;
  description?: string;
  coverImageKey?: string;
  coverVideoCourseKey?: string;
  categoryid?: number;
  modalidadesid?: number;
  nivelid?: number;
  instructorId?: string; // Changed from instructor to instructorId
  rating?: number;
  courseTypeId?: number | null;
  isActive?: boolean;
  subjects?: { id: number }[];
  individualPrice?: number | null;
}

export async function getCourseByIdWithTypes(courseId: number) {
  console.log('📘 Buscando curso con ID:', courseId);

  const course = await db
    .select()
    .from(courses)
    .where(eq(courses.id, courseId))
    .then((res) => res[0]);

  console.log('✅ Curso obtenido:', course);

  const meetings = await db
    .select()
    .from(classMeetings)
    .where(eq(classMeetings.courseId, courseId));

  console.log('📅 Reuniones encontradas:', meetings);

  // 🔗 Consultar videos desde el endpoint que acabamos de crear
  console.log('🎥 Haciendo fetch de videos...');
  const videoRes = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/super-admin/teams/video?userId=0843f2fa-3e0b-493f-8bb9-84b0aa1b2417`
  );

  const videoData = (await videoRes.json()) as VideoData;
  console.log('📦 Datos de video recibidos:', videoData);

  const videos = videoData?.videos ?? [];
  console.log('🎬 Lista de videos extraída:', videos);

  const meetingsWithVideo = meetings.map((meeting) => {
    const match = videos.find((v) =>
      decodeURIComponent(meeting.joinUrl ?? '').includes(v.meetingId)
    );

    console.log(`🔍 Buscando video para reunión ${meeting.id}:`, {
      joinUrl: meeting.joinUrl,
      videoMatch: match,
    });

    return {
      ...meeting,
      videoUrl: match?.videoUrl ?? null,
    };
  });

  const courseTypesList = await db
    .select({
      typeId: courseTypes.id,
      typeName: courseTypes.name,
    })
    .from(courseCourseTypes)
    .leftJoin(courseTypes, eq(courseCourseTypes.courseTypeId, courseTypes.id))
    .where(eq(courseCourseTypes.courseId, courseId));

  console.log('🏷️ Tipos de curso:', courseTypesList);

  return {
    ...course,
    courseTypes: courseTypesList,
    meetings: meetingsWithVideo,
  };
}

export async function GET(
  _request: Request,
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

    const course = await getCourseByIdWithTypes(courseId);
    if (!course) {
      return NextResponse.json(
        { error: 'Curso no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(course);
  } catch (error) {
    console.error('Error al obtener el curso:', error);
    return NextResponse.json(
      { error: 'Error al obtener el curso' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Validar autenticación del usuario
    const { userId } = await auth();
    if (!userId) {
      console.warn('⚠️ Usuario no autenticado.');
      return NextResponse.json(
        { error: 'No autorizado. Por favor, inicie sesión.' },
        { status: 403 }
      );
    }

    const resolvedParams = await params;
    const courseId = parseInt(resolvedParams.id);

    if (isNaN(courseId)) {
      console.warn('⚠️ ID de curso inválido.');
      return NextResponse.json(
        { error: 'ID de curso inválido' },
        { status: 400 }
      );
    }

    const data = (await request.json()) as PutRequestBody;
    console.log(JSON.stringify(data, null, 2));
    // Create update data object with type checking
    const updateData = {
      title: data.title,
      description: data.description,
      coverImageKey: data.coverImageKey,
      coverVideoCourseKey: data.coverVideoCourseKey,
      categoryid: data.categoryid ? Number(data.categoryid) : undefined,
      individualPrice: data.individualPrice ?? null,
      modalidadesid: data.modalidadesid
        ? Number(data.modalidadesid)
        : undefined,
      nivelid: data.nivelid ? Number(data.nivelid) : undefined,
      instructor: data.instructorId, // Changed to match schema's instructor field
      rating: data.rating ? Number(data.rating) : undefined,
      courseTypeId: Array.isArray(data.courseTypeId) ? data.courseTypeId : [],
      isActive: typeof data.isActive === 'boolean' ? data.isActive : undefined,
    };

    // Update course
    await updateCourse(courseId, updateData);
    // Handle subjects if present
    if (data.subjects && data.subjects.length > 0) {
      // Obtener materias actuales del curso
      const currentMaterias = await db
        .select()
        .from(materias)
        .where(eq(materias.courseid, courseId))
        .catch((err) => {
          console.error('❌ Error al obtener materias actuales:', err);
          throw new Error('Error al obtener materias actuales');
        });

      // Nueva validación: Si el curso no tiene programa y la materia no tiene ni curso ni programa
      for (const subject of data.subjects) {
        try {
          const materiaOriginal = await db
            .select()
            .from(materias)
            .where(eq(materias.id, subject.id))
            .limit(1)
            .then((res) => res[0])
            .catch((err) => {
              console.error(
                `❌ Error al obtener la materia con ID ${subject.id}:`,
                err
              );
              throw new Error(
                `Error al obtener la materia con ID ${subject.id}`
              );
            });

          if (
            (!currentMaterias.length ||
              currentMaterias[0]?.programaId === undefined) &&
            !materiaOriginal?.programaId &&
            !materiaOriginal?.courseid
          ) {
            console.log(
              `⚠️ Materia con ID ${subject.id} y curso ${courseId} no tienen programa ni curso asignado.`
            );

            await db
              .insert(materias)
              .values({
                title: materiaOriginal?.title ?? 'Título predeterminado',
                description:
                  materiaOriginal?.description ?? 'Descripción predeterminada',
                courseid: courseId,
              })
              .catch((err) => {
                console.error(
                  `❌ Error al insertar la materia con ID ${subject.id}:`,
                  err
                );
                throw new Error(
                  `Error al insertar la materia con ID ${subject.id}`
                );
              });

            console.log(
              `✨ Materia con ID ${subject.id} asignada al curso ${courseId} con programaId 9999999.`
            );
            continue;
          }
        } catch (err) {
          console.error(
            `❌ Error al procesar la materia con ID ${subject.id}:`,
            err
          );
        }
      }

      const programId = currentMaterias[0]?.programaId;
      if (programId !== null && programId !== undefined) {
        for (const subject of data.subjects) {
          const existingMateria = currentMaterias.find(
            (m) => m.id === subject.id
          );

          if (!existingMateria) {
            const materiaOriginal = await db
              .select()
              .from(materias)
              .where(eq(materias.id, subject.id))
              .limit(1)
              .then((res) => res[0])
              .catch((err) => {
                console.error(
                  `❌ Error al obtener la materia con ID ${subject.id}:`,
                  err
                );
                throw new Error(
                  `Error al obtener la materia con ID ${subject.id}`
                );
              });

            if (materiaOriginal) {
              await db
                .insert(materias)
                .values({
                  title: materiaOriginal.title,
                  description: materiaOriginal.description,
                  programaId: programId,
                  courseid: courseId,
                })
                .catch((err) => {
                  console.error(
                    `❌ Error al insertar la materia con ID ${subject.id}:`,
                    err
                  );
                  throw new Error(
                    `Error al insertar la materia con ID ${subject.id}`
                  );
                });

              console.log(
                `✨ Nueva materia creada para el curso ${courseId}:`,
                subject.id
              );

              const conditions = [eq(materias.title, materiaOriginal.title)];

              if (materiaOriginal.programaId) {
                conditions.push(
                  neq(materias.programaId, materiaOriginal.programaId)
                );
              }

              const materiasIguales = await db
                .select()
                .from(materias)
                .where(and(...conditions));

              for (const materia of materiasIguales) {
                if (!materia.courseid) {
                  await db
                    .update(materias)
                    .set({ courseid: courseId })
                    .where(eq(materias.id, materia.id))
                    .catch((err) => {
                      console.error(
                        `❌ Error al actualizar la materia con ID ${materia.id}:`,
                        err
                      );
                      throw new Error(
                        `Error al actualizar la materia con ID ${materia.id}`
                      );
                    });

                  console.log(
                    `🔄 Materia con ID ${materia.id} actualizada con curso ${courseId}`
                  );
                } else {
                  await db
                    .insert(materias)
                    .values({
                      title: materia.title,
                      description: materia.description,
                      programaId: materia.programaId,
                      courseid: courseId,
                    })
                    .catch((err) => {
                      console.error(
                        `❌ Error al duplicar la materia con ID ${materia.id}:`,
                        err
                      );
                      throw new Error(
                        `Error al duplicar la materia con ID ${materia.id}`
                      );
                    });

                  console.log(
                    `📚 Materia duplicada para programa ${materia.programaId} con nuevo curso ${courseId}`
                  );
                }
              }
            }
          }
        }
      }
    }

    const refreshedCourse = await getCourseById(courseId);
    return NextResponse.json({
      message: 'Curso actualizado exitosamente',
      course: refreshedCourse,
    });
  } catch (error) {
    console.error('❌ Error detallado:', error);
    return NextResponse.json(
      {
        error: 'Error al actualizar el curso',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}

export async function GET_ALL() {
  try {
    const courses = await getAllCourses();
    return NextResponse.json(courses, { status: 200 });
  } catch (error) {
    console.error('Error al obtener los cursos:', error);
    return NextResponse.json(
      { error: 'Error al obtener los cursos' },
      { status: 500 }
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
  instructorId: string;
  creatorId: string;
  rating: number;
  individualPrice: number | null;
}

export async function POST(request: Request) {
  try {
    console.log('Iniciando creación de curso...');

    // Autenticación
    const { userId } = await auth();
    console.log('Resultado auth:', { userId });

    if (!userId) {
      console.log('Usuario no autorizado');
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // Parsear datos del body
    const data = (await request.json()) as CourseData & {
      modalidadesid: number[];
      courseTypeId: number;
      isActive?: boolean;
    };

    console.log('Datos recibidos del body:', JSON.stringify(data, null, 2));

    // Validación precio individual
    if (
      data.courseTypeId === 4 &&
      (data.individualPrice === null || data.individualPrice <= 0)
    ) {
      console.log('Validación de precio individual fallida', {
        courseTypeId: data.courseTypeId,
        individualPrice: data.individualPrice,
      });
      return NextResponse.json(
        { error: 'Debe ingresar un precio válido para cursos individuales.' },
        { status: 400 }
      );
    }

    // Validación general
    if (
      !data.title ||
      !data.description ||
      !data.modalidadesid ||
      data.modalidadesid.length === 0
    ) {
      console.log('Validación de datos fallida', {
        title: data.title,
        description: data.description,
        modalidadesid: data.modalidadesid,
      });
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    }

    const createdCourses = [];

    // Crear cursos por cada modalidad
    for (const modalidadId of data.modalidadesid) {
      console.log(`Procesando modalidadId: ${modalidadId}`);

      // Obtener modalidad
      const modalidad = await getModalidadById(modalidadId);
      console.log(`Modalidad obtenida:`, modalidad);

      // Preparar nuevo título
      const newTitle = modalidad
        ? `${data.title} - ${modalidad.name}`
        : data.title;
      console.log(`Título final para modalidad ${modalidadId}: ${newTitle}`);

      // Preparar payload para creación
      const coursePayload = {
        ...data,
        title: newTitle,
        modalidadesid: modalidadId, // importante para este curso
        instructor: data.instructorId, // asegúrate que instructorId existe en data
      };

      console.log(
        'Payload final para crearCourse:',
        JSON.stringify(coursePayload, null, 2)
      );

      // Crear el curso
      const newCourse = await createCourse(coursePayload);
      console.log(`Curso creado para modalidad ${modalidadId}:`, newCourse);

      createdCourses.push(newCourse);
    }

    console.log('Todos los cursos creados:', createdCourses);

    return NextResponse.json(createdCourses, { status: 201 });
  } catch (error) {
    console.error('Error al crear el curso:', error);
    return NextResponse.json(
      {
        error: 'Error al crear el curso',
        details: error instanceof Error ? error.message : error,
      },
      { status: 500 }
    );
  }
}

interface DeleteCourseRequest {
  id: string;
}

export async function DELETE(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // Verifica si hay cuerpo en la solicitud
    if (request.body === undefined || request.body === null) {
      return NextResponse.json({ error: 'Cuerpo vacío' }, { status: 400 });
    }

    // Convertimos el JSON recibido al tipo correcto
    let data: DeleteCourseRequest;
    try {
      data = (await request.json()) as DeleteCourseRequest;
    } catch {
      return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
    }

    // Validamos que el ID sea un string válido
    if (!data.id || typeof data.id !== 'string') {
      return NextResponse.json(
        { error: 'ID de curso inválido' },
        { status: 400 }
      );
    }

    const courseId = parseInt(data.id);
    if (isNaN(courseId)) {
      return NextResponse.json(
        { error: 'ID de curso inválido' },
        { status: 400 }
      );
    }

    await deleteCourse(courseId);
    return NextResponse.json(
      { message: 'Curso eliminado correctamente' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error al eliminar el curso:', error);
    return NextResponse.json(
      { error: 'Error al eliminar el curso' },
      { status: 500 }
    );
  }
}
