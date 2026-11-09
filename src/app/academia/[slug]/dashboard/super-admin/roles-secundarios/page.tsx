import { Suspense } from 'react';

import { RolesSecundariosAcademia } from '~/components/academy/seccion/RolesSecundariosAcademia';

import { SeccionAcademia } from '../../_components/SeccionAcademia';

// <slug>.artiefy.com/dashboard/super-admin/roles-secundarios

type Props = { params: Promise<{ slug: string }> };

export default function RolesSecundariosAcademiaPage({ params }: Props) {
  return (
    <Suspense>
      <SeccionAcademia
        params={params}
        titulo="Roles Secundarios"
        descripcion="Roles adicionales con permisos sobre las secciones del panel."
        render={({ academia }) => (
          <RolesSecundariosAcademia slug={academia.slug} />
        )}
      />
    </Suspense>
  );
}
