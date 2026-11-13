'use client';

import { useRef, useState } from 'react';

import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  FileText,
  Filter,
  Loader2,
  Plus,
  Search,
  Trash2,
  TrendingUp,
  Upload,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import useSWR from 'swr';

import { TarjetaResumen } from '~/components/finanzas/TarjetaResumen';
import { subirLogo } from '~/lib/academy/subir-logo';

import { enviar, useEstudiantesAcademia } from './seccion/comun';
import { RegistrarPago } from './seccion/FinanzasAcademia';

// Finanzas de una academia: la misma pantalla que "Historial de
// Transacciones" de Artiefy (/dashboard/transaction-history): resumen,
// filtros, tabla paginada y detalle con comprobante, verificar / rechazar e
// historial de verificaciones, en los colores de la academia. Además, como
// sus pagos no pasan por PayU: registrar pago, subir comprobante y eliminar.

interface Item {
  id: number;
  nroPago: number;
  concepto: string;
  metodo: string;
  valor: number;
  fecha: string;
  receiptVerified: boolean;
  userName: string | null;
  userEmail: string;
}

interface Resumen {
  totalRecaudado: number;
  totalRecaudadoVerificado: number;
  totalRecaudadoNoVerificado: number;
  totalTransacciones: number;
  totalVerificadas: number;
  totalPendientes: number;
  porcentajeVerificado: number;
}

interface Detalle {
  pago: {
    id: number;
    nroPago: number;
    concepto: string;
    metodo: string;
    valor: number;
    fecha: string;
    receiptUrl: string | null;
    receiptName: string | null;
    receiptUploadedAt: string | null;
    receiptVerified: boolean;
    receiptVerifiedAt: string | null;
    receiptVerifiedBy: string | null;
    user: { name: string | null; email: string };
  };
  verificaciones: {
    id: number;
    verificado: boolean;
    verifiedBy: string | null;
    notes: string | null;
    fileUrl: string | null;
    fileName: string | null;
    createdAt: string;
  }[];
}

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(v);
const formatDate = (f: string) =>
  new Date(f.length === 10 ? `${f}T12:00:00` : f).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
