import { notFound, redirect } from 'next/navigation';

import { sesionEnAcademia } from '~/app/academia/_cache/academia';
import { EncabezadoAula } from '~/components/academy/aula/EncabezadoAula';
import { SinAcceso } from '~/components/academy/SinAcceso';
import { type Academia } from '~/server/academy/academias';
import {
  RUTA_DASHBOARD,
  type UsuarioAcademia,
} from '~/server/academy/usuarios';

import type { Route } from 'next';

/**
 * Marco del estudiante de una academia: como el área /estudiantes de Artiefy
 * (barra superior, sin el menú lateral de administración). Exige una cuenta
 * de estudiante de ESTA academia; otro rol va a su propio panel.
 */
export async function PanelEstudiante({
  params,
  render,
}: {
  params: Promise<{ slug: string }>;
  render: (s: {
    academia: Academia;
    cuenta: UsuarioAcademia;
  }) => React.ReactNode;
}) {
  const sesion = await sesionEnAcademia((await params).slug);
  if (!sesion) notFound();
  const { academia, cuenta } = sesion;
  if (!cuenta) {
    return <SinAcceso academia={academia} desactivada={sesion.desactivada} />;
  }
  if (cuenta.role !== 'estudiante') {
    redirect(RUTA_DASHBOARD[cuenta.role] as Route);
  }
  return (
    <div className="min-h-dvh bg-background text-white">
      <EncabezadoAula />
      {render({ academia, cuenta })}
    </div>
  );
}
