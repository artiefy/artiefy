import { Suspense } from 'react';

import { CatalogosAcademia } from '~/components/academy/CatalogosAcademia';

import { PanelDeRol } from '../../../_components/PanelDeRol';

// <slug>.artiefy.com/dashboard/super-admin/cursos/configuraciones
// Catálogos de cursos de la academia (categorías, modalidades, niveles…).

type Props = { params: Promise<{ slug: string }> };

export default function ConfiguracionesAcademiaPage({ params }: Props) {
  return (
    <Suspense>
      <PanelDeRol
        params={params}
        rol="super-admin"
        saludo={false}
        render={({ academia }) => <CatalogosAcademia slug={academia.slug} />}
      />
    </Suspense>
  );
}
