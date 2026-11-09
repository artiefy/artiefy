'use client';

import { useState } from 'react';

import { EstadoCarga, estilos, fmtFechaHora, useDatosAcademia } from './comun';

// Estudiantes › Logs: actividad de la academia (cuentas creadas, credenciales
// enviadas, cursos, grupos, pagos, configuración…).

interface Log {
  id: number;
  actorEmail: string | null;
  accion: string;
  detalle: string | null;
  createdAt: string;
}

export function LogsAcademia({ slug }: { slug: string }) {
  const { data, error, isLoading, sqlPendiente } = useDatosAcademia<{
    logs: Log[];
  }>(`/api/academia/${slug}/logs`);
  const [q, setQ] = useState('');
  const [accion, setAccion] = useState('');

  if (!data) {
    return (
      <EstadoCarga
        cargando={isLoading}
        error={error}
        sqlPendiente={sqlPendiente}
        script="academy_logs.sql"
      />
    );
  }

  const acciones = [...new Set(data.logs.map((l) => l.accion))].sort();
  const t = q.trim().toLowerCase();
  const visibles = data.logs.filter(
    (l) =>
      (!accion || l.accion === accion) &&
      (!t ||
        (l.detalle ?? '').toLowerCase().includes(t) ||
        (l.actorEmail ?? '').toLowerCase().includes(t))
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por correo o detalle…"
          className={`${estilos.campo} max-w-xs`}
        />
        <select
          value={accion}
          onChange={(e) => setAccion(e.target.value)}
          className={`${estilos.campo} w-56`}
        >
          <option value="" className="bg-[var(--ac-fondo)]">
            Todas las acciones
          </option>
          {acciones.map((a) => (
            <option key={a} value={a} className="bg-[var(--ac-fondo)]">
              {a}
            </option>
          ))}
        </select>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-[var(--ac-borde)]">
        <table className={estilos.tabla}>
          <thead className="bg-[var(--ac-superficie)]">
            <tr>
              <th className={estilos.th}>Fecha</th>
              <th className={estilos.th}>Acción</th>
              <th className={estilos.th}>Detalle</th>
              <th className={estilos.th}>Por</th>
            </tr>
          </thead>
          <tbody>
            {visibles.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-10 text-center text-white/50"
                >
                  {data.logs.length === 0
                    ? 'Aún no hay actividad registrada.'
                    : 'Nada coincide con la búsqueda.'}
                </td>
              </tr>
            ) : (
              visibles.map((l) => (
                <tr key={l.id}>
                  <td
                    className={`${estilos.td} whitespace-nowrap text-white/60`}
                  >
                    {fmtFechaHora(l.createdAt)}
                  </td>
                  <td className={`${estilos.td} font-medium text-white`}>
                    {l.accion}
                  </td>
                  <td className={`${estilos.td} text-white/70`}>
                    {l.detalle ?? '—'}
                  </td>
                  <td className={`${estilos.td} text-white/60`}>
                    {l.actorEmail ?? '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
