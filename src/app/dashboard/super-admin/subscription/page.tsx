'use client';

import React, { useCallback, useEffect, useState } from 'react';

import { useUser } from '@clerk/clerk-react';
import {
  FiArrowDownLeft,
  FiArrowUpRight,
  FiClock,
  FiRefreshCw,
  FiSearch,
  FiUser,
  FiUsers,
} from 'react-icons/fi';

import { cn } from '~/lib/utils';

interface AccessLogItem {
  id: number;
  userId: string;
  entryTime: string;
  exitTime: string | null;
  subscriptionStatus: string | null;
  esp32Status: string | null;
  createdAt: string;
  userName: string | null;
  userEmail: string | null;
  userPhone: string | null;
  userRole: string | null;
}

interface ApiResponse {
  items: AccessLogItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  insideCount: number;
  message?: string;
}

type FilterType = 'all' | 'inside' | 'completed';

const pageSizeDefault = 20;

export default function AccessLogsPage() {
  const { user } = useUser();
  const isSuperAdmin = user?.publicMetadata?.role === 'super-admin';

  const [items, setItems] = useState<AccessLogItem[]>([]);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(pageSizeDefault);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [insideCount, setInsideCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');

  // Debounce para búsqueda
  const [debouncedQ, setDebouncedQ] = useState(q);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 400);
    return () => clearTimeout(t);
  }, [q]);

  const fetchLogs = useCallback(
    async (p = page, search = debouncedQ, filterType = filter) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(p),
          pageSize: String(pageSize),
          filter: filterType,
        });
        if (search.trim()) params.set('q', search.trim());

        const res = await fetch(
          `/api/subscriptions/access-logs?${params.toString()}`
        );
        const data = (await res.json()) as ApiResponse;

        if (!res.ok)
          throw new Error(data.message ?? 'Error listando registros');

        setItems(data.items ?? []);
        setPage(data.page ?? p);
        setTotalPages(data.totalPages ?? 1);
        setTotal(data.total ?? 0);
        setInsideCount(data.insideCount ?? 0);
      } catch (e) {
        console.error(e);
        alert('No se pudieron cargar los registros de acceso');
      } finally {
        setLoading(false);
      }
    },
    [page, debouncedQ, filter, pageSize]
  );

  useEffect(() => {
    if (isSuperAdmin) {
      void fetchLogs(1, debouncedQ, filter);
    }
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQ, isSuperAdmin, filter]);

  // Formatear fecha y hora

  // Formatear solo hora
  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Calcular duración
  const calculateDuration = (entry: string, exit: string | null) => {
    if (!exit) return 'En progreso';
    const start = new Date(entry).getTime();
    const end = new Date(exit).getTime();
    const diffMs = end - start;
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // Obtener estado visual
  const getStatusBadge = (log: AccessLogItem) => {
    if (!log.exitTime) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-400">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
          Dentro
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-600/30 px-3 py-1 text-xs font-semibold text-gray-400">
        <span className="h-2 w-2 rounded-full bg-gray-500" />
        Salió
      </span>
    );
  };

  if (!isSuperAdmin) {
    return (
      <div className="flex min-h-[400px] items-center justify-center p-6">
        <div className="text-center">
          <FiUsers className="mx-auto mb-4 h-12 w-12 text-gray-500" />
          <h1 className="text-xl font-semibold text-white">No autorizado</h1>
          <p className="mt-2 text-gray-400">
            No tienes permisos para ver esta página.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Registro de Accesos
        </h1>
        <p className="mt-1 text-sm text-gray-400">
          Control de entrada y salida de personas en las instalaciones.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-800 bg-gradient-to-br from-gray-900 to-gray-800 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">
                Total Registros
              </p>
              <p className="mt-1 text-3xl font-bold text-white">{total}</p>
            </div>
            <div className="rounded-xl bg-primary/20 p-3">
              <FiClock className="h-6 w-6 text-primary" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-emerald-800/50 bg-gradient-to-br from-emerald-900/30 to-gray-900 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-400">
                Personas Dentro
              </p>
              <p className="mt-1 text-3xl font-bold text-white">
                {insideCount}
              </p>
            </div>
            <div className="rounded-xl bg-emerald-500/20 p-3">
              <FiUser className="h-6 w-6 text-emerald-400" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-800 bg-gradient-to-br from-gray-900 to-gray-800 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Página</p>
              <p className="mt-1 text-3xl font-bold text-white">
                {page}{' '}
                <span className="text-lg text-gray-500">/ {totalPages}</span>
              </p>
            </div>
            <div className="rounded-xl bg-gray-700/50 p-3">
              <FiUsers className="h-6 w-6 text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        {/* Search */}
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="w-full rounded-xl border border-gray-700 bg-gray-900/80 px-10 py-3 text-sm font-medium text-white placeholder:text-gray-500 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/30 md:w-80"
            placeholder="Buscar por nombre o correo..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Filter Buttons */}
          <div className="flex rounded-lg border border-gray-700 bg-gray-900/50 p-1">
            <button
              onClick={() => setFilter('all')}
              className={cn(
                'rounded-md px-4 py-2 text-sm font-medium transition-all',
                filter === 'all'
                  ? 'bg-primary text-black'
                  : 'text-gray-400 hover:text-white'
              )}
            >
              Todos
            </button>
            <button
              onClick={() => setFilter('inside')}
              className={cn(
                'rounded-md px-4 py-2 text-sm font-medium transition-all',
                filter === 'inside'
                  ? 'bg-emerald-500 text-white'
                  : 'text-gray-400 hover:text-white'
              )}
            >
              Dentro
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={cn(
                'rounded-md px-4 py-2 text-sm font-medium transition-all',
                filter === 'completed'
                  ? 'bg-gray-600 text-white'
                  : 'text-gray-400 hover:text-white'
              )}
            >
              Completados
            </button>
          </div>

          {/* Refresh Button */}
          <button
            onClick={() => fetchLogs(page, debouncedQ, filter)}
            className="flex items-center gap-2 rounded-xl bg-gray-800 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-700"
          >
            <FiRefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
            Actualizar
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-800 bg-gray-900/50 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-800 bg-gray-800/80">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-300">
                  Persona
                </th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-300">
                  Estado
                </th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-300">
                  <div className="flex items-center gap-1.5">
                    <FiArrowDownLeft className="h-4 w-4 text-emerald-400" />
                    Entrada
                  </div>
                </th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-300">
                  <div className="flex items-center gap-1.5">
                    <FiArrowUpRight className="h-4 w-4 text-red-400" />
                    Salida
                  </div>
                </th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-300">
                  Duración
                </th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-300">
                  Suscripción
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-800/50">
              {loading && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center gap-3">
                      <FiRefreshCw className="h-5 w-5 animate-spin text-primary" />
                      <span className="text-gray-400">
                        Cargando registros...
                      </span>
                    </div>
                  </td>
                </tr>
              )}

              {!loading && items.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <FiUsers className="mx-auto mb-3 h-10 w-10 text-gray-600" />
                    <p className="text-gray-400">No hay registros de acceso</p>
                  </td>
                </tr>
              )}

              {!loading &&
                items.map((log) => (
                  <tr
                    key={log.id}
                    className={cn(
                      'transition-colors hover:bg-gray-800/40',
                      !log.exitTime && 'bg-emerald-900/10'
                    )}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary/30 to-secondary/30">
                          <FiUser className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold text-white">
                            {log.userName ?? 'Sin nombre'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {log.userEmail ?? '—'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(log)}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-emerald-400">
                          {formatTime(log.entryTime)}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(log.entryTime).toLocaleDateString('es-CO')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {log.exitTime ? (
                        <div className="flex flex-col">
                          <span className="font-medium text-red-400">
                            {formatTime(log.exitTime)}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(log.exitTime).toLocaleDateString('es-CO')}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-500">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          'font-medium',
                          !log.exitTime ? 'text-yellow-400' : 'text-gray-300'
                        )}
                      >
                        {calculateDuration(log.entryTime, log.exitTime)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          'rounded-full px-2.5 py-1 text-xs font-medium',
                          log.subscriptionStatus === 'active'
                            ? 'bg-primary/20 text-primary'
                            : 'bg-gray-700 text-gray-400'
                        )}
                      >
                        {log.subscriptionStatus === 'active'
                          ? 'Activa'
                          : (log.subscriptionStatus ?? '—')}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="mt-6 flex items-center justify-between">
        <p className="text-sm font-medium text-gray-400">
          Mostrando {items.length} de {total} registros
        </p>
        <div className="flex gap-2">
          <button
            disabled={page <= 1}
            onClick={() => fetchLogs(page - 1, debouncedQ, filter)}
            className={cn(
              'rounded-xl px-5 py-2.5 text-sm font-medium transition-all',
              page <= 1
                ? 'cursor-not-allowed bg-gray-800/50 text-gray-600'
                : 'bg-gray-800 text-white hover:bg-gray-700'
            )}
          >
            Anterior
          </button>
          <button
            disabled={page >= totalPages}
            onClick={() => fetchLogs(page + 1, debouncedQ, filter)}
            className={cn(
              'rounded-xl px-5 py-2.5 text-sm font-medium transition-all',
              page >= totalPages
                ? 'cursor-not-allowed bg-gray-800/50 text-gray-600'
                : 'bg-primary text-black hover:opacity-90'
            )}
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
}
