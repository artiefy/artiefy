import { Suspense } from 'react';

import { notFound } from 'next/navigation';

import { DetalleCursoSuperAdminAcademia } from '~/components/academy/DetalleCursoSuperAdminAcademia';
import { obtenerCurso } from '~/server/academy/cursos';

import { PanelDeRol } from '../../../_components/PanelDeRol';

// <slug>.artiefy.com/dashboard/educator/cursos/[id] — como en Artiefy, el
// educador gestiona SU curso (clases, actividades, estudiantes, notas y
// clases en vivo) con la misma pantalla del super-admin, sin eliminar el
// curso ni cambiar sus instructores.

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
            slug={academia.slug}
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
  slug,
  userId,
  params,
}: {
  academyId: number;
  slug: string;
  userId: string;
  params: Props['params'];
}) {
  const curso = await obtenerCurso(academyId, Number((await params).id));
  if (!curso?.instructores.includes(userId)) notFound();
  return <DetalleCursoSuperAdminAcademia slug={slug} curso={curso} />;
}
