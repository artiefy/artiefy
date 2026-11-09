import { Suspense } from 'react';

import { notFound } from 'next/navigation';

import { DetalleCursoSuperAdminAcademia } from '~/components/academy/DetalleCursoSuperAdminAcademia';
import { obtenerCurso } from '~/server/academy/cursos';

import { PanelDeRol } from '../../../_components/PanelDeRol';

// <slug>.artiefy.com/dashboard/super-admin/cursos/[id]

type Props = { params: Promise<{ slug: string; id: string }> };

export default function DetalleCursoSuperAdminPage({ params }: Props) {
  return (
    <Suspense>
      <PanelDeRol
        params={params}
        rol="super-admin"
        saludo={false}
        render={({ academia }) => (
          <Detalle
            academyId={academia.id}
            slug={academia.slug}
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
  params,
}: {
  academyId: number;
  slug: string;
  params: Props['params'];
}) {
  const curso = await obtenerCurso(academyId, Number((await params).id));
  if (!curso) notFound();
  return <DetalleCursoSuperAdminAcademia slug={slug} curso={curso} />;
}
