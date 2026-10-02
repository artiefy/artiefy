'use client';

import { useEffect, useState } from 'react';

import { Loader2, Search, X } from 'lucide-react';

import { CampoFechaLarga } from '~/components/shared/CampoFechaLarga';
import { formatFechaLarga } from '~/lib/formatDate';

/**
 * Modal para crear un grupo, o una HOJA dentro de un grupo (con `parentId`):
 * fechas, programa, curso y filtros por columna para elegir los estudiantes.
 * En modo hoja no pide nombre: el servidor la numera ("Grupo (3)").
 */

interface Opciones {
  programas: string[];
  cursos: { id: number; title: string }[];
  columnasDisponibles: { clave: string; label: string; tipo?: 'fecha' }[];
  valores: Record<string, string[]>;
}

interface EstudiantePreview {
  id: string;
  name: string | null;
  email: string;
  identificacionNumero: string | null;
  programa: string | null;
  sede: string | null;
  horario: string | null;
}

export function ModalCrearGrupo({
  onCerrar,
  onCreado,
  parentId,
  programaInicial = '',
}: {
  onCerrar: () => void;
  onCreado: (id: number) => void;
  /** Si viene, se crea una HOJA dentro de ese grupo (sin pedir nombre). */
  parentId?: number;
  programaInicial?: string;
}) {
  const esHoja = parentId != null;
  const [opciones, setOpciones] = useState<Opciones | null>(null);
  const [nombre, setNombre] = useState('');
  const [programa, setPrograma] = useState(programaInicial);
  const [columna, setColumna] = useState('');
  const [valor, setValor] = useState('');
  const [cursoId, setCursoId] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [preview, setPreview] = useState<EstudiantePreview[]>([]);
  const [seleccion, setSeleccion] = useState<Set<string>>(new Set());
  const [cargandoPrev, setCargandoPrev] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    void fetch('/api/super-admin/grupos/opciones')
      .then((r) => (r.ok ? r.json() : null))
      .then((d: Opciones | null) => d && setOpciones(d))
      .catch(() => undefined);
  }, []);

  const buscar = async () => {
    setCargandoPrev(true);
    setErr(null);
    try {
      const res = await fetch('/api/super-admin/grupos/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          programa: programa || null,
          columna: columna || null,
          valor: valor || null,
          cursoId: cursoId ? Number(cursoId) : null,
        }),
      });
      if (!res.ok) throw new Error('No se pudo buscar');
      const json = (await res.json()) as { estudiantes: EstudiantePreview[] };
      setPreview(json.estudiantes ?? []);
      setSeleccion(new Set((json.estudiantes ?? []).map((e) => e.id)));
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Error');
    } finally {
      setCargandoPrev(false);
    }
  };

  const toggle = (id: string) => {
    setSeleccion((prev) => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id);
      else s.add(id);
      return s;
    });
  };

  const crear = async () => {
    if (!esHoja && !nombre.trim()) {
      setErr('Ponle un nombre al grupo');
      return;
    }
    setGuardando(true);
    setErr(null);
    try {
      const res = await fetch('/api/super-admin/grupos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // La hoja toma el nombre del grupo con su número: "Grupo (3)".
          nombre: esHoja ? null : nombre.trim(),
          parentId: parentId ?? null,
          programa: programa || null,
          columna: columna || null,
          valor: valor || null,
          cursoId: cursoId ? Number(cursoId) : null,
          fechaInicio: fechaInicio || null,
          fechaFin: fechaFin || null,
          userIds: [...seleccion],
        }),
      });
      const j = (await res.json().catch(() => null)) as {
        id?: number;
        error?: string;
      } | null;
      if (!res.ok || j?.id == null) {
        throw new Error(
          j?.error ??
            (esHoja ? 'No se pudo crear la hoja' : 'No se pudo crear el grupo')
        );
      }
      onCreado(j.id);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Error');
    } finally {
      setGuardando(false);
    }
  };

  const valoresCol =
    columna && opciones ? (opciones.valores[columna] ?? []) : [];
  const colEsFecha =
    opciones?.columnasDisponibles.find((c) => c.clave === columna)?.tipo ===
    'fecha';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onCerrar}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[#22C4D3]/30 bg-[#061c37] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
          <h2 className="text-lg font-bold text-[#22C4D3]">
            {esHoja ? 'Nueva hoja' : 'Crear grupo'}
          </h2>
          <button
            type="button"
            onClick={onCerrar}
            className="text-white/50 hover:text-white"
            aria-label="Cerrar"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {!esHoja && (
            <div>
              <label className="mb-1 block text-xs text-white/50">
                Nombre del grupo
              </label>
              <input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Cosmetología Cali — Sábado AM"
                className="w-full rounded-xl border border-white/10 bg-[#0b1a2f] px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-[#22C4D3]/60 focus:outline-none"
              />
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-white/50">
                Fecha inicio
              </label>
              <CampoFechaLarga
                valor={fechaInicio}
                placeholder="Selecciona la fecha de inicio"
                onCambio={setFechaInicio}
                className="w-full rounded-xl border border-white/10 bg-[#0b1a2f] px-3 py-2.5 text-sm text-white focus-within:border-[#22C4D3]/60"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-white/50">
                Fecha fin
              </label>
              <CampoFechaLarga
                valor={fechaFin}
                placeholder="Selecciona la fecha de fin"
                onCambio={setFechaFin}
                className="w-full rounded-xl border border-white/10 bg-[#0b1a2f] px-3 py-2.5 text-sm text-white focus-within:border-[#22C4D3]/60"
              />
            </div>
          </div>
          {fechaInicio && fechaFin && (
            <p className="text-[11px] text-white/40">
              Se crearán clases cada{' '}
              {new Date(`${fechaInicio}T00:00:00`).toLocaleDateString('es-CO', {
                weekday: 'long',
              })}{' '}
              desde el {fechaInicio} hasta el {fechaFin}.
            </p>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-white/50">
                Programa
              </label>
              <select
                value={programa}
                onChange={(e) => setPrograma(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#0b1a2f] px-3 py-2.5 text-sm text-white focus:border-[#22C4D3]/60 focus:outline-none [&>option]:bg-[#061c37]"
              >
                <option value="">Todos</option>
                {opciones?.programas.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-white/50">Curso</label>
              <select
                value={cursoId}
                onChange={(e) => setCursoId(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#0b1a2f] px-3 py-2.5 text-sm text-white focus:border-[#22C4D3]/60 focus:outline-none [&>option]:bg-[#061c37]"
              >
                <option value="">Cualquiera</option>
                {opciones?.cursos.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-white/50">
                Columna
              </label>
              <select
                value={columna}
                onChange={(e) => {
                  setColumna(e.target.value);
                  setValor('');
                }}
                className="w-full rounded-xl border border-white/10 bg-[#0b1a2f] px-3 py-2.5 text-sm text-white focus:border-[#22C4D3]/60 focus:outline-none [&>option]:bg-[#061c37]"
              >
                <option value="">Sin filtro extra</option>
                {opciones?.columnasDisponibles.map((c) => (
                  <option key={c.clave} value={c.clave}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-white/50">Valor</label>
              <select
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                disabled={!columna}
                className="w-full rounded-xl border border-white/10 bg-[#0b1a2f] px-3 py-2.5 text-sm text-white focus:border-[#22C4D3]/60 focus:outline-none disabled:opacity-40 [&>option]:bg-[#061c37]"
              >
                <option value="">Selecciona…</option>
                {valoresCol.map((v) => (
                  <option key={v} value={v}>
                    {colEsFecha ? formatFechaLarga(v) : v}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void buscar()}
            disabled={cargandoPrev}
            className="inline-flex items-center gap-2 rounded-xl border border-[#22C4D3]/40 bg-[#22C4D3]/10 px-4 py-2 text-sm font-semibold text-[#22C4D3] hover:bg-[#22C4D3]/20 disabled:opacity-50"
          >
            {cargandoPrev ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Search className="size-4" />
            )}
            Buscar estudiantes
          </button>

          {err && <p className="text-sm text-red-400">{err}</p>}

          {preview.length > 0 && (
            <div className="rounded-xl border border-white/10">
              <div className="flex items-center justify-between border-b border-white/10 px-3 py-2 text-xs text-white/60">
                <span>
                  {seleccion.size} de {preview.length} seleccionados
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setSeleccion(
                      seleccion.size === preview.length
                        ? new Set()
                        : new Set(preview.map((e) => e.id))
                    )
                  }
                  className="text-[#22C4D3] hover:underline"
                >
                  {seleccion.size === preview.length
                    ? 'Quitar todos'
                    : 'Seleccionar todos'}
                </button>
              </div>
              <div className="max-h-56 overflow-y-auto">
                {preview.map((e) => (
                  <label
                    key={e.id}
                    className="flex cursor-pointer items-center gap-3 border-b border-white/5 px-3 py-2 text-sm last:border-b-0 hover:bg-white/5"
                  >
                    <input
                      type="checkbox"
                      checked={seleccion.has(e.id)}
                      onChange={() => toggle(e.id)}
                      className="size-4 accent-[#22C4D3]"
                    />
                    <span className="min-w-0 flex-1 truncate text-white">
                      {e.name ?? e.email}
                    </span>
                    <span className="shrink-0 text-xs text-white/40">
                      {e.identificacionNumero ?? ''}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-white/10 px-5 py-3">
          <button
            type="button"
            onClick={onCerrar}
            className="rounded-xl border border-white/15 px-4 py-2 text-sm text-white/70 hover:bg-white/5"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => void crear()}
            disabled={guardando || (!esHoja && !nombre.trim())}
            className="inline-flex items-center gap-2 rounded-xl bg-[#22C4D3] px-4 py-2 text-sm font-semibold text-[#04101f] hover:bg-[#3ad4e2] disabled:opacity-50"
          >
            {guardando && <Loader2 className="size-4 animate-spin" />}
            {esHoja ? 'Crear hoja' : 'Crear grupo'} ({seleccion.size})
          </button>
        </div>
      </div>
    </div>
  );
}
