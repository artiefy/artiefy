'use client';

import { useState } from 'react';

import { Building2, Check, Globe, Loader2, User, X } from 'lucide-react';

const DOCUMENTOS = [
  { valor: 'CC', etiqueta: 'C.C' },
  { valor: 'CE', etiqueta: 'C.E' },
  { valor: 'TI', etiqueta: 'T.I' },
  { valor: 'PA', etiqueta: 'Pasaporte' },
];

// "Academia de Diseño Creativo" → "academiadedisenocreativo" (máx. 40).
const sugerirSlug = (texto: string) =>
  texto
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 40);

const campo =
  'h-12 w-full rounded-xl border border-white/10 bg-[#061c37] px-4 text-white placeholder:text-white/35 focus:border-[#22C4D3]/60 focus:outline-none';

export function ModalCrearAcademia({
  onCerrar,
  onCreada,
}: {
  onCerrar: () => void;
  onCreada: (id: number) => void;
}) {
  const [tipo, setTipo] = useState<'personal' | 'empresa'>('personal');
  const [documentoTipo, setDocumentoTipo] = useState('CC');
  const [documentoNumero, setDocumentoNumero] = useState('');
  const [nombre, setNombre] = useState('');
  const [acronimo, setAcronimo] = useState('');
  const [slug, setSlug] = useState('');
  const [slugEditado, setSlugEditado] = useState(false);
  const [esArtiefy, setEsArtiefy] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mientras no se edite a mano, la dirección sale del acrónimo o el nombre.
  const slugFinal = slugEditado ? slug : sugerirSlug(acronimo || nombre);

  const crear = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    setError(null);
    try {
      const res = await fetch('/api/super-admin/academias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo,
          documentoTipo: tipo === 'empresa' ? 'NIT' : documentoTipo,
          documentoNumero,
          nombre,
          acronimo,
          slug: slugFinal,
          esArtiefy,
        }),
      });
      const j = (await res.json().catch(() => ({}))) as {
        id?: number;
        error?: string;
      };
      if (!res.ok || !j.id) throw new Error(j.error ?? 'No se pudo crear');
      onCreada(j.id);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={() => !guardando && onCerrar()}
    >
      <form
        onSubmit={(e) => void crear(e)}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl border border-white/10 bg-[#01142B] p-6 shadow-2xl sm:max-w-xl sm:rounded-3xl sm:p-8"
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white">Crear academia</h2>
            <p className="mt-1 text-white/60">
              Configura los datos y la dirección de la nueva academia.
            </p>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar"
            className="rounded-lg p-1 text-white/60 hover:bg-white/5 hover:text-white"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Personal / Empresa */}
        <div className="mb-6 grid grid-cols-2 gap-1 rounded-2xl bg-white/[0.04] p-1">
          {(
            [
              { valor: 'personal', etiqueta: 'Personal', Icono: User },
              { valor: 'empresa', etiqueta: 'Empresa', Icono: Building2 },
            ] as const
          ).map(({ valor, etiqueta, Icono }) => (
            <button
              key={valor}
              type="button"
              onClick={() => setTipo(valor)}
              className={`inline-flex h-12 items-center justify-center gap-2 rounded-xl font-medium transition-colors ${
                tipo === valor
                  ? 'bg-[#22C4D3] text-[#04101f]'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              <Icono className="size-5" /> {etiqueta}
            </button>
          ))}
        </div>

        <div className="space-y-5">
          {tipo === 'personal' ? (
            <label className="block">
              <span className="mb-2 block font-semibold text-white">
                Documento
              </span>
              <div className="grid grid-cols-[120px_1fr] gap-3 sm:grid-cols-[170px_1fr]">
                <select
                  value={documentoTipo}
                  onChange={(e) => setDocumentoTipo(e.target.value)}
                  className={`${campo} [&>option]:bg-[#061c37]`}
                >
                  {DOCUMENTOS.map((d) => (
                    <option key={d.valor} value={d.valor}>
                      {d.etiqueta}
                    </option>
                  ))}
                </select>
                <input
                  value={documentoNumero}
                  onChange={(e) => setDocumentoNumero(e.target.value)}
                  placeholder="Número de documento"
                  className={campo}
                />
              </div>
            </label>
          ) : (
            <label className="block">
              <span className="mb-2 block font-semibold text-white">NIT</span>
              <input
                value={documentoNumero}
                onChange={(e) => setDocumentoNumero(e.target.value)}
                placeholder="900123456-7"
                className={campo}
              />
            </label>
          )}

          <label className="block">
            <span className="mb-2 block font-semibold text-white">Nombre</span>
            <input
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Academia de Innovación"
              className={campo}
            />
          </label>

          <label className="block">
            <span className="mb-2 block font-semibold text-white">
              Acrónimo
            </span>
            <input
              value={acronimo}
              onChange={(e) => setAcronimo(e.target.value.toUpperCase())}
              placeholder="ADI"
              maxLength={12}
              className={campo}
            />
          </label>

          <label className="block">
            <span className="mb-2 flex items-center gap-2 font-semibold text-white">
              <Globe className="size-4" /> Dirección (URL)
            </span>
            <div className="flex h-12 items-center rounded-xl border border-white/10 bg-[#061c37] pr-4 focus-within:border-[#22C4D3]/60">
              <input
                required
                value={slugFinal}
                onChange={(e) => {
                  setSlugEditado(true);
                  setSlug(
                    e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')
                  );
                }}
                placeholder="academy"
                maxLength={40}
                className="h-full min-w-0 flex-1 bg-transparent px-4 text-[#22C4D3] placeholder:text-[#22C4D3]/40 focus:outline-none"
              />
              <span className="shrink-0 text-sm text-white/50">
                .artiefy.com
              </span>
            </div>
          </label>

          <button
            type="button"
            onClick={() => setEsArtiefy(!esArtiefy)}
            className="flex items-center gap-3 text-left text-white"
          >
            <span
              className={`flex size-6 items-center justify-center rounded-full border-2 ${
                esArtiefy
                  ? 'border-[#22C4D3] bg-[#22C4D3] text-[#04101f]'
                  : 'border-[#22C4D3]/60'
              }`}
            >
              {esArtiefy && <Check className="size-4" strokeWidth={3} />}
            </span>
            Esta academia es parte de Artiefy
          </button>
        </div>

        {error && (
          <p className="mt-5 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        )}

        <div className="mt-8 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCerrar}
            className="rounded-2xl px-5 py-3 font-semibold text-white hover:bg-white/5"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={guardando}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#22C4D3] px-6 py-3 font-semibold text-[#04101f] hover:bg-[#3ad4e2] disabled:opacity-60"
          >
            {guardando && <Loader2 className="size-4 animate-spin" />}
            Crear academia
          </button>
        </div>
      </form>
    </div>
  );
}
