import { Suspense } from 'react';

import { notFound } from 'next/navigation';

import { ProgramaAula } from '~/components/academy/aula/ProgramaAula';
import { programaEstudiante } from '~/server/academy/aula';

import { PanelEstudiante } from '../../../_components/PanelEstudiante';

// <slug>.artiefy.com/dashboard/student/programas/[id] — detalle de un
// programa (como /estudiantes/programas/[id] de Artiefy).

type Props = { params: Promise<{ slug: string; id: string }> };

export default function ProgramaPage({ params }: Props) {
  return (
    <Suspense>
      <PanelEstudiante
        params={params}
        render={({ academia, cuenta, previa }) => (
          <Programa
            academyId={academia.id}
            userId={cuenta.userId}
            previa={previa}
            params={params}
          />
        )}
      />
    </Suspense>
  );
}

async function Programa({
  academyId,
  userId,
  previa,
  params,
}: {
  academyId: number;
  userId: string;
  previa: boolean;
  params: Props['params'];
}) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const datos = await programaEstudiante(academyId, userId, id, previa);
  if (!datos) notFound();
  return <ProgramaAula datos={datos} />;
}
