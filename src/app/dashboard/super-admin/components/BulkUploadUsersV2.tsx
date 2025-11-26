'use client';
import React, { useMemo, useState } from 'react';

import {
  FiAlertCircle,
  FiCheck,
  FiDownload,
  FiMove,
  FiTrash2,
  FiUpload,
  FiX,
} from 'react-icons/fi';

interface ColumnMapping {
  excelColumn: string;
  dbField: string;
}

interface Resultado {
  email: string;
  estado: 'GUARDADO' | 'YA_EXISTE' | 'ERROR';
  detalle?: string;
}

interface Props {
  onFinished?: (res: unknown) => void;
}

interface ApiResponse {
  columns?: string[];
  autoMappings?: ColumnMapping[];
  sampleData?: Record<string, unknown>[];
  detectedHeaderRow?: number;
  rowsTotal?: number;
  rowsAllowed?: number;
  summary?: {
    total: number;
    guardados: number;
    yaExiste: number;
    errores: number;
    omitidosPorCompatibilidad?: number;
  };
  resultados?: Resultado[];
}

const BulkUploadUsersV2: React.FC<Props> = ({ onFinished }) => {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const [showMapping, setShowMapping] = useState(false);
  const [columns, setColumns] = useState<string[]>([]);
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [dragged, setDragged] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<string | null>(null);
  void columns;
  // 👇 NUEVO: filas editables que se muestran en la tabla
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);

  // Campos del schema (los únicos que deben verse)
  const dbFields = useMemo(
    () => [
      // obligatorios
      { value: 'firstName', label: 'Nombre', required: true },
      { value: 'lastName', label: 'Apellido', required: true },
      { value: 'email', label: 'Email', required: true },

      // contacto / doc / dirección
      { value: 'phone', label: 'Teléfono', required: false },
      { value: 'document', label: 'Documento', required: false },
      { value: 'address', label: 'Dirección', required: false },
      { value: 'country', label: 'País', required: false },
      { value: 'city', label: 'Ciudad', required: false },
      {
        value: 'birthDate',
        label: 'F. Nacimiento (YYYY-MM-DD)',
        required: false,
      },

      // académicos / programa
      { value: 'nivelEducacion', label: 'Nivel Educación', required: false },
      { value: 'programa', label: 'Programa', required: false },
      {
        value: 'fechaInicio',
        label: 'F. Inicio (YYYY-MM-DD)',
        required: false,
      },
      { value: 'comercial', label: 'Comercial', required: false },
      { value: 'sede', label: 'Sede', required: false },
      { value: 'horario', label: 'Horario', required: false },

      // pagos / cuotas
      { value: 'numeroCuotas', label: 'N° cuotas', required: false },
      { value: 'pagoInscripcion', label: 'Pago inscripción', required: false },
      { value: 'pagoCuota1', label: 'Pago cuota 1', required: false },
      { value: 'valorPrograma', label: 'Valor programa', required: false },
      {
        value: 'inscripcionValor',
        label: 'Valor inscripción',
        required: false,
      },
      { value: 'paymentMethod', label: 'Método de pago', required: false },
      {
        value: 'cuota1Fecha',
        label: 'Cuota1 fecha (YYYY-MM-DD)',
        required: false,
      },
      { value: 'cuota1Metodo', label: 'Cuota1 método', required: false },
      { value: 'cuota1Valor', label: 'Cuota1 valor', required: false },
      {
        value: 'inscripcionOrigen',
        label: 'Origen inscripción',
        required: false,
      },
      {
        value: 'purchaseDate',
        label: 'Fecha compra (YYYY-MM-DD)',
        required: false,
      },

      // acudiente / identificación
      {
        value: 'identificacionTipo',
        label: 'Tipo identificación',
        required: false,
      },
      {
        value: 'identificacionNumero',
        label: 'Número identificación',
        required: false,
      },
      { value: 'tieneAcudiente', label: 'Tiene acudiente', required: false },
      { value: 'acudienteNombre', label: 'Acudiente nombre', required: false },
      {
        value: 'acudienteContacto',
        label: 'Acudiente contacto',
        required: false,
      },
      { value: 'acudienteEmail', label: 'Acudiente email', required: false },
    ],
    []
  );
  const schemaKeys = useMemo(
    () => new Set(dbFields.map((d) => d.value)),
    [dbFields]
  );

  const notify = (msg: string) => alert(msg);

  const handleFile = async (f: File) => {
    const fd = new FormData();
    fd.append('file', f);
    fd.append('previewOnly', 'true');

    const res = await fetch('/api/usersMasive/masiveFiles', {
      method: 'POST',
      body: fd,
      credentials: 'include',
    });

    if (res.status === 401) {
      notify('No autenticado. Inicia sesión y vuelve a intentar.');
      return;
    }
    if (!res.ok) throw new Error('No se pudo analizar el archivo');

    const json = (await res.json()) as ApiResponse;

    setColumns(json.columns ?? []);

    // SOLO mapeos a campos de schema
    const auto = json.autoMappings ?? [];
    const filtered = auto.filter((m) => m.dbField && schemaKeys.has(m.dbField));
    setMappings(filtered);

    // 👇 NUEVO: traemos TODAS las filas permitidas y las dejamos editables
    setRows(json.sampleData ?? []);

    setShowMapping(true);

    console.log('[preview]', {
      detectedHeaderRow: json.detectedHeaderRow,
      rowsTotal: json.rowsTotal,
      rowsAllowed: json.rowsAllowed,
    });
  };

  const handleUpload = async () => {
    if (!file) return notify('Selecciona un archivo');
    const required = ['firstName', 'lastName', 'email'];
    const mapped = mappings.map((m) => m.dbField).filter(Boolean);
    const missing = required.filter((r) => !mapped.includes(r));
    if (missing.length) return notify(`Falta mapear: ${missing.join(', ')}`);

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('mappings', JSON.stringify(mappings.filter((m) => m.dbField)));
      // 👇 NUEVO: enviamos las filas editadas/filtradas
      fd.append('rowsJson', JSON.stringify(rows));

      const res = await fetch('/api/usersMasive/masiveFiles', {
        method: 'POST',
        body: fd,
        credentials: 'include',
      });

      if (res.status === 401) {
        notify('No autenticado. Inicia sesión y vuelve a intentar.');
        return;
      }
      if (!res.ok) throw new Error('Error en la carga masiva');

      const json = (await res.json()) as ApiResponse;
      onFinished?.(json);

      const resumen = json.summary;
      const lista: Resultado[] = json.resultados ?? [];
      console.log('[detalle resultados]', lista);

      const msg = `✅ Completado
- Total: ${resumen?.total ?? 0}
- Guardados: ${resumen?.guardados ?? 0}
- Ya existe: ${resumen?.yaExiste ?? 0}
- Errores: ${resumen?.errores ?? 0}
- Omitidos por compatibilidad: ${resumen?.omitidosPorCompatibilidad ?? 0}`;
      notify(msg);

      setOpen(false);
      setShowMapping(false);
      setFile(null);
      setMappings([]);
      setColumns([]);
      setRows([]);
    } catch (e) {
      const error = e as Error;
      notify(error?.message || 'Error desconocido');
    } finally {
      setUploading(false);
    }
  };

  const allRequiredMapped = useMemo(
    () =>
      ['firstName', 'lastName', 'email'].every((x) =>
        mappings.map((m) => m.dbField).includes(x)
      ),
    [mappings]
  );

  // 👀 Solo mostrar columnas mapeadas a schema
  const visibleMappings = useMemo(
    () => mappings.filter((m) => m.dbField && schemaKeys.has(m.dbField)),
    [mappings, schemaKeys]
  );

  // ====== Edición en celdas y quitar filas ======
  const editCell = (rowIdx: number, excelColumn: string, value: string) => {
    setRows((prev) =>
      prev.map((r, i) => (i === rowIdx ? { ...r, [excelColumn]: value } : r))
    );
  };
  const removeRow = (rowIdx: number) => {
    setRows((prev) => prev.filter((_, i) => i !== rowIdx));
  };

  return (
    <div>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-md bg-gray-900 px-3 py-2 text-xs font-medium text-white hover:bg-gray-800"
      >
        <FiUpload className="text-sm" /> Subida desde excel
      </button>

      {open && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 p-2 sm:p-4">
          <div className="w-full max-w-[95vw] overflow-hidden rounded-xl bg-white text-gray-800 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between bg-gray-900 px-4 py-3 text-white">
              <div>
                <h2 className="text-sm font-semibold sm:text-base">
                  Carga Masiva de Usuarios (v2)
                </h2>
                <p className="text-[10px] opacity-80">
                  Tabla editable y opción de quitar candidatos
                </p>
              </div>
              <button
                onClick={() => {
                  setOpen(false);
                  setShowMapping(false);
                  setFile(null);
                  setMappings([]);
                  setColumns([]);
                  setRows([]);
                }}
                className="rounded-md p-1 hover:bg-white/10"
              >
                <FiX size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="max-h-[90vh] overflow-auto p-4 text-[12px] leading-tight">
              {!showMapping ? (
                <div className="space-y-4">
                  {/* Dropzone */}
                  <div className="relative rounded-lg border-2 border-dashed border-gray-300 p-8 text-center hover:border-gray-400">
                    <input
                      type="file"
                      accept=".xlsx"
                      className="absolute inset-0 cursor-pointer opacity-0"
                      onChange={async (e) => {
                        const f = e.target.files?.[0] ?? null;
                        setFile(f ?? null);
                        if (f) {
                          try {
                            await handleFile(f);
                          } catch (err) {
                            const error = err as Error;
                            notify(
                              error?.message || 'No se pudo leer el archivo'
                            );
                          }
                        }
                      }}
                    />
                    <FiUpload className="mx-auto mb-2 text-3xl text-gray-400" />
                    <p className="text-xs font-medium">
                      {file
                        ? file.name
                        : 'Arrastra o haz clic para seleccionar .xlsx'}
                    </p>
                    <p className="mt-1 text-[11px] text-gray-500">
                      Detectamos encabezados automáticamente
                    </p>
                  </div>

                  {/* Plantilla */}
                  <div className="rounded-md bg-gray-100 p-3">
                    <div className="flex items-center gap-2 text-gray-800">
                      <FiAlertCircle className="text-base" /> ¿Plantilla? Puedes
                      descargar un ejemplo.
                    </div>
                    <button
                      onClick={async () => {
                        const res = await fetch(
                          '/api/usersMasive/masiveFiles',
                          { method: 'GET' }
                        );
                        if (!res.ok)
                          return notify('No se pudo descargar la plantilla');
                        const blob = await res.blob();
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'plantilla_usuarios_v2.xlsx';
                        a.click();
                      }}
                      className="mt-2 inline-flex items-center gap-2 rounded-md bg-gray-900 px-3 py-2 text-xs font-medium text-white hover:bg-gray-800"
                    >
                      <FiDownload /> Descargar plantilla
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {allRequiredMapped ? (
                    <div className="flex items-center gap-2 rounded-md bg-emerald-50 px-3 py-2 text-emerald-700">
                      <FiCheck /> Todos los campos obligatorios están mapeados
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 rounded-md bg-amber-50 px-3 py-2 text-amber-700">
                      <FiAlertCircle /> Faltan campos obligatorios por mapear
                    </div>
                  )}

                  {/* Tabla editable: SOLO columnas válidas de schema */}
                  <div className="overflow-x-auto rounded-md border">
                    <table className="w-full text-[11px]">
                      <thead>
                        <tr className="bg-gray-100">
                          {visibleMappings.map((m) => {
                            const hit = dbFields.find(
                              (d) => d.value === m.dbField
                            );
                            const over = overCol === m.excelColumn;
                            return (
                              <th
                                key={m.excelColumn}
                                onDragOver={(e) => {
                                  e.preventDefault();
                                  setOverCol(m.excelColumn);
                                }}
                                onDragLeave={() => setOverCol(null)}
                                onDrop={(e) => {
                                  e.preventDefault();
                                  setOverCol(null);
                                  if (dragged) {
                                    setMappings((prev) =>
                                      prev.map((x) =>
                                        x.excelColumn === m.excelColumn
                                          ? { ...x, dbField: dragged }
                                          : x
                                      )
                                    );
                                  }
                                }}
                                className={`min-w-[160px] border p-2 text-left font-semibold whitespace-nowrap ${
                                  over ? 'bg-gray-50' : ''
                                }`}
                              >
                                <div>{m.excelColumn}</div>
                                <div
                                  className={`mt-2 min-h-[52px] rounded border-2 border-dashed p-2 ${
                                    hit
                                      ? 'border-emerald-400 bg-emerald-50'
                                      : 'border-gray-300 bg-gray-50'
                                  }`}
                                >
                                  {hit ? (
                                    <div className="flex items-center justify-between gap-2">
                                      <div>
                                        <div className="font-medium">
                                          {hit.label}
                                        </div>
                                        {hit.required && (
                                          <div className="text-[10px] text-emerald-700">
                                            Obligatorio
                                          </div>
                                        )}
                                      </div>
                                      <button
                                        onClick={() =>
                                          setMappings((prev) =>
                                            prev.map((x) =>
                                              x.excelColumn === m.excelColumn
                                                ? { ...x, dbField: '' }
                                                : x
                                            )
                                          )
                                        }
                                        className="text-[10px] text-red-600 hover:underline"
                                      >
                                        quitar
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="text-[10px] text-gray-500 italic">
                                      Arrastra un campo aquí
                                    </div>
                                  )}
                                </div>
                              </th>
                            );
                          })}
                          <th className="min-w-[100px] border p-2 text-left font-semibold">
                            Acciones
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row, idx) => (
                          <tr
                            key={idx}
                            className="odd:bg-white even:bg-gray-50"
                          >
                            {visibleMappings.map((m) => (
                              <td
                                key={`${idx}-${m.excelColumn}`}
                                className="min-w-[160px] border p-2"
                              >
                                <input
                                  className="w-full rounded border px-2 py-1 outline-none"
                                  value={(() => {
                                    const val = row[m.excelColumn];
                                    if (val === null || val === undefined)
                                      return '';
                                    if (typeof val === 'object')
                                      return JSON.stringify(val);
                                    if (typeof val === 'string') return val;
                                    if (
                                      typeof val === 'number' ||
                                      typeof val === 'boolean'
                                    )
                                      return String(val);
                                    return JSON.stringify(val);
                                  })()}
                                  onChange={(e) =>
                                    editCell(idx, m.excelColumn, e.target.value)
                                  }
                                />
                              </td>
                            ))}
                            <td className="border p-2">
                              <button
                                onClick={() => removeRow(idx)}
                                className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] hover:bg-gray-50"
                                title="Quitar este candidato"
                              >
                                <FiTrash2 /> Quitar
                              </button>
                            </td>
                          </tr>
                        ))}
                        {rows.length === 0 && (
                          <tr>
                            <td
                              className="p-4 text-center text-gray-500"
                              colSpan={visibleMappings.length + 1}
                            >
                              No hay filas para mostrar
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Campos disponibles (para remapear) */}
                  <div className="rounded-md border p-3">
                    <div className="mb-2 flex items-center gap-2">
                      <FiMove className="text-gray-900" />
                      <div className="text-xs font-semibold">
                        Campos disponibles
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-6">
                      {dbFields.map((d) => (
                        <div
                          key={d.value}
                          draggable
                          onDragStart={() => setDragged(d.value)}
                          onDragEnd={() => setDragged(null)}
                          className={`cursor-move rounded border p-2 text-center text-[11px] ${
                            d.required ? 'border-red-300' : 'border-gray-300'
                          }`}
                          title={d.required ? 'Obligatorio' : 'Opcional'}
                        >
                          {d.label}
                          {d.required && (
                            <div className="text-[10px] text-red-600">
                              * requerido
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => {
                        setOpen(false);
                        setShowMapping(false);
                        setFile(null);
                        setMappings([]);
                        setColumns([]);
                        setRows([]);
                      }}
                      className="rounded border px-3 py-2 text-xs hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleUpload}
                      disabled={
                        uploading || !allRequiredMapped || rows.length === 0
                      }
                      className="rounded bg-gray-900 px-4 py-2 text-xs font-medium text-white hover:bg-gray-800 disabled:opacity-60"
                    >
                      {uploading ? 'Subiendo...' : 'Subir'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkUploadUsersV2;
