import { Suspense } from 'react';

import { InicioAula } from '~/components/academy/aula/InicioAula';
import { inicioEstudiante } from '~/server/academy/aula';

import { PanelEstudiante } from '../_components/PanelEstudiante';

// <slug>.artiefy.com/dashboard/student — inicio del estudiante (como
// /estudiantes de Artiefy): sus cursos con progreso y el catálogo.

type Props = { params: Promise<{ slug: string }> };

export default function EstudianteAcademiaPage({ params }: Props) {
  return (
    <Suspense>
      <PanelEstudiante
        params={params}
        render={({ academia, cuenta, previa }) => (
          <Inicio
            previa={previa}
            academyId={academia.id}
            academia={academia.nombre}
            userId={cuenta.userId}
            nombre={cuenta.name?.split(' ')[0] ?? 'bienvenido'}
          />
        )}
      />
    </Suspense>
  );
}

async function Inicio({
  previa,
  academyId,
  academia,
  userId,
  nombre,
}: {
  previa: boolean;
  academyId: number;
  academia: string;
  userId: string;
  nombre: string;
}) {
  const datos = await inicioEstudiante(academyId, userId, previa);
  return <InicioAula nombre={nombre} academia={academia} datos={datos} />;
}
