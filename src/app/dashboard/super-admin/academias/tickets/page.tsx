'use client';

import Link from 'next/link';

import { ArrowLeft } from 'lucide-react';

import { TicketsAcademia } from '~/components/academy/seccion/TicketsAcademia';
import { COLORES_POR_DEFECTO, variablesDeMarca } from '~/lib/academy/marca';

// /dashboard/super-admin/academias/tickets — tickets de todas las academias
// (super-admin de Artiefy). Los componentes de academia usan las variables de
// marca (--ac-*): aquí van con los colores de Artiefy.

export default function TicketsAcademiasPage() {
  return (
    <div
      className="space-y-4 p-4 text-white sm:p-6"
      style={variablesDeMarca(
        COLORES_POR_DEFECTO.primario,
        COLORES_POR_DEFECTO.fondo
      )}
    >
      <Link
        href="/dashboard/super-admin/academias"
        className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white"
      >
        <ArrowLeft className="size-4" /> Academias
      </Link>
      <TicketsAcademia
        api="/api/super-admin/academias/tickets"
        modo="artiefy"
      />
    </div>
  );
}
