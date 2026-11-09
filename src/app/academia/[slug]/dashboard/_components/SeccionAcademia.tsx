import { type Academia } from '~/server/academy/academias';
import { type UsuarioAcademia } from '~/server/academy/usuarios';

import { PanelDeRol } from './PanelDeRol';

/**
 * Página de una sección del panel de super-admin de la academia: el panel
 * con el título de la sección arriba y su contenido.
 */
export function SeccionAcademia({
  params,
  titulo,
  descripcion,
  render,
}: {
  params: Promise<{ slug: string }>;
  titulo: string;
  descripcion?: string;
  render: (s: {
    academia: Academia;
    cuenta: UsuarioAcademia;
  }) => React.ReactNode;
}) {
  return (
    <PanelDeRol
      params={params}
      rol="super-admin"
      saludo={false}
      render={(s) => (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-white sm:text-3xl">
              {titulo}
            </h1>
            {descripcion && (
              <p className="mt-1 text-sm text-white/60">{descripcion}</p>
            )}
          </div>
          {render(s)}
        </div>
      )}
    />
  );
}
