'use client';

import { useRef, useState } from 'react';

import {
  ClipboardList,
  Copy,
  ExternalLink,
  ImagePlus,
  Loader2,
  Plus,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import useSWR from 'swr';

import { urlAcademia } from '~/lib/academy/host';
import { urlLogo } from '~/lib/academy/marca';
import { subirLogo } from '~/lib/academy/subir-logo';

import { enviar } from './seccion/comun';

// Configuraciones › "Formulario de inscripción y favicon": favicon de la
// academia, logos de "Organiza" del formulario público, fechas de inicio y
// comerciales. Las sedes y horarios salen de sus catálogos (Espacios y
// Horarios). Cada cambio se guarda al instante.

interface Ajustes {
  faviconKey: string | null;
  formularioLogos: string[];
  formularioFechas: string[];
  formularioComerciales: string[];
}

const fmtFecha = (f: string) =>
  new Date(`${f}T12:00:00`).toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

const chip =
  'inline-flex items-center gap-1.5 rounded-full border border-[var(--ac-borde)] bg-[var(--ac-superficie)] px-3 py-1 text-sm text-white';
const campo =
  'h-10 rounded-xl border border-[var(--ac-borde)] bg-[var(--ac-superficie)] px-3 text-sm text-white placeholder:text-white/30 focus:border-[var(--ac-primario)] focus:outline-none [color-scheme:inherit]';

export function AjustesFormularioAcademia({ slug }: { slug: string }) {
  const api = `/api/academia/${slug}/ajustes`;
  const { data, mutate } = useSWR(
    [api, 'ajustes'],
    async ([url]: [string, string]) => {
      const res = await fetch(url);
      const j = (await res.json().catch(() => ({}))) as Ajustes & {
        error?: string;
      };
      if (!res.ok) throw new Error(j.error ?? 'No se pudo cargar');
      return j;
    }
  );
  const [subiendo, setSubiendo] = useState<'favicon' | 'logo' | null>(null);
  const [fecha, setFecha] = useState('');
  const [comercial, setComercial] = useState('');
  const faviconRef = useRef<HTMLInputElement>(null);
  const logoRef = useRef<HTMLInputElement>(null);
  const enlace =
    typeof window === 'undefined'
      ? ''
      : urlAcademia(slug, '/dashboard/formulario', window.location.origin);

  const guardar = async (cambio: Partial<Ajustes>, ok: string) => {
    try {
      const nuevos = (await enviar(api, 'PATCH', cambio)) as Ajustes;
      await mutate(nuevos, { revalidate: false });
      toast.success(ok);
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const subir = async (tipo: 'favicon' | 'logo', file: File | undefined) => {
    if (!file || !data) return;
    setSubiendo(tipo);
    try {
      const key = await subirLogo(file);
      await guardar(
        tipo === 'favicon'
          ? { faviconKey: key }
          : { formularioLogos: [...data.formularioLogos, key] },
        tipo === 'favicon' ? 'Favicon actualizado' : 'Logo agregado'
      );
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setSubiendo(null);
    }
  };

  if (!data) {
    return (
      <section className="mt-8 border-t border-[var(--ac-borde)] pt-8">
        <Loader2 className="size-5 animate-spin text-white/50" />
      </section>
    );
  }

  const favicon = urlLogo(data.faviconKey);

  return (
    <section className="mt-8 space-y-6 border-t border-[var(--ac-borde)] pt-8">
      <div>
        <h2 className="flex items-center gap-2 text-xl font-bold text-white">
          <ClipboardList className="size-5 text-[var(--ac-primario)]" />
          Formulario de inscripción y favicon
        </h2>
        <p className="text-sm text-white/60">
          Las inscripciones del formulario llegan a tu lista de estudiantes. Las
          sedes y horarios salen de los catálogos Espacios y Horarios.
        </p>
      </div>

      {enlace && (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-[var(--ac-borde)] bg-[var(--ac-superficie)] p-3 text-sm">
          <span className="min-w-0 flex-1 truncate text-white/80">
            {enlace}
          </span>
          <button
            type="button"
            onClick={() =>
              void navigator.clipboard
                .writeText(enlace)
                .then(() => toast.success('Enlace copiado'))
            }
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[var(--ac-borde)] px-3 text-white hover:bg-white/5"
          >
            <Copy className="size-4" /> Copiar
          </button>
          <a
            href={enlace}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[var(--ac-primario)] px-3 font-semibold text-[var(--ac-primario-texto)]"
          >
            <ExternalLink className="size-4" /> Abrir formulario
          </a>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Favicon */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-white/80">Favicon</p>
          <div className="flex items-center gap-3">
            <div className="flex size-14 items-center justify-center rounded-xl border border-[var(--ac-borde)] bg-[var(--ac-superficie)]">
              {favicon ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={favicon}
                  alt="Favicon"
                  className="size-8 object-contain"
                />
              ) : (
                <span className="text-[10px] text-white/40">Logo</span>
              )}
            </div>
            <button
              type="button"
              onClick={() => faviconRef.current?.click()}
              disabled={subiendo !== null}
              className="inline-flex h-10 items-center gap-2 rounded-full border border-[var(--ac-borde)] px-4 text-sm text-white hover:bg-white/5 disabled:opacity-50"
            >
              {subiendo === 'favicon' ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ImagePlus className="size-4" />
              )}
              {favicon ? 'Cambiar' : 'Subir favicon'}
            </button>
            {favicon && (
              <button
                type="button"
                onClick={() =>
                  void guardar({ faviconKey: null }, 'Favicon quitado')
                }
                className="text-sm text-red-400 hover:underline"
              >
                Quitar
              </button>
            )}
            <input
              ref={faviconRef}
              type="file"
              accept="image/png,image/svg+xml,image/webp,image/jpeg"
              className="hidden"
              onChange={(e) => {
                void subir('favicon', e.target.files?.[0]);
                e.target.value = '';
              }}
            />
          </div>
          <p className="text-xs text-white/50">
            Cuadrado, PNG o SVG. Sin favicon se usa el logo de la academia.
          </p>
        </div>

        {/* Logos del formulario */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-white/80">
            Logos de “Organiza”
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-lg border border-dashed border-[var(--ac-borde)] px-3 py-2 text-xs text-white/50">
              Logo de la academia (siempre primero)
            </span>
            {data.formularioLogos.map((k) => (
              <span
                key={k}
                className="relative flex h-12 items-center rounded-lg border border-[var(--ac-borde)] bg-[var(--ac-superficie)] px-2"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={urlLogo(k) ?? ''}
                  alt="Logo"
                  className="h-9 max-w-28 object-contain"
                />
                <button
                  type="button"
                  aria-label="Quitar logo"
                  onClick={() =>
                    void guardar(
                      {
                        formularioLogos: data.formularioLogos.filter(
                          (x) => x !== k
                        ),
                      },
                      'Logo quitado'
                    )
                  }
                  className="absolute -top-2 -right-2 flex size-5 items-center justify-center rounded-full bg-red-500 text-white"
                >
                  <X className="size-3" />
                </button>
              </span>
            ))}
            {data.formularioLogos.length < 6 && (
              <button
                type="button"
                onClick={() => logoRef.current?.click()}
                disabled={subiendo !== null}
                className="inline-flex h-12 items-center gap-2 rounded-lg border border-[var(--ac-borde)] px-3 text-sm text-white hover:bg-white/5 disabled:opacity-50"
              >
                {subiendo === 'logo' ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Plus className="size-4" />
                )}
                Agregar logo
              </button>
            )}
            <input
              ref={logoRef}
              type="file"
              accept="image/png,image/svg+xml,image/webp,image/jpeg"
              className="hidden"
              onChange={(e) => {
                void subir('logo', e.target.files?.[0]);
                e.target.value = '';
              }}
            />
          </div>
        </div>

        {/* Fechas de inicio */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-white/80">Fechas de inicio</p>
          <div className="flex flex-wrap gap-2">
            {data.formularioFechas.map((f) => (
              <span key={f} className={chip}>
                {fmtFecha(f)}
                <button
                  type="button"
                  aria-label="Quitar fecha"
                  onClick={() =>
                    void guardar(
                      {
                        formularioFechas: data.formularioFechas.filter(
                          (x) => x !== f
                        ),
                      },
                      'Fecha quitada'
                    )
                  }
                  className="text-white/40 hover:text-red-400"
                >
                  <X className="size-3.5" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className={campo}
            />
            <button
              type="button"
              disabled={!fecha}
              onClick={() => {
                void guardar(
                  { formularioFechas: [...data.formularioFechas, fecha] },
                  'Fecha agregada'
                );
                setFecha('');
              }}
              className="inline-flex h-10 items-center gap-1.5 rounded-full bg-[var(--ac-primario)] px-4 text-sm font-semibold text-[var(--ac-primario-texto)] disabled:opacity-40"
            >
              <Plus className="size-4" /> Agregar
            </button>
          </div>
        </div>

        {/* Comerciales */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-white/80">Comerciales</p>
          <div className="flex flex-wrap gap-2">
            {data.formularioComerciales.map((c) => (
              <span key={c} className={chip}>
                {c}
                <button
                  type="button"
                  aria-label="Quitar comercial"
                  onClick={() =>
                    void guardar(
                      {
                        formularioComerciales:
                          data.formularioComerciales.filter((x) => x !== c),
                      },
                      'Comercial quitado'
                    )
                  }
                  className="text-white/40 hover:text-red-400"
                >
                  <X className="size-3.5" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={comercial}
              onChange={(e) => setComercial(e.target.value)}
              placeholder="Nombre o contacto del comercial"
              className={`${campo} flex-1`}
            />
            <button
              type="button"
              disabled={!comercial.trim()}
              onClick={() => {
                void guardar(
                  {
                    formularioComerciales: [
                      ...data.formularioComerciales,
                      comercial.trim(),
                    ],
                  },
                  'Comercial agregado'
                );
                setComercial('');
              }}
              className="inline-flex h-10 items-center gap-1.5 rounded-full bg-[var(--ac-primario)] px-4 text-sm font-semibold text-[var(--ac-primario-texto)] disabled:opacity-40"
            >
              <Plus className="size-4" /> Agregar
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
