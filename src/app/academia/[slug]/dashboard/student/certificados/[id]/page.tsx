import { Suspense } from 'react';

import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Lock } from 'lucide-react';

import { CertificadoAula } from '~/components/academy/aula/CertificadoAula';
import { ErrorAcademia } from '~/server/academy/academias';
import { certificadoEstudiante } from '~/server/academy/aula';

import { PanelEstudiante } from '../../../_components/PanelEstudiante';

import type { Route } from 'next';

// <slug>.artiefy.com/dashboard/student/certificados/[id] — constancia de un
// curso terminado (como /estudiantes/certificados/[id] de Artiefy).

type Props = { params: Promise<{ slug: string; id: string }> };

export default function CertificadoPage({ params }: Props) {
  return (
    <Suspense>
      <PanelEstudiante
        params={params}
        render={({ academia, cuenta, previa }) => (
          <Certificado
            academyId={academia.id}
            userId={cuenta.userId}
            nombre={cuenta.name ?? cuenta.email}
            previa={previa}
            params={params}
          />
        )}
      />
    </Suspense>
  );
}

async function Certificado({
  academyId,
  userId,
  nombre,
  previa,
  params,
}: {
  academyId: number;
  userId: string;
  nombre: string;
  previa: boolean;
  params: Props['params'];
}) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const resultado = await certificadoEstudiante(
    academyId,
    userId,
    id,
    previa
  ).then(
    (datos) => ({ datos, error: null }),
    (error: unknown) => {
      if (error instanceof ErrorAcademia) return { datos: null, error };
      throw error;
    }
  );
  if (resultado.error) {
    return (
      <main className="mx-auto max-w-lg px-4 py-24 text-center">
        <Lock className="mx-auto size-10 text-primary" />
        <p className="mt-4 text-lg font-semibold text-foreground">
          {resultado.error.message}
        </p>
        <Link
          href={`/dashboard/student/cursos/${id}` as Route}
          className="mt-6 inline-block rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-[var(--ac-primario-texto)]"
        >
          Volver al curso
        </Link>
      </main>
    );
  }
  if (!resultado.datos) notFound();
  return <CertificadoAula nombre={nombre} {...resultado.datos} />;
}
