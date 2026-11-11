'use client';

import { useState } from 'react';

import { Loader2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import {
  ConfirmarEliminar,
  enviar,
  EstadoCarga,
  estilos,
  fmtFecha,
  fmtPesos,
  Modal,
  useDatosAcademia,
  useEstudiantesAcademia,
} from './comun';

// Finanzas de la academia: resumen (recaudado, pendiente, este mes), tabla de
// pagos con filtro y registro manual de pagos.

interface Pago {
  id: number;
  userId: string;
  estudiante: string | null;
  email: string | null;
  concepto: string;
  monto: number;
  fecha: string;
  metodo: string | null;
  estado: 'pagado' | 'pendiente' | 'anulado';
}

const COLOR_ESTADO: Record<Pago['estado'], string> = {
  pagado: 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300',
  pendiente: 'border-amber-500/30 bg-amber-500/15 text-amber-300',
  anulado: 'border-white/15 bg-white/5 text-white/50',
};

const hoyISO = () => new Date().toISOString().slice(0, 10);

export function FinanzasAcademia({ slug }: { slug: string }) {
  const api = `/api/academia/${slug}/finanzas`;
  const { data, error, isLoading, sqlPendiente, mutate } = useDatosAcademia<{
    pagos: Pago[];
  }>(api);
  const estudiantes = useEstudiantesAcademia(slug);
  const [registrando, setRegistrando] = useState(false);
  const [borrando, setBorrando] = useState<Pago | null>(null);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [q, setQ] = useState('');

  if (!data) {
    return (
      <EstadoCarga
        cargando={isLoading}
        error={error}
        sqlPendiente={sqlPendiente}
        script="academy_pagos.sql"
      />
    );
  }

  const mes = hoyISO().slice(0, 7);
  const suma = (lista: Pago[]) => lista.reduce((t, p) => t + p.monto, 0);
  const pagados = data.pagos.filter((p) => p.estado === 'pagado');
  const resumen = [
    ['Recaudado', fmtPesos(suma(pagados))],
    [
      'Recaudado este mes',
      fmtPesos(suma(pagados.filter((p) => p.fecha.startsWith(mes)))),
    ],
    [
      'Pendiente por cobrar',
      fmtPesos(suma(data.pagos.filter((p) => p.estado === 'pendiente'))),
    ],
  ];

  const t = q.trim().toLowerCase();
  const visibles = data.pagos.filter(
    (p) =>
      (!filtroEstado || p.estado === filtroEstado) &&
      (!t ||
        (p.estudiante ?? '').toLowerCase().includes(t) ||
        (p.email ?? '').toLowerCase().includes(t) ||
        p.concepto.toLowerCase().includes(t))
  );

  const cambiarEstado = async (p: Pago, estado: string) => {
    try {
      await enviar(`${api}/${p.id}`, 'PATCH', { estado });
      await mutate();
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        {resumen.map(([etiqueta, valor]) => (
          <div
            key={etiqueta}
            className="border-l-2 border-[var(--ac-primario)] py-1 pl-5"
          >
            <p className="text-2xl font-bold text-white sm:text-3xl">{valor}</p>
            <p className="text-sm text-white/60">{etiqueta}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar estudiante o concepto…"
          className={`${estilos.campo} max-w-xs`}
        />
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          className={`${estilos.campo} w-40`}
        >
          <option value="" className="bg-[var(--ac-fondo)]">
            Todos
          </option>
          {(['pagado', 'pendiente', 'anulado'] as const).map((e) => (
            <option
              key={e}
              value={e}
              className="bg-[var(--ac-fondo)] capitalize"
            >
              {e}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setRegistrando(true)}
          className={`${estilos.boton} ml-auto`}
        >
          <Plus className="size-4" /> Registrar pago
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-[var(--ac-borde)]">
        <table className={estilos.tabla}>
          <thead className="bg-[var(--ac-superficie)]">
            <tr>
              <th className={estilos.th}>Fecha</th>
              <th className={estilos.th}>Estudiante</th>
              <th className={estilos.th}>Concepto</th>
              <th className={estilos.th}>Método</th>
              <th className={`${estilos.th} text-right`}>Monto</th>
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
                  {data.pagos.length === 0
                    ? 'Todavía no hay pagos registrados.'
                    : 'Ningún pago coincide con el filtro.'}
                </td>
              </tr>
            ) : (
              visibles.map((p) => (
                <tr key={p.id}>
                  <td
                    className={`${estilos.td} whitespace-nowrap text-white/70`}
                  >
                    {fmtFecha(`${p.fecha}T12:00:00`)}
                  </td>
                  <td className={`${estilos.td} text-white`}>
                    {p.estudiante ?? p.email ?? '—'}
                  </td>
                  <td className={`${estilos.td} text-white/80`}>
                    {p.concepto}
                  </td>
                  <td className={`${estilos.td} text-white/60`}>
                    {p.metodo ?? '—'}
                  </td>
                  <td
                    className={`${estilos.td} text-right font-semibold whitespace-nowrap text-white`}
                  >
                    {fmtPesos(p.monto)}
                  </td>
                  <td className={estilos.td}>
                    <select
                      value={p.estado}
                      onChange={(e) => void cambiarEstado(p, e.target.value)}
                      className={`${estilos.chip} cursor-pointer capitalize ${COLOR_ESTADO[p.estado]}`}
                    >
                      {(['pagado', 'pendiente', 'anulado'] as const).map(
                        (e) => (
                          <option
                            key={e}
                            value={e}
                            className="bg-[var(--ac-fondo)]"
                          >
                            {e}
                          </option>
                        )
                      )}
                    </select>
                  </td>
                  <td className={estilos.td}>
                    <button
                      type="button"
                      onClick={() => setBorrando(p)}
                      aria-label="Eliminar pago"
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

      {registrando && (
        <RegistrarPago
          api={api}
          estudiantes={estudiantes}
          onClose={() => setRegistrando(false)}
          onSaved={async () => {
            setRegistrando(false);
            await mutate();
          }}
        />
      )}
      {borrando && (
        <ConfirmarEliminar
          titulo="Eliminar pago"
          texto={
            <>
              ¿Eliminar el pago{' '}
              <span className="font-semibold text-white">
                “{borrando.concepto}”
              </span>{' '}
              de {fmtPesos(borrando.monto)}?
            </>
          }
          onClose={() => setBorrando(null)}
          onConfirmar={async () => {
            try {
              await enviar(`${api}/${borrando.id}`, 'DELETE');
              toast.success('Pago eliminado');
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

export function RegistrarPago({
  api,
  estudiantes,
  onClose,
  onSaved,
}: {
  api: string;
  estudiantes: { id: string; name: string; email: string }[];
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [userId, setUserId] = useState('');
  const [concepto, setConcepto] = useState('');
  const [monto, setMonto] = useState('');
  const [fecha, setFecha] = useState(hoyISO);
  const [metodo, setMetodo] = useState('');
  const [estado, setEstado] = useState('pagado');
  const [guardando, setGuardando] = useState(false);

  const guardar = async () => {
    setGuardando(true);
    try {
      await enviar(api, 'POST', {
        userId,
        concepto,
        monto: Number(monto),
        fecha,
        metodo,
        estado,
      });
      toast.success('Pago registrado');
      await onSaved();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal titulo="Registrar pago" onClose={onClose} ancho="max-w-lg">
      <div className="space-y-4">
        <label className="block">
          <span className={estilos.etiqueta}>Estudiante</span>
          <select
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className={estilos.campo}
          >
            <option value="" className="bg-[var(--ac-fondo)]">
              — Seleccionar —
            </option>
            {estudiantes.map((e) => (
              <option key={e.id} value={e.id} className="bg-[var(--ac-fondo)]">
                {e.name} ({e.email})
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className={estilos.etiqueta}>Concepto</span>
          <input
            value={concepto}
            onChange={(e) => setConcepto(e.target.value)}
            placeholder="Mensualidad, matrícula…"
            className={estilos.campo}
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className={estilos.etiqueta}>Monto (COP)</span>
            <input
              type="number"
              min={0}
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              className={estilos.campo}
            />
          </label>
          <label className="block">
            <span className={estilos.etiqueta}>Fecha</span>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className={`${estilos.campo} [color-scheme:dark]`}
            />
          </label>
          <label className="block">
            <span className={estilos.etiqueta}>Método</span>
            <input
              value={metodo}
              onChange={(e) => setMetodo(e.target.value)}
              placeholder="Efectivo, transferencia…"
              className={estilos.campo}
            />
          </label>
          <label className="block">
            <span className={estilos.etiqueta}>Estado</span>
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
              className={`${estilos.campo} capitalize`}
            >
              {(['pagado', 'pendiente', 'anulado'] as const).map((e) => (
                <option key={e} value={e} className="bg-[var(--ac-fondo)]">
                  {e}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className={estilos.botonSec}>
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => void guardar()}
            disabled={guardando || !userId || !concepto.trim() || !monto}
            className={estilos.boton}
          >
            {guardando && <Loader2 className="size-4 animate-spin" />}
            Registrar
          </button>
        </div>
      </div>
    </Modal>
  );
}
