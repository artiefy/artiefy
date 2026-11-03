import { Suspense } from 'react';

import { CursosAcademia } from '~/components/academy/CursosAcademia';

import { PanelDeRol } from '../../_components/PanelDeRol';

// <slug>.artiefy.com/dashboard/super-admin/cursos

type Props = { params: Promise<{ slug: string }> };

export default function CursosAcademiaPage({ params }: Props) {
  return (
    <Suspense>
      <PanelDeRol
        params={params}
        rol="super-admin"
        saludo={false}
        render={({ academia }) => <CursosAcademia slug={academia.slug} />}
      />
    </Suspense>
  );
}
