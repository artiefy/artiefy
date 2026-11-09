import { Suspense } from 'react';

import { notFound } from 'next/navigation';

import { DetalleCursoAcademia } from '~/components/academy/DetalleCursoAcademia';
import { obtenerCurso } from '~/server/academy/cursos';

import { PanelDeRol } from '../../../_components/PanelDeRol';

// <slug>.artiefy.com/dashboard/educator/cursos/[id] — solo sus cursos.

type Props = { params: Promise<{ slug: string; id: string }> };

export default function DetalleCursoEducadorPage({ params }: Props) {
  return (
    <Suspense>
      <PanelDeRol
        params={params}
        rol="educador"
        saludo={false}
        render={({ academia, cuenta }) => (
          <Detalle
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
  academyId,
  userId,
  params,
}: {
  academyId: number;
  userId: string;
  params: Props['params'];
}) {
  const curso = await obtenerCurso(academyId, Number((await params).id));
  if (!curso?.instructores.includes(userId)) notFound();
  return (
    <DetalleCursoAcademia
      curso={curso}
      volver="/dashboard/educator"
      etiquetaVolver="Mis cursos"
    />
  );
}
