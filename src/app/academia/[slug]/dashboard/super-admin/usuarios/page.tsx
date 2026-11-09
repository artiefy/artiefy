import { Suspense } from 'react';

import { GestorUsuarios } from '~/components/academy/GestorUsuarios';

import { PanelDeRol } from '../../_components/PanelDeRol';

// <slug>.artiefy.com/dashboard/super-admin/usuarios — Usuarios y Roles › Todos.

type Props = { params: Promise<{ slug: string }> };

export default function UsuariosAcademiaPage({ params }: Props) {
  return (
    <Suspense>
      <PanelDeRol
        params={params}
        rol="super-admin"
        saludo={false}
        render={({ academia, cuenta }) => (
          <div className="space-y-4">
            <h1 className="text-2xl font-bold text-white">Usuarios y Roles</h1>
            <GestorUsuarios
              apiBase={`/api/academia/${academia.slug}/usuarios`}
              yoUserId={cuenta.userId}
            />
          </div>
        )}
      />
    </Suspense>
  );
}
