'use client';

import { useCallback, useEffect, useState } from 'react';

import { useUser } from '@clerk/nextjs';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
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
  Search,
  TrendingUp,
  X,
} from 'lucide-react';

interface Pago {
  id: number;
  nroPago: number;
  concepto: string;
  metodo: string;
  valor: number;
  fecha: string;
  createdAt: string;
  receiptVerified: boolean;
  receiptVerifiedAt: string | null;
  userName: string | null;
  userEmail: string;
  userId: string;
}

interface Verificacion {
  id: number;
  pagoId: number;
  verifiedBy: string | null;
  notes: string | null;
  fileKey: string | null;
  fileUrl: string | null;
  fileName: string | null;
  createdAt: string;
}

interface DetailData {
  pago: Pago & {
    receiptKey: string | null;
    receiptUrl: string | null;
    receiptName: string | null;
    receiptUploadedAt: string | null;
    receiptVerified: boolean;
    receiptVerifiedAt: string | null;
    receiptVerifiedBy: string | null;
    verifiedReceiptKey: string | null;
    verifiedReceiptUrl: string | null;
    verifiedReceiptName: string | null;
    user: { name: string | null; email: string };
  };
  verificaciones: Verificacion[];
}

interface PaginationInfo {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

interface ListResponse {
  ok: boolean;
  message?: string;
  data?: {
    items: Pago[];
    pagination: PaginationInfo;
  };
}

interface DetailResponse {
  ok: boolean;
  message?: string;
  data?: DetailData;
}

export default function TransactionHistoryPage() {
  const { user } = useUser();

  // Estados de filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [verified, setVerified] = useState<'all' | 'true' | 'false'>('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [method, setMethod] = useState('');
  const [concepto, setConcepto] = useState('');

  // Estados de paginación y listado
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [items, setItems] = useState<Pago[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados de resumen (totales de toda la BD)
  const [summary, setSummary] = useState({
    totalRecaudado: 0,
    totalRecaudadoVerificado: 0,
    totalRecaudadoNoVerificado: 0,
    totalTransacciones: 0,
    totalVerificadas: 0,
    totalPendientes: 0,
    porcentajeVerificado: '0',
  });

  // Estados de detalle
  const [selectedPago, setSelectedPago] = useState<number | null>(null);
  const [detailData, setDetailData] = useState<DetailData | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Debounce para búsqueda
  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Cargar listado
  const loadTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('pageSize', pageSize.toString());
      if (debouncedQuery) params.append('q', debouncedQuery);
      if (verified !== 'all') params.append('verified', verified);
      if (fromDate) params.append('from', fromDate);
      if (toDate) params.append('to', toDate);
      if (method) params.append('method', method);
      if (concepto) params.append('concepto', concepto);

      const response = await fetch(
        `/api/transaction-history?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error(
          `Error ${response.status}: ${response.statusText || 'Error desconocido'}`
        );
      }

      const data = (await response.json()) as ListResponse;

      if (data.ok && data.data) {
        setItems(data.data.items);
        setPagination(data.data.pagination);
      } else {
        setError(data.message || 'Error al cargar transacciones');
      }
    } catch (err) {
      console.error('Error loading transactions:', err);
      setError(
        err instanceof Error ? err.message : 'Error al cargar las transacciones'
      );
    } finally {
      setLoading(false);
    }
  }, [
    page,
    pageSize,
    debouncedQuery,
    verified,
    fromDate,
    toDate,
    method,
    concepto,
  ]);

  // Cargar resumen (totales de toda la BD con filtros aplicados)
  const loadSummary = useCallback(async (params: URLSearchParams) => {
    try {
      const url = `/api/transaction-history/summary?${params.toString()}`;
      console.log('📊 Cargando resumen desde:', url);

      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json();
        console.error(
          '❌ Error al cargar summary:',
          response.status,
          errorData
        );
        return;
      }

      const data = await response.json();
      console.log('✅ Datos del summary recibidos:', data);

      if (data.ok && data.data) {
        setSummary(data.data);
        console.log('📈 Totales actualizados:', {
          totalRecaudado: data.data.totalRecaudado,
          totalTransacciones: data.data.totalTransacciones,
          verificadas: data.data.totalVerificadas,
          pendientes: data.data.totalPendientes,
        });
      }
    } catch (err) {
      console.error('❌ Error loading summary:', err);
    }
  }, []);

  useEffect(() => {
    setPage(1); // Reset a página 1 cuando cambian filtros
  }, [debouncedQuery, verified, fromDate, toDate, method, concepto]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  // Cargar resumen cuando cambian los filtros
  useEffect(() => {
    const summaryParams = new URLSearchParams();
    if (debouncedQuery) summaryParams.append('q', debouncedQuery);
    if (verified !== 'all') summaryParams.append('verified', verified);
    if (fromDate) summaryParams.append('from', fromDate);
    if (toDate) summaryParams.append('to', toDate);
    if (method) summaryParams.append('method', method);
    if (concepto) summaryParams.append('concepto', concepto);

    console.log('🔍 Filtros aplicados:', {
      query: debouncedQuery,
      verified: verified !== 'all' ? verified : 'todos',
      fromDate,
      toDate,
      method,
      concepto,
      url: `/api/transaction-history/summary?${summaryParams.toString()}`,
    });

    loadSummary(summaryParams);
  }, [
    debouncedQuery,
    verified,
    fromDate,
    toDate,
    method,
    concepto,
    loadSummary,
  ]);

  // Cargar detalle
  const loadDetail = useCallback(async (pagoId: number) => {
    setDetailLoading(true);
    setDetailError(null);

    try {
      const response = await fetch(`/api/transaction-history/${pagoId}`);

      if (!response.ok) {
        throw new Error(
          `Error ${response.status}: ${response.statusText || 'Error desconocido'}`
        );
      }

      const data = (await response.json()) as DetailResponse;

      if (data.ok && data.data) {
        setDetailData(data.data);
      } else {
        setDetailError(data.message || 'Error al cargar detalles');
      }
    } catch (err) {
      console.error('Error loading detail:', err);
      setDetailError(
        err instanceof Error ? err.message : 'Error al cargar detalles'
      );
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const handleViewDetail = (pagoId: number) => {
    setSelectedPago(pagoId);
    loadDetail(pagoId);
  };

  const handleCloseDetail = () => {
    setSelectedPago(null);
    setDetailData(null);
    setDetailError(null);
  };

  const handleUpdateStatus = async (verified: boolean) => {
    if (!detailData || !user?.id) return;

    setUpdatingStatus(true);
    try {
      const response = await fetch(
        `/api/transaction-history/${detailData.pago.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            receiptVerified: verified,
            receiptVerifiedAt: verified ? new Date().toISOString() : null,
            receiptVerifiedBy: verified ? user.id : null,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Error al actualizar estado');
      }

      // Actualizar el detalle local
      if (detailData) {
        const updatedData = {
          ...detailData,
          pago: {
            ...detailData.pago,
            receiptVerified: verified,
            receiptVerifiedAt: verified ? new Date().toISOString() : null,
            receiptVerifiedBy: verified ? 'Super Admin' : null,
          },
        };
        setDetailData(updatedData);
      }

      // Recargar la lista de transacciones
      loadTransactions();
    } catch (err) {
      console.error('Error updating status:', err);
      setDetailError(
        err instanceof Error ? err.message : 'Error al actualizar estado'
      );
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setVerified('all');
    setFromDate('');
    setToDate('');
    setMethod('');
    setConcepto('');
    setPage(1);
  };

  const handlePrevPage = () => {
    if (pagination && page > 1) setPage(page - 1);
  };

  const handleNextPage = () => {
    if (pagination && page < pagination.totalPages) setPage(page + 1);
  };

  const formatCurrency = (valor: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(valor);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      return format(date, 'dd/MM/yyyy', { locale: es });
    } catch {
      return dateStr;
    }
  };

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      return format(date, 'dd/MM/yyyy HH:mm', { locale: es });
    } catch {
      return dateStr;
    }
  };

  const hasActiveFilters =
    searchQuery ||
    verified !== 'all' ||
    fromDate ||
    toDate ||
    method ||
    concepto;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#01142B] via-[#0a2548] to-[#051f42] p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-xl border border-[#00BDD8]/30 bg-gradient-to-br from-[#00BDD8]/30 to-[#00BDD8]/10 p-3">
              <TrendingUp className="h-6 w-6 text-[#00BDD8]" />
            </div>
            <div>
              <h1 className="bg-gradient-to-r from-[#00BDD8] to-[#00d9ff] bg-clip-text text-2xl font-bold text-transparent sm:text-3xl">
                Historial de Transacciones
              </h1>
              <p className="mt-1 text-sm text-gray-400">
                Transacciones registradas en facturas y su historial de
                verificación
              </p>
            </div>
          </div>
        </div>

        {/* Resumen de Finanzas */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Total Recaudado */}
          <div className="rounded-2xl border border-green-500/20 bg-gradient-to-br from-green-500/10 to-green-500/5 p-6 backdrop-blur-md">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-xs font-semibold text-green-400 uppercase">
                Total Recaudado
              </span>
              <div className="rounded-lg bg-green-500/20 p-2">
                <CheckCircle2 className="h-4 w-4 text-green-400" />
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <p className="mb-1 text-xs text-gray-400">Total</p>
                <p className="text-xl font-bold text-white">
                  {formatCurrency(summary.totalRecaudado)}
                </p>
              </div>
              <div className="border-t border-green-500/10 pt-3">
                <p className="mb-1 text-xs text-gray-400">Verificado</p>
                <p className="text-sm font-semibold text-green-300">
                  {formatCurrency(summary.totalRecaudadoVerificado)}
                </p>
              </div>
              <div>
                <p className="mb-1 text-xs text-gray-400">No Verificado</p>
                <p className="text-sm font-semibold text-yellow-300">
                  {formatCurrency(summary.totalRecaudadoNoVerificado)}
                </p>
              </div>
            </div>
          </div>

          {/* Total Transacciones */}
          <div className="rounded-2xl border border-[#00BDD8]/20 bg-gradient-to-br from-[#00BDD8]/10 to-[#00BDD8]/5 p-6 backdrop-blur-md">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-xs font-semibold text-[#00BDD8] uppercase">
                Total Transacciones
              </span>
              <div className="rounded-lg bg-[#00BDD8]/20 p-2">
                <FileText className="h-4 w-4 text-[#00BDD8]" />
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <p className="mb-1 text-xs text-gray-400">Total</p>
                <p className="text-xl font-bold text-white">
                  {summary.totalTransacciones}
                </p>
              </div>
              <div className="border-t border-[#00BDD8]/10 pt-3">
                <p className="mb-1 text-xs text-gray-400">Verificadas</p>
                <p className="text-sm font-semibold text-green-300">
                  {summary.totalVerificadas}
                </p>
              </div>
              <div>
                <p className="mb-1 text-xs text-gray-400">No Verificadas</p>
                <p className="text-sm font-semibold text-yellow-300">
                  {summary.totalPendientes}
                </p>
              </div>
            </div>
          </div>

          {/* Resumen */}
          <div className="rounded-2xl border border-yellow-500/20 bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 p-6 backdrop-blur-md">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-xs font-semibold text-yellow-400 uppercase">
                Resumen
              </span>
              <div className="rounded-lg bg-yellow-500/20 p-2">
                <AlertCircle className="h-4 w-4 text-yellow-400" />
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <p className="mb-1 text-xs text-gray-400">Pendientes</p>
                <p className="text-xl font-bold text-white">
                  {summary.totalPendientes}
                </p>
              </div>
              <div className="border-t border-yellow-500/10 pt-3">
                <p className="mb-1 text-xs text-gray-400">% Verificado</p>
                <p className="text-sm font-semibold text-green-300">
                  {summary.porcentajeVerificado}%
                </p>
              </div>
              <div>
                <p className="mb-1 text-xs text-gray-400">Monto Pendiente</p>
                <p className="text-sm font-semibold text-yellow-300">
                  {formatCurrency(summary.totalRecaudadoNoVerificado)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="mb-6 rounded-2xl border border-[#00BDD8]/20 bg-gradient-to-br from-[#00BDD8]/5 to-[#00BDD8]/[0.02] p-6 shadow-xl backdrop-blur-md">
          <div className="mb-6 flex items-center gap-2">
            <Filter className="h-5 w-5 text-[#00BDD8]" />
            <h2 className="text-sm font-semibold text-white">Filtros</h2>
          </div>
          <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Búsqueda */}
            <div className="relative">
              <label className="mb-2 block text-xs font-medium text-gray-300">
                Búsqueda
              </label>
              <div className="relative">
                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#00BDD8]/50" />
                <input
                  type="text"
                  placeholder="Usuario, email, concepto..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-[#00BDD8]/30 bg-[#001a35]/50 py-2.5 pr-4 pl-10 text-sm text-white placeholder-gray-500 backdrop-blur-sm transition focus:border-[#00BDD8]/70 focus:ring-2 focus:ring-[#00BDD8]/20 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Estado Verificación */}
            <div>
              <label className="mb-2 block text-xs font-medium text-gray-300">
                Verificación
              </label>
              <select
                value={verified}
                onChange={(e) =>
                  setVerified(e.target.value as 'all' | 'true' | 'false')
                }
                className="w-full rounded-lg border border-[#00BDD8]/30 bg-[#001a35]/50 px-4 py-2.5 text-sm text-white backdrop-blur-sm focus:border-[#00BDD8]/70 focus:ring-2 focus:ring-[#00BDD8]/20 focus:outline-hidden"
              >
                <option value="all" className="bg-[#01142B]">
                  Todos
                </option>
                <option value="true" className="bg-[#01142B]">
                  Verificado
                </option>
                <option value="false" className="bg-[#01142B]">
                  No verificado
                </option>
              </select>
            </div>

            {/* Desde */}
            <div>
              <label className="mb-2 block text-xs font-medium text-gray-300">
                Desde
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full rounded-lg border border-[#00BDD8]/30 bg-[#001a35]/50 px-4 py-2.5 text-sm text-white backdrop-blur-sm focus:border-[#00BDD8]/70 focus:ring-2 focus:ring-[#00BDD8]/20 focus:outline-hidden"
              />
            </div>

            {/* Hasta */}
            <div>
              <label className="mb-2 block text-xs font-medium text-gray-300">
                Hasta
              </label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full rounded-lg border border-[#00BDD8]/30 bg-[#001a35]/50 px-4 py-2.5 text-sm text-white backdrop-blur-sm focus:border-[#00BDD8]/70 focus:ring-2 focus:ring-[#00BDD8]/20 focus:outline-hidden"
              />
            </div>

            {/* Método */}
            <div>
              <label className="mb-2 block text-xs font-medium text-gray-300">
                Método
              </label>
              <input
                type="text"
                placeholder="Ej: tarjeta, transferencia..."
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="w-full rounded-lg border border-[#00BDD8]/30 bg-[#001a35]/50 px-4 py-2.5 text-sm text-white placeholder-gray-500 backdrop-blur-sm focus:border-[#00BDD8]/70 focus:ring-2 focus:ring-[#00BDD8]/20 focus:outline-hidden"
              />
            </div>

            {/* Concepto */}
            <div>
              <label className="mb-2 block text-xs font-medium text-gray-300">
                Concepto
              </label>
              <input
                type="text"
                placeholder="Ej: inscripción..."
                value={concepto}
                onChange={(e) => setConcepto(e.target.value)}
                className="w-full rounded-lg border border-[#00BDD8]/30 bg-[#001a35]/50 px-4 py-2.5 text-sm text-white placeholder-gray-500 backdrop-blur-sm focus:border-[#00BDD8]/70 focus:ring-2 focus:ring-[#00BDD8]/20 focus:outline-hidden"
              />
            </div>

            {/* Botón Limpiar */}
            {hasActiveFilters && (
              <div className="flex items-end">
                <button
                  onClick={handleClearFilters}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm font-medium text-red-300 backdrop-blur-sm transition hover:border-red-500/50 hover:bg-red-500/20"
                >
                  <X className="h-4 w-4" />
                  Limpiar
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-300 backdrop-blur-sm">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Tabla */}
        <div className="overflow-hidden rounded-2xl border border-[#00BDD8]/20 bg-gradient-to-b from-[#00BDD8]/5 to-[#00BDD8]/[0.02] shadow-2xl backdrop-blur-md">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-[#00BDD8]" />
                <p className="text-sm text-gray-400">
                  Cargando transacciones...
                </p>
              </div>
            </div>
          ) : items.length === 0 ? (
            <div className="py-16 text-center">
              <div className="mx-auto mb-4 w-fit rounded-xl bg-[#00BDD8]/10 p-4">
                <FileText className="mx-auto h-8 w-8 text-[#00BDD8]/50" />
              </div>
              <p className="text-gray-400">No hay transacciones registradas</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-[#00BDD8]/10 bg-gradient-to-r from-[#00BDD8]/10 to-[#00BDD8]/5">
                  <tr>
                    <th className="px-6 py-4 text-left font-semibold text-[#00BDD8]">
                      Nro. Pago
                    </th>
                    <th className="px-6 py-4 text-left font-semibold text-[#00BDD8]">
                      Usuario
                    </th>
                    <th className="px-6 py-4 text-left font-semibold text-[#00BDD8]">
                      Concepto
                    </th>
                    <th className="px-6 py-4 text-left font-semibold text-[#00BDD8]">
                      Método
                    </th>
                    <th className="px-6 py-4 text-right font-semibold text-[#00BDD8]">
                      Valor
                    </th>
                    <th className="px-6 py-4 text-left font-semibold text-[#00BDD8]">
                      Fecha
                    </th>
                    <th className="px-6 py-4 text-center font-semibold text-[#00BDD8]">
                      Verificación
                    </th>
                    <th className="px-6 py-4 text-center font-semibold text-[#00BDD8]">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#00BDD8]/10">
                  {items.map((item) => (
                    <tr
                      key={item.id}
                      className="border-0 transition hover:bg-[#00BDD8]/5"
                    >
                      <td className="px-6 py-4">
                        <span className="font-semibold text-white">
                          #{item.nroPago}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-white">
                            {item.userName || 'N/A'}
                          </span>
                          <span className="mt-1 text-xs text-gray-400">
                            {item.userEmail}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-300">
                        {item.concepto}
                      </td>
                      <td className="px-6 py-4 text-gray-300">{item.metodo}</td>
                      <td className="px-6 py-4 text-right font-semibold text-[#00BDD8]">
                        {formatCurrency(item.valor)}
                      </td>
                      <td className="px-6 py-4 text-gray-300">
                        {formatDate(item.fecha)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {item.receiptVerified ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-green-500/30 bg-green-500/20 px-3 py-1 text-xs font-medium text-green-300">
                            <CheckCircle2 className="h-3 w-3" />
                            Verificado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full border border-yellow-500/30 bg-yellow-500/20 px-3 py-1 text-xs font-medium text-yellow-300">
                            <AlertCircle className="h-3 w-3" />
                            Pendiente
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleViewDetail(item.id)}
                          className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-[#00BDD8] to-[#00d9ff] px-4 py-2 text-xs font-semibold text-[#01142B] transition hover:shadow-lg hover:shadow-[#00BDD8]/50"
                        >
                          <Eye className="h-3.5 w-3.5" />
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
          <div className="mt-6 flex flex-col items-center justify-between gap-4 rounded-2xl border border-[#00BDD8]/20 bg-gradient-to-r from-[#00BDD8]/5 to-[#00BDD8]/[0.02] p-4 backdrop-blur-md sm:flex-row">
            <div className="text-xs text-gray-400 sm:text-sm">
              Página{' '}
              <span className="font-semibold text-[#00BDD8]">
                {pagination.page}
              </span>{' '}
              de{' '}
              <span className="font-semibold text-[#00BDD8]">
                {pagination.totalPages}
              </span>{' '}
              (
              <span className="font-semibold text-[#00BDD8]">
                {pagination.totalItems}
              </span>{' '}
              transacciones)
            </div>
            <div className="flex gap-2">
              <button
                onClick={handlePrevPage}
                disabled={page === 1}
                className="inline-flex items-center gap-2 rounded-lg border border-[#00BDD8]/30 bg-[#001a35]/50 px-4 py-2 text-sm font-medium text-[#00BDD8] backdrop-blur-sm transition hover:enabled:border-[#00BDD8]/70 hover:enabled:bg-[#00BDD8]/10 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </button>
              <button
                onClick={handleNextPage}
                disabled={page >= pagination.totalPages}
                className="inline-flex items-center gap-2 rounded-lg border border-[#00BDD8]/30 bg-[#001a35]/50 px-4 py-2 text-sm font-medium text-[#00BDD8] backdrop-blur-sm transition hover:enabled:border-[#00BDD8]/70 hover:enabled:bg-[#00BDD8]/10 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Siguiente
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Modal de Detalle */}
        {selectedPago && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
            <div className="w-full max-w-3xl overflow-hidden rounded-2xl border border-[#00BDD8]/30 bg-gradient-to-b from-[#01142B] to-[#0a2548] shadow-2xl">
              <div className="flex items-center justify-between border-b border-[#00BDD8]/20 bg-gradient-to-r from-[#00BDD8]/10 to-transparent px-6 py-4">
                <h2 className="bg-gradient-to-r from-[#00BDD8] to-[#00d9ff] bg-clip-text text-lg font-bold text-transparent">
                  Detalles de Transacción #{detailData?.pago.nroPago}
                </h2>
                <button
                  onClick={handleCloseDetail}
                  className="rounded-lg p-2 text-gray-400 transition hover:bg-[#00BDD8]/10 hover:text-[#00BDD8]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="max-h-[80vh] overflow-y-auto">
                {detailLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin text-[#00BDD8]" />
                  </div>
                ) : detailError ? (
                  <div className="m-6 flex items-center gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-red-300 backdrop-blur-sm">
                    <AlertCircle className="h-5 w-5 flex-shrink-0" />
                    <p className="text-sm">{detailError}</p>
                  </div>
                ) : detailData ? (
                  <div className="space-y-6 p-6">
                    {/* Resumen */}
                    <div>
                      <h3 className="mb-4 text-sm font-semibold text-[#00BDD8]">
                        Información del Pago
                      </h3>
                      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                        <div className="rounded-lg border border-[#00BDD8]/20 bg-[#00BDD8]/5 p-4 backdrop-blur-sm">
                          <p className="text-xs text-gray-400">Concepto</p>
                          <p className="mt-2 font-semibold break-words text-white">
                            {detailData.pago.concepto}
                          </p>
                        </div>
                        <div className="rounded-lg border border-[#00BDD8]/20 bg-[#00BDD8]/5 p-4 backdrop-blur-sm">
                          <p className="text-xs text-gray-400">Método</p>
                          <p className="mt-2 font-semibold text-white">
                            {detailData.pago.metodo}
                          </p>
                        </div>
                        <div className="rounded-lg border border-[#00BDD8]/20 bg-[#00BDD8]/5 p-4 backdrop-blur-sm">
                          <p className="text-xs text-gray-400">Valor</p>
                          <p className="mt-2 font-semibold text-[#00BDD8]">
                            {formatCurrency(detailData.pago.valor)}
                          </p>
                        </div>
                        <div className="rounded-lg border border-[#00BDD8]/20 bg-[#00BDD8]/5 p-4 backdrop-blur-sm">
                          <p className="text-xs text-gray-400">Fecha Pago</p>
                          <p className="mt-2 font-semibold text-white">
                            {formatDate(detailData.pago.fecha)}
                          </p>
                        </div>
                        <div className="rounded-lg border border-[#00BDD8]/20 bg-[#00BDD8]/5 p-4 backdrop-blur-sm">
                          <p className="text-xs text-gray-400">Usuario</p>
                          <p className="mt-2 font-semibold text-white">
                            {detailData.pago.user.name || 'N/A'}
                          </p>
                        </div>
                        <div className="rounded-lg border border-[#00BDD8]/20 bg-[#00BDD8]/5 p-4 backdrop-blur-sm">
                          <p className="text-xs text-gray-400">Email</p>
                          <p className="mt-2 text-xs font-semibold break-all text-white">
                            {detailData.pago.user.email}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Comprobante */}
                    <div>
                      <h3 className="mb-4 text-sm font-semibold text-[#00BDD8]">
                        Comprobante de Pago
                      </h3>
                      <div className="space-y-4 rounded-lg border border-[#00BDD8]/20 bg-[#00BDD8]/5 p-5 backdrop-blur-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-300">Estado:</span>
                          {detailData.pago.receiptVerified ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-green-500/30 bg-green-500/20 px-3 py-1 text-xs font-medium text-green-300">
                              <CheckCircle2 className="h-3 w-3" />
                              Verificado
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full border border-yellow-500/30 bg-yellow-500/20 px-3 py-1 text-xs font-medium text-yellow-300">
                              <AlertCircle className="h-3 w-3" />
                              Pendiente
                            </span>
                          )}
                        </div>

                        {/* Botones para cambiar estado */}
                        <div className="flex gap-2 pt-2">
                          <button
                            onClick={() => handleUpdateStatus(true)}
                            disabled={
                              updatingStatus || detailData.pago.receiptVerified
                            }
                            className="flex-1 rounded-lg border border-green-500/30 bg-green-500/20 px-3 py-2 text-xs font-semibold text-green-300 transition hover:enabled:bg-green-500/30 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {updatingStatus ? (
                              <Loader2 className="mr-1 inline h-3 w-3 animate-spin" />
                            ) : (
                              <CheckCircle2 className="mr-1 inline h-3 w-3" />
                            )}
                            Verificar
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(false)}
                            disabled={
                              updatingStatus || !detailData.pago.receiptVerified
                            }
                            className="flex-1 rounded-lg border border-red-500/30 bg-red-500/20 px-3 py-2 text-xs font-semibold text-red-300 transition hover:enabled:bg-red-500/30 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {updatingStatus ? (
                              <Loader2 className="mr-1 inline h-3 w-3 animate-spin" />
                            ) : (
                              <X className="mr-1 inline h-3 w-3" />
                            )}
                            Rechazar
                          </button>
                        </div>

                        {detailData.pago.receiptUploadedAt && (
                          <div className="border-t border-[#00BDD8]/10 pt-4">
                            <p className="text-xs text-gray-400">
                              Subido:{' '}
                              <span className="text-gray-300">
                                {formatDateTime(
                                  detailData.pago.receiptUploadedAt
                                )}
                              </span>
                            </p>
                            {detailData.pago.receiptName && (
                              <p className="mt-2 text-xs font-medium text-white">
                                {detailData.pago.receiptName}
                              </p>
                            )}
                            {detailData.pago.receiptUrl && (
                              <a
                                href={detailData.pago.receiptUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-3 inline-flex items-center gap-2 rounded-lg border border-[#00BDD8]/30 bg-[#00BDD8]/20 px-3 py-1.5 text-xs font-medium text-[#00BDD8] transition hover:bg-[#00BDD8]/30"
                              >
                                <Download className="h-3.5 w-3.5" />
                                Descargar
                              </a>
                            )}
                          </div>
                        )}

                        {detailData.pago.receiptVerifiedAt && (
                          <div className="border-t border-[#00BDD8]/10 pt-4">
                            <p className="text-xs text-gray-400">
                              Verificado:{' '}
                              <span className="text-gray-300">
                                {formatDateTime(
                                  detailData.pago.receiptVerifiedAt
                                )}
                              </span>
                            </p>
                            {detailData.pago.receiptVerifiedBy && (
                              <p className="mt-2 text-xs font-medium text-white">
                                Por: {detailData.pago.receiptVerifiedBy}
                              </p>
                            )}
                          </div>
                        )}

                        {detailData.pago.verifiedReceiptUrl && (
                          <div className="border-t border-[#00BDD8]/10 pt-4">
                            <p className="text-xs text-gray-400">
                              Comprobante Verificado
                            </p>
                            {detailData.pago.verifiedReceiptName && (
                              <p className="mt-2 text-xs font-medium text-white">
                                {detailData.pago.verifiedReceiptName}
                              </p>
                            )}
                            <a
                              href={detailData.pago.verifiedReceiptUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-3 inline-flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/20 px-3 py-1.5 text-xs font-medium text-green-300 transition hover:bg-green-500/30"
                            >
                              <Download className="h-3.5 w-3.5" />
                              Descargar
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Historial de Verificaciones */}
                    <div>
                      <h3 className="mb-4 text-sm font-semibold text-[#00BDD8]">
                        Historial de Verificaciones
                      </h3>
                      {detailData.verificaciones.length === 0 ? (
                        <div className="rounded-lg border border-[#00BDD8]/20 bg-[#00BDD8]/5 p-6 text-center text-sm text-gray-400 backdrop-blur-sm">
                          Sin verificaciones registradas
                        </div>
                      ) : (
                        <div className="overflow-x-auto rounded-lg border border-[#00BDD8]/20 backdrop-blur-sm">
                          <table className="w-full text-xs">
                            <thead className="border-b border-[#00BDD8]/10 bg-[#00BDD8]/5">
                              <tr>
                                <th className="px-4 py-3 text-left font-semibold text-[#00BDD8]">
                                  Fecha
                                </th>
                                <th className="px-4 py-3 text-left font-semibold text-[#00BDD8]">
                                  Verificado por
                                </th>
                                <th className="px-4 py-3 text-left font-semibold text-[#00BDD8]">
                                  Notas
                                </th>
                                <th className="px-4 py-3 text-left font-semibold text-[#00BDD8]">
                                  Archivo
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#00BDD8]/10">
                              {detailData.verificaciones.map((v) => (
                                <tr
                                  key={v.id}
                                  className="transition hover:bg-[#00BDD8]/5"
                                >
                                  <td className="px-4 py-3 text-gray-300">
                                    {formatDateTime(v.createdAt)}
                                  </td>
                                  <td className="px-4 py-3 text-gray-300">
                                    {v.verifiedBy || 'Sistema / N/A'}
                                  </td>
                                  <td className="px-4 py-3 text-gray-400">
                                    {v.notes || '-'}
                                  </td>
                                  <td className="px-4 py-3">
                                    {v.fileUrl ? (
                                      <a
                                        href={v.fileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-[#00BDD8] transition hover:text-[#00d9ff]"
                                      >
                                        <Download className="h-3 w-3" />
                                        {v.fileName || 'Archivo'}
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
                ) : null}
              </div>

              <div className="flex justify-end border-t border-[#00BDD8]/20 bg-gradient-to-r from-[#00BDD8]/5 to-transparent px-6 py-4">
                <button
                  onClick={handleCloseDetail}
                  className="rounded-lg border border-[#00BDD8]/30 bg-gradient-to-r from-[#00BDD8]/30 to-[#00BDD8]/10 px-6 py-2 text-sm font-semibold text-[#00BDD8] transition hover:from-[#00BDD8]/40 hover:to-[#00BDD8]/20"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
