'use client';

import { useState } from 'react';

import { ArrowUpRight, Loader2, Video } from 'lucide-react';
import { toast } from 'sonner';

import {
  ConfirmarEliminar,
  enviar,
  EstadoCarga,
  estilos,
  Modal,
  useDatosAcademia,
} from './seccion/comun';

// Pestaña "Clases en Vivo" del detalle de un curso de la academia, igual a la
// de Artiefy: "Clases Agendadas", el botón "Agendar Clase" (mismo modal:
// título general, fecha y hora de inicio, duración, semanas, días y títulos
// por día) y la lista agrupada por título con "Ver más" y "Eliminar todas las
// clases". En vez de crear la reunión en Teams, se pega el enlace de la
// reunión (Meet, Zoom, Teams…).

interface Sesion {
  id: number;
  titulo: string;
  inicio: string;
  fin: string;
  enlace: string | null;
  leccion: string | null;
}

const TIMEZONE = 'America/Bogota';
const DIAS = [
  'lunes',
  'martes',
  'miércoles',
  'jueves',
  'viernes',
  'sábado',
  'domingo',
];
// getDay(): 0 = domingo.
const DIAS_POR_INDICE = [
  'domingo',
  'lunes',
  'martes',
  'miércoles',
  'jueves',
  'viernes',
  'sábado',
];

const fmtClase = new Intl.DateTimeFormat('es-CO', {
  dateStyle: 'full',
  timeStyle: 'medium',
  timeZone: TIMEZONE,
});
const fmtHora = new Intl.DateTimeFormat('es-CO', {
  timeStyle: 'medium',
  timeZone: TIMEZONE,
});
const fmtCorta = new Intl.DateTimeFormat('es-CO', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: TIMEZONE,
});

/** "Título (Clase 1)" → "Título": así agrupa Artiefy las clases. */
const tituloBase = (t: string) =>
  (/^(.+?)(\s*\(.+\))?$/.exec(t)?.[1] ?? t).trim() || 'Sin título';

const diasDe = (grupo: Sesion[]) =>
  [
    ...new Set(
      grupo.map((s) =>
        new Date(s.inicio).toLocaleDateString('es-CO', {
          weekday: 'long',
          timeZone: TIMEZONE,
        })
      )
    ),
  ].join(', ');

