import { Suspense } from 'react';

import { ListaEstudiantesAcademia } from '~/components/academy/ListaEstudiantesAcademia';
import { listarEstudiantes } from '~/server/academy/estudiantes';

import { PanelDeRol } from '../../_components/PanelDeRol';

// <slug>.artiefy.com/dashboard/super-admin/estudiantes — Lista de
// Estudiantes (la misma pantalla que "Gestión de Builders" de Artiefy).

type Props = { params: Promise<{ slug: string }> };

export default function EstudiantesAcademiaPage({ params }: Props) {
  return (
    <Suspense>
      <PanelDeRol
        params={params}
        rol="super-admin"
        saludo={false}
        anchoCompleto
        render={({ academia }) => (
          <Lista academyId={academia.id} slug={academia.slug} />
        )}
      />
    </Suspense>
  );
}

async function Lista({ academyId, slug }: { academyId: number; slug: string }) {
  return (
    <ListaEstudiantesAcademia
      slug={slug}
      estudiantes={await listarEstudiantes(academyId)}
    />
  );
}
