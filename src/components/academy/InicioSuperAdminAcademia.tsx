'use client';

import { useEffect, useRef, useState } from 'react';

import { useRouter } from 'next/navigation';

import {
  BarChart3,
  Building2,
  Check,
  Globe,
  GraduationCap,
  Loader2,
  Moon,
  Palette,
  RotateCcw,
  Settings,
  Sun,
  User,
  UserPlus,
  Users,
} from 'lucide-react';

import { urlAcademia } from '~/lib/academy/host';
import {
  COLORES_POR_DEFECTO,
  FONDOS_POR_MODO,
  modoDeFondo,
  variablesDeMarca,
} from '~/lib/academy/marca';

// Inicio del super-admin de una academia: pestañas Estadísticas y
// Configuraciones (datos y colores de la academia).

export interface DatosAcademiaInicio {
  slug: string;
  nombre: string;
  acronimo: string | null;
  tipo: 'personal' | 'empresa';
  documentoTipo: string | null;
  documentoNumero: string | null;
  esArtiefy: boolean;
  colorPrimario: string;
  colorFondo: string;
}

export interface EstadisticasAcademia {
  usuarios: number;
  estudiantes: number;
  educadores: number;
  recientes: {
    id: number;
    name: string | null;
    email: string;
    rol: string;
    fecha: string;
  }[];
}

const TIPOS_DOCUMENTO = ['C.C', 'T.I', 'C.E', 'Pasaporte'];

const campo =
  'h-11 w-full rounded-xl border border-[var(--ac-borde)] bg-[var(--ac-fondo)] px-3 text-sm text-white placeholder:text-white/30 focus:border-[var(--ac-primario)] focus:outline-none';
const etiqueta = 'mb-1.5 block text-sm font-semibold text-white';

const fmtFecha = (iso: string) =>
  new Date(iso).toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

export function InicioSuperAdminAcademia({
  academia,
  estadisticas,
}: {
  academia: DatosAcademiaInicio;
  estadisticas: EstadisticasAcademia;
}) {
  const [pestana, setPestana] = useState<'estadisticas' | 'configuraciones'>(
    'estadisticas'
  );
  const pildora = (activa: boolean) =>
    `inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold transition-colors ${
      activa
        ? 'bg-[var(--ac-primario)] text-[var(--ac-primario-texto)]'
        : 'bg-[var(--ac-superficie)] text-white hover:bg-white/10'
    }`;

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-[var(--ac-primario)]">
          {academia.slug}.artiefy.com
        </p>
        <h1 className="mt-1 text-3xl font-bold text-white sm:text-4xl">
          {academia.nombre}
        </h1>
        <p className="mt-2 text-white/60">
          Panel de la academia{academia.acronimo ? ` ${academia.acronimo}` : ''}
          .
        </p>
      </div>

      <div className="flex flex-wrap gap-3" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={pestana === 'estadisticas'}
          onClick={() => setPestana('estadisticas')}
          className={pildora(pestana === 'estadisticas')}
        >
          <BarChart3 className="size-4" /> Estadísticas
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={pestana === 'configuraciones'}
          onClick={() => setPestana('configuraciones')}
          className={pildora(pestana === 'configuraciones')}
        >
          <Settings className="size-4" /> Configuraciones
        </button>
      </div>

      {pestana === 'estadisticas' ? (
        <Estadisticas e={estadisticas} />
      ) : (
        <Configuraciones academia={academia} />
      )}
    </div>
  );
}

