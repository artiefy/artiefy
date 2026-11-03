'use client';

import { use, useState } from 'react';

import Link from 'next/link';

import { ArrowLeft, ExternalLink, ImageUp, Loader2, Save } from 'lucide-react';
import useSWR from 'swr';

import { GestorUsuarios } from '~/components/academy/GestorUsuarios';
import { urlAcademia } from '~/lib/academy/host';
import { urlLogo, variablesDeMarca } from '~/lib/academy/marca';
import { subirLogo } from '~/lib/academy/subir-logo';

interface Academia {
  id: number;
  slug: string;
  nombre: string;
  acronimo: string | null;
  tipo: 'personal' | 'empresa';
  documentoTipo: string | null;
  documentoNumero: string | null;
  esArtiefy: boolean;
  logoKey: string | null;
  colorPrimario: string;
  colorFondo: string;
  activa: boolean;
}

const campo =
  'h-11 w-full rounded-xl border border-white/10 bg-[#01142B] px-3 text-sm text-white placeholder:text-white/30 focus:border-[#22C4D3]/60 focus:outline-none';
const tarjeta = 'rounded-2xl border border-white/10 bg-[#061c37] p-4 sm:p-5';

export default function PanelAcademiaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const api = `/api/super-admin/academias/${id}`;
  const { data, error, mutate } = useSWR(api, async (url: string) => {
    const res = await fetch(url);
    const j = (await res.json()) as { academia?: Academia; error?: string };
    if (!res.ok || !j.academia) throw new Error(j.error ?? 'No encontrada');
    return j.academia;
  });

  if (error) {
    return (
      <p className="p-10 text-center text-red-400">
        {(error as Error).message}
      </p>
    );
  }
  if (!data) {
    return (
      <p className="flex items-center justify-center gap-2 p-10 text-white/50">
        <Loader2 className="size-4 animate-spin" /> Cargando…
      </p>
    );
  }
  // key: al recargar la academia, los formularios toman los valores nuevos.
  return (
    <Panel
      key={`${data.id}:${data.slug}:${data.logoKey}`}
      academia={data}
      api={api}
      recargar={() => void mutate()}
    />
  );
}

