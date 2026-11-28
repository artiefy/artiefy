'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';

import Link from 'next/link';

import {
  Bell,
  BookOpen,
  CalendarClock,
  ClipboardCheck,
  Loader2,
  MessageCircle,
  PanelsTopLeft,
  PlayCircle,
  Search,
} from 'lucide-react';
import useSWR from 'swr';

import { cn } from '~/lib/utils';

import type { Route } from 'next';

// Buscador y campana de notificaciones de la barra superior del aula (como
// el Header del estudiante de Artiefy).

const fetcher = async <T,>(url: string): Promise<T> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error('No se pudo cargar');
  return (await res.json()) as T;
};

// ------------------------------------------------------------ Buscador ---

interface Resultados {
  cursos: {
    id: number;
    title: string;
    categoryName: string | null;
    matriculado: boolean;
  }[];
  programas: { id: number; title: string }[];
  clases: { id: number; title: string; courseId: number; curso: string }[];
}

export function BuscadorAula({ slug }: { slug: string }) {
  const [q, setQ] = useState('');
  const [consulta, setConsulta] = useState('');
  const [abierto, setAbierto] = useState(false);
  const caja = useRef<HTMLDivElement>(null);

  // Busca 300 ms después de dejar de escribir.
  useEffect(() => {
    const t = setTimeout(() => setConsulta(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);
  useEffect(() => {
    const cerrar = (e: MouseEvent) => {
      if (!caja.current?.contains(e.target as Node)) setAbierto(false);
    };
    document.addEventListener('mousedown', cerrar);
    return () => document.removeEventListener('mousedown', cerrar);
  }, []);

  const { data, isLoading } = useSWR(
    consulta.length >= 2
      ? `/api/academia/${slug}/aula/buscar?q=${encodeURIComponent(consulta)}`
      : null,
    fetcher<Resultados>
  );
  const vacio =
    data &&
    data.cursos.length + data.programas.length + data.clases.length === 0;
  const fila =
    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-primary/10';
  const cerrar = () => {
    setAbierto(false);
    setQ('');
  };

  return (
    <div ref={caja} className="relative w-full max-w-md">
      <div className="flex h-10 items-center gap-2 rounded-full border border-border/60 bg-card px-4 transition-colors focus-within:border-primary/50">
        <Search className="size-4 shrink-0 text-primary" />
        <input
          type="search"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setAbierto(true);
          }}
          onFocus={() => setAbierto(true)}
          placeholder="¿Qué quieres aprender?"
          aria-label="Buscar cursos y clases"
          className="h-full min-w-0 flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
        {isLoading && (
          <Loader2 className="size-4 animate-spin text-muted-foreground" />
        )}
      </div>
      {abierto && consulta.length >= 2 && data && (
        <div className="absolute inset-x-0 top-12 z-50 max-h-[70vh] overflow-y-auto rounded-2xl border border-border bg-background p-2 shadow-2xl">
          {vacio && (
            <p className="px-3 py-4 text-center text-sm text-muted-foreground">
              Sin resultados para “{consulta}”.
            </p>
          )}
          {data.cursos.length > 0 && (
            <p className="px-3 pt-2 pb-1 text-[11px] font-semibold text-muted-foreground uppercase">
              Cursos
            </p>
          )}
          {data.cursos.map((c) => (
            <Link
              key={`c${c.id}`}
              href={`/dashboard/student/cursos/${c.id}` as Route}
              onClick={cerrar}
              className={fila}
            >
              <BookOpen className="size-4 shrink-0 text-primary" />
              <span className="min-w-0 flex-1 truncate">{c.title}</span>
              {c.matriculado && (
                <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">
                  Tuyo
                </span>
              )}
            </Link>
          ))}
          {data.programas.length > 0 && (
            <p className="px-3 pt-2 pb-1 text-[11px] font-semibold text-muted-foreground uppercase">
              Programas
            </p>
          )}
          {data.programas.map((p) => (
            <Link
              key={`p${p.id}`}
              href={`/dashboard/student/programas/${p.id}` as Route}
              onClick={cerrar}
              className={fila}
            >
              <PanelsTopLeft className="size-4 shrink-0 text-primary" />
              <span className="truncate">{p.title}</span>
            </Link>
          ))}
          {data.clases.length > 0 && (
            <p className="px-3 pt-2 pb-1 text-[11px] font-semibold text-muted-foreground uppercase">
              Clases de tus cursos
            </p>
          )}
          {data.clases.map((l) => (
            <Link
              key={`l${l.id}`}
              href={
                `/dashboard/student/cursos/${l.courseId}/clases/${l.id}` as Route
              }
              onClick={cerrar}
              className={fila}
            >
              <PlayCircle className="size-4 shrink-0 text-primary" />
              <span className="min-w-0 flex-1">
                <span className="block truncate">{l.title}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {l.curso}
                </span>
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------ Notificaciones ---

interface Notificacion {
  id: string;
  tipo: 'clase' | 'vivo' | 'nota' | 'respuesta';
  titulo: string;
  mensaje: string;
  fecha: string;
  href: string;
}

const ICONO = {
  clase: PlayCircle,
  vivo: CalendarClock,
  nota: ClipboardCheck,
  respuesta: MessageCircle,
};

// "Visto hasta" de la campana, guardado en el navegador por academia.
const EVENTO = 'aula-notificaciones-vistas';
const clave = (slug: string) => `aula-notificaciones-${slug}`;
const leerVisto = (slug: string) => {
  try {
    return localStorage.getItem(clave(slug)) ?? '';
  } catch {
    return '';
  }
};
const suscribir = (cb: () => void) => {
  window.addEventListener(EVENTO, cb);
  window.addEventListener('storage', cb);
  return () => {
    window.removeEventListener(EVENTO, cb);
    window.removeEventListener('storage', cb);
  };
};

export function CampanaAula({ slug }: { slug: string }) {
  const [abierto, setAbierto] = useState(false);
  const caja = useRef<HTMLDivElement>(null);
  const { data } = useSWR(
    `/api/academia/${slug}/aula/notificaciones`,
    fetcher<{ notificaciones: Notificacion[] }>,
    { refreshInterval: 120_000 }
  );
  const visto = useSyncExternalStore(
    suscribir,
    () => leerVisto(slug),
    () => ''
  );
  const lista = data?.notificaciones ?? [];
  const nuevas = lista.filter((n) => n.fecha > visto).length;

  useEffect(() => {
    const cerrar = (e: MouseEvent) => {
      if (!caja.current?.contains(e.target as Node)) setAbierto(false);
    };
    document.addEventListener('mousedown', cerrar);
    return () => document.removeEventListener('mousedown', cerrar);
  }, []);

  const abrir = () => {
    setAbierto((a) => !a);
    const masNueva = lista[0]?.fecha;
    if (masNueva && masNueva > visto) {
      try {
        localStorage.setItem(clave(slug), masNueva);
      } catch {
        // Sin almacenamiento: el contador se reinicia al recargar.
      }
      window.dispatchEvent(new Event(EVENTO));
    }
  };

  return (
    <div ref={caja} className="relative">
      <button
        type="button"
        onClick={abrir}
        aria-label="Notificaciones"
        className="relative flex size-10 items-center justify-center rounded-full border border-border/60 bg-card text-foreground transition-colors hover:border-primary/50"
      >
        <Bell className="size-5" />
        {nuevas > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-[#FFFFFF]">
            {nuevas > 9 ? '9+' : nuevas}
          </span>
        )}
      </button>
      {abierto && (
        <div className="absolute top-12 right-0 z-50 w-[340px] max-w-[90vw] overflow-hidden rounded-2xl border border-border bg-background shadow-2xl">
          <p className="border-b border-border px-4 py-3 text-sm font-semibold text-foreground">
            Notificaciones
          </p>
          <div className="max-h-[60vh] overflow-y-auto">
            {lista.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                No tienes notificaciones.
              </p>
            ) : (
              lista.map((n) => {
                const Icono = ICONO[n.tipo];
                return (
                  <Link
                    key={n.id}
                    href={n.href as Route}
                    onClick={() => setAbierto(false)}
                    className={cn(
                      'flex gap-3 border-b border-border/50 px-4 py-3 last:border-b-0 hover:bg-primary/5',
                      n.fecha > visto && 'bg-primary/5'
                    )}
                  >
                    <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/15">
                      <Icono className="size-4 text-primary" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-foreground">
                        {n.titulo}
                      </span>
                      <span className="line-clamp-2 text-xs text-muted-foreground">
                        {n.mensaje}
                      </span>
                    </span>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
