'use client';

import { useEffect, useState } from 'react';

interface SedeRow {
  id: number;
  nombre: string;
}

export default function SedePage() {
  const [nombre, setNombre] = useState('');
  const [items, setItems] = useState<SedeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/super-admin/form-inscription/sede');
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data: { ok: boolean; sedes: SedeRow[] } = await res.json();
      setItems(data.sedes ?? []);
    } catch {
      setError('No se pudieron cargar las sedes');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleSave = async () => {
    if (!nombre) return;
    try {
      setSaving(true);
      const res = await fetch('/api/super-admin/form-inscription/sede', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // IMPORTANTE: el body debe llevar SOLO { nombre }
        body: JSON.stringify({ nombre }),
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      setNombre('');
      await load();
    } catch {
      alert('No se pudo guardar la sede');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B132B] px-4 py-12 text-white">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="rounded-lg bg-[#1C2541] p-6 shadow-lg shadow-cyan-500/10">
          <h2 className="mb-4 text-2xl font-bold text-cyan-400">
            Agregar Sede
          </h2>
          <div className="flex gap-3">
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Nombre de la sede"
              className="flex-1 rounded border border-gray-700 bg-[#2C3E50] p-2 text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
            />
            <button
              onClick={handleSave}
              disabled={saving || !nombre}
              className="rounded bg-cyan-500 px-4 py-2 font-semibold text-black transition hover:bg-cyan-400 disabled:opacity-60"
            >
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </div>

        <div className="rounded-lg bg-[#1C2541] p-6 shadow-lg shadow-cyan-500/10">
          <h3 className="mb-4 text-xl font-semibold text-cyan-300">
            Sedes registradas
          </h3>
          {loading ? (
            <p className="text-gray-300">Cargando…</p>
          ) : error ? (
            <p className="text-red-400">{error}</p>
          ) : items.length === 0 ? (
            <p className="text-gray-400">No hay sedes registradas.</p>
          ) : (
            <ul className="divide-y divide-gray-700">
              {items.map((s) => (
                <li key={s.id} className="py-2">
                  {s.nombre}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