function Panel({
  academia,
  api,
  recargar,
}: {
  academia: Academia;
  api: string;
  recargar: () => void;
}) {
  const [form, setForm] = useState(academia);
  const [subiendo, setSubiendo] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState<{ ok: boolean; texto: string } | null>(
    null
  );
  const logo = urlLogo(form.logoKey);

  const guardar = async (cambios: Partial<Academia>) => {
    setGuardando(true);
    setAviso(null);
    try {
      const res = await fetch(api, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cambios),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(j.error ?? 'No se pudo guardar');
      setAviso({ ok: true, texto: 'Cambios guardados.' });
      recargar();
    } catch (err) {
      setAviso({ ok: false, texto: (err as Error).message });
    } finally {
      setGuardando(false);
    }
  };

  const cambiarLogo = async (file: File | undefined) => {
    if (!file) return;
    setSubiendo(true);
    setAviso(null);
    try {
      const logoKey = await subirLogo(file);
      setForm((f) => ({ ...f, logoKey }));
      await guardar({ logoKey });
    } catch (err) {
      setAviso({ ok: false, texto: (err as Error).message });
    } finally {
      setSubiendo(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-5 px-4 py-8 text-white sm:px-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/dashboard/super-admin/academias"
          className="inline-flex items-center gap-2 text-white/70 hover:text-white"
        >
          <ArrowLeft className="size-5" /> Academias
        </Link>
        <button
          type="button"
          onClick={() =>
            window.open(
              urlAcademia(academia.slug, '/', window.location.origin),
              '_blank'
            )
          }
          className="ml-auto inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm hover:bg-white/5"
        >
          {academia.slug}.artiefy.com <ExternalLink className="size-4" />
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-bold">{academia.nombre}</h1>
        <button
          type="button"
          disabled={guardando}
          onClick={() => void guardar({ activa: !academia.activa })}
          className={`rounded-full px-3 py-1 text-sm font-medium ${
            academia.activa
              ? 'bg-emerald-500/15 text-emerald-300'
              : 'bg-white/10 text-white/60'
          }`}
          title="Clic para cambiar"
        >
          {academia.activa ? 'Activa' : 'Inactiva'}
        </button>
      </div>

      {aviso && (
        <p
          className={`rounded-lg px-3 py-2 text-sm ${
            aviso.ok
              ? 'bg-emerald-500/10 text-emerald-300'
              : 'bg-red-500/10 text-red-300'
          }`}
        >
          {aviso.texto}
        </p>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Marca */}
        <section className={tarjeta}>
          <h2 className="text-lg font-bold">Marca</h2>
          <p className="mb-4 text-sm text-white/50">
            Logo y colores que verán sus usuarios.
          </p>

          <label className="flex cursor-pointer items-center gap-4 rounded-xl border border-dashed border-white/20 p-4 hover:border-[#22C4D3]/50">
            <span className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white/5">
              {subiendo ? (
                <Loader2 className="size-5 animate-spin" />
              ) : logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logo}
                  alt="Logo"
                  className="size-full object-contain"
                />
              ) : (
                <ImageUp className="size-6 text-white/50" />
              )}
            </span>
            <span className="text-sm">
              <span className="font-semibold">
                {logo ? 'Cambiar logo' : 'Subir logo'}
              </span>
              <span className="block text-white/50">
                PNG, JPG, WEBP o SVG · máx. 2 MB
              </span>
            </span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              className="sr-only"
              onChange={(e) => void cambiarLogo(e.target.files?.[0])}
            />
          </label>

          <div className="mt-4 grid grid-cols-2 gap-3">
            {(
              [
                ['colorPrimario', 'Color principal'],
                ['colorFondo', 'Color de fondo'],
              ] as const
            ).map(([clave, etiqueta]) => (
              <label key={clave} className="text-sm">
                <span className="mb-1 block text-white/70">{etiqueta}</span>
                <span className="flex h-11 items-center gap-2 rounded-xl border border-white/10 bg-[#01142B] px-2">
                  <input
                    type="color"
                    value={form[clave]}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        [clave]: e.target.value.toUpperCase(),
                      })
                    }
                    className="size-7 cursor-pointer rounded border-0 bg-transparent"
                  />
                  <span className="font-mono text-xs">{form[clave]}</span>
                </span>
              </label>
            ))}
          </div>

          {/* Vista previa con los colores elegidos */}
          <div
            className="mt-4 rounded-xl border p-4"
            style={{
              ...variablesDeMarca(form.colorPrimario, form.colorFondo),
              background: 'var(--ac-fondo)',
              borderColor: 'var(--ac-borde)',
            }}
          >
            <div className="flex items-center gap-2">
              {logo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logo} alt="" className="h-7 object-contain" />
              )}
              <span className="font-bold">{form.nombre}</span>
            </div>
            <span
              className="mt-3 inline-block rounded-full px-4 py-1.5 text-sm font-semibold"
              style={{
                background: 'var(--ac-primario)',
                color: 'var(--ac-primario-texto)',
              }}
            >
              Botón de ejemplo
            </span>
          </div>

          <button
            type="button"
            disabled={guardando}
            onClick={() =>
              void guardar({
                colorPrimario: form.colorPrimario,
                colorFondo: form.colorFondo,
              })
            }
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#22C4D3] px-4 py-2 text-sm font-semibold text-[#04101f] disabled:opacity-50"
          >
            <Save className="size-4" /> Guardar colores
          </button>
        </section>

        {/* Datos */}
        <section className={tarjeta}>
          <h2 className="mb-4 text-lg font-bold">Datos</h2>
          <div className="space-y-3">
            <label className="block text-sm">
              <span className="mb-1 block text-white/70">Nombre</span>
              <input
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                className={campo}
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm">
                <span className="mb-1 block text-white/70">Acrónimo</span>
                <input
                  value={form.acronimo ?? ''}
                  onChange={(e) =>
                    setForm({ ...form, acronimo: e.target.value.toUpperCase() })
                  }
                  className={campo}
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-white/70">
                  {form.tipo === 'empresa' ? 'NIT' : form.documentoTipo}
                </span>
                <input
                  value={form.documentoNumero ?? ''}
                  onChange={(e) =>
                    setForm({ ...form, documentoNumero: e.target.value })
                  }
                  className={campo}
                />
              </label>
            </div>
            <label className="block text-sm">
              <span className="mb-1 block text-white/70">Dirección (URL)</span>
              <span className="flex h-11 items-center rounded-xl border border-white/10 bg-[#01142B] pr-3">
                <input
                  value={form.slug}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      slug: e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9-]/g, ''),
                    })
                  }
                  className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm text-[#22C4D3] focus:outline-none"
                />
                <span className="text-xs text-white/50">.artiefy.com</span>
              </span>
              {form.slug !== academia.slug && (
                <span className="mt-1 block text-xs text-amber-300">
                  Cambiar la dirección rompe los enlaces que ya tengan sus
                  usuarios.
                </span>
              )}
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.esArtiefy}
                onChange={(e) =>
                  setForm({ ...form, esArtiefy: e.target.checked })
                }
                className="accent-[#22C4D3]"
              />
              Esta academia es parte de Artiefy
            </label>
          </div>
          <button
            type="button"
            disabled={guardando}
            onClick={() =>
              void guardar({
                nombre: form.nombre,
                acronimo: form.acronimo,
                documentoNumero: form.documentoNumero,
                slug: form.slug,
                esArtiefy: form.esArtiefy,
              })
            }
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#22C4D3] px-4 py-2 text-sm font-semibold text-[#04101f] disabled:opacity-50"
          >
            <Save className="size-4" /> Guardar datos
          </button>
        </section>
      </div>

      <GestorUsuarios apiBase={`${api}/usuarios`} />
    </div>
  );
}
