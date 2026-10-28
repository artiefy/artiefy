'use client';

import { useState } from 'react';

import { ArrowRight, CalendarDays, Loader2, Pencil, X } from 'lucide-react';
import { toast } from 'sonner';

interface GrupoEditable {
  id: number;
  nombre: string;
  fechaInicio: string | null;
  fechaFin: string | null;
}

export function ModalEditarGrupo({
  grupo,
  onCerrar,
  onGuardado,
}: {
  grupo: GrupoEditable;
  onCerrar: () => void;
  onGuardado: (cambios: {
    nombre: string;
    fechaInicio: string | null;
    fechaFin: string | null;
  }) => void;
}) {
  const [nombre, setNombre] = useState(grupo.nombre);
  const [fechaInicio, setFechaInicio] = useState(grupo.fechaInicio ?? '');
  const [fechaFin, setFechaFin] = useState(grupo.fechaFin ?? '');
  const [guardando, setGuardando] = useState(false);

  const guardar = async () => {
    const nombreLimpio = nombre.trim();
    if (!nombreLimpio) {
      toast.error('El nombre del grupo es obligatorio');
      return;
    }
    if (fechaInicio && fechaFin && fechaFin < fechaInicio) {
      toast.error('La fecha de fin debe ser posterior a la fecha de inicio');
      return;
    }

    setGuardando(true);
    try {
      const res = await fetch(`/api/super-admin/grupos/${grupo.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: nombreLimpio,
          fechaInicio: fechaInicio || null,
          fechaFin: fechaFin || null,
        }),
      });
      const json = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      if (!res.ok)
        throw new Error(json?.error ?? 'No se pudo guardar el grupo');

      toast.success('Grupo actualizado');
      onGuardado({
        nombre: nombreLimpio,
        fechaInicio: fechaInicio || null,
        fechaFin: fechaFin || null,
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'No se pudo guardar el grupo'
      );
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={() => !guardando && onCerrar()}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="editar-grupo-titulo"
        className="w-full max-w-xl overflow-hidden rounded-2xl border border-white/10 bg-[#061c37] shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4 sm:px-6">
          <div className="flex min-w-0 items-start gap-3">
            <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl border border-[#22C4D3]/20 bg-[#22C4D3]/10 text-[#22C4D3]">
              <Pencil className="size-4" />
            </span>
            <div>
              <h2
                id="editar-grupo-titulo"
                className="text-lg font-semibold text-white"
              >
                Editar grupo
              </h2>
              <p className="mt-0.5 text-sm text-slate-400">
                Actualiza la información y el periodo del grupo.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            disabled={guardando}
            aria-label="Cerrar"
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-white/45 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50"
          >
            <X className="size-4" />
          </button>
        </header>

        <div className="space-y-5 p-5 sm:p-6">
          <div>
            <label
              htmlFor="nombre-grupo"
              className="mb-1.5 block text-xs font-medium text-white/70"
            >
              Nombre
            </label>
            <input
              id="nombre-grupo"
              value={nombre}
              onChange={(event) => setNombre(event.target.value)}
              maxLength={160}
              disabled={guardando}
              className="w-full rounded-xl border border-white/10 bg-[#0b1a2f] px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-[#22C4D3]/60 focus:outline-none disabled:opacity-60"
            />
          </div>

          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
              <CalendarDays className="size-4 text-[#22C4D3]" />
              Periodo del grupo
            </h3>
            <div className="grid items-end gap-3 sm:grid-cols-[1fr_auto_1fr]">
              <div>
                <label
                  htmlFor="fecha-inicio-grupo"
                  className="mb-1.5 block text-xs font-medium text-white/65"
                >
                  Fecha de inicio
                </label>
                <div className="relative">
                  <input
                    id="fecha-inicio-grupo"
                    type="date"
                    value={fechaInicio}
                    onChange={(event) => setFechaInicio(event.target.value)}
                    disabled={guardando}
                    className="w-full rounded-xl border border-white/10 bg-[#0b1a2f] px-3 py-2.5 pr-10 text-sm text-white [color-scheme:dark] focus:border-[#22C4D3]/60 focus:outline-none disabled:opacity-60 [&::-webkit-calendar-picker-indicator]:opacity-0"
                  />
                  <CalendarDays className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-[#22C4D3]" />
                </div>
              </div>
              <ArrowRight className="mx-auto mb-3 hidden size-4 text-white/30 sm:block" />
              <div>
                <label
                  htmlFor="fecha-fin-grupo"
                  className="mb-1.5 block text-xs font-medium text-white/65"
                >
                  Fecha de fin
                </label>
                <div className="relative">
                  <input
                    id="fecha-fin-grupo"
                    type="date"
                    value={fechaFin}
                    onChange={(event) => setFechaFin(event.target.value)}
                    disabled={guardando}
                    min={fechaInicio || undefined}
                    className="w-full rounded-xl border border-white/10 bg-[#0b1a2f] px-3 py-2.5 pr-10 text-sm text-white [color-scheme:dark] focus:border-[#22C4D3]/60 focus:outline-none disabled:opacity-60 [&::-webkit-calendar-picker-indicator]:opacity-0"
                  />
                  <CalendarDays className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-[#22C4D3]" />
                </div>
              </div>
            </div>
          </section>
        </div>

        <footer className="flex justify-end gap-2 border-t border-white/10 px-5 py-4 sm:px-6">
          <button
            type="button"
            onClick={onCerrar}
            disabled={guardando}
            className="rounded-xl px-4 py-2 text-sm font-medium text-white/65 transition-colors hover:bg-white/5 hover:text-white disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => void guardar()}
            disabled={guardando}
            className="inline-flex items-center gap-2 rounded-xl bg-[#22C4D3] px-4 py-2 text-sm font-semibold text-[#04101f] transition-colors hover:bg-[#3ad4e2] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {guardando && <Loader2 className="size-4 animate-spin" />}
            Guardar cambios
          </button>
        </footer>
      </section>
    </div>
  );
}
