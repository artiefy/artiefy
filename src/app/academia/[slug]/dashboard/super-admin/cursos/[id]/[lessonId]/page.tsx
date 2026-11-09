import { Suspense } from 'react';

import { DetalleClaseAcademia } from '~/components/academy/DetalleClaseAcademia';

import { PanelDeRol } from '../../../../_components/PanelDeRol';

// <slug>.artiefy.com/dashboard/super-admin/cursos/[id]/[lessonId] — clase de
// un curso con sus actividades (misma ruta que en Artiefy).

type Props = {
  params: Promise<{ slug: string; id: string; lessonId: string }>;
};

export default function ClaseAcademiaPage({ params }: Props) {
  return (
    <Suspense>
      <PanelDeRol
        params={params}
        rol="super-admin"
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
