'use client';

import { useEffect, useState } from 'react';

interface Horario {
  id: number;
  schedule: string;
}

export default function HorariosPage() {
  const [schedule, setSchedule] = useState('');
  const [items, setItems] = useState<Horario[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- NUEVO: estados para editar / borrar ---
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // helpers de edición
  const startEdit = (row: Horario) => {
    setEditingId(row.id);
    setEditValue(row.schedule);
  };
  const cancelEdit = () => {
    setEditingId(null);
    setEditValue('');
  };

  // UPDATE
  const handleUpdate = async (id: number) => {
    const value = editValue.trim();
    if (!value) return;
    try {
      setUpdatingId(id);
      const res = await fetch(`/api/super-admin/form-inscription/horario?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schedules: value }),
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      setEditingId(null);
      setEditValue('');
      await load();
    } catch {
      alert('No se pudo actualizar el horario');
    } finally {
      setUpdatingId(null);
    }
  };

  // DELETE
  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar este horario?')) return;
    try {
      setDeletingId(id);
      const res = await fetch(`/api/super-admin/form-inscription/horario?id=${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      await load();
    } catch {
      alert('No se pudo eliminar el horario');
    } finally {
      setDeletingId(null);
    }
  };


  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/super-admin/form-inscription/horario', {
        cache: 'no-store',
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      // Helpers de *type narrowing* seguros (ponlos arriba del componente)
      function isRecord(v: unknown): v is Record<string, unknown> {
        return typeof v === 'object' && v !== null;
      }
      function isHorarioArray(v: unknown): v is Horario[] {
        return (
          Array.isArray(v) &&
          v.every(
            (x) =>
              isRecord(x) &&
              typeof x.id === 'number' &&
              typeof x.schedule === 'string'
          )
        );
      }
      interface Comercial {
        id: number;
        contact: string;
      }
      function isComercialArray(v: unknown): v is Comercial[] {
        return (
          Array.isArray(v) &&
          v.every(
            (x) =>
              isRecord(x) &&
              typeof x.id === 'number' &&
              typeof x.contact === 'string'
          )
        );
      }

      // En tu función load:
      const data: unknown = await res.json();

      let rows: Horario[] = [];
      if (
        isRecord(data) &&
        isHorarioArray((data as Record<string, unknown>).horarios)
      ) {
        rows = (data as { horarios: Horario[] }).horarios;
      } else if (
        isRecord(data) &&
        isComercialArray((data as Record<string, unknown>).comercials)
      ) {
        const cs = (data as { comercials: Comercial[] }).comercials;
        rows = cs.map((c) => ({ id: c.id, schedule: c.contact }));
      }
      setItems(rows);
    } catch {
      setError('No se pudieron cargar los horarios');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleSave = async () => {
    const value = schedule.trim();
    if (!value) return;
    try {
      setSaving(true);
      const res = await fetch('/api/super-admin/form-inscription/horario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // El API espera { schedules: string } y lo inserta en la columna Drizzle 'schedule'
        body: JSON.stringify({ schedules: value }),
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      setSchedule('');
      await load();
    } catch {
      alert('No se pudo guardar el horario');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B132B] px-4 py-12 text-white">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="rounded-lg bg-[#1C2541] p-6 shadow-lg shadow-cyan-500/10">
          <h2 className="mb-4 text-2xl font-bold text-cyan-400">
            Agregar Horario
          </h2>
          <div className="flex gap-3">
            <input
              value={schedule}
              onChange={(e) => setSchedule(e.target.value)}
              placeholder="Horario"
              className="flex-1 rounded border border-gray-700 bg-[#2C3E50] p-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
            />
            <button
              onClick={handleSave}
              disabled={saving || !schedule.trim()}
              className="rounded bg-cyan-500 px-4 py-2 font-semibold text-black transition hover:bg-cyan-400 disabled:opacity-60"
            >
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </div>

        <div className="rounded-lg bg-[#1C2541] p-6 shadow-lg shadow-cyan-500/10">
          <h3 className="mb-4 text-xl font-semibold text-cyan-300">
            Horarios Registrados
          </h3>
          {loading ? (
            <p className="text-gray-300">Cargando…</p>
          ) : error ? (
            <p className="text-red-400">{error}</p>
          ) : items.length === 0 ? (
            <p className="text-gray-400">No hay horarios registrados.</p>
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
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="flex-1 rounded border border-gray-700 bg-[#2C3E50] p-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                      />
                    ) : (
                      <span className="flex-1">{row.schedule}</span>
                    )}

                    {isEditing ? (
                      <>
                        <button
                          onClick={() => void handleUpdate(row.id)}
                          disabled={isUpdating || !editValue.trim()}
                          className="rounded bg-green-500 px-3 py-1 text-black font-semibold hover:bg-green-400 disabled:opacity-60"
                        >
                          {isUpdating ? 'Guardando…' : 'Guardar'}
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="rounded bg-gray-600 px-3 py-1 text-white font-semibold hover:bg-gray-500"
                        >
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => startEdit(row)}
                          className="rounded bg-blue-500 px-3 py-1 text-black font-semibold hover:bg-blue-400"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => void handleDelete(row.id)}
                          disabled={isDeleting}
                          className="rounded bg-red-500 px-3 py-1 text-black font-semibold hover:bg-red-400 disabled:opacity-60"
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
