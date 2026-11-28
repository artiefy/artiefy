import { Suspense } from 'react';

import { DetalleClaseAcademia } from '~/components/academy/DetalleClaseAcademia';

import { PanelDeRol } from '../../../../_components/PanelDeRol';

// <slug>.artiefy.com/dashboard/educator/cursos/[id]/[lessonId] — clase de un
// curso del educador con sus actividades. La API solo responde si el curso
// es suyo.

type Props = {
  params: Promise<{ slug: string; id: string; lessonId: string }>;
};

export default function ClaseEducadorPage({ params }: Props) {
  return (
    <Suspense>
      <PanelDeRol
        params={params}
        rol="educador"
        saludo={false}
        render={({ academia }) => (
          <Clase slug={academia.slug} params={params} />
        )}
      />
    </Suspense>
  );
}

async function Clase({
  slug,
  params,
}: {
  slug: string;
  params: Props['params'];
}) {
  const { lessonId } = await params;
  return <DetalleClaseAcademia slug={slug} lessonId={Number(lessonId)} />;
}
