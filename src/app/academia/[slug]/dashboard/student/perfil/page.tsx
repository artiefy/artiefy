import { Suspense } from 'react';

import { currentUser } from '@clerk/nextjs/server';

import { PerfilAula } from '~/components/academy/aula/PerfilAula';
import { miAprendizaje } from '~/server/academy/aula';

import { PanelEstudiante } from '../../_components/PanelEstudiante';

// <slug>.artiefy.com/dashboard/student/perfil — perfil del estudiante (como
// /estudiantes/perfil de Artiefy).

type Props = { params: Promise<{ slug: string }> };

export default function PerfilPage({ params }: Props) {
  return (
    <Suspense>
      <PanelEstudiante
        params={params}
        render={({ academia, cuenta, previa }) => (
          <Perfil
            academyId={academia.id}
            userId={cuenta.userId}
            nombre={cuenta.name ?? cuenta.email}
            email={cuenta.email}
            desde={cuenta.createdAt.toISOString()}
            previa={previa}
          />
        )}
      />
    </Suspense>
  );
}

async function Perfil({
  academyId,
  userId,
  nombre,
  email,
  desde,
  previa,
}: {
  academyId: number;
  userId: string;
  nombre: string;
  email: string;
  desde: string;
  previa: boolean;
}) {
  const [{ courses, programs }, usuario] = await Promise.all([
    miAprendizaje(academyId, userId, previa),
    currentUser(),
  ]);
  return (
    <PerfilAula
      nombre={nombre}
      email={email}
      imagen={usuario?.imageUrl ?? null}
      desde={desde}
      courses={courses}
      programs={programs}
    />
  );
}
