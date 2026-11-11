import { Suspense } from 'react';

import { notFound } from 'next/navigation';

import { academiaDeLaPagina } from '~/app/academia/_cache/academia';
import { FormularioPublicoAcademia } from '~/components/academy/FormularioPublicoAcademia';
import { urlLogo } from '~/lib/academy/marca';
import { obtenerAjustes } from '~/server/academy/ajustes';

// <slug>.artiefy.com/dashboard/formulario — PÚBLICO: el formulario de
// inscripción de Artiefy en la academia. Las inscripciones llegan a su lista
// de estudiantes; los logos de "Organiza" se configuran en Configuraciones.

type Props = { params: Promise<{ slug: string }> };

export default function FormularioAcademiaPage({ params }: Props) {
  return (
    <Suspense>
      <Formulario params={params} />
    </Suspense>
  );
}

async function Formulario({ params }: Props) {
  const academia = await academiaDeLaPagina((await params).slug);
  if (!academia?.activa) notFound();
  const ajustes = await obtenerAjustes(academia.id);
  const logos = [
    urlLogo(academia.logoKey),
    ...ajustes.formularioLogos.map((k) => urlLogo(k)),
  ].filter((u): u is string => Boolean(u));
  return (
    <FormularioPublicoAcademia
      slug={academia.slug}
      nombre={academia.nombre}
      logos={logos}
    />
  );
}
