import { Suspense } from 'react';

import { HistorialTransaccionesAcademia } from '~/components/academy/HistorialTransaccionesAcademia';

import { PanelDeRol } from '../../_components/PanelDeRol';

// <slug>.artiefy.com/dashboard/super-admin/finanzas — la misma pantalla que
// Finanzas › Historial de Transacciones de Artiefy, con los pagos de la
// academia.

type Props = { params: Promise<{ slug: string }> };

export default function FinanzasAcademiaPage({ params }: Props) {
  return (
    <Suspense>
      <PanelDeRol
        params={params}
        rol="super-admin"
        saludo={false}
        anchoCompleto
        render={({ academia }) => (
          <HistorialTransaccionesAcademia slug={academia.slug} />
        )}
      />
    </Suspense>
  );
}
