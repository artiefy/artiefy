import { Suspense } from 'react';

import { notFound, redirect } from 'next/navigation';

import { sesionEnAcademia } from '~/app/academia/_cache/academia';
import { RUTA_DASHBOARD } from '~/server/academy/usuarios';

import type { Route } from 'next';

// Raíz de la academia (<slug>.artiefy.com/): las academias no tienen página
// de inicio. Sin sesión se va directo al login; con cuenta, al panel de su
// rol; con sesión pero sin cuenta en esta academia, /dashboard muestra el
// aviso de "sin acceso".

type Props = { params: Promise<{ slug: string }> };

export default function InicioAcademiaPage({ params }: Props) {
  return (
    <Suspense fallback={null}>
      <Redireccion params={params} />
    </Suspense>
  );
}

async function Redireccion({ params }: Props): Promise<null> {
  const sesion = await sesionEnAcademia((await params).slug);
  if (!sesion) notFound();
  if (!sesion.userId) redirect('/sign-in' as Route);
  redirect(
    (sesion.cuenta ? RUTA_DASHBOARD[sesion.cuenta.role] : '/dashboard') as Route
  );
}
