/* eslint-disable */
'use client';

import React, { useEffect, useMemo, useState } from 'react';

import { useUser } from '@clerk/clerk-react';
import {
  FiEdit2,
  FiEye,
  FiRefreshCw,
  FiSearch,
  FiTrash2,
  FiX,
} from 'react-icons/fi';

import { cn } from '~/lib/utils';

interface LogItem {
  id: number;
  userId: string | null;
  usuario: string;
  contrasena: string | null;
  correo: string;
  nota: string;
  createdAt: string;
}

const pageSizeDefault = 20;

export default function CredentialsLogsPage() {
  const { user } = useUser();
  const isSuperAdmin = user?.publicMetadata?.role === 'super-admin';

  const [items, setItems] = useState<LogItem[]>([]);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(pageSizeDefault);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  // modal view/edit
  const [openModal, setOpenModal] = useState(false);
  const [modalItem, setModalItem] = useState<LogItem | null>(null);
  const [notaEdit, setNotaEdit] = useState('');
  const [saving, setSaving] = useState(false);

  // debounce simple para búsqueda
  const [debouncedQ, setDebouncedQ] = useState(q);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 400);
    return () => clearTimeout(t);
  }, [q]);

  async function fetchLogs(p = page, search = debouncedQ) {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(p),
        pageSize: String(pageSize),
      });
      if (search.trim()) params.set('q', search.trim());

      const res = await fetch(
        `/api/super-admin/form-inscription/credentials-logs?${params.toString()}`
      );
      const data = await res.json();

      if (!res.ok) throw new Error(data?.message ?? 'Error listando logs');

      setItems(data.items ?? []);
      setPage(data.page ?? p);
      setTotalPages(data.totalPages ?? 1);
    } catch (e) {
      console.error(e);
      alert('No se pudieron cargar los logs');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isSuperAdmin) fetchLogs(1, debouncedQ);
    // resetea pag al cambiar búsqueda
    setPage(1);
  }, [debouncedQ, isSuperAdmin]);

  function openView(item: LogItem) {
    setModalItem(item);
    setNotaEdit(item.nota);
    setOpenModal(true);
  }

  async function saveNota() {
    if (!modalItem) return;
    setSaving(true);
    try {
      const res = await fetch(
        `/api/super-admin/form-inscription/credentials-logs/${modalItem.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nota: notaEdit }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message ?? 'Error actualizando');

      // update local
      setItems((prev) =>
        prev.map((x) => (x.id === modalItem.id ? { ...x, nota: data.nota } : x))
      );
      setOpenModal(false);
    } catch (e) {
      console.error(e);
      alert('No se pudo actualizar la nota');
    } finally {
      setSaving(false);
    }
  }

  async function deleteItem(id: number) {
    if (!confirm('¿Seguro que deseas eliminar este log?')) return;
    try {
      const res = await fetch(
        `/api/super-admin/form-inscription/credentials-logs/${id}`,
        {
          method: 'DELETE',
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message ?? 'Error eliminando');

      setItems((prev) => prev.filter((x) => x.id !== id));
    } catch (e) {
      console.error(e);
      alert('No se pudo eliminar');
    }
  }

  if (!isSuperAdmin) {
    return (
      <div className="p-6">
        <h1 className="text-lg font-semibold">No autorizado</h1>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Logs de Credenciales
          </h1>
          <p className="mt-1 text-sm text-gray-400">
            Historial de envíos de usuario/contraseña a nuevos registros.
          </p>
        </div>

        <div className="flex gap-2">
          <div className="relative">
            <FiSearch className="absolute top-2.5 left-2 text-gray-400" />
            <input
              className="focus:border-primary focus:ring-primary w-72 rounded-lg border border-gray-700 bg-gray-900 px-8 py-2.5 text-sm font-medium text-white outline-none placeholder:text-gray-500 focus:ring-1"
              placeholder="Buscar por usuario, correo o nota..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <button
            onClick={() => fetchLogs(1, debouncedQ)}
            className="flex items-center gap-2 rounded-lg bg-gray-800 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-700"
          >
            <FiRefreshCw className="h-4 w-4" /> Recargar
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-800 bg-gray-900">
        <table className="w-full text-left text-sm text-gray-200">
          <thead className="bg-gray-800 text-xs font-semibold tracking-wider text-gray-300 uppercase">
            <tr>
              <th className="px-5 py-4">Usuario</th>
              <th className="px-5 py-4">Correo</th>
              <th className="px-5 py-4">Contraseña</th>
              <th className="px-5 py-4">Nota</th>
              <th className="px-5 py-4">Fecha</th>
              <th className="px-5 py-4 text-right">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-400">
                  Cargando...
                </td>
              </tr>
            )}

            {!loading && items.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-400">
                  No hay registros
                </td>
              </tr>
            )}

            {!loading &&
              items.map((it) => (
                <tr
                  key={it.id}
                  className="hover:bg-gray-850 border-t border-gray-800 transition-colors"
                >
                  <td className="px-5 py-4 font-medium">{it.usuario}</td>
                  <td className="px-5 py-4">{it.correo}</td>
                  <td className="px-5 py-4 font-mono text-base">
                    {it.contrasena ? (
                      '••••••••'
                    ) : (
                      <span className="text-gray-500">—</span>
                    )}
                  </td>
                  <td className="px-5 py-4">{it.nota}</td>
                  <td className="px-5 py-4 text-xs text-gray-400">
                    {new Date(it.createdAt).toLocaleString('es-CO')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openView(it)}
                        title="Ver / editar"
                        className="rounded-md bg-gray-800 p-2 hover:bg-gray-700"
                      >
                        <FiEye />
                      </button>
                      <button
                        onClick={() => deleteItem(it.id)}
                        title="Eliminar"
                        className="rounded-md bg-red-700/80 p-2 hover:bg-red-600"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* paginación */}
      <div className="mt-4 flex items-center justify-between">
        <p className="text-sm font-medium text-gray-400">
          Página {page} de {totalPages}
        </p>
        <div className="flex gap-2">
          <button
            disabled={page <= 1}
            onClick={() => fetchLogs(page - 1, debouncedQ)}
            className={cn(
              'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
              page <= 1
                ? 'cursor-not-allowed bg-gray-800 text-gray-500'
                : 'bg-gray-700 text-white hover:bg-gray-600'
            )}
          >
            Anterior
          </button>
          <button
            disabled={page >= totalPages}
            onClick={() => fetchLogs(page + 1, debouncedQ)}
            className={cn(
              'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
              page >= totalPages
                ? 'cursor-not-allowed bg-gray-800 text-gray-500'
                : 'bg-gray-700 text-white hover:bg-gray-600'
            )}
          >
            Siguiente
          </button>
        </div>
      </div>

      {/* modal */}
      {openModal && modalItem && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-gray-800 bg-gray-900 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">
                Log #{modalItem.id}
              </h2>
              <button
                onClick={() => setOpenModal(false)}
                className="rounded-md p-1 hover:bg-gray-800"
              >
                <FiX />
              </button>
            </div>

            <div className="space-y-3 text-base text-gray-200">
              <div>
                <span className="font-medium text-gray-400">Usuario: </span>
                <span className="font-medium text-white">
                  {modalItem.usuario}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-400">Correo: </span>
                <span className="text-white">{modalItem.correo}</span>
              </div>
              <div>
                <span className="font-medium text-gray-400">Contraseña: </span>
                <span className="font-mono text-lg text-white">
                  {modalItem.contrasena ?? '—'}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-400">Fecha: </span>
                <span className="text-sm text-gray-300">
                  {new Date(modalItem.createdAt).toLocaleString('es-CO')}
                </span>
              </div>

              <div className="pt-3">
                <label className="mb-2 block text-sm font-medium text-gray-400">
                  Nota (editable)
                </label>
                <input
                  value={notaEdit}
                  onChange={(e) => setNotaEdit(e.target.value)}
                  className="focus:border-primary focus:ring-primary w-full rounded-lg border border-gray-700 bg-gray-950 px-4 py-2.5 text-base text-white transition-colors outline-none focus:ring-1"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setOpenModal(false)}
                className="rounded-lg bg-gray-800 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-700"
              >
                Cancelar
              </button>
              <button
                disabled={saving}
                onClick={saveNota}
                className="bg-primary rounded-lg px-5 py-2.5 text-sm font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
