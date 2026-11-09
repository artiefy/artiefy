import { Suspense } from 'react';

import { TicketsAcademia } from '~/components/academy/seccion/TicketsAcademia';

import { PanelDeRol } from '../../_components/PanelDeRol';

// <slug>.artiefy.com/dashboard/super-admin/tickets — tablero de tickets de la
// academia hacia el soporte de Artiefy (mismo tablero que Artiefy).

type Props = { params: Promise<{ slug: string }> };

export default function TicketsAcademiaPage({ params }: Props) {
  return (
    <Suspense>
      <PanelDeRol
        params={params}
        rol="super-admin"
        saludo={false}
        anchoCompleto
        render={({ academia }) => (
          <TicketsAcademia
            api={`/api/academia/${academia.slug}/tickets`}
            modo="academia"
          />
        )}
      />
    </Suspense>
  );
}
