import { Suspense } from 'react';

import { notFound } from 'next/navigation';

import { academiaDeLaPagina } from '~/app/academia/_cache/academia';
import { FormularioInscripcionAcademia } from '~/components/academy/FormularioInscripcionAcademia';
import { LogoAcademia } from '~/components/academy/LogoAcademia';
import { listarCursos } from '~/server/academy/cursos';

// <slug>.artiefy.com/inscripcion — formulario de inscripción público de la
// academia (sin sesión). Las respuestas llegan a Estudiantes › Formulario.

type Props = { params: Promise<{ slug: string }> };

export default function InscripcionAcademiaPage({ params }: Props) {
  return (
    <Suspense>
      <Inscripcion params={params} />
    </Suspense>
  );
}

async function Inscripcion({ params }: Props) {
  const academia = await academiaDeLaPagina((await params).slug);
  if (!academia) notFound();
  const cursos = (await listarCursos(academia.id))
    .filter((c) => c.visibility && c.isActive)
    .map((c) => ({ id: c.id, title: c.title }));

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-xl space-y-6 rounded-3xl border border-[var(--ac-borde)] bg-[var(--ac-superficie)] p-6 sm:p-8">
        <div className="flex items-center gap-4">
          <LogoAcademia {...academia} className="h-12" />
          <div>
            <h1 className="text-2xl font-bold text-white">Inscripción</h1>
            <p className="text-sm text-white/60">{academia.nombre}</p>
          </div>
        </div>
        <FormularioInscripcionAcademia slug={academia.slug} cursos={cursos} />
      </div>
    </main>
  );
}
