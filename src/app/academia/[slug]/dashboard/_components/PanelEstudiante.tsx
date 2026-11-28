import Link from 'next/link';
import { notFound } from 'next/navigation';

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
 * de ESTA academia; el personal la ve en vista previa.
 */
export async function PanelEstudiante({
  params,
  render,
}: {
  params: Promise<{ slug: string }>;
  render: (s: {
    academia: Academia;
    cuenta: UsuarioAcademia;
    // true: super-admin o educador viendo el área del estudiante.
    previa: boolean;
  }) => React.ReactNode;
}) {
  const sesion = await sesionEnAcademia((await params).slug);
  if (!sesion) notFound();
  const { academia, cuenta } = sesion;
  if (!cuenta) {
    return <SinAcceso academia={academia} desactivada={sesion.desactivada} />;
  }
  // Como en Artiefy, el personal puede ver el área del estudiante: en vista
  // previa (todo abierto, sin guardar avance ni entregas).
  const previa = cuenta.role !== 'estudiante';
  return (
    <div className="min-h-dvh bg-background text-white">
      <EncabezadoAula />
      {previa && (
        <div className="border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-center text-sm text-amber-200">
          Vista previa del estudiante: ves todos los cursos con las clases
          abiertas. No se guarda avance ni entregas.{' '}
          <Link
            href={RUTA_DASHBOARD[cuenta.role] as Route}
            className="font-semibold underline"
          >
            Volver a mi panel
          </Link>
        </div>
      )}
      {render({ academia, cuenta, previa })}
    </div>
  );
}
