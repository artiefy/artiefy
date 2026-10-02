'use client';

import { useState } from 'react';

import { Loader2, Upload, X } from 'lucide-react';
import * as XLSX from 'xlsx';

interface Fila {
  nombres: string;
  apellidos: string;
  email: string;
  phone: string;
  identificacion: string;
  modalidad: string;
}

interface Resultado {
  creados: number;
  agregados: number;
  errores: { fila: number; email: string; motivo: string }[];
}

const norm = (s: string) =>
  s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();

// Empareja el encabezado del Excel con el campo interno.
function mapearFila(row: Record<string, unknown>): Fila {
  const get = (...alias: string[]) => {
    for (const key of Object.keys(row)) {
      if (alias.includes(norm(key))) {
        const v = row[key];
        return v == null ? '' : String(v).trim();
      }
    }
    return '';
  };
  return {
    nombres: get('nombres', 'nombre', 'firstname'),
    apellidos: get('apellidos', 'apellido', 'lastname'),
    email: get('correo', 'email', 'e-mail'),
    phone: get('celular', 'telefono', 'phone', 'tel'),
    identificacion: get(
      'documento',
      'identificacion',
      '# identidad',
      'identidad',
      'cedula',
      'cc'
    ),
    modalidad: get('modalidad'),
  };
}

export default function AltaMasivaGrupo({
  grupoId,
  programa,
  onDone,
}: {
  grupoId: number | string;
  programa: string | null;
  onDone: () => void;
}) {
  const [abierto, setAbierto] = useState(false);
  const [filas, setFilas] = useState<Fila[]>([]);
  const [nombreArchivo, setNombreArchivo] = useState('');
  const [subiendo, setSubiendo] = useState(false);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cerrar = () => {
    setAbierto(false);
    setFilas([]);
    setNombreArchivo('');
    setResultado(null);
    setError(null);
  };

  const onArchivo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setNombreArchivo(f.name);
    setError(null);
    setResultado(null);
    try {
      const buf = await f.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      const hoja = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(hoja, {
        defval: '',
      });
      const parsed = json.map(mapearFila).filter((r) => r.email || r.nombres);
      setFilas(parsed);
      if (parsed.length === 0) setError('No se encontraron filas con datos.');
    } catch {
      setError('No se pudo leer el archivo. Debe ser un Excel (.xlsx).');
    }
  };

  const plantilla = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ['Nombres', 'Apellidos', 'Correo', 'Celular', 'Documento', 'Modalidad'],
      [
        'Juan',
        'Pérez',
        'juan@ejemplo.com',
        '3001112233',
        '1234567890',
        'Virtual',
      ],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Estudiantes');
    XLSX.writeFile(wb, 'plantilla_grupo.xlsx');
  };

  const subir = async () => {
    if (filas.length === 0) return;
    setSubiendo(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/super-admin/grupos/${grupoId}/alta-masiva`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rows: filas, programa }),
        }
      );
      const j = (await res.json()) as Resultado & { error?: string };
      if (!res.ok) {
        setError(j.error ?? 'No se pudo procesar');
        return;
      }
      setResultado(j);
      onDone();
    } catch {
      setError('Error al procesar el archivo');
    } finally {
      setSubiendo(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="inline-flex h-9 shrink-0 items-center gap-2 rounded-full border border-white/10 px-3 text-sm font-medium text-white/90 hover:bg-white/5"
        title="Asignar muchos estudiantes al grupo desde un Excel"
      >
        <Upload className="size-4" /> Masivos
      </button>

      {abierto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={cerrar}
        >
          <div
            className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[#22C4D3]/30 bg-[#061c37] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
              <div>
                <h2 className="text-lg font-bold text-[#22C4D3]">
                  Asignar estudiantes al grupo (masivo)
                </h2>
                <p className="text-xs text-white/50">
                  Sube un Excel. Los que no existan se crean y reciben sus
                  credenciales; todos quedan en esta hoja y matriculados a su
                  curso.
                </p>
              </div>
              <button
                type="button"
                onClick={cerrar}
                className="text-white/50 hover:text-white"
                aria-label="Cerrar"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-5">
              <div className="flex flex-wrap items-center gap-2">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[#22C4D3]/40 bg-[#22C4D3]/10 px-4 py-2 text-sm font-semibold text-[#22C4D3] hover:bg-[#22C4D3]/20">
                  <Upload className="size-4" /> Elegir Excel (.xlsx)
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={onArchivo}
                    className="hidden"
                  />
                </label>
                <button
                  type="button"
                  onClick={plantilla}
                  className="rounded-lg border border-white/15 px-3 py-2 text-sm text-white/70 hover:bg-white/5"
                >
                  Descargar plantilla
                </button>
                {nombreArchivo && (
                  <span className="text-xs text-white/50">{nombreArchivo}</span>
                )}
              </div>

              {error && (
                <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                  {error}
                </p>
              )}

              {filas.length > 0 && !resultado && (
                <div className="rounded-xl border border-white/10">
                  <div className="border-b border-white/10 px-3 py-2 text-xs text-white/60">
                    {filas.length} estudiantes detectados
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead className="text-left text-white/50">
                        <tr>
                          <th className="px-3 py-1.5">Nombres</th>
                          <th className="px-3 py-1.5">Apellidos</th>
                          <th className="px-3 py-1.5">Correo</th>
                          <th className="px-3 py-1.5">Celular</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filas.slice(0, 50).map((f, i) => (
                          <tr key={i} className="border-t border-white/5">
                            <td className="px-3 py-1.5 text-white/80">
                              {f.nombres || '—'}
                            </td>
                            <td className="px-3 py-1.5 text-white/60">
                              {f.apellidos || '—'}
                            </td>
                            <td className="px-3 py-1.5 text-white/60">
                              {f.email || '—'}
                            </td>
                            <td className="px-3 py-1.5 text-white/60">
                              {f.phone || '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {filas.length > 50 && (
                      <p className="px-3 py-2 text-center text-[11px] text-white/40">
                        … y {filas.length - 50} más
                      </p>
                    )}
                  </div>
                </div>
              )}

              {resultado && (
                <div className="space-y-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">
                  <p>
                    ✓ {resultado.creados} creados y {resultado.agregados} ya
                    existentes agregados al grupo.
                  </p>
                  {resultado.errores.length > 0 && (
                    <details className="text-amber-200">
                      <summary className="cursor-pointer">
                        {resultado.errores.length} con problemas
                      </summary>
                      <ul className="mt-1 max-h-40 overflow-y-auto text-xs">
                        {resultado.errores.map((e, i) => (
                          <li key={i}>
                            Fila {e.fila} ({e.email || '—'}): {e.motivo}
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t border-white/10 px-5 py-3">
              <button
                type="button"
                onClick={cerrar}
                className="rounded-xl border border-white/15 px-4 py-2 text-sm text-white/70 hover:bg-white/5"
              >
                {resultado ? 'Cerrar' : 'Cancelar'}
              </button>
              {!resultado && (
                <button
                  type="button"
                  onClick={() => void subir()}
                  disabled={subiendo || filas.length === 0}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#22C4D3] px-4 py-2 text-sm font-semibold text-[#04101f] hover:bg-[#3ad4e2] disabled:opacity-50"
                >
                  {subiendo ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Upload className="size-4" />
                  )}
                  Asignar al grupo ({filas.length})
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
