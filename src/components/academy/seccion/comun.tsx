'use client';

import { useState } from 'react';

import { Database, Loader2, Trash2, X } from 'lucide-react';
import useSWR from 'swr';

// Piezas comunes de las secciones del panel de super-admin de una academia
// (Tickets, Programas, Grupos, Finanzas…): carga de datos, aviso de SQL
// pendiente y estilos con los colores de la marca.

export const estilos = {
  tarjeta:
    'rounded-2xl border border-[var(--ac-borde)] bg-[var(--ac-superficie)] p-4 sm:p-5',
  campo:
    'h-10 w-full rounded-xl border border-[var(--ac-borde)] bg-[var(--ac-fondo)] px-3 text-sm text-white placeholder:text-white/30 focus:border-[var(--ac-primario)] focus:outline-none',
  area: 'min-h-24 w-full rounded-xl border border-[var(--ac-borde)] bg-[var(--ac-fondo)] px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-[var(--ac-primario)] focus:outline-none',
  etiqueta: 'mb-1 block text-xs font-semibold text-white/70',
  boton:
    'inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[var(--ac-primario)] px-4 text-sm font-semibold text-[var(--ac-primario-texto)] disabled:opacity-40',
  botonSec:
    'inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[var(--ac-fondo)] px-4 text-sm font-medium text-white hover:bg-white/10 disabled:opacity-40',
  chip: 'rounded-full border px-2 py-0.5 text-xs font-medium',
  tabla: 'w-full min-w-[640px] text-sm',
  th: 'px-4 py-3 text-left text-xs font-semibold text-white/70 uppercase',
  td: 'border-t border-[var(--ac-borde)] px-4 py-3',
} as const;

class ErrorApi extends Error {
  constructor(
    message: string,
    readonly sqlPendiente: boolean
  ) {
    super(message);
  }
}

/** GET a la API de la sección; distingue "falta ejecutar el SQL". */
export function useDatosAcademia<T>(url: string | null) {
  // Clave propia [url, 'datos']: otras pantallas (GestorUsuarios,
  // CursosAcademia…) cachean la misma URL con otra forma y no deben chocar.
  const swr = useSWR<T, ErrorApi>(
    url ? [url, 'datos'] : null,
    async ([u]: [string, string]) => {
      const res = await fetch(u);
      const j = (await res.json().catch(() => ({}))) as {
        error?: string;
        sqlPendiente?: boolean;
      };
      if (!res.ok) {
        throw new ErrorApi(
          j.error ?? 'No se pudieron cargar los datos',
          j.sqlPendiente === true
        );
      }
      return j as T;
    }
  );
  return { ...swr, sqlPendiente: swr.error?.sqlPendiente === true };
}

/** POST/PATCH/DELETE con JSON; lanza el mensaje de error de la API. */
export async function enviar(
  url: string,
  metodo: 'POST' | 'PATCH' | 'DELETE' | 'PUT',
  cuerpo?: unknown
) {
  const res = await fetch(url, {
    method: metodo,
    headers: cuerpo ? { 'Content-Type': 'application/json' } : undefined,
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });
  const j = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) throw new Error(j.error ?? 'No se pudo guardar');
  return j;
}

/** Estado de carga / error / SQL pendiente de una sección. */
export function EstadoCarga({
  cargando,
  error,
  sqlPendiente,
  script,
}: {
  cargando: boolean;
  error?: Error;
  sqlPendiente: boolean;
  // Archivo de scripts/ que habilita la sección.
  script: string;
}) {
  if (sqlPendiente) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/5 px-6 py-12 text-center">
        <Database className="size-8 text-amber-300" />
        <p className="text-lg font-semibold text-white">
          Falta habilitar esta sección
        </p>
        <p className="max-w-md text-sm text-white/60">
          Hay que ejecutar{' '}
          <code className="rounded bg-white/10 px-1.5 py-0.5 text-amber-200">
            scripts/{script}
          </code>{' '}
          en la base de datos.
        </p>
      </div>
    );
  }
  if (error) {
    return (
      <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-300">
        {error.message}
      </p>
    );
  }
  if (cargando) {
    return (
      <p className="flex items-center justify-center gap-2 py-12 text-white/50">
        <Loader2 className="size-4 animate-spin" /> Cargando…
      </p>
    );
  }
  return null;
}

