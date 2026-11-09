import { Suspense } from 'react';

import { GruposAcademia } from '~/components/academy/seccion/GruposAcademia';

import { PanelDeRol } from '../../../_components/PanelDeRol';

// <slug>.artiefy.com/dashboard/super-admin/estudiantes/grupos — misma
// pantalla que Grupos de Artiefy.

type Props = { params: Promise<{ slug: string }> };

export default function GruposAcademiaPage({ params }: Props) {
  return (
    <Suspense>
      <PanelDeRol
        params={params}
        rol="super-admin"
        saludo={false}
        render={({ academia }) => <GruposAcademia slug={academia.slug} />}
      />
    </Suspense>
  );
}
