import { Suspense } from 'react';

import { notFound } from 'next/navigation';

import { CursoAula } from '~/components/academy/aula/CursoAula';
import { cursoEstudiante } from '~/server/academy/aula';

import { PanelEstudiante } from '../../../_components/PanelEstudiante';

// <slug>.artiefy.com/dashboard/student/cursos/[id] — detalle del curso para
// el estudiante (como /estudiantes/cursos/[id] de Artiefy).

type Props = { params: Promise<{ slug: string; id: string }> };

export default function DetalleCursoEstudiantePage({ params }: Props) {
  return (
    <Suspense>
      <PanelEstudiante
        params={params}
        render={({ academia, cuenta, previa }) => (
          <Detalle
            previa={previa}
            slug={academia.slug}
            academyId={academia.id}
            userId={cuenta.userId}
            params={params}
          />
        )}
      />
    </Suspense>
  );
}

async function Detalle({
  previa,
  slug,
  academyId,
  userId,
  params,
}: {
  previa: boolean;
  slug: string;
  academyId: number;
  userId: string;
  params: Props['params'];
}) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const datos = await cursoEstudiante(academyId, userId, id, previa);
  if (!datos) notFound();
  return (
    <CursoAula datos={datos} slug={slug} userId={userId} previa={previa} />
  );
}
