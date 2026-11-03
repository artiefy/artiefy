import { Suspense } from 'react';

import { redirect } from 'next/navigation';

import { sesionEnAcademia } from '~/app/academia/_cache/academia';
import { Header } from '~/components/estudiantes/layout/Header';
import { RUTA_DASHBOARD } from '~/server/academy/usuarios';

import HomePage from '../../page';

import type { Route } from 'next';

// Página principal de la academia (<slug>.artiefy.com/): la MISMA de Artiefy.
// El logo, el nombre y los colores salen de la marca que pone el layout de la
// academia (MarcaProvider + variables del tema).

type Props = { params: Promise<{ slug: string }> };

export default function InicioAcademiaPage({ params }: Props) {
  return (
    <>
      <Suspense fallback={null}>
        <RedirigirPrivilegiados params={params} />
      </Suspense>
      <Header />
      <HomePage />
    </>
  );
}

// Como en Artiefy: super-admin y educador van directo a su panel; el
// estudiante se queda en el inicio. Usa el rol DE LA ACADEMIA, no el de
// Artiefy (la HomePage ignora ese rol dentro de una academia).
async function RedirigirPrivilegiados({ params }: Props) {
  const sesion = await sesionEnAcademia((await params).slug);
  const rol = sesion?.cuenta?.role;
  if (rol === 'super-admin' || rol === 'educador') {
    redirect(RUTA_DASHBOARD[rol] as Route);
  }
  return null;
}
