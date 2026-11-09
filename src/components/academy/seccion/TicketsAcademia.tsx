'use client';

import { useState } from 'react';

import {
  FileText,
  Info,
  Loader2,
  MessageSquare,
  Plus,
  Send,
} from 'lucide-react';
import { toast } from 'sonner';

import {
  EncabezadoArtiefy,
  enviar,
  EstadoCarga,
  estilos,
  fmtFechaHora,
  Modal,
  useDatosAcademia,
} from './comun';

// Tickets de academias. modo 'academia': el super-admin de la academia crea
// tickets para el soporte de Artiefy y conversa en ellos. modo 'artiefy': el
// super-admin de Artiefy ve los de todas las academias, responde y cambia su
// estado.

interface Ticket {
  id: number;
  academia: string;
  slug: string;
  email: string;
  title: string;
  description: string;
  tipo: string;
  estado: string;
  createdAt: string;
  updatedAt: string;
}

interface Comentario {
  id: number;
  sender: 'academia' | 'artiefy';
  content: string;
  createdAt: string;
}

const ESTADOS = [
  'abierto',
  'en proceso',
  'en revision',
  'solucionado',
  'cerrado',
] as const;
const TIPOS = [
  ['soporte', 'Soporte'],
  ['bug', 'Error (bug)'],
  ['revision', 'Revisión'],
  ['otro', 'Otro'],
] as const;

// Mismos colores que el tablero de tickets de Artiefy.
const ESTADO_CONFIG: Record<string, { label: string; className: string }> = {
  abierto: { label: 'Abierto', className: 'bg-green-500/10 text-green-500' },
  'en proceso': {
    label: 'En Proceso',
    className: 'bg-blue-500/10 text-blue-500',
  },
  'en revision': {
    label: 'En Revisión',
    className: 'bg-yellow-500/10 text-yellow-500',
  },
  solucionado: {
    label: 'Solucionado',
    className: 'bg-purple-500/10 text-purple-500',
  },
  cerrado: { label: 'Cerrado', className: 'bg-gray-500/10 text-gray-500' },
};
const TIPO_CONFIG: Record<string, { label: string; className: string }> = {
  soporte: { label: 'Soporte', className: 'bg-sky-500/10 text-sky-500' },
  bug: { label: 'Bug', className: 'bg-red-500/10 text-red-500' },
  revision: {
    label: 'Revisión',
    className: 'bg-yellow-500/10 text-yellow-500',
  },
  otro: { label: 'Otro', className: 'bg-gray-500/10 text-gray-500' },
};

const filtroCampo =
  'rounded border border-[var(--ac-borde)] bg-[var(--ac-fondo)] px-2 py-1.5 text-xs text-white/80 focus:text-white focus:ring-1 focus:ring-[var(--ac-primario)] focus:outline-none';
const filtroEtiqueta = 'mb-1 text-xs font-medium text-white/50';

