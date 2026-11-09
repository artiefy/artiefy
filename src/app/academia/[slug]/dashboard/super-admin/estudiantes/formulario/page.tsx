import { Suspense } from 'react';

import { FormularioAcademia } from '~/components/academy/seccion/FormularioAcademia';

import { SeccionAcademia } from '../../../_components/SeccionAcademia';

// <slug>.artiefy.com/dashboard/super-admin/estudiantes/formulario

type Props = { params: Promise<{ slug: string }> };

export default function FormularioAcademiaPage({ params }: Props) {
  return (
    <Suspense>
      <SeccionAcademia
        params={params}
        titulo="Formulario"
        descripcion="Inscripciones recibidas desde el formulario público de la academia."
        render={({ academia }) => <FormularioAcademia slug={academia.slug} />}
      />
    </Suspense>
  );
}
