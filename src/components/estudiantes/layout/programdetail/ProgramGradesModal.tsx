'use client';

import Link from 'next/link';

import { FaTrophy } from 'react-icons/fa';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '~/components/estudiantes/ui/dialog';
import { Icons } from '~/components/estudiantes/ui/icons';
import { formatScore } from '~/utils/formatScore';

interface CourseGrade {
  courseTitle: string;
  finalGrade: number;
}

interface GradeModalProps {
  isOpen: boolean;
  onCloseAction: () => void;
  programTitle: string;
  finalGrade: number;
  isLoading: boolean;
  coursesGrades?: CourseGrade[];
}
interface Materia {
  id: number;
  title: string;
}

export function ProgramGradesModal({
  isOpen,
  onCloseAction,
  programTitle,
  finalGrade,
  isLoading,
  coursesGrades = [],
  programId,
  hasAllMateriasPassed = false,
  materias = [],
}: GradeModalProps & {
  programId?: string | number;
  hasAllMateriasPassed?: boolean;
  materias?: Materia[];
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onCloseAction}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <FaTrophy className="text-yellow-500" />
            Calificaciones del Programa
          </DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <h3 className="mb-4 text-lg font-semibold">{programTitle}</h3>

          {/* Promedio General del Programa */}
          <div className="mb-6 rounded-lg bg-gray-100 p-4 text-center">
            <p className="mb-2 text-sm font-medium text-gray-600">
              Promedio General del Programa
            </p>
            {isLoading ? (
              <Icons.spinner className="text-background mx-auto h-6 w-6" />
            ) : (
              <span
                className={`text-3xl font-bold ${
                  finalGrade >= 3 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {formatScore(finalGrade)}
              </span>
            )}
          </div>

          {/* Tabla de Calificaciones por Curso */}
          <div className="mt-4 max-h-80 overflow-hidden overflow-y-auto rounded-lg border">
            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4">
              <div className="text-background font-semibold">Curso</div>
              <div className="text-background text-center font-semibold">
                Calificación Final
              </div>
            </div>
            <div className="divide-y">
              {isLoading ? (
                <div className="flex justify-center p-4">
                  <Icons.spinner className="text-background h-6 w-6" />
                </div>
              ) : coursesGrades.length > 0 ? (
                coursesGrades.map((course, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-2 gap-4 bg-white p-4"
                  >
                    <div className="text-background text-sm font-bold">
                      {course.courseTitle}
                    </div>
                    <div className="text-center">
                      <span
                        className={`font-semibold ${
                          course.finalGrade >= 3
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}
                      >
                        {formatScore(course.finalGrade)}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-gray-500">
                  No hay calificaciones disponibles
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Certificado del Programa: mostrar si todas las materias aprobadas */}
        {hasAllMateriasPassed && !isLoading && (
          <div className="mt-6 rounded-lg border bg-green-50 p-4">
            <h4 className="mb-2 text-lg font-semibold">Certificado</h4>
            <p className="text-sm text-gray-700">
              ¡Felicitaciones! Has completado exitosamente el programa con una
              calificación sobresaliente. Tu certificado está listo para ser
              visualizado y compartido.
            </p>
            <div className="mt-4 flex items-center gap-3">
              <Link
                href={`/estudiantes/certificados/programa/${programId}`}
                className="inline-flex items-center gap-2 rounded bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700"
              >
                <FaTrophy /> Ver Tu Certificado
              </Link>
            </div>

            {/* Materias asociadas */}
            {materias.length > 0 && (
              <div className="mt-4">
                <h5 className="mb-2 text-sm font-semibold">
                  Materias asociadas:
                </h5>
                <ul className="list-disc pl-5 text-sm text-gray-800">
                  {materias.map((m) => (
                    <li key={m.id}>{m.title ?? m.title}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
