'use client';

import { useEffect, useState } from 'react';

interface DateRow {
  id: number;
  startDate: string;
} // startDate viene como 'YYYY-MM-DD'

export default function DatesPage() {
  const [date, setDate] = useState('');
  const [items, setItems] = useState<DateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // --- NUEVO: estados para editar / borrar ---
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState(''); // YYYY-MM-DD
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // helpers edición
  const startEdit = (row: DateRow) => {
    setEditingId(row.id);
    // row.startDate ya viene YYYY-MM-DD (ideal para <input type="date" />)
    setEditValue(row.startDate);
  };
  const cancelEdit = () => {
    setEditingId(null);
    setEditValue('');
  };

  // UPDATE
  const handleUpdate = async (id: number) => {
    const value = editValue.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      alert('Formato de fecha inválido. Usa YYYY-MM-DD');
      return;
    }
    try {
      setUpdatingId(id);
      const res = await fetch(
        `/api/super-admin/form-inscription/dates?id=${id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ startDate: value }),
        }
      );
      if (!res.ok) throw new Error('HTTP ' + res.status);
      setEditingId(null);
      setEditValue('');
      await load();
    } catch {
      alert('No se pudo actualizar la fecha');
    } finally {
      setUpdatingId(null);
    }
  };

  // DELETE
  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar esta fecha?')) return;
    try {
      setDeletingId(id);
      const res = await fetch(
        `/api/super-admin/form-inscription/dates?id=${id}`,
        {
          method: 'DELETE',
        }
      );
      if (!res.ok) throw new Error('HTTP ' + res.status);
      await load();
    } catch {
      alert('No se pudo eliminar la fecha');
    } finally {
      setDeletingId(null);
    }
  };

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/super-admin/form-inscription/dates');
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data: { ok: boolean; dates: DateRow[] } = await res.json();
      setItems(data.dates ?? []);
    } catch {
      setError('No se pudieron cargar las fechas');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleSave = async () => {
    if (!date) return;
    try {
      setSaving(true);
      const res = await fetch('/api/super-admin/form-inscription/dates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // IMPORTANTE: el body debe llevar SOLO { startDate }
        body: JSON.stringify({ startDate: date }),
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      setDate('');
      await load();
    } catch {
      alert('No se pudo guardar la fecha');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B132B] px-4 py-12 text-white">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="rounded-lg bg-[#1C2541] p-6 shadow-lg shadow-cyan-500/10">
          <h2 className="mb-4 text-2xl font-bold text-cyan-400">
            Agregar Fecha
          </h2>
          <div className="flex gap-3">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="flex-1 rounded border border-gray-700 bg-[#2C3E50] p-2 text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
            />
            <button
              onClick={handleSave}
              disabled={saving || !date}
              className="rounded bg-cyan-500 px-4 py-2 font-semibold text-black transition hover:bg-cyan-400 disabled:opacity-60"
            >
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </div>

        <div className="rounded-lg bg-[#1C2541] p-6 shadow-lg shadow-cyan-500/10">
          <h3 className="mb-4 text-xl font-semibold text-cyan-300">
            Fechas de inicio
          </h3>
          {loading ? (
            <p className="text-gray-300">Cargando…</p>
          ) : error ? (
            <p className="text-red-400">{error}</p>
          ) : items.length === 0 ? (
            <p className="text-gray-400">No hay fechas registradas.</p>
          ) : (
            <ul className="divide-y divide-gray-700">
              {items.map((row) => {
                const isEditing = editingId === row.id;
                const isUpdating = updatingId === row.id;
                const isDeleting = deletingId === row.id;

                return (
                  <li key={row.id} className="flex items-center gap-3 py-2">
                    {isEditing ? (
                      <input
                        type="date"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="flex-1 rounded border border-gray-700 bg-[#2C3E50] p-2 text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                      />
                    ) : (
                      <span className="flex-1">{row.startDate}</span>
                    )}

                    {isEditing ? (
                      <>
                        <button
                          onClick={() => void handleUpdate(row.id)}
                          disabled={isUpdating || !editValue}
                          className="rounded bg-green-500 px-3 py-1 font-semibold text-black hover:bg-green-400 disabled:opacity-60"
                        >
                          {isUpdating ? 'Guardando…' : 'Guardar'}
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="rounded bg-gray-600 px-3 py-1 font-semibold text-white hover:bg-gray-500"
                        >
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => startEdit(row)}
                          className="rounded bg-blue-500 px-3 py-1 font-semibold text-black hover:bg-blue-400"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => void handleDelete(row.id)}
                          disabled={isDeleting}
                          className="rounded bg-red-500 px-3 py-1 font-semibold text-black hover:bg-red-400 disabled:opacity-60"
                        >
                          {isDeleting ? 'Eliminando…' : 'Eliminar'}
                        </button>
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
