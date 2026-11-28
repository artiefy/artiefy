import { Suspense } from 'react';

import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Lock } from 'lucide-react';

import { ClaseAula } from '~/components/academy/aula/ClaseAula';
import { ErrorAcademia } from '~/server/academy/academias';
import { claseEstudiante } from '~/server/academy/aula';

import { PanelEstudiante } from '../../../../../_components/PanelEstudiante';

import type { Route } from 'next';

// <slug>.artiefy.com/dashboard/student/cursos/[id]/clases/[lessonId] — una
// clase para el estudiante (como /estudiantes/clases/[id] de Artiefy).

type Props = {
  params: Promise<{ slug: string; id: string; lessonId: string }>;
};

export default function ClaseEstudiantePage({ params }: Props) {
  return (
    <Suspense>
      <PanelEstudiante
        params={params}
        render={({ academia, cuenta }) => (
          <Clase
            academyId={academia.id}
            slug={academia.slug}
            userId={cuenta.userId}
            params={params}
          />
        )}
      />
    </Suspense>
  );
}

async function Clase({
  academyId,
  slug,
  userId,
  params,
}: {
  academyId: number;
  slug: string;
  userId: string;
  params: Props['params'];
}) {
  const { id, lessonId } = await params;
  const leccionId = Number(lessonId);
  if (!Number.isInteger(leccionId)) notFound();
  // El error (no matriculado / clase bloqueada) se resuelve antes del JSX.
  const resultado = await claseEstudiante(academyId, userId, leccionId).then(
    (datos) => ({ datos, error: null }),
    (error: unknown) => {
      if (error instanceof ErrorAcademia) return { datos: null, error };
      throw error;
    }
  );
  if (resultado.error) {
    return (
      <main className="mx-auto max-w-lg px-4 py-24 text-center">
        <Lock className="mx-auto size-10 text-primary" />
        <p className="mt-4 text-lg font-semibold text-white">
          {resultado.error.message}
        </p>
        <Link
          href={`/dashboard/student/cursos/${id}` as Route}
          className="mt-6 inline-block rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-[var(--ac-primario-texto)]"
        >
          Volver al curso
        </Link>
      </main>
    );
  }
  const { datos } = resultado;
  if (!datos || datos.leccion.courseId !== Number(id)) notFound();
  return <ClaseAula slug={slug} datos={datos} />;
}