export function ClasesEnVivoAcademia({
  slug,
  courseId,
}: {
  slug: string;
  courseId: number;
}) {
  const api = `/api/academia/${slug}/cursos/${courseId}/sesiones`;
  const { data, error, isLoading, sqlPendiente, mutate } = useDatosAcademia<{
    sesiones: Sesion[];
  }>(api);
  const [agendando, setAgendando] = useState(false);
  const [abierto, setAbierto] = useState<string | null>(null);
  // Una o varias clases por eliminar (una clase o "todas las clases").
  const [borrando, setBorrando] = useState<{
    titulo: string;
    mensaje: string;
    ids: number[];
  } | null>(null);

  const grupos = Object.entries(
    (data?.sesiones ?? []).reduce<Record<string, Sesion[]>>((acc, s) => {
      (acc[tituloBase(s.titulo)] ??= []).push(s);
      return acc;
    }, {})
  ).sort(
    ([, a], [, b]) =>
      Math.min(...b.map((s) => new Date(s.inicio).getTime())) -
      Math.min(...a.map((s) => new Date(s.inicio).getTime()))
  );

  return (
    <div className="-mx-1 space-y-8 px-1 duration-500 animate-in fade-in md:-mx-3 md:px-3">
      <h2 className="text-2xl font-bold text-white">Clases Agendadas</h2>
      <div className="flex w-full flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => setAgendando(true)}
          disabled={!data}
          className="w-full rounded-md bg-[var(--ac-primario)] px-5 py-3 text-sm font-semibold text-[var(--ac-primario-texto)] transition-all duration-300 hover:opacity-90 disabled:opacity-50 sm:w-auto md:px-6 md:py-3 md:text-base"
        >
          Agendar Clase
        </button>
      </div>

      {!data ? (
        <EstadoCarga
          cargando={isLoading}
          error={error}
          sqlPendiente={sqlPendiente}
          script="academy_seed_completo.sql"
        />
      ) : grupos.length === 0 ? (
        <p className="text-sm text-white/50">No hay clases agendadas.</p>
      ) : (
        <div className="mt-6 space-y-6">
          {grupos.map(([base, grupo]) => {
            const fechas = grupo.map((s) => new Date(s.inicio).getTime());
            const subgrupos = Object.entries(
              grupo.reduce<Record<string, Sesion[]>>((acc, s) => {
                (acc[s.titulo || 'Sin título'] ??= []).push(s);
                return acc;
              }, {})
            );
            return (
              <div
                key={base}
                className="rounded-2xl border border-white/10 bg-gradient-to-br from-[var(--ac-superficie)] to-[var(--ac-fondo)] p-6 shadow-2xl transition-all duration-500"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-2xl font-bold text-white">{base}</h3>
                    <p className="text-sm text-white/50">
                      {grupo.length} clases programadas — {diasDe(grupo)}
                    </p>
                    <p className="mt-0.5 text-xs text-white/40">
                      {fmtCorta.format(Math.min(...fechas))} →{' '}
                      {fmtCorta.format(Math.max(...fechas))}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setAbierto(abierto === base ? null : base)}
                      className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white shadow-md transition hover:bg-blue-500"
                    >
                      {abierto === base ? 'Ocultar' : 'Ver más'}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setBorrando({
                          titulo: 'Eliminar clases',
                          mensaje: `Se eliminarán ${grupo.length} clases. Esta acción no se puede deshacer.`,
                          ids: grupo.map((s) => s.id),
                        })
                      }
                      className="rounded bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-500"
                    >
                      🗑 Eliminar todas las clases
                    </button>
                  </div>
                </div>

                {abierto === base && (
                  <div className="mt-6 space-y-4">
                    {subgrupos.map(([titulo, clases]) => (
                      <div
                        key={titulo}
                        className="rounded-xl border border-white/10 bg-[var(--ac-fondo)] p-5 shadow-md"
                      >
                        <p className="mb-2 text-base font-semibold text-white">
                          {titulo}
                        </p>
                        <ul className="space-y-2">
                          {clases
                            .slice()
                            .sort(
                              (a, b) =>
                                new Date(a.inicio).getTime() -
                                new Date(b.inicio).getTime()
                            )
                            .map((s) => (
                              <li key={s.id} className="text-sm text-white/70">
                                <p>
                                  🕒 {fmtClase.format(new Date(s.inicio))} →{' '}
                                  {fmtHora.format(new Date(s.fin))}
                                </p>
                                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                  {s.enlace && (
                                    <a
                                      href={s.enlace}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="group/clase inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--ac-primario)] px-4 py-2 text-sm font-semibold text-[var(--ac-primario-texto)] shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl"
                                    >
                                      <Video className="size-4" />
                                      Entrar a la clase
                                      <ArrowUpRight className="size-4 transition-transform duration-200 group-hover/clase:translate-x-0.5 group-hover/clase:-translate-y-0.5" />
                                    </a>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setBorrando({
                                        titulo: 'Eliminar clase',
                                        mensaje: `Se eliminará la clase “${s.titulo}”. Esta acción no se puede deshacer.`,
                                        ids: [s.id],
                                      })
                                    }
                                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-2 text-sm font-semibold text-red-300 transition-all duration-200 hover:-translate-y-0.5 hover:bg-red-400/20"
                                  >
                                    🗑 Eliminar clase
                                  </button>
                                </div>
                              </li>
                            ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {agendando && (
        <AgendarClase
          api={api}
          onClose={() => setAgendando(false)}
          onSaved={async () => {
            setAgendando(false);
            await mutate();
          }}
        />
      )}
      {borrando && (
        <ConfirmarEliminar
          titulo={borrando.titulo}
          texto={borrando.mensaje}
          onClose={() => setBorrando(null)}
          onConfirmar={async () => {
            try {
              for (const id of borrando.ids) {
                await enviar(`/api/academia/${slug}/sesiones/${id}`, 'DELETE');
              }
              toast.success(
                borrando.ids.length > 1
                  ? 'Clases eliminadas'
                  : 'Clase eliminada'
              );
              setBorrando(null);
              await mutate();
            } catch (err) {
              toast.error((err as Error).message);
              await mutate();
            }
          }}
        />
      )}
    </div>
  );
}

/** Modal "Agendar Clase": el mismo formulario de Artiefy. */
function AgendarClase({
  api,
  onClose,
  onSaved,
}: {
  api: string;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [titulo, setTitulo] = useState('');
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [duracion, setDuracion] = useState(60);
  const [semanas, setSemanas] = useState(1);
  const [extras, setExtras] = useState<string[]>([]);
  const [titulos, setTitulos] = useState<Record<string, string>>({});
  const [enlace, setEnlace] = useState('');
  const [errorForm, setErrorForm] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  // El día de la fecha de inicio va siempre (como en Artiefy).
  const primerDia = fecha
    ? DIAS_POR_INDICE[new Date(`${fecha}T12:00:00`).getDay()]!
    : '';
  const dias = DIAS.filter((d) => d === primerDia || extras.includes(d));

  const alternar = (dia: string) => {
    if (dia === primerDia) return;
    setExtras((prev) =>
      prev.includes(dia) ? prev.filter((d) => d !== dia) : [...prev, dia]
    );
  };

  const guardar = async () => {
    setErrorForm(null);
    if (!titulo.trim())
      return setErrorForm('Debes ingresar un título general.');
    if (!fecha) return setErrorForm('Debes seleccionar una fecha de inicio.');
    if (!hora) return setErrorForm('Debes seleccionar una hora de inicio.');
    if (duracion < 15) {
      return setErrorForm('La duración mínima debe ser de 15 minutos.');
    }
    if (semanas < 1) {
      return setErrorForm('Debes ingresar al menos 1 semana de repetición.');
    }
    if (dias.length === 0) {
      return setErrorForm('Debes seleccionar al menos un día de la semana.');
    }

    // Cada semana, cada día elegido, desde la fecha de inicio (hora de
    // Colombia, UTC-5 sin horario de verano).
    const inicioBase = new Date(`${fecha}T${hora}:00-05:00`);
    const sesiones: Record<string, unknown>[] = [];
    for (let semana = 0; semana < semanas; semana++) {
      for (const dia of dias) {
        const desfase =
          (DIAS_POR_INDICE.indexOf(dia) -
            new Date(`${fecha}T12:00:00`).getDay() +
            7) %
          7;
        const inicio = new Date(
          inicioBase.getTime() + (semana * 7 + desfase) * 86_400_000
        );
        const fin = new Date(inicio.getTime() + duracion * 60_000);
        const propio = titulos[dia]?.trim();
        sesiones.push({
          titulo: propio ? `${titulo.trim()} (${propio})` : titulo.trim(),
          inicio: inicio.toISOString(),
          fin: fin.toISOString(),
          enlace,
        });
      }
    }

    setGuardando(true);
    try {
      await enviar(api, 'POST', { sesiones });
      toast.success('Clases agendadas', {
        description: `Se crearon ${sesiones.length} clases.`,
      });
      await onSaved();
    } catch (error) {
      setErrorForm((error as Error).message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal titulo="Agendar clases" onClose={onClose} ancho="max-w-screen-sm">
      <div className="space-y-4">
        <label className="flex flex-col space-y-1">
          <span className="text-sm font-medium text-white">Título general</span>
          <input
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Ej. Matemáticas Avanzadas"
            className={estilos.campo}
          />
        </label>
        <label className="flex flex-col space-y-1">
          <span className="text-sm font-medium text-white">
            Fecha de inicio
          </span>
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className={estilos.campo}
          />
        </label>
        <label className="flex flex-col space-y-1">
          <span className="text-sm font-medium text-white">Hora de inicio</span>
          <input
            type="time"
            value={hora}
            onChange={(e) => setHora(e.target.value)}
            className={estilos.campo}
          />
        </label>
        <label className="flex flex-col space-y-1">
          <span className="text-sm font-medium text-white">
            Duración (minutos)
          </span>
          <input
            type="number"
            min={15}
            step={15}
            value={duracion}
            onChange={(e) => setDuracion(Number(e.target.value))}
            className={estilos.campo}
          />
        </label>
        <label className="flex flex-col space-y-1">
          <span className="text-sm font-medium text-white">
            Número de semanas
          </span>
          <input
            type="number"
            min={1}
            max={50}
            value={semanas}
            onChange={(e) => setSemanas(Number(e.target.value))}
            className={estilos.campo}
          />
        </label>
        <div className="flex flex-col space-y-1">
          <span className="text-sm font-medium text-white">
            Días de la semana
          </span>
          <div className="flex flex-wrap gap-2">
            {DIAS.map((dia) => (
              <button
                key={dia}
                type="button"
                disabled={dia === primerDia}
                onClick={() => alternar(dia)}
                className={`rounded border px-3 py-1 text-sm ${
                  dias.includes(dia)
                    ? dia === primerDia
                      ? 'cursor-not-allowed bg-gray-400 text-white'
                      : 'bg-white text-black'
                    : 'border-gray-500 bg-transparent text-white'
                }`}
              >
                {dia.slice(0, 3)}
              </button>
            ))}
          </div>
          {primerDia && (
            <p className="mt-1 text-xs text-white/50">
              El día <strong>{primerDia}</strong> es obligatorio porque es el
              inicio de clases.
            </p>
          )}
        </div>
        <div className="flex flex-col space-y-1">
          <span className="text-sm font-medium text-white">
            Títulos por día (opcional)
          </span>
          {dias.map((dia) => (
            <div key={dia} className="mb-2 flex items-center gap-2">
              <span className="w-20 text-white">{dia.slice(0, 3)}:</span>
              <input
                value={titulos[dia] ?? ''}
                onChange={(e) =>
                  setTitulos((t) => ({ ...t, [dia]: e.target.value }))
                }
                placeholder={`Título para ${dia}`}
                className={estilos.campo}
              />
            </div>
          ))}
        </div>
        <label className="flex flex-col space-y-1">
          <span className="text-sm font-medium text-white">
            Enlace de la reunión
          </span>
          <input
            value={enlace}
            onChange={(e) => setEnlace(e.target.value)}
            placeholder="https://meet.google.com/…"
            className={estilos.campo}
          />
          <span className="mt-1 text-xs text-white/50">
            Se usa en todas las clases (Meet, Zoom, Teams…).
          </span>
        </label>

        {errorForm && (
          <div className="rounded border border-red-500 bg-red-100 px-4 py-2 text-sm text-red-800">
            {errorForm}
          </div>
        )}
        <div className="flex justify-end gap-2 pt-4">
          <button type="button" onClick={onClose} className={estilos.botonSec}>
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => void guardar()}
            disabled={dias.length === 0 || guardando}
            className={estilos.boton}
          >
            {guardando && <Loader2 className="size-4 animate-spin" />}
            {guardando ? 'Creando clases...' : 'Crear clases'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