export function TicketsAcademia({
  api,
  modo,
}: {
  // /api/academia/[slug]/tickets o /api/super-admin/academias/tickets
  api: string;
  modo: 'academia' | 'artiefy';
}) {
  const { data, error, isLoading, sqlPendiente, mutate } = useDatosAcademia<{
    tickets: Ticket[];
  }>(api);
  const [abiertoId, setAbiertoId] = useState<number | null>(null);
  const [creando, setCreando] = useState(false);
  const [filtroId, setFiltroId] = useState('');
  const [filtroEmail, setFiltroEmail] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroAcademia, setFiltroAcademia] = useState('');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [idAsc, setIdAsc] = useState(false);
  const [arrastrado, setArrastrado] = useState<number | null>(null);
  const [sobre, setSobre] = useState<string | null>(null);

  const encabezado = (
    <EncabezadoArtiefy
      titulo={
        modo === 'artiefy' ? 'Tickets de Academias' : 'Tickets de Soporte'
      }
    />
  );

  if (!data) {
    return (
      <div className="space-y-6">
        {encabezado}
        <EstadoCarga
          cargando={isLoading}
          error={error}
          sqlPendiente={sqlPendiente}
          script="academy_tickets.sql"
        />
      </div>
    );
  }

  const academias = [...new Set(data.tickets.map((t) => t.academia))].sort();
  const correos = [...new Set(data.tickets.map((t) => t.email))].sort();
  const visibles = data.tickets
    .filter(
      (t) =>
        (!filtroId || String(t.id).includes(filtroId.trim())) &&
        (!filtroEmail || t.email === filtroEmail) &&
        (!filtroTipo || t.tipo === filtroTipo) &&
        (!filtroEstado || t.estado === filtroEstado) &&
        (!filtroAcademia || t.academia === filtroAcademia) &&
        (!desde || t.createdAt.slice(0, 10) >= desde) &&
        (!hasta || t.createdAt.slice(0, 10) <= hasta)
    )
    .sort((a, b) => (idAsc ? a.id - b.id : 0));
  const abierto = data.tickets.find((t) => t.id === abiertoId) ?? null;
  // Solo Artiefy mueve tickets entre columnas (la academia solo cierra o
  // reabre desde el detalle).
  const puedeMover = modo === 'artiefy';

  const mover = async (id: number, estado: string) => {
    const t = data.tickets.find((x) => x.id === id);
    if (!t || t.estado === estado) return;
    try {
      await enviar(`${api}/${id}`, 'PATCH', { estado });
      toast.success(
        `Ticket #${id} → ${ESTADO_CONFIG[estado]?.label ?? estado}`
      );
      await mutate();
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      {encabezado}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          {modo === 'academia' && (
            <button
              type="button"
              onClick={() => setCreando(true)}
              className="inline-flex items-center justify-center gap-2 rounded-md border border-white/20 bg-[var(--ac-fondo)] px-4 py-2 text-sm font-medium text-[var(--ac-primario)] transition-all hover:bg-[var(--ac-primario)]/10"
            >
              Crear Nuevo Ticket <Plus className="size-4" />
            </button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex flex-col gap-4 rounded-xl border border-white/10 bg-[var(--ac-superficie)] p-4 shadow-md sm:flex-row sm:items-center">
            <label className="flex flex-col">
              <span className="mb-1 text-sm font-medium text-[var(--ac-primario)]">
                Desde
              </span>
              <input
                type="date"
                value={desde}
                onChange={(e) => setDesde(e.target.value)}
                className="rounded-lg border border-[var(--ac-borde)] bg-[var(--ac-fondo)] px-3 py-2 text-sm text-white focus:border-[var(--ac-primario)] focus:outline-none"
              />
            </label>
            <label className="flex flex-col">
              <span className="mb-1 text-sm font-medium text-[var(--ac-primario)]">
                Hasta
              </span>
              <input
                type="date"
                value={hasta}
                onChange={(e) => setHasta(e.target.value)}
                className="rounded-lg border border-[var(--ac-borde)] bg-[var(--ac-fondo)] px-3 py-2 text-sm text-white focus:border-[var(--ac-primario)] focus:outline-none"
              />
            </label>
          </div>
          <div className="inline-flex items-center gap-3 rounded-lg border border-[var(--ac-primario)]/30 bg-[var(--ac-primario)]/15 px-6 py-4 text-lg font-semibold text-white shadow-lg">
            <FileText className="size-6 animate-pulse text-[var(--ac-primario)]" />
            <span className="tracking-wide">
              {visibles.length} ticket(s) encontrado(s)
            </span>
          </div>
        </div>
      </div>

      {/* Barra de filtros */}
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-[var(--ac-borde)] bg-[var(--ac-superficie)]/50 p-4">
        <label className="flex flex-col">
          <span className={filtroEtiqueta}>ID</span>
          <input
            value={filtroId}
            onChange={(e) => setFiltroId(e.target.value)}
            placeholder="Buscar ID"
            className={`${filtroCampo} w-20 placeholder:text-white/40`}
          />
        </label>
        {modo === 'artiefy' && (
          <label className="flex flex-col">
            <span className={filtroEtiqueta}>Academia</span>
            <select
              value={filtroAcademia}
              onChange={(e) => setFiltroAcademia(e.target.value)}
              className={`${filtroCampo} w-44`}
            >
              <option value="">Todas</option>
              {academias.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="flex flex-col">
          <span className={filtroEtiqueta}>Email</span>
          <select
            value={filtroEmail}
            onChange={(e) => setFiltroEmail(e.target.value)}
            className={`${filtroCampo} w-44`}
          >
            <option value="">Todos</option>
            {correos.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col">
          <span className={filtroEtiqueta}>Tipo</span>
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className={filtroCampo}
          >
            <option value="">Todos</option>
            {TIPOS.map(([v, t]) => (
              <option key={v} value={v}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col">
          <span className={filtroEtiqueta}>Estado</span>
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className={filtroCampo}
          >
            <option value="">Todos</option>
            {ESTADOS.map((e) => (
              <option key={e} value={e}>
                {ESTADO_CONFIG[e]?.label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={() => setIdAsc((v) => !v)}
          className={`${filtroCampo} hover:text-white`}
        >
          ID {idAsc ? '↑' : '↓'}
        </button>
      </div>

      {/* Columnas kanban por estado */}
      {visibles.length === 0 ? (
        <div className="py-16 text-center text-white/50">
          No hay tickets disponibles
        </div>
      ) : (
        <div className="flex snap-x gap-4 overflow-x-auto pb-4">
          {ESTADOS.map((estado) => {
            const config = ESTADO_CONFIG[estado]!;
            const columna = visibles.filter((t) => t.estado === estado);
            return (
              <div
                key={estado}
                className={`min-w-[260px] flex-shrink-0 snap-start rounded-xl border bg-[var(--ac-superficie)]/50 transition-colors sm:min-w-[280px] ${
                  sobre === estado
                    ? 'border-[var(--ac-primario)]/60 bg-[var(--ac-primario)]/5'
                    : 'border-[var(--ac-borde)]'
                }`}
                onDragOver={(e) => {
                  if (!puedeMover) return;
                  e.preventDefault();
                  setSobre(estado);
                }}
                onDragLeave={() => setSobre(null)}
                onDrop={(e) => {
                  e.preventDefault();
                  setSobre(null);
                  if (arrastrado != null) void mover(arrastrado, estado);
                  setArrastrado(null);
                }}
              >
                <div className="flex items-center gap-2 border-b border-[var(--ac-borde)] p-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${config.className}`}
                  >
                    {config.label}
                  </span>
                  <span className="text-xs text-white/50">
                    {columna.length}
                  </span>
                </div>
                <div className="max-h-[65vh] space-y-2 overflow-y-auto p-2">
                  {columna.length === 0 ? (
                    <p className="py-8 text-center text-xs text-white/50">
                      Sin tickets
                    </p>
                  ) : (
                    columna.map((t) => (
                      <div
                        key={t.id}
                        draggable={puedeMover}
                        onDragStart={() => setArrastrado(t.id)}
                        onDragEnd={() => {
                          setArrastrado(null);
                          setSobre(null);
                        }}
                        className={`space-y-2 rounded-lg border border-[var(--ac-borde)] bg-[var(--ac-superficie)] p-3 transition-colors hover:bg-white/5 ${
                          puedeMover ? 'cursor-grab active:cursor-grabbing' : ''
                        } ${arrastrado === t.id ? 'opacity-50' : ''}`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white">
                            #{t.id}
                          </span>
                          <span
                            className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                              TIPO_CONFIG[t.tipo]?.className ??
                              'bg-gray-500/10 text-gray-500'
                            }`}
                          >
                            {TIPO_CONFIG[t.tipo]?.label ?? t.tipo}
                          </span>
                        </div>
                        <p className="line-clamp-2 text-sm font-medium text-white">
                          {t.title}
                        </p>
                        {modo === 'artiefy' && (
                          <p className="text-xs font-semibold text-[var(--ac-primario)]">
                            {t.academia}
                          </p>
                        )}
                        <p
                          className="truncate text-xs text-white/70"
                          title={t.email}
                        >
                          {t.email}
                        </p>
                        <div className="flex items-center justify-between border-t border-[var(--ac-borde)] pt-2 text-[10px] text-white/50">
                          <span>{fmtFechaHora(t.createdAt)}</span>
                          <button
                            type="button"
                            onClick={() => setAbiertoId(t.id)}
                            className="rounded-md p-1 hover:bg-blue-500/10 hover:text-blue-500"
                            title="Ver detalles"
                            aria-label={`Ver ticket ${t.id}`}
                          >
                            <Info className="size-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {creando && (
        <NuevoTicket
          api={api}
          onClose={() => setCreando(false)}
          onCreado={async () => {
            setCreando(false);
            await mutate();
          }}
        />
      )}
      {abierto && (
        <DetalleTicket
          api={api}
          modo={modo}
          ticket={abierto}
          onClose={() => setAbiertoId(null)}
          onCambio={async () => {
            await mutate();
          }}
        />
      )}
    </div>
  );
}

function NuevoTicket({
  api,
  onClose,
  onCreado,
}: {
  api: string;
  onClose: () => void;
  onCreado: () => Promise<void>;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tipo, setTipo] = useState<string>('soporte');
  const [guardando, setGuardando] = useState(false);

  const crear = async () => {
    setGuardando(true);
    try {
      await enviar(api, 'POST', { title, description, tipo });
      toast.success('Ticket enviado al soporte de Artiefy');
      await onCreado();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal titulo="Nuevo ticket" onClose={onClose}>
      <div className="space-y-4">
        <label className="block">
          <span className={estilos.etiqueta}>Asunto</span>
          <input
            value={title}
            maxLength={120}
            onChange={(e) => setTitle(e.target.value)}
            className={estilos.campo}
          />
        </label>
        <label className="block">
          <span className={estilos.etiqueta}>Tipo</span>
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            className={estilos.campo}
          >
            {TIPOS.map(([v, t]) => (
              <option key={v} value={v} className="bg-[var(--ac-fondo)]">
                {t}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className={estilos.etiqueta}>Descripción</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={estilos.area}
          />
        </label>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className={estilos.botonSec}>
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => void crear()}
            disabled={guardando || !title.trim() || !description.trim()}
            className={estilos.boton}
          >
            {guardando && <Loader2 className="size-4 animate-spin" />}
            Enviar ticket
          </button>
        </div>
      </div>
    </Modal>
  );
}

function DetalleTicket({
  api,
  modo,
  ticket,
  onClose,
  onCambio,
}: {
  api: string;
  modo: 'academia' | 'artiefy';
  ticket: Ticket;
  onClose: () => void;
  onCambio: () => Promise<void>;
}) {
  const url = `${api}/${ticket.id}`;
  const { data, mutate } = useDatosAcademia<{ comentarios: Comentario[] }>(url);
  const [mensaje, setMensaje] = useState('');
  const [enviando, setEnviando] = useState(false);
  const yo = modo;

  const responder = async () => {
    setEnviando(true);
    try {
      await enviar(url, 'POST', { content: mensaje });
      setMensaje('');
      await Promise.all([mutate(), onCambio()]);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setEnviando(false);
    }
  };

  const cambiarEstado = async (estado: string) => {
    try {
      await enviar(url, 'PATCH', { estado });
      toast.success('Estado actualizado');
      await onCambio();
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  return (
    <Modal titulo={`#${ticket.id} · ${ticket.title}`} onClose={onClose}>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {modo === 'artiefy' && (
            <span className="font-semibold text-white">{ticket.academia}</span>
          )}
          <span className="text-white/50">{ticket.email}</span>
          {modo === 'artiefy' ? (
            <select
              value={ticket.estado}
              onChange={(e) => void cambiarEstado(e.target.value)}
              className={`${estilos.campo} ml-auto h-9 w-40 capitalize`}
            >
              {ESTADOS.map((e) => (
                <option key={e} value={e} className="bg-[var(--ac-fondo)]">
                  {e}
                </option>
              ))}
            </select>
          ) : (
            <button
              type="button"
              onClick={() =>
                void cambiarEstado(
                  ticket.estado === 'cerrado' ? 'abierto' : 'cerrado'
                )
              }
              className={`${estilos.botonSec} ml-auto h-9`}
            >
              {ticket.estado === 'cerrado' ? 'Reabrir' : 'Cerrar ticket'}
            </button>
          )}
        </div>

        <p className="rounded-xl bg-[var(--ac-fondo)] p-4 text-sm whitespace-pre-line text-white/80">
          {ticket.description}
        </p>

        <div className="space-y-2">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
            <MessageSquare className="size-4" /> Conversación
          </h3>
          {!data ? (
            <p className="text-sm text-white/40">Cargando…</p>
          ) : data.comentarios.length === 0 ? (
            <p className="text-sm text-white/40">Sin mensajes todavía.</p>
          ) : (
            data.comentarios.map((c) => (
              <div
                key={c.id}
                className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                  c.sender === yo
                    ? 'ml-auto bg-[var(--ac-primario)]/15 text-white'
                    : 'bg-[var(--ac-fondo)] text-white/80'
                }`}
              >
                <p className="text-[11px] font-semibold text-white/50">
                  {c.sender === 'artiefy' ? 'Soporte Artiefy' : 'Academia'} ·{' '}
                  {fmtFechaHora(c.createdAt)}
                </p>
                <p className="whitespace-pre-line">{c.content}</p>
              </div>
            ))
          )}
        </div>

        <div className="flex gap-2">
          <textarea
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            placeholder="Escribe un mensaje…"
            className={`${estilos.area} min-h-12`}
          />
          <button
            type="button"
            onClick={() => void responder()}
            disabled={enviando || !mensaje.trim()}
            aria-label="Enviar mensaje"
            className={`${estilos.boton} h-12 shrink-0`}
          >
            {enviando ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
