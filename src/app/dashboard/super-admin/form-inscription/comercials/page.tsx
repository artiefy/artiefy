'use client';

import { useEffect, useState } from 'react';

interface Commercial { id: number; contact: string }

export default function ComercialsPage() {
  const [contact, setContact] = useState('');
  const [items, setItems] = useState<Commercial[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // --- NUEVO estado para editar / borrar ---
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // helpers de edición
  const startEdit = (c: Commercial) => {
    setEditingId(c.id);
    setEditValue(c.contact);
  };
  const cancelEdit = () => {
    setEditingId(null);
    setEditValue('');
  };

  // UPDATE
  const handleUpdate = async (id: number) => {
    if (!editValue.trim()) return;
    try {
      setUpdatingId(id);
      const res = await fetch(`/api/super-admin/form-inscription/comercials?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commercialContact: editValue.trim() }),
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      setEditingId(null);
      setEditValue('');
      await load();
    } catch {
      alert('No se pudo actualizar el comercial');
    } finally {
      setUpdatingId(null);
    }
  };

  // DELETE
  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar este comercial?')) return;
    try {
      setDeletingId(id);
      const res = await fetch(`/api/super-admin/form-inscription/comercials?id=${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      await load();
    } catch {
      alert('No se pudo eliminar el comercial');
    } finally {
      setDeletingId(null);
    }
  };


  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/super-admin/form-inscription/comercials');
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data: { ok: boolean; comercials: Commercial[] } = await res.json();
      setItems(data.comercials ?? []);
    } catch {
      setError('No se pudieron cargar los comerciales');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleSave = async () => {
    if (!contact.trim()) return;
    try {
      setSaving(true);
      const res = await fetch('/api/super-admin/form-inscription/comercials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commercialContact: contact.trim() }),
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      setContact('');
      await load();
    } catch {
      alert('No se pudo guardar el comercial');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B132B] px-4 py-12 text-white">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="rounded-lg bg-[#1C2541] p-6 shadow-lg shadow-cyan-500/10">
          <h2 className="mb-4 text-2xl font-bold text-cyan-400">
            Agregar Comercial
          </h2>
          <div className="flex gap-3">
            <input
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="Contacto comercial"
              className="flex-1 rounded border border-gray-700 bg-[#2C3E50] p-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
            />
            <button
              onClick={handleSave}
              disabled={saving || !contact.trim()}
              className="rounded bg-cyan-500 px-4 py-2 font-semibold text-black transition hover:bg-cyan-400 disabled:opacity-60"
            >
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </div>

        <div className="rounded-lg bg-[#1C2541] p-6 shadow-lg shadow-cyan-500/10">
          <h3 className="mb-4 text-xl font-semibold text-cyan-300">
            Comerciales
          </h3>
          {loading ? (
            <p className="text-gray-300">Cargando…</p>
          ) : error ? (
            <p className="text-red-400">{error}</p>
          ) : items.length === 0 ? (
            <p className="text-gray-400">No hay comerciales registrados.</p>
          ) : (
            <ul className="divide-y divide-gray-700">
              {items.map((c) => {
                const isEditing = editingId === c.id;
                const isUpdating = updatingId === c.id;
                const isDeleting = deletingId === c.id;

                return (
                  <li key={c.id} className="flex items-center gap-3 py-2">
                    {isEditing ? (
                      <input
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="flex-1 rounded border border-gray-700 bg-[#2C3E50] p-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                      />
                    ) : (
                      <span className="flex-1">{c.contact}</span>
                    )}

                    {isEditing ? (
                      <>
                        <button
                          onClick={() => void handleUpdate(c.id)}
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
                          onClick={() => startEdit(c)}
                          className="rounded bg-blue-500 px-3 py-1 text-black font-semibold hover:bg-blue-400"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => void handleDelete(c.id)}
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
