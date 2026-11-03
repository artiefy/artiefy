import { Suspense } from 'react';

import { TarjetasCursos } from '~/components/academy/TarjetasCursos';
import { listarCursos } from '~/server/academy/cursos';

import { PanelDeRol } from '../_components/PanelDeRol';

// <slug>.artiefy.com/dashboard/student — los cursos de la academia.
// Aún no hay matrículas por academia: el estudiante ve los cursos visibles y
// activos (cuando existan, se filtrarán por los suyos).

type Props = { params: Promise<{ slug: string }> };

export default function EstudianteAcademiaPage({ params }: Props) {
  return (
    <Suspense>
      <PanelDeRol
        params={params}
        rol="estudiante"
        render={({ academia }) => <Cursos academyId={academia.id} />}
      />
    </Suspense>
  );
}

async function Cursos({ academyId }: { academyId: number }) {
  const cursos = (await listarCursos(academyId)).filter(
    (c) => c.visibility && c.isActive
  );
  return (
    <section id="cursos" className="space-y-4">
      <h2 className="text-xl font-bold text-white">Cursos</h2>
      <TarjetasCursos
        cursos={cursos}
        hrefBase="/dashboard/student/cursos"
        vacio="Todavía no hay cursos disponibles en la academia."
      />
    </section>
  );
}
