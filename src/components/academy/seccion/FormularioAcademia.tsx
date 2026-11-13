'use client';

import { useState, useSyncExternalStore } from 'react';

import { Copy, ExternalLink, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import {
  ConfirmarEliminar,
  enviar,
  EstadoCarga,
  estilos,
  fmtFechaHora,
  useDatosAcademia,
} from './comun';

// Estudiantes › Formulario: respuestas del formulario público de inscripción,
// con su estado de seguimiento y el enlace para compartir el formulario.

interface Inscripcion {
  id: number;
  nombre: string;
  email: string;
  telefono: string | null;
  documento: string | null;
  curso: string | null;
  mensaje: string | null;
  estado: 'nueva' | 'contactada' | 'inscrita' | 'descartada';
  createdAt: string;
}

const ESTADOS = ['nueva', 'contactada', 'inscrita', 'descartada'] as const;
const COLOR_ESTADO: Record<Inscripcion['estado'], string> = {
  nueva: 'border-sky-500/30 bg-sky-500/15 text-sky-300',
  contactada: 'border-amber-500/30 bg-amber-500/15 text-amber-300',
  inscrita: 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300',
  descartada: 'border-white/15 bg-white/5 text-white/50',
};

const sinSuscripcion = () => () => undefined;

export function FormularioAcademia({ slug }: { slug: string }) {
  const api = `/api/academia/${slug}/inscripciones`;
  const { data, error, isLoading, sqlPendiente, mutate } = useDatosAcademia<{
    inscripciones: Inscripcion[];
  }>(api);
  const [filtro, setFiltro] = useState('');
  const [borrando, setBorrando] = useState<Inscripcion | null>(null);

  // Origen del subdominio de la academia (en el servidor, solo la ruta).
  const origen = useSyncExternalStore(
    sinSuscripcion,
    () => window.location.origin,
    () => ''
  );
  const enlace = `${origen}/inscripcion`;

  // Inscripciones del formulario corto (/inscripcion). Las del formulario
  // completo (/dashboard/formulario) llegan a la lista de estudiantes.
  const cabecera = (
    <div className="flex flex-wrap items-center gap-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-white">
          Inscripciones del formulario corto
        </p>
        <p className="truncate text-sm text-[var(--ac-primario)]">{enlace}</p>
      </div>
      <button
        type="button"
        onClick={() => {
          void navigator.clipboard.writeText(enlace);
          toast.success('Enlace copiado');
        }}
        className={estilos.botonSec}
      >
        <Copy className="size-4" /> Copiar
      </button>
      <a href="/inscripcion" target="_blank" className={estilos.botonSec}>
        <ExternalLink className="size-4" /> Abrir
      </a>
    </div>
  );

  if (!data) {
    return (
      <div className="space-y-4">
        {cabecera}
        <EstadoCarga
          cargando={isLoading}
          error={error}
          sqlPendiente={sqlPendiente}
          script="academy_inscripciones.sql"
        />
      </div>
    );
  }

  const visibles = data.inscripciones.filter(
    (i) => !filtro || i.estado === filtro
  );

  const cambiarEstado = async (i: Inscripcion, estado: string) => {
    try {
      await enviar(`${api}/${i.id}`, 'PATCH', { estado });
      await mutate();
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <div className="space-y-4">
      {cabecera}
      <div className="flex flex-wrap gap-2">
        {[['', 'Todas'] as const, ...ESTADOS.map((e) => [e, e] as const)].map(
          ([valor, texto]) => (
            <button
              key={valor || 'todas'}
              type="button"
              onClick={() => setFiltro(valor)}
              className={`inline-flex h-9 items-center gap-2 rounded-full px-4 text-sm font-medium capitalize ${
                filtro === valor
                  ? 'bg-[var(--ac-primario)] text-[var(--ac-primario-texto)]'
                  : 'bg-[var(--ac-superficie)] text-white hover:bg-white/10'
              }`}
            >
              {texto}
              <span className="text-xs opacity-70">
                {valor
                  ? data.inscripciones.filter((i) => i.estado === valor).length
                  : data.inscripciones.length}
              </span>
            </button>
          )
        )}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-[var(--ac-borde)]">
        <table className={estilos.tabla}>
          <thead className="bg-[var(--ac-superficie)]">
            <tr>
              <th className={estilos.th}>Fecha</th>
              <th className={estilos.th}>Nombre</th>
              <th className={estilos.th}>Contacto</th>
              <th className={estilos.th}>Curso</th>
              <th className={estilos.th}>Mensaje</th>
              <th className={estilos.th}>Estado</th>
              <th className={estilos.th} />
            </tr>
          </thead>
          <tbody>
            {visibles.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-10 text-center text-white/50"
                >
                  {data.inscripciones.length === 0
                    ? 'Aún no llegan inscripciones. Comparte el enlace del formulario.'
                    : 'Ninguna inscripción con ese estado.'}
                </td>
              </tr>
            ) : (
              visibles.map((i) => (
                <tr key={i.id}>
                  <td
                    className={`${estilos.td} whitespace-nowrap text-white/60`}
                  >
                    {fmtFechaHora(i.createdAt)}
                  </td>
                  <td className={`${estilos.td} font-medium text-white`}>
                    {i.nombre}
                    {i.documento && (
                      <span className="block text-xs font-normal text-white/50">
                        {i.documento}
                      </span>
                    )}
                  </td>
                  <td className={`${estilos.td} text-white/70`}>
                    {i.email}
                    {i.telefono && (
                      <span className="block text-xs text-white/50">
                        {i.telefono}
                      </span>
                    )}
                  </td>
                  <td className={`${estilos.td} text-white/70`}>
                    {i.curso ?? '—'}
                  </td>
                  <td
                    className={`${estilos.td} max-w-[240px] text-white/60`}
                    title={i.mensaje ?? ''}
                  >
                    <span className="line-clamp-2">{i.mensaje ?? '—'}</span>
                  </td>
                  <td className={estilos.td}>
                    <select
                      value={i.estado}
                      onChange={(e) => void cambiarEstado(i, e.target.value)}
                      className={`${estilos.chip} cursor-pointer capitalize ${COLOR_ESTADO[i.estado]}`}
                    >
                      {ESTADOS.map((e) => (
                        <option
                          key={e}
                          value={e}
                          className="bg-[var(--ac-fondo)]"
                        >
                          {e}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className={estilos.td}>
                    <button
                      type="button"
                      onClick={() => setBorrando(i)}
                      aria-label="Eliminar inscripción"
                      className="text-white/30 hover:text-red-400"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {borrando && (
        <ConfirmarEliminar
          titulo="Eliminar inscripción"
          texto={
            <>
              ¿Eliminar la inscripción de{' '}
              <span className="font-semibold text-white">
                {borrando.nombre}
              </span>
              ?
            </>
          }
          onClose={() => setBorrando(null)}
          onConfirmar={async () => {
            try {
              await enviar(`${api}/${borrando.id}`, 'DELETE');
              toast.success('Inscripción eliminada');
              setBorrando(null);
              await mutate();
            } catch (err) {
              toast.error((err as Error).message);
            }
          }}
        />
      )}
    </div>
  );
}
