'use client';

import { useCallback, useRef, useState } from 'react';

import { Download, FileSpreadsheet, X } from 'lucide-react';

import { buscarCandidatos, type Candidato } from './emparejar-nombres';

export interface EstudianteBuscable {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface PersonaImportada {
  /** Número de fila en el archivo, para poder señalarla. */
  fila: number;
  /** Texto tal cual venía, para que se reconozca la fila. */
  nombreOriginal: string;
  documento?: string;
  candidatos: Candidato<EstudianteBuscable>[];
}

interface Props {
  estudiantes: EstudianteBuscable[];
  /** Ids ya seleccionados en el modal, para marcarlos. */
  seleccionados: string[];
  /** Se llama al elegir o desmarcar a alguien. */
  onElegir: (id: string, elegido: boolean) => void;
}

const nombreCompleto = (e: EstudianteBuscable) =>
  `${e.firstName} ${e.lastName}`.trim();

/**
 * Importa una lista desde Excel y la cruza con los estudiantes existentes.
 *
 * NO selecciona a nadie por su cuenta: propone candidatos y espera a que el
 * operador elija. Los nombres de las listas institucionales casi nunca
 * coinciden con los registrados, y equivocarse aquí matricula a otra persona.
 */
export function ImportarDesdeExcel({
  estudiantes,
  seleccionados,
  onElegir,
}: Props) {
  const archivoRef = useRef<HTMLInputElement>(null);
  const [personas, setPersonas] = useState<PersonaImportada[]>([]);
  const [leyendo, setLeyendo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Genera un Excel vacío con las columnas que espera el importador.
   *
   * Se arma en el navegador con la misma librería que lee los archivos, así
   * que no hace falta guardar una plantilla en el servidor ni mantenerla
   * sincronizada con lo que el lector entiende.
   */
  const descargarFormato = useCallback(async () => {
    const XLSX = await import('xlsx');

    const filas = [
      ['Documento', 'Nombres', 'Apellidos'],
      ['1108644609', 'Cristian David', 'Morales Gualy'],
      ['', 'Sara', 'Lopez Quijano'],
    ];

    const hoja = XLSX.utils.aoa_to_sheet(filas);
    hoja['!cols'] = [{ wch: 16 }, { wch: 22 }, { wch: 24 }];

    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, 'Estudiantes');
    XLSX.writeFile(libro, 'formato-estudiantes.xlsx');
  }, []);

  const procesar = useCallback(
    async (archivo: File) => {
      setLeyendo(true);
      setError(null);

      try {
        // SheetJS se carga solo cuando hace falta: pesa bastante y esta
        // pantalla se usa de vez en cuando.
        const XLSX = await import('xlsx');
        const datos = new Uint8Array(await archivo.arrayBuffer());
        const libro = XLSX.read(datos, { type: 'array' });
        const hoja = libro.Sheets[libro.SheetNames[0]];

        // `header: 1` devuelve cada fila como un array: estas listas suelen
        // venir sin encabezados, así que llegan tal cual.
        const filas = XLSX.utils.sheet_to_json<unknown[]>(hoja, {
          header: 1,
          blankrows: false,
        });

        const resultado: PersonaImportada[] = [];

        filas.forEach((fila, i) => {
          const celdas = fila.map((c) => String(c ?? '').trim());
          if (celdas.every((c) => c === '')) return;

          // La cédula, si viene, es la celda formada solo por dígitos.
          const documento = celdas.find((c) => /^\d{5,}$/.test(c));
          // El nombre es todo lo demás junto: la lista puede traer nombres y
          // apellidos repartidos en varias columnas.
          const nombre = celdas
            .filter((c) => c !== '' && c !== documento)
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim();

          if (!nombre) return;

          resultado.push({
            fila: i + 1,
            nombreOriginal: nombre,
            documento,
            candidatos: buscarCandidatos(nombre, estudiantes, nombreCompleto),
          });
        });

        if (resultado.length === 0) {
          setError('No se encontraron nombres en el archivo.');
        }
        setPersonas(resultado);
      } catch (e) {
        console.error('[IMPORTAR] no se pudo leer el archivo:', e);
        setError('No se pudo leer el archivo. Debe ser Excel o CSV.');
      } finally {
        setLeyendo(false);
        if (archivoRef.current) archivoRef.current.value = '';
      }
    },
    [estudiantes]
  );

  const conCoincidencias = personas.filter((p) => p.candidatos.length > 0);
  const sinCoincidencias = personas.filter((p) => p.candidatos.length === 0);

  return (
    <div className="flex min-h-0 flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={archivoRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void procesar(f);
          }}
        />
        <button
          type="button"
          onClick={() => archivoRef.current?.click()}
          disabled={leyendo}
          className="
            flex items-center gap-2 rounded-lg border border-cyan-500/40
            bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-300
            transition-colors
            hover:bg-cyan-500/20
            disabled:opacity-50
          "
        >
          <FileSpreadsheet className="size-4" />
          {leyendo ? 'Leyendo…' : 'Importar lista desde Excel'}
        </button>

