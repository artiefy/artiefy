'use client';

import { useEffect, useState } from 'react';

type Commercial = { id: number; contact: string };

export default function ComercialsPage() {
  const [contact, setContact] = useState('');
  const [items, setItems] = useState<Commercial[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
              {items.map((c) => (
                <li key={c.id} className="py-2">
                  {c.contact}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
