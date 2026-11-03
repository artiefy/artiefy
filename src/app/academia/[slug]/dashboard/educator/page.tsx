import { Suspense } from 'react';

import { TarjetasCursos } from '~/components/academy/TarjetasCursos';
import { listarCursos } from '~/server/academy/cursos';

import { PanelDeRol } from '../_components/PanelDeRol';

// <slug>.artiefy.com/dashboard/educator — los cursos que dicta el educador.

type Props = { params: Promise<{ slug: string }> };

export default function EducadorAcademiaPage({ params }: Props) {
  return (
    <Suspense>
      <PanelDeRol
        params={params}
        rol="educador"
        render={({ academia, cuenta }) => (
          <MisCursos academyId={academia.id} userId={cuenta.userId} />
        )}
      />
    </Suspense>
  );
}

async function MisCursos({
  academyId,
  userId,
}: {
  academyId: number;
  userId: string;
}) {
  const cursos = (await listarCursos(academyId)).filter(
    (c) => c.instructor === userId
  );
  return (
    <section id="cursos" className="space-y-4">
      <h2 className="text-xl font-bold text-white">Mis cursos</h2>
      <TarjetasCursos
        cursos={cursos}
        hrefBase="/dashboard/educator/cursos"
        vacio="Aún no tienes cursos asignados. El administrador de la academia te asigna como educador de un curso."
      />
    </section>
  );
}