const formatDateTime = (f: string) =>
  new Date(f).toLocaleString('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

// Colores de la academia (equivalentes a #00BDD8 / #01142B de Artiefy).
const P = 'var(--ac-primario)';
const campo =
  'w-full rounded-lg border border-[var(--ac-primario)]/30 bg-[var(--ac-fondo)]/50 px-4 py-2.5 text-sm text-white placeholder-white/40 backdrop-blur-sm transition focus:border-[var(--ac-primario)]/70 focus:ring-2 focus:ring-[var(--ac-primario)]/20 focus:outline-hidden [&>option]:bg-[var(--ac-fondo)]';
const etiqueta = 'mb-2 block text-xs font-medium text-white/70';
const tarjetaInfo =
  'rounded-lg border border-[var(--ac-primario)]/20 bg-[var(--ac-primario)]/5 p-4 backdrop-blur-sm';

function EstadoVerificacion({ ok }: { ok: boolean }) {
  return ok ? (
    <span className="inline-flex items-center gap-1 rounded-full border border-green-500/30 bg-green-500/20 px-3 py-1 text-xs font-medium text-green-300">
      <CheckCircle2 className="size-3" />
      Verificado
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full border border-yellow-500/30 bg-yellow-500/20 px-3 py-1 text-xs font-medium text-yellow-300">
      <AlertCircle className="size-3" />
      Pendiente
    </span>
  );
}

export function HistorialTransaccionesAcademia({ slug }: { slug: string }) {
  const api = `/api/academia/${slug}/finanzas`;
  const [searchQuery, setSearchQuery] = useState('');
  const [verified, setVerified] = useState<'all' | 'true' | 'false'>('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [method, setMethod] = useState('');
  const [concepto, setConcepto] = useState('');
  const [page, setPage] = useState(1);
  const [seleccionado, setSeleccionado] = useState<number | null>(null);
  const [registrando, setRegistrando] = useState(false);
  const estudiantes = useEstudiantesAcademia(slug);

  const params = new URLSearchParams({
    page: String(page),
    pageSize: '10',
    verified,
    ...(searchQuery ? { q: searchQuery } : {}),
    ...(fromDate ? { from: fromDate } : {}),
    ...(toDate ? { to: toDate } : {}),
    ...(method ? { method } : {}),
    ...(concepto ? { concepto } : {}),
  });
  const { data, error, isLoading, mutate } = useSWR(
    [`${api}/historial?${params.toString()}`, 'historial'],
    async ([url]: [string, string]) => {
      const res = await fetch(url);
      const j = (await res.json().catch(() => ({}))) as {
        items?: Item[];
        pagination?: { page: number; totalItems: number; totalPages: number };
        summary?: Resumen;
        error?: string;
      };
      if (!res.ok) throw new Error(j.error ?? 'Error al cargar transacciones');
      return j as Required<Pick<typeof j, 'items' | 'pagination' | 'summary'>>;
    },
    { keepPreviousData: true }
  );
  const items = data?.items ?? [];
  const pagination = data?.pagination;
  const summary: Resumen = data?.summary ?? {
    totalRecaudado: 0,
    totalRecaudadoVerificado: 0,
    totalRecaudadoNoVerificado: 0,
    totalTransacciones: 0,
    totalVerificadas: 0,
    totalPendientes: 0,
    porcentajeVerificado: 0,
  };

  const hasActiveFilters = Boolean(
    searchQuery ||
    verified !== 'all' ||
    fromDate ||
    toDate ||
    method ||
    concepto
  );
  const filtro =
    <T,>(set: (v: T) => void) =>
    (v: T) => {
      set(v);
      setPage(1);
    };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--ac-fondo)] via-[var(--ac-superficie)] to-[var(--ac-fondo)] p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-[var(--ac-primario)]/30 bg-gradient-to-br from-[var(--ac-primario)]/30 to-[var(--ac-primario)]/10 p-3">
              <TrendingUp className="size-6 text-[var(--ac-primario)]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[var(--ac-primario)] sm:text-3xl">
                Historial de Transacciones
              </h1>
              <p className="mt-1 text-sm text-white/50">
                Pagos de los estudiantes de la academia y su historial de
                verificación
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setRegistrando(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--ac-primario)] px-4 py-2.5 text-sm font-semibold text-[var(--ac-primario-texto)] transition hover:opacity-90"
          >
            <Plus className="size-4" /> Registrar pago
          </button>
        </div>

        {/* Resumen de Finanzas */}
        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <TarjetaResumen
            titulo="Total Recaudado"
            icono={CheckCircle2}
            acento="text-green-400"
            borde="border-green-500/20"
            total={formatCurrency(summary.totalRecaudado)}
            izquierda={{
              label: 'Verificado',
              valor: formatCurrency(summary.totalRecaudadoVerificado),
              className: 'text-green-300',
            }}
            derecha={{
              label: 'No Verificado',
              valor: formatCurrency(summary.totalRecaudadoNoVerificado),
              className: 'text-yellow-300',
            }}
          />
          <TarjetaResumen
            titulo="Total Transacciones"
            icono={FileText}
            acento="text-[var(--ac-primario)]"
            borde="border-[var(--ac-primario)]/20"
            total={summary.totalTransacciones}
            izquierda={{
              label: 'Verificadas',
              valor: summary.totalVerificadas,
              className: 'text-green-300',
            }}
            derecha={{
              label: 'No Verificadas',
              valor: summary.totalPendientes,
              className: 'text-yellow-300',
            }}
          />
          <TarjetaResumen
            titulo="Pendientes"
            icono={AlertCircle}
            acento="text-yellow-400"
            borde="border-yellow-500/20"
            total={summary.totalPendientes}
            izquierda={{
              label: '% Verificado',
              valor: `${summary.porcentajeVerificado}%`,
              className: 'text-green-300',
            }}
            derecha={{
              label: 'Monto Pendiente',
              valor: formatCurrency(summary.totalRecaudadoNoVerificado),
              className: 'text-yellow-300',
            }}
          />
        </div>

        {/* Filtros */}
        <div className="mb-6 rounded-2xl border border-[var(--ac-primario)]/20 bg-gradient-to-br from-[var(--ac-primario)]/5 to-[var(--ac-primario)]/[0.02] p-6 shadow-xl backdrop-blur-md">
          <div className="mb-6 flex items-center gap-2">
            <Filter className="size-5 text-[var(--ac-primario)]" />
            <h2 className="text-sm font-semibold text-white">Filtros</h2>
          </div>
          <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="relative">
              <label className={etiqueta}>Búsqueda</label>
              <div className="relative">
                <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[var(--ac-primario)]/50" />
                <input
                  type="text"
                  placeholder="Usuario, email, concepto..."
                  value={searchQuery}
                  onChange={(e) => filtro(setSearchQuery)(e.target.value)}
                  className={`${campo} pl-10`}
                />
              </div>
            </div>
            <div>
              <label className={etiqueta}>Verificación</label>
              <select
                value={verified}
                onChange={(e) =>
                  filtro(setVerified)(
                    e.target.value as 'all' | 'true' | 'false'
                  )
                }
                className={campo}
              >
                <option value="all">Todos</option>
                <option value="true">Verificado</option>
                <option value="false">No verificado</option>
              </select>
            </div>
            <div>
              <label className={etiqueta}>Desde</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => filtro(setFromDate)(e.target.value)}
                className={campo}
              />
            </div>
            <div>
              <label className={etiqueta}>Hasta</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => filtro(setToDate)(e.target.value)}
                className={campo}
              />
            </div>
            <div>
              <label className={etiqueta}>Método</label>
              <input
                type="text"
                placeholder="Ej: tarjeta, transferencia..."
                value={method}
                onChange={(e) => filtro(setMethod)(e.target.value)}
                className={campo}
              />
            </div>
            <div>
              <label className={etiqueta}>Concepto</label>
              <input
                type="text"
                placeholder="Ej: inscripción..."
                value={concepto}
                onChange={(e) => filtro(setConcepto)(e.target.value)}
                className={campo}
              />
            </div>
            {hasActiveFilters && (
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setVerified('all');
                    setFromDate('');
                    setToDate('');
                    setMethod('');
                    setConcepto('');
                    setPage(1);
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm font-medium text-red-300 backdrop-blur-sm transition hover:border-red-500/50 hover:bg-red-500/20"
                >
                  <X className="size-4" />
                  Limpiar
                </button>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-300 backdrop-blur-sm">
            <AlertCircle className="size-5 shrink-0" />
            <p className="text-sm">{(error as Error).message}</p>
          </div>
        )}

        {/* Tabla */}
        <div className="overflow-hidden rounded-2xl border border-[var(--ac-primario)]/20 bg-gradient-to-b from-[var(--ac-primario)]/5 to-[var(--ac-primario)]/[0.02] shadow-2xl backdrop-blur-md">
          {isLoading && !data ? (
            <div className="flex items-center justify-center py-16">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="size-8 animate-spin text-[var(--ac-primario)]" />
                <p className="text-sm text-white/50">
                  Cargando transacciones...
                </p>
              </div>
            </div>
          ) : items.length === 0 ? (
            <div className="py-16 text-center">
              <div className="mx-auto mb-4 w-fit rounded-xl bg-[var(--ac-primario)]/10 p-4">
                <FileText className="mx-auto size-8 text-[var(--ac-primario)]/50" />
              </div>
              <p className="text-white/50">No hay transacciones registradas</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-[var(--ac-primario)]/10 bg-gradient-to-r from-[var(--ac-primario)]/10 to-[var(--ac-primario)]/5">
                  <tr>
                    {[
                      ['Nro. Pago', 'text-left'],
                      ['Usuario', 'text-left'],
                      ['Concepto', 'text-left'],
                      ['Método', 'text-left'],
                      ['Valor', 'text-right'],
                      ['Fecha', 'text-left'],
                      ['Verificación', 'text-center'],
                      ['Acciones', 'text-center'],
                    ].map(([t, al]) => (
                      <th
                        key={t}
                        className={`px-6 py-4 font-semibold text-[var(--ac-primario)] ${al}`}
                      >
                        {t}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--ac-primario)]/10">
                  {items.map((item) => (
                    <tr
                      key={item.id}
                      className="border-0 transition hover:bg-[var(--ac-primario)]/5"
                    >
                      <td className="px-6 py-4">
                        <span className="font-semibold text-white">
                          #{item.nroPago}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-white">
                            {item.userName ?? 'N/A'}
                          </span>
                          <span className="mt-1 text-xs text-white/50">
                            {item.userEmail}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-white/80">
                        {item.concepto}
                      </td>
                      <td className="px-6 py-4 text-white/80">
                        {item.metodo || '—'}
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-[var(--ac-primario)]">
                        {formatCurrency(item.valor)}
                      </td>
                      <td className="px-6 py-4 text-white/80">
                        {formatDate(item.fecha)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <EstadoVerificacion ok={item.receiptVerified} />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          type="button"
                          onClick={() => setSeleccionado(item.id)}
                          className="inline-flex items-center gap-1 rounded-lg bg-[var(--ac-primario)] px-4 py-2 text-xs font-semibold text-[var(--ac-primario-texto)] transition hover:opacity-90"
                        >
                          <Eye className="size-3.5" />
                          Ver
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Paginación */}
        {pagination && pagination.totalPages > 1 && (
          <div className="mt-6 flex flex-col items-center justify-between gap-4 rounded-2xl border border-[var(--ac-primario)]/20 bg-gradient-to-r from-[var(--ac-primario)]/5 to-[var(--ac-primario)]/[0.02] p-4 backdrop-blur-md sm:flex-row">
            <div className="text-xs text-white/50 sm:text-sm">
              Página{' '}
              <span className="font-semibold text-[var(--ac-primario)]">
                {pagination.page}
              </span>{' '}
              de{' '}
              <span className="font-semibold text-[var(--ac-primario)]">
                {pagination.totalPages}
              </span>{' '}
              (
              <span className="font-semibold text-[var(--ac-primario)]">
                {pagination.totalItems}
              </span>{' '}
              transacciones)
            </div>
            <div className="flex gap-2">
              {[
                {
                  t: 'Anterior',
                  off: page === 1,
                  go: () => setPage((p) => Math.max(1, p - 1)),
                },
                {
                  t: 'Siguiente',
                  off: page >= pagination.totalPages,
                  go: () => setPage((p) => p + 1),
                },
              ].map((b) => (
                <button
                  key={b.t}
                  type="button"
                  onClick={b.go}
                  disabled={b.off}
                  className="inline-flex items-center gap-2 rounded-lg border border-[var(--ac-primario)]/30 bg-[var(--ac-fondo)]/50 px-4 py-2 text-sm font-medium text-[var(--ac-primario)] backdrop-blur-sm transition hover:enabled:border-[var(--ac-primario)]/70 hover:enabled:bg-[var(--ac-primario)]/10 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {b.t === 'Anterior' && <ChevronLeft className="size-4" />}
                  {b.t}
                  {b.t === 'Siguiente' && <ChevronRight className="size-4" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {seleccionado !== null && (
          <DetallePago
            api={api}
            id={seleccionado}
            onClose={() => setSeleccionado(null)}
            onCambio={() => mutate()}
          />
        )}
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
      </div>
    </div>
  );
}

function DetallePago({
  api,
  id,
  onClose,
  onCambio,
}: {
  api: string;
  id: number;
  onClose: () => void;
  onCambio: () => Promise<unknown>;
}) {
  const url = `${api}/${id}/verificacion`;
  const { data, error, isLoading, mutate } = useSWR(
    [url, 'detalle-pago'],
    async ([u]: [string, string]) => {
      const res = await fetch(u);
      const j = (await res.json().catch(() => ({}))) as Detalle & {
        error?: string;
      };
      if (!res.ok) throw new Error(j.error ?? 'No se pudo cargar el detalle');
      return j;
    }
  );
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [notas, setNotas] = useState('');
  const [borrando, setBorrando] = useState(false);
  const comprobanteRef = useRef<HTMLInputElement>(null);

  const cambiar = async (cuerpo: Record<string, unknown>, que: string) => {
    setOcupado(que);
    try {
      const nuevo = (await enviar(url, 'PATCH', cuerpo)) as Detalle;
      await mutate(nuevo, { revalidate: false });
      await onCambio();
      setNotas('');
      toast.success(
        que === 'comprobante'
          ? 'Comprobante subido'
          : que === 'verificar'
            ? 'Pago verificado'
            : 'Pago rechazado'
      );
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setOcupado(null);
    }
  };

  const subirComprobante = async (file: File | undefined) => {
    if (!file) return;
    setOcupado('comprobante');
    try {
      const key = await subirLogo(file);
      await cambiar(
        { comprobanteKey: key, comprobanteNombre: file.name },
        'comprobante'
      );
    } catch (err) {
      toast.error((err as Error).message);
      setOcupado(null);
    }
  };

  const pago = data?.pago;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
      <div className="w-full max-w-3xl overflow-hidden rounded-2xl border border-[var(--ac-primario)]/30 bg-gradient-to-b from-[var(--ac-fondo)] to-[var(--ac-superficie)] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--ac-primario)]/20 bg-gradient-to-r from-[var(--ac-primario)]/10 to-transparent px-6 py-4">
          <h2 className="text-lg font-bold" style={{ color: P }}>
            Detalles de Transacción #{pago?.nroPago ?? id}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-lg p-2 text-white/50 transition hover:bg-[var(--ac-primario)]/10 hover:text-[var(--ac-primario)]"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="max-h-[80vh] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="size-8 animate-spin text-[var(--ac-primario)]" />
            </div>
          ) : error || !pago ? (
            <div className="m-6 flex items-center gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-red-300 backdrop-blur-sm">
              <AlertCircle className="size-5 shrink-0" />
              <p className="text-sm">
                {(error as Error | undefined)?.message ?? 'Sin datos'}
              </p>
            </div>
          ) : (
            <div className="space-y-6 p-6">
              <div>
                <h3 className="mb-4 text-sm font-semibold text-[var(--ac-primario)]">
                  Información del Pago
                </h3>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {(
                    [
                      ['Concepto', pago.concepto],
                      ['Método', pago.metodo || '—'],
                      ['Valor', formatCurrency(pago.valor)],
                      ['Fecha Pago', formatDate(pago.fecha)],
                      ['Usuario', pago.user.name ?? 'N/A'],
                      ['Email', pago.user.email],
                    ] as const
                  ).map(([t, v]) => (
                    <div key={t} className={tarjetaInfo}>
                      <p className="text-xs text-white/50">{t}</p>
                      <p
                        className={`mt-2 font-semibold break-words ${
                          t === 'Valor'
                            ? 'text-[var(--ac-primario)]'
                            : 'text-white'
                        } ${t === 'Email' ? 'text-xs break-all' : ''}`}
                      >
                        {v}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="mb-4 text-sm font-semibold text-[var(--ac-primario)]">
                  Comprobante de Pago
                </h3>
                <div className="space-y-4 rounded-lg border border-[var(--ac-primario)]/20 bg-[var(--ac-primario)]/5 p-5 backdrop-blur-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/70">Estado:</span>
                    <EstadoVerificacion ok={pago.receiptVerified} />
                  </div>

                  <textarea
                    value={notas}
                    onChange={(e) => setNotas(e.target.value)}
                    placeholder="Notas de la verificación (opcional)"
                    rows={2}
                    className={campo}
                  />

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() =>
                        void cambiar({ verificado: true, notas }, 'verificar')
                      }
                      disabled={ocupado !== null || pago.receiptVerified}
                      className="flex-1 rounded-lg border border-green-500/30 bg-green-500/20 px-3 py-2 text-xs font-semibold text-green-300 transition hover:enabled:bg-green-500/30 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {ocupado === 'verificar' ? (
                        <Loader2 className="mr-1 inline size-3 animate-spin" />
                      ) : (
                        <CheckCircle2 className="mr-1 inline size-3" />
                      )}
                      Verificar
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        void cambiar({ verificado: false, notas }, 'rechazar')
                      }
                      disabled={ocupado !== null || !pago.receiptVerified}
                      className="flex-1 rounded-lg border border-red-500/30 bg-red-500/20 px-3 py-2 text-xs font-semibold text-red-300 transition hover:enabled:bg-red-500/30 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {ocupado === 'rechazar' ? (
                        <Loader2 className="mr-1 inline size-3 animate-spin" />
                      ) : (
                        <X className="mr-1 inline size-3" />
                      )}
                      Rechazar
                    </button>
                  </div>

                  <div className="border-t border-[var(--ac-primario)]/10 pt-4">
                    {pago.receiptUploadedAt && (
                      <>
                        <p className="text-xs text-white/50">
                          Subido:{' '}
                          <span className="text-white/80">
                            {formatDateTime(pago.receiptUploadedAt)}
                          </span>
                        </p>
                        {pago.receiptName && (
                          <p className="mt-2 text-xs font-medium text-white">
                            {pago.receiptName}
                          </p>
                        )}
                      </>
                    )}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {pago.receiptUrl && (
                        <a
                          href={pago.receiptUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 rounded-lg border border-[var(--ac-primario)]/30 bg-[var(--ac-primario)]/20 px-3 py-1.5 text-xs font-medium text-[var(--ac-primario)] transition hover:bg-[var(--ac-primario)]/30"
                        >
                          <Download className="size-3.5" />
                          Descargar
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => comprobanteRef.current?.click()}
                        disabled={ocupado !== null}
                        className="inline-flex items-center gap-2 rounded-lg border border-[var(--ac-primario)]/30 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white/5 disabled:opacity-50"
                      >
                        {ocupado === 'comprobante' ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <Upload className="size-3.5" />
                        )}
                        {pago.receiptUrl
                          ? 'Cambiar comprobante'
                          : 'Subir comprobante'}
                      </button>
                      <input
                        ref={comprobanteRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={(e) => {
                          void subirComprobante(e.target.files?.[0]);
                          e.target.value = '';
                        }}
                      />
                    </div>
                  </div>

                  {pago.receiptVerifiedAt && (
                    <div className="border-t border-[var(--ac-primario)]/10 pt-4">
                      <p className="text-xs text-white/50">
                        Verificado:{' '}
                        <span className="text-white/80">
                          {formatDateTime(pago.receiptVerifiedAt)}
                        </span>
                      </p>
                      {pago.receiptVerifiedBy && (
                        <p className="mt-2 text-xs font-medium text-white">
                          Por: {pago.receiptVerifiedBy}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="mb-4 text-sm font-semibold text-[var(--ac-primario)]">
                  Historial de Verificaciones
                </h3>
                {data.verificaciones.length === 0 ? (
                  <div className="rounded-lg border border-[var(--ac-primario)]/20 bg-[var(--ac-primario)]/5 p-6 text-center text-sm text-white/50 backdrop-blur-sm">
                    Sin verificaciones registradas
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-[var(--ac-primario)]/20 backdrop-blur-sm">
                    <table className="w-full text-xs">
                      <thead className="border-b border-[var(--ac-primario)]/10 bg-[var(--ac-primario)]/5">
                        <tr>
                          {[
                            'Fecha',
                            'Resultado',
                            'Verificado por',
                            'Notas',
                            'Archivo',
                          ].map((t) => (
                            <th
                              key={t}
                              className="px-4 py-3 text-left font-semibold text-[var(--ac-primario)]"
                            >
                              {t}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--ac-primario)]/10">
                        {data.verificaciones.map((v) => (
                          <tr
                            key={v.id}
                            className="transition hover:bg-[var(--ac-primario)]/5"
                          >
                            <td className="px-4 py-3 text-white/80">
                              {formatDateTime(v.createdAt)}
                            </td>
                            <td className="px-4 py-3">
                              {v.verificado ? (
                                <span className="text-green-300">
                                  Verificado
                                </span>
                              ) : (
                                <span className="text-red-300">Rechazado</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-white/80">
                              {v.verifiedBy ?? 'Sistema / N/A'}
                            </td>
                            <td className="px-4 py-3 text-white/60">
                              {v.notes ?? '-'}
                            </td>
                            <td className="px-4 py-3">
                              {v.fileUrl ? (
                                <a
                                  href={v.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-[var(--ac-primario)] hover:opacity-80"
                                >
                                  <Download className="size-3" />
                                  {v.fileName ?? 'Archivo'}
                                </a>
                              ) : (
                                '-'
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between gap-2 border-t border-[var(--ac-primario)]/20 bg-gradient-to-r from-[var(--ac-primario)]/5 to-transparent px-6 py-4">
          {borrando ? (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-white/70">¿Eliminar este pago?</span>
              <button
                type="button"
                onClick={() => {
                  setOcupado('eliminar');
                  void enviar(`${api}/${id}`, 'DELETE')
                    .then(async () => {
                      toast.success('Pago eliminado');
                      await onCambio();
                      onClose();
                    })
                    .catch((err: Error) => {
                      toast.error(err.message);
                      setOcupado(null);
                    });
                }}
                disabled={ocupado !== null}
                className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-500 disabled:opacity-50"
              >
                Sí, eliminar
              </button>
              <button
                type="button"
                onClick={() => setBorrando(false)}
                className="rounded-lg px-3 py-1.5 text-xs text-white/70 hover:bg-white/5"
              >
                No
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setBorrando(true)}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-red-400 hover:bg-red-500/10"
            >
              <Trash2 className="size-4" /> Eliminar pago
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[var(--ac-primario)]/30 bg-gradient-to-r from-[var(--ac-primario)]/30 to-[var(--ac-primario)]/10 px-6 py-2 text-sm font-semibold text-[var(--ac-primario)] transition hover:from-[var(--ac-primario)]/40 hover:to-[var(--ac-primario)]/20"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
