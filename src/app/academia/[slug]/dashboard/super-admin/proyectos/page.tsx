import { Suspense } from 'react';

import { ProyectosAcademia } from '~/components/academy/seccion/ProyectosAcademia';

import { SeccionAcademia } from '../../_components/SeccionAcademia';

// <slug>.artiefy.com/dashboard/super-admin/proyectos

type Props = { params: Promise<{ slug: string }> };

export default function ProyectosAcademiaPage({ params }: Props) {
  return (
    <Suspense>
      <SeccionAcademia
        params={params}
        titulo="Proyectos de Estudiantes"
        descripcion="Los proyectos que hacen los estudiantes dentro de cada curso."
        render={({ academia }) => <ProyectosAcademia slug={academia.slug} />}
      />
    </Suspense>
  );
}
