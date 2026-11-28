import { Suspense } from 'react';

import { MiAprendizajeAula } from '~/components/academy/aula/MiAprendizajeAula';
import { miAprendizaje } from '~/server/academy/aula';

import { PanelEstudiante } from '../../_components/PanelEstudiante';

// <slug>.artiefy.com/dashboard/student/mi-aprendizaje — sus cursos y
// programas (como /estudiantes/myaccount de Artiefy).

type Props = { params: Promise<{ slug: string }> };

export default function MiAprendizajePage({ params }: Props) {
  return (
    <Suspense>
      <PanelEstudiante
        params={params}
        render={({ academia, cuenta, previa }) => (
          <Contenido
            academyId={academia.id}
            userId={cuenta.userId}
            previa={previa}
          />
        )}
      />
    </Suspense>
  );
}

async function Contenido({
  academyId,
  userId,
  previa,
}: {
  academyId: number;
  userId: string;
  previa: boolean;
}) {
  const { courses, programs } = await miAprendizaje(academyId, userId, previa);
  return <MiAprendizajeAula courses={courses} programs={programs} />;
}
