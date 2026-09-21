'use client';

import { useCallback, useEffect, useState } from 'react';

import {
  Download,
  ExternalLink,
  FileDown,
  FileText,
  IdCard,
  Loader2,
  Receipt,
  ScrollText,
  Search,
  Wallet,
  X,
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface DocumentosInscrito {
  id: string;
  name: string;
  email: string;
  document: string | null;
  identificacionTipo: string | null;
  identificacionNumero: string | null;
  programa: string | null;
  sede: string | null;
  fechaInicio: string | null;
  createdAt: string | null;
  documentos: {
    identidad: string | null;
    recibo: string | null;
    acta: string | null;
    pagare: string | null;
    comprobante: string | null;
  };
}

interface Respuesta {
  inscritos: DocumentosInscrito[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  programas: string[];
  sedes: string[];
}

const DOCS: {
  clave: keyof DocumentosInscrito['documentos'];
  label: string;
  Icono: typeof FileText;
}[] = [
  { clave: 'identidad', label: 'Identidad', Icono: IdCard },
  { clave: 'recibo', label: 'Recibo servicio', Icono: Receipt },
  { clave: 'acta', label: 'Acta / Diploma', Icono: ScrollText },
  { clave: 'pagare', label: 'Pagaré', Icono: FileText },
  { clave: 'comprobante', label: 'Comprobante pago', Icono: Wallet },
];

const formatearFecha = (valor: string | null): string => {
  if (!valor) return '—';
  const d = new Date(valor);
  if (Number.isNaN(d.getTime())) return valor;
  return d.toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

/** Detecta imágenes por extensión para elegir <img> en vez de <iframe>. */
const esImagen = (url: string): boolean =>
  /\.(jpe?g|png|gif|webp|bmp|heic|heif|avif)(\?|$)/i.test(url);

interface DocActivo {
  url: string;
  titulo: string;
}

export default function DocumentosInscripcionPage() {
  const [docActivo, setDocActivo] = useState<DocActivo | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [debounced, setDebounced] = useState('');
  const [datos, setDatos] = useState<Respuesta | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [filtroPrograma, setFiltroPrograma] = useState('');
  const [filtroSede, setFiltroSede] = useState('');
  const [exportando, setExportando] = useState(false);

  // Espera a que el operador deje de escribir antes de buscar.
  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(busqueda.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [busqueda]);

  // Al cambiar un filtro, se vuelve a la primera página.
  useEffect(() => {
    setPage(1);
  }, [filtroPrograma, filtroSede]);

  const construirParams = useCallback(
    (extra?: Record<string, string>) => {
      const params = new URLSearchParams(extra);
      if (debounced) params.set('q', debounced);
      if (filtroPrograma) params.set('programa', filtroPrograma);
      if (filtroSede) params.set('sede', filtroSede);
      return params;
    },
    [debounced, filtroPrograma, filtroSede]
  );

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const params = construirParams({
        page: String(page),
        pageSize: '20',
      });

      const res = await fetch(
        `/api/super-admin/form-inscription/documentos?${params.toString()}`
      );
      if (!res.ok) throw new Error('No se pudieron cargar los documentos');
      const json = (await res.json()) as Respuesta;
      setDatos(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar');
      setDatos(null);
    } finally {
      setCargando(false);
    }
  }, [page, construirParams]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  // Exporta a Excel TODOS los inscritos que cumplen los filtros actuales.
  const exportar = useCallback(async () => {
    setExportando(true);
    try {
      const params = construirParams({ page: '1', pageSize: '5000' });
      const res = await fetch(
        `/api/super-admin/form-inscription/documentos?${params.toString()}`
      );
      if (!res.ok) throw new Error('No se pudo exportar');
      const json = (await res.json()) as Respuesta;

      const filas = json.inscritos.map((i) => ({
        Nombre: i.name,
        Correo: i.email,
        'Tipo doc.': i.identificacionTipo ?? '',
        Identificación: i.identificacionNumero ?? i.document ?? '',
        Programa: i.programa ?? '',
        Sede: i.sede ?? '',
        'Fecha inicio': i.fechaInicio ?? '',
        Registrado: formatearFecha(i.createdAt),
        Identidad: i.documentos.identidad ?? '',
        'Recibo servicio': i.documentos.recibo ?? '',
        'Acta / Diploma': i.documentos.acta ?? '',
        Pagaré: i.documentos.pagare ?? '',
        'Comprobante pago': i.documentos.comprobante ?? '',
      }));

      const hoja = XLSX.utils.json_to_sheet(filas);
      const libro = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(libro, hoja, 'Documentos');
      XLSX.writeFile(libro, 'documentos_inscripcion.xlsx');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al exportar');
    } finally {
      setExportando(false);
    }
  }, [construirParams]);

  const inscritos = datos?.inscritos ?? [];
  const programasOpciones = datos?.programas ?? [];
  const sedesOpciones = datos?.sedes ?? [];

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-[#22C4D3] sm:text-3xl">
          Documentos de inscripción
        </h1>
        <p className="mt-1 text-sm text-white/50">
          Consulta y descarga los documentos que subió cada persona en el
          formulario de inscripción.
        </p>
      </header>

      {/* Buscador */}
      <div className="relative mb-3">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-white/40" />
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre, correo o documento…"
          className="
            w-full rounded-xl border border-white/10 bg-black/25 py-3 pr-4 pl-10
            text-sm text-white transition-all
            placeholder:text-white/30
            focus:border-[#22C4D3]/60 focus:ring-2 focus:ring-[#22C4D3]/25
            focus:outline-none
          "
        />
      </div>

      {/* Filtros + exportar */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <select
          value={filtroPrograma}
          onChange={(e) => setFiltroPrograma(e.target.value)}
          className="
            min-w-0 flex-1 rounded-xl border border-white/10 bg-[#0b1a2f] px-3
            py-2.5 text-sm text-white transition-all
            focus:border-[#22C4D3]/60 focus:outline-none
            sm:min-w-[200px] sm:flex-none
            [&>option]:bg-[#061c37] [&>option]:text-white
          "
        >
          <option value="">Todos los programas</option>
          {programasOpciones.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>

        <select
          value={filtroSede}
          onChange={(e) => setFiltroSede(e.target.value)}
          className="
            min-w-0 flex-1 rounded-xl border border-white/10 bg-[#0b1a2f] px-3
            py-2.5 text-sm text-white transition-all
            focus:border-[#22C4D3]/60 focus:outline-none
            sm:min-w-[180px] sm:flex-none
            [&>option]:bg-[#061c37] [&>option]:text-white
          "
        >
          <option value="">Todas las sedes</option>
          {sedesOpciones.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        {(filtroPrograma || filtroSede || busqueda) && (
          <button
            type="button"
            onClick={() => {
              setFiltroPrograma('');
              setFiltroSede('');
              setBusqueda('');
            }}
            className="
              rounded-xl border border-white/15 px-3 py-2.5 text-sm text-white/60
              transition-colors
              hover:bg-white/5 hover:text-white
            "
          >
            Limpiar
          </button>
        )}

        <button
          type="button"
          onClick={() => void exportar()}
          disabled={exportando || inscritos.length === 0}
          className="
            ml-auto inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/90
            px-4 py-2.5 text-sm font-semibold text-black transition-colors
            hover:bg-emerald-400
            disabled:cursor-not-allowed disabled:opacity-50
          "
        >
          {exportando ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <FileDown className="size-4" />
          )}
          Exportar Excel
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-950/20 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {cargando ? (
        <div className="flex items-center justify-center gap-2 py-16 text-white/50">
          <Loader2 className="size-5 animate-spin" />
          Cargando…
        </div>
      ) : inscritos.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-10 text-center text-white/50">
          No hay inscritos con documentos
          {debounced ? ' para esa búsqueda' : ''}.
        </div>
      ) : (
        <div className="space-y-3">
          {inscritos.map((inscrito) => (
            <div
              key={inscrito.id}
              className="
                rounded-xl border border-white/10 bg-white/[0.03] p-4
                transition-colors
                hover:border-white/20
                sm:p-5
              "
            >
              <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="font-semibold text-white">{inscrito.name}</p>
                  <p className="text-xs break-all text-white/50">
                    {inscrito.email}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-white/40">
                    {(inscrito.identificacionNumero ?? inscrito.document) && (
                      <span>
                        {inscrito.identificacionTipo ?? 'Doc'}:{' '}
                        {inscrito.identificacionNumero ?? inscrito.document}
                      </span>
                    )}
                    {inscrito.programa && <span>{inscrito.programa}</span>}
                    {inscrito.sede && <span>{inscrito.sede}</span>}
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="text-xs text-white/40">
                    {formatearFecha(inscrito.createdAt)}
                  </span>
                  {(() => {
                    const subidos = Object.values(inscrito.documentos).filter(
                      Boolean
                    ).length;
                    return (
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          subidos === 5
                            ? 'bg-emerald-500/15 text-emerald-300'
                            : subidos === 0
                              ? 'bg-red-500/15 text-red-300'
                              : 'bg-amber-500/15 text-amber-300'
                        }`}
                      >
                        {subidos}/5 documentos
                      </span>
                    );
                  })()}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {DOCS.map(({ clave, label, Icono }) => {
                  const url = inscrito.documentos[clave];
                  return url ? (
                    <button
                      key={clave}
                      type="button"
                      onClick={() =>
                        setDocActivo({
                          url,
                          titulo: `${label} — ${inscrito.name}`,
                        })
                      }
                      className="
                        inline-flex items-center gap-1.5 rounded-lg border
                        border-[#22C4D3]/40 bg-[#22C4D3]/10 px-3 py-1.5 text-xs
                        font-medium text-[#22C4D3] transition-colors
                        hover:bg-[#22C4D3]/20
                      "
                    >
                      <Icono className="size-3.5" />
                      {label}
                    </button>
                  ) : (
                    <span
                      key={clave}
                      className="
                        inline-flex items-center gap-1.5 rounded-lg border
                        border-white/10 px-3 py-1.5 text-xs font-medium
                        text-white/25
                      "
                      title="No subió este documento"
                    >
                      <Icono className="size-3.5" />
                      {label}
                    </span>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Paginación */}
      {datos && datos.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-3 text-sm">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || cargando}
            className="
              rounded-lg border border-white/15 px-3 py-1.5 text-white/70
              transition-colors
              hover:bg-white/5
              disabled:cursor-not-allowed disabled:opacity-40
            "
          >
            Anterior
          </button>
          <span className="text-white/50">
            Página {datos.page} de {datos.totalPages} · {datos.total} inscritos
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(datos.totalPages, p + 1))}
            disabled={page >= datos.totalPages || cargando}
            className="
              rounded-lg border border-white/15 px-3 py-1.5 text-white/70
              transition-colors
              hover:bg-white/5
              disabled:cursor-not-allowed disabled:opacity-40
            "
          >
            Siguiente
          </button>
        </div>
      )}

      {/* Visor del documento en modal */}
      {docActivo && (
        <div
          className="
            fixed inset-0 z-50 flex flex-col bg-black/70 p-3 backdrop-blur-sm
            sm:p-6
          "
          onClick={() => setDocActivo(null)}
        >
          <div
            className="
              mx-auto flex size-full max-w-5xl flex-col overflow-hidden
              rounded-2xl border border-[#22C4D3]/30 bg-[#061c37] shadow-2xl
            "
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
              <p className="min-w-0 truncate text-sm font-semibold text-white">
                {docActivo.titulo}
              </p>
              <div className="flex shrink-0 items-center gap-1.5">
                <a
                  href={docActivo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="
                    inline-flex items-center gap-1.5 rounded-lg border
                    border-white/15 px-2.5 py-1.5 text-xs font-medium
                    text-white/70 transition-colors
                    hover:bg-white/10 hover:text-white
                  "
                >
                  <ExternalLink className="size-3.5" />
                  Abrir
                </a>
                <a
                  href={docActivo.url}
                  download
                  className="
                    inline-flex items-center gap-1.5 rounded-lg border
                    border-white/15 px-2.5 py-1.5 text-xs font-medium
                    text-white/70 transition-colors
                    hover:bg-white/10 hover:text-white
                  "
                >
                  <Download className="size-3.5" />
                  Descargar
                </a>
                <button
                  type="button"
                  onClick={() => setDocActivo(null)}
                  aria-label="Cerrar"
                  className="
                    rounded-lg p-1.5 text-white/60 transition-colors
                    hover:bg-white/10 hover:text-white
                  "
                >
                  <X className="size-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto bg-black/30">
              {esImagen(docActivo.url) ? (
                <div className="flex min-h-full items-center justify-center p-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={docActivo.url}
                    alt={docActivo.titulo}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              ) : (
                <iframe
                  src={docActivo.url}
                  title={docActivo.titulo}
                  className="size-full"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