        <button
          type="button"
          onClick={() => void descargarFormato()}
          className="
            flex items-center gap-1.5 rounded-lg border border-gray-600 px-3
            py-1.5 text-xs font-medium text-gray-300 transition-colors
            hover:bg-white/5
          "
        >
          <Download className="size-3.5" />
          Descargar formato
        </button>

        {personas.length > 0 && (
          <button
            type="button"
            onClick={() => setPersonas([])}
            className="
              flex items-center gap-1 text-xs text-gray-400
              hover:text-white
            "
          >
            <X className="size-3" />
            Limpiar
          </button>
        )}
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      {personas.length > 0 && (
        <p className="text-xs text-gray-400">
          {personas.length} fila(s) · {conCoincidencias.length} con posibles
          coincidencias · {sinCoincidencias.length} sin encontrar
        </p>
      )}

      {personas.length > 0 && (
        <div
          className="
            scrollbar-marca max-h-[45vh] min-h-0 flex-1 space-y-2
            overflow-y-auto pr-1
          "
        >
          {personas.map((persona) => (
            <div
              key={persona.fila}
              className="rounded-lg border border-gray-700 bg-gray-900/60 p-2"
            >
              <p className="text-xs font-semibold text-white">
                {persona.nombreOriginal}
                {persona.documento && (
                  <span className="ml-2 text-[11px] font-normal text-gray-500">
                    {persona.documento}
                  </span>
                )}
              </p>

              {persona.candidatos.length === 0 ? (
                <p className="mt-1 text-[11px] text-amber-400">
                  Sin coincidencias en la plataforma
                </p>
              ) : (
                <div className="mt-1.5 flex flex-col gap-1">
                  {persona.candidatos.map((c) => {
                    const marcado = seleccionados.includes(c.registro.id);
                    return (
                      <label
                        key={c.registro.id}
                        className={`
                          flex cursor-pointer items-center gap-2 rounded px-2
                          py-1 text-xs transition-colors
                          ${
                            marcado
                              ? 'bg-cyan-500/15 text-cyan-200'
                              : `
                                text-gray-300
                                hover:bg-white/5
                              `
                          }
                        `}
                      >
                        <input
                          type="checkbox"
                          checked={marcado}
                          onChange={(e) =>
                            onElegir(c.registro.id, e.target.checked)
                          }
                          className="size-3.5 accent-cyan-500"
                        />
                        <span className="flex-1 truncate">
                          {nombreCompleto(c.registro)}
                          <span className="ml-2 text-[11px] text-gray-500">
                            {c.registro.email}
                          </span>
                        </span>
                        <span className="shrink-0 text-[11px] text-gray-500">
                          {Math.round(c.similitud * 100)}%
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
