import { Suspense } from 'react';

import { FinanzasAcademia } from '~/components/academy/seccion/FinanzasAcademia';

import { SeccionAcademia } from '../../_components/SeccionAcademia';

// <slug>.artiefy.com/dashboard/super-admin/finanzas

type Props = { params: Promise<{ slug: string }> };

export default function FinanzasAcademiaPage({ params }: Props) {
  return (
    <Suspense>
      <SeccionAcademia
        params={params}
        titulo="Finanzas"
        descripcion="Pagos de los estudiantes de la academia."
        render={({ academia }) => <FinanzasAcademia slug={academia.slug} />}
      />
    </Suspense>
  );
}
