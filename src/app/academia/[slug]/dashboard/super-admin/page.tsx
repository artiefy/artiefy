import { Suspense } from 'react';

import { GestorUsuarios } from '~/components/academy/GestorUsuarios';
import { listarUsuarios } from '~/server/academy/usuarios';
import { ACADEMY_ROLES, type AcademyRole } from '~/server/db/schema';

import { PanelDeRol } from '../_components/PanelDeRol';

// <slug>.artiefy.com/dashboard/super-admin

type Props = { params: Promise<{ slug: string }> };

const PLURAL: Record<AcademyRole, string> = {
  'super-admin': 'Super-admins',
  educador: 'Educadores',
  estudiante: 'Estudiantes',
};

export default function SuperAdminAcademiaPage({ params }: Props) {
  return (
    <Suspense>
      <PanelDeRol
        params={params}
        rol="super-admin"
        render={({ academia, cuenta }) => (
          <div className="space-y-6">
            <Resumen academyId={academia.id} />
            <div id="usuarios" className="scroll-mt-16">
              <GestorUsuarios
                apiBase={`/api/academia/${academia.slug}/usuarios`}
                yoUserId={cuenta.userId}
              />
            </div>
          </div>
        )}
      />
    </Suspense>
  );
}

async function Resumen({ academyId }: { academyId: number }) {
  const usuarios = await listarUsuarios(academyId);
  return (
    <div className="grid grid-cols-3 gap-3">
      {ACADEMY_ROLES.map((rol) => (
        <div
          key={rol}
          className="rounded-2xl border border-[var(--ac-borde)] bg-[var(--ac-superficie)] p-4"
        >
          <p className="text-2xl font-bold text-[var(--ac-primario)] sm:text-3xl">
            {usuarios.filter((u) => u.role === rol).length}
          </p>
          <p className="text-xs text-white/60 sm:text-sm">{PLURAL[rol]}</p>
        </div>
      ))}
    </div>
  );
}
