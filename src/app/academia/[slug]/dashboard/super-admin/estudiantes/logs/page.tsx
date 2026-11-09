import { Suspense } from 'react';

import { LogsAcademia } from '~/components/academy/seccion/LogsAcademia';

import { SeccionAcademia } from '../../../_components/SeccionAcademia';

// <slug>.artiefy.com/dashboard/super-admin/estudiantes/logs

type Props = { params: Promise<{ slug: string }> };

export default function LogsAcademiaPage({ params }: Props) {
  return (
    <Suspense>
      <SeccionAcademia
        params={params}
        titulo="Logs"
        descripcion="Actividad de la academia: cuentas, credenciales, cursos y más."
        render={({ academia }) => <LogsAcademia slug={academia.slug} />}
      />
    </Suspense>
  );
}
