'use client';

import { useState } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import {
  BadgeCheck,
  Folder,
  Loader2,
  MessageSquare,
  Plus,
  PlusCircle,
} from 'lucide-react';
import useSWR from 'swr';

import { urlLogo } from '~/lib/academy/marca';

import { ModalCrearAcademia } from './_components/ModalCrearAcademia';

interface AcademiaFila {
  id: number;
  slug: string;
  nombre: string;
  acronimo: string | null;
  esArtiefy: boolean;
  logoKey: string | null;
  colorPrimario: string;
  activa: boolean;
  usuarios: number;
}

const obtener = async (url: string) => {
  const res = await fetch(url);
  const j = (await res.json()) as {
    academias?: AcademiaFila[];
    error?: string;
  };
  if (!res.ok) throw new Error(j.error ?? 'No se pudieron cargar');
  return j.academias ?? [];
};

export default function AcademiasPage() {
  const router = useRouter();
  const { data: academias, error } = useSWR(
    '/api/super-admin/academias',
    obtener
  );
  const [creando, setCreando] = useState(false);
  const abrir = (id: number) =>
    router.push(`/dashboard/super-admin/academias/${id}`);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 text-white sm:px-6">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold sm:text-4xl">Academias</h1>
          <p className="mt-1 text-white/60">
            Doble clic en una academia para abrir su panel.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/dashboard/super-admin/academias/tickets"
            className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-2.5 font-semibold text-white hover:bg-white/5"
          >
            <MessageSquare className="size-5" /> Tickets de academias
          </Link>
          <button
            type="button"
            onClick={() => setCreando(true)}
            className="inline-flex items-center gap-2 rounded-full bg-[#22C4D3] px-5 py-2.5 font-semibold text-[#04101f] shadow-[0_0_24px_rgba(34,196,211,0.35)] hover:bg-[#3ad4e2]"
          >
            <Plus className="size-5" /> Crear academia
          </button>
        </div>
      </div>

      {error ? (
        <p className="text-red-400">{(error as Error).message}</p>
      ) : !academias ? (
        <p className="flex items-center gap-2 text-white/50">
          <Loader2 className="size-4 animate-spin" /> Cargando…
        </p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <button
            type="button"
            onClick={() => setCreando(true)}
            className="flex min-h-[230px] flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-white/25 text-white hover:border-[#22C4D3]/60 hover:bg-white/[0.02]"
          >
            <PlusCircle className="size-6 text-white/80" />
            <span className="text-lg font-semibold">Crear academia</span>
          </button>

          {academias.map((a) => {
            const logo = urlLogo(a.logoKey);
            return (
              <div
                key={a.id}
                role="button"
                tabIndex={0}
                onDoubleClick={() => abrir(a.id)}
                onKeyDown={(e) => e.key === 'Enter' && abrir(a.id)}
                className={`group relative flex min-h-[230px] cursor-pointer flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#061c37] text-left transition-colors select-none hover:border-[#22C4D3]/40 ${
                  a.activa ? '' : 'opacity-60'
                }`}
              >
                {/* Pestaña de carpeta + dirección */}
                <div className="flex items-start justify-between">
                  <div className="flex h-14 w-36 items-center rounded-br-3xl bg-white/[0.05] px-7">
                    {logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={logo}
                        alt=""
                        className="max-h-8 max-w-24 object-contain"
                      />
                    ) : (
                      <Folder
                        className="size-7"
                        style={{ color: a.colorPrimario }}
                      />
                    )}
                  </div>
                  <span className="px-6 pt-5 text-sm text-white/60">
                    {a.slug}
                  </span>
                </div>

                <div className="flex flex-1 flex-col px-7 py-6">
                  <p className="text-4xl font-black tracking-wide">
                    {a.acronimo ?? a.nombre.slice(0, 3).toUpperCase()}
                  </p>
                  <p className="mt-2 text-white/60">{a.nombre}</p>
                  <div className="mt-auto flex flex-wrap items-center gap-2 pt-6">
                    {a.esArtiefy && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#22C4D3] px-3 py-1 text-sm font-semibold text-[#04101f]">
                        <BadgeCheck className="size-4" /> Artiefy
                      </span>
                    )}
                    {!a.activa && (
                      <span className="rounded-full bg-white/10 px-3 py-1 text-sm text-white/60">
                        Inactiva
                      </span>
                    )}
                    <span className="text-sm text-white/40">
                      {a.usuarios} {a.usuarios === 1 ? 'usuario' : 'usuarios'}
                    </span>
                    {/* En pantallas táctiles el doble clic no es confiable. */}
                    <Link
                      href={`/dashboard/super-admin/academias/${a.id}`}
                      className="ml-auto text-sm font-medium text-[#22C4D3] sm:hidden"
                    >
                      Abrir panel →
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {creando && (
        <ModalCrearAcademia
          onCerrar={() => setCreando(false)}
          onCreada={(id) => abrir(id)}
        />
      )}
    </div>
  );
}
