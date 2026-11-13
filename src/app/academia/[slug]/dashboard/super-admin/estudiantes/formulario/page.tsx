import { Suspense } from 'react';

import { AjustesFormularioAcademia } from '~/components/academy/AjustesFormularioAcademia';
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
        descripcion="Formulario público de inscripción: fechas de inicio, comerciales, logos y favicon. Sus inscripciones llegan a la lista de estudiantes."
        render={({ academia }) => (
          <div className="space-y-10">
            <AjustesFormularioAcademia slug={academia.slug} sinBorde />
            <div className="border-t border-[var(--ac-borde)] pt-8">
              <FormularioAcademia slug={academia.slug} />
            </div>
          </div>
        )}
      />
    </Suspense>
  );
}
