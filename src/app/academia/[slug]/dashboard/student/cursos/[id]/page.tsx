import { Suspense } from 'react';

import { notFound } from 'next/navigation';

import { DetalleCursoAcademia } from '~/components/academy/DetalleCursoAcademia';
import { obtenerCurso } from '~/server/academy/cursos';

import { PanelDeRol } from '../../../_components/PanelDeRol';

// <slug>.artiefy.com/dashboard/student/cursos/[id] — cursos visibles y activos.

type Props = { params: Promise<{ slug: string; id: string }> };

export default function DetalleCursoEstudiantePage({ params }: Props) {
  return (
    <Suspense>
      <PanelDeRol
        params={params}
        rol="estudiante"
        saludo={false}
        render={({ academia }) => (
          <Detalle academyId={academia.id} params={params} />
        )}
      />
    </Suspense>
  );
}

async function Detalle({
  academyId,
  params,
}: {
  academyId: number;
  params: Props['params'];
}) {
  const curso = await obtenerCurso(academyId, Number((await params).id));
  if (!curso?.visibility || !curso.isActive) notFound();
  return (
    <DetalleCursoAcademia
      curso={curso}
      volver="/dashboard/student"
      etiquetaVolver="Cursos"
    />
  );
}
