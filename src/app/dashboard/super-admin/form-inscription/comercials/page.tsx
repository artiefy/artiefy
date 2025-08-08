'use client';
import { useState } from 'react';

export default function ComercialsPage() {
  const [contact, setContact] = useState('');

  const handle = async () => {
    await fetch('/api/super-admin/form-inscription/comercials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'usuario-id',
        commercialContact: contact,
      }),
    });
    setContact('');
  };

  return (
    <div className="min-h-screen bg-[#0B132B] px-4 py-12 text-white">
      <div className="mx-auto max-w-md rounded-lg bg-[#1C2541] p-8 shadow-lg shadow-cyan-500/10">
        <h2 className="mb-4 text-2xl font-bold text-cyan-400">
          Agregar Comercial
        </h2>
        <input
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          placeholder="Contacto comercial"
          className="mb-4 w-full rounded border border-gray-700 bg-[#2C3E50] p-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
        />
        <button
          onClick={handle}
          className="w-full rounded bg-cyan-500 px-4 py-2 font-semibold text-black transition hover:bg-cyan-400"
        >
          Guardar Comercial
        </button>
      </div>
    </div>
  );
}
