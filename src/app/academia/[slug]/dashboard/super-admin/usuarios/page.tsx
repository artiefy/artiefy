import { Suspense } from 'react';

import { UsuariosAcademia } from '~/components/academy/UsuariosAcademia';

import { PanelDeRol } from '../../_components/PanelDeRol';

// <slug>.artiefy.com/dashboard/super-admin/usuarios — Usuarios y Roles › Todos
// (el mismo "Administrador de usuarios" de Artiefy).

type Props = { params: Promise<{ slug: string }> };

export default function UsuariosAcademiaPage({ params }: Props) {
  return (
    <Suspense>
      <PanelDeRol
        params={params}
        rol="super-admin"
        saludo={false}
        anchoCompleto
        render={({ academia, cuenta }) => (
          <UsuariosAcademia slug={academia.slug} yoUserId={cuenta.userId} />
        )}
      />
    </Suspense>
  );
}
