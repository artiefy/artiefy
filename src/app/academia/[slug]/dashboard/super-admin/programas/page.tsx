import { Suspense } from 'react';

import { ProgramasAcademia } from '~/components/academy/seccion/ProgramasAcademia';

import { SeccionAcademia } from '../../_components/SeccionAcademia';

// <slug>.artiefy.com/dashboard/super-admin/programas

type Props = { params: Promise<{ slug: string }> };

export default function ProgramasAcademiaPage({ params }: Props) {
  return (
    <Suspense>
      <SeccionAcademia
        params={params}
        titulo="Programas"
        descripcion="Agrupa los cursos de la academia en programas."
        render={({ academia }) => <ProgramasAcademia slug={academia.slug} />}
      />
    </Suspense>
  );
}
