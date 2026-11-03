import { Suspense } from 'react';

import { notFound, redirect } from 'next/navigation';

import { sesionEnAcademia } from '~/app/academia/_cache/academia';
import { SinAcceso } from '~/components/academy/SinAcceso';
import { RUTA_DASHBOARD } from '~/server/academy/usuarios';

import type { Route } from 'next';

// /dashboard de la academia: manda a cada cuenta al panel de su rol.

type Props = { params: Promise<{ slug: string }> };

export default function DashboardAcademiaPage({ params }: Props) {
  return (
    <Suspense>
      <Redireccion params={params} />
    </Suspense>
  );
}

async function Redireccion({ params }: Props) {
  const sesion = await sesionEnAcademia((await params).slug);
  if (!sesion) notFound();
  if (!sesion.cuenta) return <SinAcceso academia={sesion.academia} />;
  redirect(RUTA_DASHBOARD[sesion.cuenta.role] as Route);
}