function Estadisticas({ e }: { e: EstadisticasAcademia }) {
  const tarjetas = [
    { icono: Users, valor: e.usuarios, texto: 'Usuarios nuevos' },
    { icono: GraduationCap, valor: e.estudiantes, texto: 'Estudiantes nuevos' },
    { icono: UserPlus, valor: e.educadores, texto: 'Educadores nuevos' },
  ];
  return (
    <div className="space-y-8">
      <div>
        <p className="mb-5 text-sm text-white/60">Últimos 7 días</p>
        <div className="grid gap-6 sm:grid-cols-3">
          {tarjetas.map(({ icono: Icono, valor, texto }) => (
            <div
              key={texto}
              className="border-l-2 border-[var(--ac-primario)] py-1 pl-6"
            >
              <Icono className="size-6 text-[var(--ac-primario)]" />
              <p className="mt-4 text-4xl font-bold text-white">{valor}</p>
              <p className="mt-1 text-white/60">{texto}</p>
            </div>
          ))}
        </div>
      </div>

      <section className="border-t border-[var(--ac-borde)] pt-8">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-xl font-bold text-white">
            <UserPlus className="size-5 text-[var(--ac-primario)]" />
            Usuarios nuevos
          </h2>
          <span className="rounded-full bg-[var(--ac-primario)] px-4 py-1.5 text-sm font-semibold text-[var(--ac-primario-texto)]">
            +{e.usuarios} esta semana
          </span>
        </div>
        {e.recientes.length === 0 ? (
          <p className="py-6 text-sm text-white/50">
            No hay usuarios nuevos esta semana.
          </p>
        ) : (
          <ul>
            {e.recientes.map((u) => (
              <li
                key={u.id}
                className="flex items-center justify-between gap-4 border-b border-[var(--ac-borde)] py-4"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-white">
                    {u.name ?? u.email}
                  </p>
                  <p className="truncate text-sm text-white/60">{u.email}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm text-white">{u.rol}</p>
                  <p className="text-sm text-white/50">{fmtFecha(u.fecha)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

// Aplica los colores en :root como estilo en línea: tapa la regla del layout
// (cssDeMarca), así el cambio se ve al instante en toda la página, portales
// incluidos. null quita el estilo en línea y vuelve a la marca guardada.
function aplicarColores(colores: { primario: string; fondo: string } | null) {
  const raiz = document.documentElement.style;
  const vars = variablesDeMarca(
    colores?.primario ?? COLORES_POR_DEFECTO.primario,
    colores?.fondo ?? COLORES_POR_DEFECTO.fondo
  ) as Record<string, string>;
  for (const [k, v] of Object.entries(vars)) {
    if (colores) raiz.setProperty(k, v);
    else raiz.removeProperty(k);
  }
  // Controles nativos (selects, fechas, scroll) en el modo del fondo.
  raiz.colorScheme = colores
    ? modoDeFondo(colores.fondo) === 'claro'
      ? 'light'
      : 'dark'
    : '';
}

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

function Configuraciones({ academia }: { academia: DatosAcademiaInicio }) {
  const router = useRouter();
  const [form, setForm] = useState(academia);
  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState<{ ok: boolean; texto: string } | null>(
    null
  );
  // Colores con los que se entró: al salir sin guardar se restauran.
  const guardados = useRef({
    primario: academia.colorPrimario,
    fondo: academia.colorFondo,
  });

  // Vista previa en vivo: cada cambio de color se aplica a toda la página.
  useEffect(() => {
    if (HEX_RE.test(form.colorPrimario) && HEX_RE.test(form.colorFondo)) {
      aplicarColores({ primario: form.colorPrimario, fondo: form.colorFondo });
    }
  }, [form.colorPrimario, form.colorFondo]);

  // Al salir de la pestaña sin guardar, vuelve a los colores guardados.
  useEffect(
    () => () => {
      aplicarColores(guardados.current);
    },
    []
  );

  const cambio = <K extends keyof DatosAcademiaInicio>(
    clave: K,
    valor: DatosAcademiaInicio[K]
  ) => setForm((f) => ({ ...f, [clave]: valor }));

  const hayCambios = (
    Object.keys(academia) as (keyof DatosAcademiaInicio)[]
  ).some((k) => form[k] !== academia[k]);

  const cancelar = () => {
    setForm(academia);
    setAviso(null);
  };

  const guardar = async () => {
    if (!HEX_RE.test(form.colorPrimario) || !HEX_RE.test(form.colorFondo)) {
      setAviso({
        ok: false,
        texto: 'Los colores deben tener el formato #RRGGBB.',
      });
      return;
    }
    setGuardando(true);
    setAviso(null);
    try {
      const res = await fetch(`/api/academia/${academia.slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: form.nombre,
          acronimo: form.acronimo,
          tipo: form.tipo,
          documentoTipo: form.tipo === 'empresa' ? 'NIT' : form.documentoTipo,
          documentoNumero: form.documentoNumero,
          slug: form.slug,
          colorPrimario: form.colorPrimario,
          colorFondo: form.colorFondo,
        }),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(j.error ?? 'No se pudo guardar');
      guardados.current = {
        primario: form.colorPrimario.toUpperCase(),
        fondo: form.colorFondo.toUpperCase(),
      };
      // Nueva dirección: la academia ahora vive en otro subdominio.
      if (form.slug !== academia.slug) {
        window.location.href = urlAcademia(
          form.slug,
          '/dashboard/super-admin',
          window.location.origin
        );
        return;
      }
      setAviso({ ok: true, texto: 'Cambios guardados.' });
      router.refresh();
    } catch (err) {
      setAviso({ ok: false, texto: (err as Error).message });
    } finally {
      setGuardando(false);
    }
  };

  // El modo del color secundario guardado vuelve a ese color; el otro modo
  // usa el fondo base (blanco u oscuro de Artiefy).
  const fondoParaModo = (modo: 'claro' | 'oscuro') =>
    modoDeFondo(academia.colorFondo) === modo
      ? academia.colorFondo
      : FONDOS_POR_MODO[modo];

  const modoActual = HEX_RE.test(form.colorFondo)
    ? modoDeFondo(form.colorFondo)
    : 'oscuro';

  const colores = [
    ['colorPrimario', 'Color primario'],
    ['colorFondo', 'Color secundario'],
  ] as const;

  return (
    <div className="space-y-8">
      <section className="space-y-5">
        <div>
          <h2 className="text-xl font-bold text-white">Datos de la academia</h2>
          <p className="text-sm text-white/60">
            Información y dirección de tu academia.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {(
            [
              ['personal', 'Personal', User],
              ['empresa', 'Empresa', Building2],
            ] as const
          ).map(([valor, texto, Icono]) => (
            <button
              key={valor}
              type="button"
              onClick={() => cambio('tipo', valor)}
              className={`inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-medium ${
                form.tipo === valor
                  ? 'bg-[var(--ac-primario)] text-[var(--ac-primario-texto)]'
                  : 'bg-[var(--ac-superficie)] text-white hover:bg-white/10'
              }`}
            >
              <Icono className="size-4" /> {texto}
            </button>
          ))}
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <label className="block">
            <span className={etiqueta}>Nombre</span>
            <input
              value={form.nombre}
              onChange={(e) => cambio('nombre', e.target.value)}
              className={campo}
            />
          </label>
          <label className="block">
            <span className={etiqueta}>Acrónimo</span>
            <input
              value={form.acronimo ?? ''}
              onChange={(e) =>
                cambio('acronimo', e.target.value.toUpperCase() || null)
              }
              className={campo}
            />
          </label>
          <div>
            <span className={etiqueta}>
              {form.tipo === 'empresa' ? 'NIT' : 'Documento'}
            </span>
            <div className="flex gap-2">
              {form.tipo === 'personal' && (
                <select
                  value={form.documentoTipo ?? 'C.C'}
                  onChange={(e) => cambio('documentoTipo', e.target.value)}
                  className={`${campo} w-28 shrink-0`}
                >
                  {TIPOS_DOCUMENTO.map((t) => (
                    <option key={t} value={t} className="bg-[var(--ac-fondo)]">
                      {t}
                    </option>
                  ))}
                </select>
              )}
              <input
                value={form.documentoNumero ?? ''}
                onChange={(e) =>
                  cambio('documentoNumero', e.target.value || null)
                }
                className={campo}
              />
            </div>
          </div>
          <label className="block">
            <span className={`${etiqueta} flex items-center gap-1.5`}>
              <Globe className="size-4" /> Dirección (URL)
            </span>
            <span className="flex h-11 items-center rounded-xl border border-[var(--ac-borde)] bg-[var(--ac-fondo)] pr-3 focus-within:border-[var(--ac-primario)]">
              <input
                value={form.slug}
                onChange={(e) =>
                  cambio(
                    'slug',
                    e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')
                  )
                }
                className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm text-[var(--ac-primario)] focus:outline-none"
              />
              <span className="text-xs text-white/50">.artiefy.com</span>
            </span>
            {form.slug !== academia.slug && (
              <span className="mt-1 block text-xs text-amber-300">
                Cambiar la dirección rompe los enlaces que ya tengan tus
                usuarios.
              </span>
            )}
          </label>
        </div>

        {/* Solo el super-admin de Artiefy lo cambia (desde su panel). */}
        <p className="flex items-center gap-2 text-sm text-white/80">
          <span
            className={`flex size-4 items-center justify-center rounded-full border ${
              form.esArtiefy
                ? 'border-[var(--ac-primario)] bg-[var(--ac-primario)]'
                : 'border-[var(--ac-primario)]'
            }`}
          >
            {form.esArtiefy && (
              <Check className="size-3 text-[var(--ac-primario-texto)]" />
            )}
          </span>
          Esta academia es parte de Artiefy
        </p>
      </section>

      <section className="space-y-5 border-t border-[var(--ac-borde)] pt-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-bold text-white">
              <Palette className="size-5 text-[var(--ac-primario)]" />
              Colores de la academia
            </h2>
            <p className="text-sm text-white/60">
              Vista previa inmediata. Los cambios se aplican solo a esta
              academia.
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              setForm((f) => ({
                ...f,
                colorPrimario: COLORES_POR_DEFECTO.primario,
                colorFondo: COLORES_POR_DEFECTO.fondo,
              }))
            }
            className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-white hover:bg-white/5"
          >
            <RotateCcw className="size-4" /> Restablecer colores
          </button>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {colores.map(([clave, texto]) => (
            <label key={clave} className="block">
              <span className={etiqueta}>{texto}</span>
              <span className="flex items-center gap-2">
                <input
                  type="color"
                  value={HEX_RE.test(form[clave]) ? form[clave] : '#000000'}
                  onChange={(e) => cambio(clave, e.target.value.toUpperCase())}
                  className="h-11 w-14 shrink-0 cursor-pointer rounded-xl border border-[var(--ac-borde)] bg-transparent p-1"
                />
                <input
                  value={form[clave]}
                  onChange={(e) =>
                    cambio(clave, e.target.value.trim().toUpperCase())
                  }
                  maxLength={7}
                  className={`${campo} font-mono`}
                />
              </span>
            </label>
          ))}
        </div>

        {/* Modo: se deduce del color secundario; los botones lo fijan. */}
        <div className="space-y-2">
          <span className={etiqueta}>Fondo de la academia</span>
          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                ['claro', 'Claro', Sun],
                ['oscuro', 'Oscuro', Moon],
              ] as const
            ).map(([modo, texto, Icono]) => (
              <button
                key={modo}
                type="button"
                onClick={() => cambio('colorFondo', fondoParaModo(modo))}
                className={`inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-medium ${
                  modoActual === modo
                    ? 'border-[var(--ac-primario)] bg-[var(--ac-primario)] text-[var(--ac-primario-texto)]'
                    : 'border-[var(--ac-borde)] bg-[var(--ac-superficie)] text-white hover:bg-white/10'
                }`}
              >
                <Icono className="size-4" /> {texto}
              </button>
            ))}
            {HEX_RE.test(form.colorFondo) && (
              <span className="text-sm text-white/60">
                Tu color secundario es{' '}
                <span className="font-semibold text-white">
                  {modoActual === 'claro' ? 'claro' : 'oscuro'}
                </span>
                : la academia se ve en modo {modoActual}.
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-[var(--ac-primario)] px-4 py-2 text-sm font-semibold text-[var(--ac-primario-texto)]">
            Color primario
          </span>
          <span className="rounded-full bg-[var(--ac-superficie)] px-4 py-2 text-sm font-semibold text-white">
            Color secundario
          </span>
          <span className="text-sm text-[var(--ac-primario)]">
            {form.acronimo ? `Academia ${form.acronimo}` : form.nombre}
          </span>
        </div>
      </section>

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

      <div className="flex flex-wrap justify-end gap-3 border-t border-[var(--ac-borde)] pt-6">
        <button
          type="button"
          onClick={cancelar}
          disabled={guardando || !hayCambios}
          className="h-11 rounded-full bg-[var(--ac-superficie)] px-5 text-sm font-semibold text-white hover:bg-white/10 disabled:opacity-40"
        >
          Cancelar cambios
        </button>
        <button
          type="button"
          onClick={() => void guardar()}
          disabled={guardando || !hayCambios}
          className="inline-flex h-11 items-center gap-2 rounded-full bg-[var(--ac-primario)] px-5 text-sm font-semibold text-[var(--ac-primario-texto)] disabled:opacity-40"
        >
          {guardando && <Loader2 className="size-4 animate-spin" />}
          Guardar cambios
        </button>
      </div>
    </div>
  );
}
