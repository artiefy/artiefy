"use server";

import { db } from "~/server/db";
import { type BaseCourse, type MateriaWithCourse, type Program } from "~/types";

export async function getAllPrograms(): Promise<Program[]> {
  try {
    const programs = await db.query.programas.findMany({
      with: {
        category: true,
        materias: {
          with: {
            curso: {
              with: {
                category: true,
              },
            },
          },
        },
      },
    });

    return programs.map((program) => ({
      ...program,
      id: program.id.toString(),
      rating: program.rating ?? 0,
      materias: program.materias.map((materia) => ({
        id: materia.id,
        title: materia.title,
        description: materia.description,
        programaId: materia.programaId,
        courseid: materia.courseid,
        curso: materia.curso
          ? ({
              id: materia.curso.id,
              title: materia.curso.title,
              description: materia.curso.description,
              coverImageKey: materia.curso.coverImageKey,
              categoryid: materia.curso.categoryid,
              instructor: materia.curso.instructor,
              createdAt: materia.curso.createdAt,
              updatedAt: materia.curso.updatedAt,
              creatorId: materia.curso.creatorId,
              rating: materia.curso.rating ?? 0,
              modalidadesid: materia.curso.modalidadesid,
              nivelid: materia.curso.nivelid,
              category: materia.curso.category,
            } as BaseCourse)
          : undefined,
      })) as MateriaWithCourse[],
    }));
  } catch (error) {
    console.error("Error fetching programs:", error);
    return [];
  }
}