export const fmtFecha = (iso: string | Date) =>
  new Date(iso).toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

export const fmtFechaHora = (iso: string | Date) =>
  new Date(iso).toLocaleString('es-CO', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });

export const fmtPesos = (n: number) => `$${n.toLocaleString('es-CO')}`;

export function Modal({
  titulo,
  onClose,
  children,
  ancho = 'max-w-2xl',
}: {
  titulo: string;
  onClose: () => void;
  children: React.ReactNode;
  ancho?: string;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={`flex max-h-[90dvh] w-full ${ancho} flex-col overflow-hidden rounded-2xl border border-[var(--ac-borde)] bg-[var(--ac-superficie)] shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-[var(--ac-borde)] px-5 py-4">
          <h2 className="text-lg font-bold text-white">{titulo}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="text-white/50 hover:text-white"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}

/** Confirmación antes de borrar (mismo estilo que "Eliminar hoja"). */
export function ConfirmarEliminar({
  titulo,
  texto,
  onConfirmar,
  onClose,
}: {
  titulo: string;
  texto: React.ReactNode;
  onConfirmar: () => Promise<void>;
  onClose: () => void;
}) {
  const [borrando, setBorrando] = useState(false);
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={() => !borrando && onClose()}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-red-500/30 bg-[var(--ac-superficie)] p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-full bg-red-500/15 text-red-400">
            <Trash2 className="size-4" />
          </span>
          <h2 className="text-lg font-bold text-white">{titulo}</h2>
        </div>
        <p className="text-sm text-white/70">{texto}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={borrando}
            className="rounded-xl border border-white/15 px-4 py-2 text-sm text-white/70 hover:bg-white/5 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => {
              setBorrando(true);
              void onConfirmar().finally(() => setBorrando(false));
            }}
            disabled={borrando}
            className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50"
          >
            {borrando ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Trash2 className="size-4" />
            )}
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}

/** Cursos de la academia (para elegir en programas, grupos, proyectos…). */
export function useCursosAcademia(slug: string) {
  const { data } = useDatosAcademia<{
    cursos: { id: number; title: string }[];
  }>(`/api/academia/${slug}/cursos`);
  return data?.cursos ?? [];
}

/** Estudiantes de la academia (para grupos, finanzas, proyectos…). */
export function useEstudiantesAcademia(slug: string) {
  const { data } = useDatosAcademia<{
    usuarios: {
      userId: string;
      name: string | null;
      email: string;
      role: string;
    }[];
  }>(`/api/academia/${slug}/usuarios`);
  return (data?.usuarios ?? [])
    .filter((u) => u.role === 'estudiante')
    .map((u) => ({ id: u.userId, name: u.name ?? u.email, email: u.email }));
}

/**
 * Encabezado con borde en degradado, el mismo de las pantallas de super-admin
 * de Artiefy ("Tickets de Soporte", "Gestión de Cursos"…), con la marca.
 */
export function EncabezadoArtiefy({
  titulo,
  children,
}: {
  titulo: string;
  // Acciones a la derecha del título (opcional).
  children?: React.ReactNode;
}) {
  return (
    <header className="group relative overflow-hidden rounded-lg p-px">
      <div className="absolute -inset-0.5 animate-gradient bg-gradient-to-r from-[var(--ac-primario)] via-[var(--ac-primario)]/60 to-[var(--ac-fondo)] opacity-75 blur transition duration-500" />
      <div className="relative flex flex-col items-start justify-between gap-3 rounded-lg bg-[var(--ac-superficie)] p-4 text-white shadow-lg sm:flex-row sm:items-center sm:p-6">
        <h1 className="flex items-center gap-3 text-xl font-extrabold tracking-tight text-[var(--ac-primario)] sm:text-2xl lg:text-3xl">
          {titulo}
        </h1>
        {children}
      </div>
    </header>
  );
}
