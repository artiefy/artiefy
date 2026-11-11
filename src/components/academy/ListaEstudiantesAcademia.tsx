'use client';

import { Fragment, useState } from 'react';

import {
  Check,
  ChevronDown,
  ClipboardPaste,
  Columns3,
  Copy,
  Download,
  GraduationCap,
  Loader2,
  Mail,
  MessageSquare,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  UserPlus,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import useSWR from 'swr';
import * as XLSX from 'xlsx';

import { type EstudianteAcademia } from '~/server/academy/estudiantes';

import {
  enviar,
  Modal,
  useCursosAcademia,
  useDatosAcademia,
} from './seccion/comun';

// "Gestión de Estudiantes" de una academia: la misma pantalla que "Gestión de
// Builders" de Artiefy (programs/enrolled_users): barra de acciones, chips de
// estado, buscador con Fila / Copiar / Pegar / Agregar columna / Filtros y la
// tabla tipo hoja (a pantalla completa, celdas editables, 50 en 50), con los
// colores de la marca de la academia.

interface ColumnaPropia {
  clave: string;
  etiqueta: string;
  opciones: string[];
}

type Tipo = 'texto' | 'fecha' | 'lista' | 'derivada';

interface Columna {
  id: string;
  label: string;
  tipo: Tipo;
  opciones?: string[];
  porDefecto: boolean;
  propia?: boolean;
}

export const ESTADOS_INSCRIPCION = [
  'Nuevo',
  'Estudiante',
  'Graduando',
  'Egresado',
  'Aplaza',
  'Retirado',
];
const CARTERA = ['Al día', 'En cartera', 'No verificado'];
const TIPOS_DOCUMENTO = ['CC', 'TI', 'CE', 'PA', 'PPT', 'NIT'];

// Mismas columnas (y orden) que Gestión de Builders.
const COLUMNAS_BASE: Columna[] = [
  { id: 'nombre', label: 'Nombre', tipo: 'texto', porDefecto: true },
  { id: 'grupos', label: 'Grupos', tipo: 'derivada', porDefecto: true },
  { id: 'correo', label: 'Correo', tipo: 'derivada', porDefecto: true },
  { id: 'telefono', label: 'Teléfono', tipo: 'texto', porDefecto: true },
  {
    id: 'tipo_documento',
    label: 'Tipo de documento',
    tipo: 'lista',
    opciones: TIPOS_DOCUMENTO,
    porDefecto: true,
  },
  {
    id: 'numero_documento',
    label: 'Número de documento',
    tipo: 'texto',
    porDefecto: true,
  },
  {
    id: 'estado',
    label: 'Estado',
    tipo: 'lista',
    opciones: ESTADOS_INSCRIPCION,
    porDefecto: true,
  },
  {
    id: 'fecha_compra',
    label: 'Fecha de compra',
    tipo: 'fecha',
    porDefecto: true,
  },
  {
    id: 'fin_suscripcion',
    label: 'Fin suscripción',
    tipo: 'fecha',
    porDefecto: true,
  },
  {
    id: 'cartera',
    label: 'Cartera',
    tipo: 'lista',
    opciones: CARTERA,
    porDefecto: true,
  },
  { id: 'origen', label: 'Origen', tipo: 'texto', porDefecto: true },
  { id: 'programa', label: 'Programa', tipo: 'derivada', porDefecto: true },
  {
    id: 'ultimo_curso',
    label: 'Último curso',
    tipo: 'derivada',
    porDefecto: true,
  },
  { id: 'en_curso', label: '¿En curso?', tipo: 'derivada', porDefecto: true },
  {
    id: 'programa_texto',
    label: 'Programa (texto)',
    tipo: 'texto',
    porDefecto: true,
  },
  {
    id: 'fecha_inicio',
    label: 'Fecha inicio',
    tipo: 'fecha',
    porDefecto: true,
  },
  { id: 'comercial', label: 'Comercial', tipo: 'texto', porDefecto: true },
  { id: 'sede', label: 'Sede', tipo: 'texto', porDefecto: true },
  { id: 'horario', label: 'Horario', tipo: 'texto', porDefecto: true },
  { id: 'cursos', label: 'Cursos', tipo: 'derivada', porDefecto: false },
  { id: 'cuenta', label: 'Cuenta', tipo: 'derivada', porDefecto: false },
];

const POR_TANDA = 50;

const fmtFecha = (valor: string) => {
  if (!valor) return '';
  const d = new Date(valor.length === 10 ? `${valor}T12:00:00` : valor);
  return Number.isNaN(d.getTime())
    ? valor
    : d.toLocaleDateString('es-CO', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
};

const ultimoCurso = (e: EstudianteAcademia) =>
  [...e.cursos].sort((a, b) => b.enrolledAt.localeCompare(a.enrolledAt))[0];

/** Valor que se muestra (y se exporta) de una columna. */
function valorDe(e: EstudianteAcademia, id: string): string {
  switch (id) {
    case 'nombre':
      return e.name ?? '';
    case 'correo':
      return e.email;
    case 'grupos':
      return e.grupos.join(', ');
    case 'programa':
      return e.programas.join(', ');
    case 'ultimo_curso':
      return ultimoCurso(e)?.title ?? '';
    case 'en_curso':
      return e.cursos.some((c) => !c.completed) ? 'Sí' : 'No';
    case 'cursos':
      return e.cursos.map((c) => c.title).join(', ');
    case 'cuenta':
      return e.activo ? 'Activa' : 'Desactivada';
    case 'fecha_compra':
      return e.datos.fecha_compra ?? e.fecha.slice(0, 10);
    default:
      return e.datos[id] ?? '';
  }
}

// Píldoras de la barra (mismas medidas que Builders).
const pildora =
  'inline-flex h-7 items-center justify-center gap-1 rounded-full border px-2 text-[10px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 [&_svg]:size-3';
const tonoBase =
  'border-[var(--ac-borde)] bg-[var(--ac-superficie)]/70 text-white hover:border-[var(--ac-primario)]/50 hover:text-[var(--ac-primario)]';
const botonFila =
  'inline-flex h-9 items-center gap-1.5 rounded-full border border-[var(--ac-borde)] bg-[var(--ac-superficie)]/70 px-2.5 text-[10px] font-medium text-white hover:bg-white/10';
const campoFiltro =
  'h-7 w-44 rounded-md border border-[var(--ac-borde)] bg-[var(--ac-superficie)]/70 px-2.5 text-[11px] text-white placeholder:text-white/40 focus:border-[var(--ac-primario)]/60 focus:outline-none [&>option]:bg-[var(--ac-superficie)]';

export function ListaEstudiantesAcademia({
  slug,
  estudiantes: iniciales,
}: {
  slug: string;
  estudiantes: EstudianteAcademia[];
}) {
  const api = `/api/academia/${slug}/estudiantes`;
  const { data, mutate } = useSWR(
    [api, 'gestion'],
    async ([url]: [string, string]) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error('No se pudieron cargar los estudiantes');
      return (await res.json()) as {
        estudiantes: EstudianteAcademia[];
        columnas: ColumnaPropia[];
      };
    },
    { fallbackData: { estudiantes: iniciales, columnas: [] } }
  );
  const estudiantes = data.estudiantes;
  const propias: Columna[] = data.columnas.map((c) => ({
    id: c.clave,
    label: c.etiqueta,
    tipo: c.opciones.length ? 'lista' : 'texto',
    opciones: c.opciones,
    porDefecto: true,
    propia: true,
  }));
  const columnas = [...COLUMNAS_BASE, ...propias];

  const [busqueda, setBusqueda] = useState('');
  const [estado, setEstado] = useState('');
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);
  const [filtroCartera, setFiltroCartera] = useState('');
  const [filtroCurso, setFiltroCurso] = useState('');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [seleccion, setSeleccion] = useState<string[]>([]);
  const [ocultas, setOcultas] = useState<string[]>(
    COLUMNAS_BASE.filter((c) => !c.porDefecto).map((c) => c.id)
  );
  const [cantidad, setCantidad] = useState(POR_TANDA);
  const [modal, setModal] = useState<
    | 'crear'
    | 'correo'
    | 'masivo'
    | 'matricular'
    | 'columnas'
    | 'agregar-columna'
    | 'comentarios'
    | 'seleccionar'
    | null
  >(null);
  const [prellenado, setPrellenado] = useState<{
    nombre: string;
    apellido: string;
    email: string;
  } | null>(null);
  const [filaNueva, setFilaNueva] = useState<{
    nombre: string;
    email: string;
  } | null>(null);

  const visibles = columnas.filter((c) => !ocultas.includes(c.id));
  const q = busqueda.trim().toLowerCase();

  const filtrados = estudiantes.filter((e) => {
    if (estado && (e.datos.estado ?? '') !== estado) return false;
    if (filtroCartera && (e.datos.cartera ?? '') !== filtroCartera)
      return false;
    if (filtroCurso && !e.cursos.some((c) => String(c.id) === filtroCurso)) {
      return false;
    }
    const compra = valorDe(e, 'fecha_compra');
    if (desde && compra < desde) return false;
    if (hasta && compra > hasta) return false;
    if (!q) return true;
    return [
      e.name ?? '',
      e.email,
      e.datos.numero_documento ?? '',
      e.datos.telefono ?? '',
      ...e.cursos.map((c) => c.title),
    ].some((v) => v.toLowerCase().includes(q));
  });
  const mostrados = filtrados.slice(0, cantidad);
  const seleccionados = estudiantes.filter((e) => seleccion.includes(e.userId));

  const conteoEstado = (valor: string) =>
    valor
      ? estudiantes.filter((e) => (e.datos.estado ?? '') === valor).length
      : estudiantes.length;

  const hayFiltros = Boolean(
    busqueda || estado || filtroCartera || filtroCurso || desde || hasta
  );

  // Guarda un dato (optimista) de uno o varios estudiantes.
  const guardar = async (userIds: string[], campo: string, valor: string) => {
    void mutate(
      (prev) =>
        prev && {
          ...prev,
          estudiantes: prev.estudiantes.map((e) =>
            userIds.includes(e.userId)
              ? { ...e, datos: { ...e.datos, [campo]: valor } }
              : e
          ),
        },
      { revalidate: false }
    );
    try {
      await enviar(api, 'PATCH', { userIds, campo, valor });
    } catch (error) {
      toast.error((error as Error).message);
      await mutate();
    }
  };

  // Opciones de las celdas (grupos, programas y cursos de la academia).
  const { data: gruposData } = useDatosAcademia<{
    grupos: { id: number; nombre: string }[];
  }>(`/api/academia/${slug}/grupos`);
  const { data: programasData } = useDatosAcademia<{
    programas: { id: number; title: string; cursos: { id: number }[] }[];
  }>(`/api/academia/${slug}/programas`);
  const cursosAcademia = useCursosAcademia(slug);
  const opcionesCelda: OpcionesCelda = {
    grupos: gruposData?.grupos ?? [],
    programas: programasData?.programas ?? [],
    cursos: cursosAcademia.map((c) => ({ id: c.id, title: c.title })),
  };
  const [cursosDe, setCursosDe] = useState<string | null>(null);

  // Acción de una fila contra el API de estudiantes (grupos, correo).
  const accionFila = async (cuerpo: Record<string, unknown>, ok: string) => {
    try {
      await enviar(api, 'PATCH', cuerpo);
      toast.success(ok);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      await mutate();
    }
  };

  const matricularUno = async (userId: string, courseIds: number[]) => {
    if (courseIds.length === 0) {
      toast.error('El programa no tiene cursos');
      return;
    }
    try {
      let nuevas = 0;
      for (const courseId of courseIds) {
        const r = (await enviar(`/api/academia/${slug}/matriculas`, 'POST', {
          courseId,
          userIds: [userId],
        })) as { matriculados?: number };
        nuevas += r.matriculados ?? 0;
      }
      toast.success(
        nuevas ? `Matriculado en ${nuevas} curso(s)` : 'Ya estaba matriculado'
      );
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      await mutate();
    }
  };

  const cambiarCuenta = async (userId: string, activo: boolean) => {
    try {
      await enviar(`/api/academia/${slug}/usuarios`, 'PATCH', {
        userIds: [userId],
        activo,
      });
      toast.success(activo ? 'Cuenta activada' : 'Cuenta desactivada');
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      await mutate();
    }
  };

  const renombrar = async (userId: string, nombre: string) => {
    void mutate(
      (prev) =>
        prev && {
          ...prev,
          estudiantes: prev.estudiantes.map((e) =>
            e.userId === userId ? { ...e, name: nombre } : e
          ),
        },
      { revalidate: false }
    );
    try {
      await enviar(`/api/academia/${slug}/usuarios`, 'PATCH', {
        userId,
        nombre,
      });
    } catch (error) {
      toast.error((error as Error).message);
      await mutate();
    }
  };

  const crearFila = async () => {
    if (!filaNueva) return;
    const nombre = filaNueva.nombre.trim();
    const email = filaNueva.email.trim();
    if (!nombre || !email) {
      toast.error('Escribe el nombre y el correo');
      return;
    }
    try {
      await enviar(`/api/academia/${slug}/usuarios`, 'POST', {
        nombre,
        email,
        rol: 'estudiante',
      });
      toast.success('Estudiante creado');
      setFilaNueva(null);
      await mutate();
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const exportar = () => {
    const lista = seleccionados.length ? seleccionados : filtrados;
    const filas = lista.map((e) =>
      Object.fromEntries(
        visibles.map((c) => [
          c.label,
          c.tipo === 'fecha' ? fmtFecha(valorDe(e, c.id)) : valorDe(e, c.id),
        ])
      )
    );
    const hoja = XLSX.utils.json_to_sheet(filas);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, 'Estudiantes');
    XLSX.writeFile(libro, 'estudiantes.xlsx');
  };

  const copiar = () => {
    const filas = [
      'Nombre\tCorreo',
      ...seleccionados.map((e) => `${e.name ?? ''}\t${e.email}`),
    ];
    void navigator.clipboard
      .writeText(filas.join('\n'))
      .then(() => toast.success(`${seleccionados.length} copiados`));
  };

  const pegar = () => {
    void navigator.clipboard
      .readText()
      .then((texto) => {
        const fila = texto
          .split(/\r?\n/)
          .find((r) => r.trim() && !/^nombre\s+correo$/i.test(r));
        if (!fila) return;
        const [nombre = '', email = ''] = fila.split('\t');
        const [primero = '', ...resto] = nombre.trim().split(/\s+/);
        if (!primero || !email) return;
        setPrellenado({
          nombre: primero,
          apellido: resto.join(' '),
          email: email.trim(),
        });
        setModal('crear');
      })
      .catch(() => undefined);
  };

  const todosVisiblesMarcados =
    mostrados.length > 0 &&
    mostrados.every((e) => seleccion.includes(e.userId));

  return (
    <div className="flex h-[calc(100dvh-5.5rem)] w-full flex-col gap-1.5 overflow-hidden text-white">
      <div className="flex flex-col gap-2">
        <h1 className="flex items-center gap-2 text-lg font-bold text-white">
          Gestión de Estudiantes
          <ChevronDown className="size-4 text-white/50" />
        </h1>

        {/* Botones de acción */}
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              {
                label: 'Crear Usuario',
                icon: <UserPlus />,
                tono: tonoBase,
                onClick: () => {
                  setPrellenado(null);
                  setModal('crear');
                },
              },
              {
                label: 'Correo',
                icon: <Mail />,
                tono: tonoBase,
                onClick: () => setModal('correo'),
              },
              {
                label: 'Editar Masivamente',
                icon: <Pencil />,
                tono: 'border-amber-500/50 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20',
                onClick: () => setModal('masivo'),
                disabled: seleccion.length === 0,
              },
              {
                label: 'Matricular a Curso',
                icon: <GraduationCap />,
                tono: 'border-blue-500/50 bg-blue-500/15 text-blue-400 hover:bg-blue-500/25',
                onClick: () => setModal('matricular'),
                disabled: seleccion.length === 0,
              },
            ] as {
              label: string;
              icon: React.ReactNode;
              tono: string;
              onClick: () => void;
              disabled?: boolean;
            }[]
          ).map(({ label, icon, tono, onClick, disabled }) => (
            <button
              key={label}
              type="button"
              onClick={onClick}
              disabled={disabled}
              className={`${pildora} ${tono}`}
            >
              {icon}
              {label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setModal('columnas')}
            className={`${pildora} ${tonoBase} px-2.5`}
          >
            <Columns3 />
            <span>Columnas</span>
            {ocultas.length > 0 && (
              <span className="rounded-md bg-[var(--ac-primario)]/15 px-1 py-px text-[9px] font-bold text-[var(--ac-primario)]">
                {ocultas.length} ocultas
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={exportar}
            className={`${pildora} ${tonoBase} px-2.5`}
          >
            <Download /> Exportar
          </button>
          <button
            type="button"
            onClick={() => setModal('comentarios')}
            disabled={seleccion.length !== 1}
            title={
              seleccion.length !== 1
                ? 'Selecciona una persona para ver sus comentarios'
                : 'Ver comentarios de la persona seleccionada'
            }
            className={`${pildora} ${tonoBase} px-2.5`}
          >
            <MessageSquare /> Comentarios
          </button>
        </div>

        {/* Chips de estado de inscripción */}
        <div className="flex [scrollbar-width:none] gap-1.5 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden">
          {['', ...ESTADOS_INSCRIPCION].map((valor) => {
            const activo = estado === valor;
            return (
              <Fragment key={valor || 'todos'}>
                <button
                  type="button"
                  onClick={() => {
                    setEstado(valor);
                    setCantidad(POR_TANDA);
                  }}
                  className={`inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-[10px] whitespace-nowrap transition-all ${
                    activo
                      ? valor
                        ? 'border-[var(--ac-primario)]/70 bg-[var(--ac-primario)]/15 font-semibold text-[var(--ac-primario)]'
                        : 'border-emerald-500/70 bg-emerald-500/15 font-semibold text-emerald-400'
                      : 'border-[var(--ac-borde)] bg-[var(--ac-superficie)]/50 text-white/60 hover:border-white/30 hover:text-white'
                  }`}
                >
                  {valor || 'Todos'}
                  <span
                    className={`rounded-md px-1 py-px text-[9px] font-semibold tabular-nums ${
                      activo
                        ? valor
                          ? 'bg-[var(--ac-primario)]/20'
                          : 'bg-emerald-500/20'
                        : 'bg-white/5 text-white/60'
                    }`}
                  >
                    {conteoEstado(valor)}
                  </span>
                </button>
                {!valor &&
                  [
                    {
                      label: 'Activos',
                      value: estudiantes.filter((e) => e.activo).length,
                    },
                    {
                      label: 'En cartera',
                      value: estudiantes.filter(
                        (e) => e.datos.cartera === 'En cartera'
                      ).length,
                    },
                  ].map((m) => (
                    <span
                      key={m.label}
                      className="inline-flex h-8 items-center gap-1.5 rounded-full border border-[var(--ac-borde)] bg-[var(--ac-superficie)]/50 px-2 text-[11px] whitespace-nowrap text-white/60"
                    >
                      {m.label}
                      <span className="rounded-md bg-white/5 px-1 py-px text-[9px] font-semibold text-white/60 tabular-nums">
                        {m.value}
                      </span>
                    </span>
                  ))}
              </Fragment>
            );
          })}
        </div>
      </div>

      {/* Buscador y acciones de hoja */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[260px] flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-white/50" />
          <input
            type="text"
            placeholder="Buscar por nombre, documento, correo…"
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value);
              setCantidad(POR_TANDA);
            }}
            className="h-9 w-full rounded-full border border-[var(--ac-borde)] bg-[var(--ac-superficie)]/70 pr-2.5 pl-8 text-[12px] text-white placeholder:text-white/50 focus:border-[var(--ac-primario)]/60 focus:outline-none"
          />
        </div>
        <button
          type="button"
          onClick={() => setFilaNueva((f) => f ?? { nombre: '', email: '' })}
          className={botonFila}
        >
          <Plus className="size-4" /> Fila
        </button>
        <button
          type="button"
          onClick={copiar}
          disabled={seleccion.length === 0}
          className={`${botonFila} disabled:opacity-40`}
        >
          <Copy className="size-4" /> Copiar
        </button>
        <button type="button" onClick={pegar} className={botonFila}>
          <ClipboardPaste className="size-4" /> Pegar
        </button>
        <button
          type="button"
          onClick={() => setModal('agregar-columna')}
          className={botonFila}
        >
          <Columns3 className="size-4" /> Agregar columna
        </button>
        <button
          type="button"
          onClick={() => setFiltrosAbiertos((v) => !v)}
          title="Filtros por columna"
          aria-label="Filtros por columna"
          className={`inline-flex size-9 items-center justify-center rounded-full border ${
            filtrosAbiertos
              ? 'border-[var(--ac-primario)]/60 bg-[var(--ac-primario)]/15 text-[var(--ac-primario)]'
              : 'border-[var(--ac-borde)] bg-[var(--ac-superficie)]/70 text-white/70 hover:bg-white/10'
          }`}
        >
          <SlidersHorizontal className="size-4" />
        </button>
      </div>

      {filtrosAbiertos && (
        <FiltrosExtra
          slug={slug}
          cartera={filtroCartera}
          setCartera={setFiltroCartera}
          curso={filtroCurso}
          setCurso={setFiltroCurso}
          desde={desde}
          setDesde={setDesde}
          hasta={hasta}
          setHasta={setHasta}
          hayFiltros={hayFiltros}
          limpiar={() => {
            setBusqueda('');
            setEstado('');
            setFiltroCartera('');
            setFiltroCurso('');
            setDesde('');
            setHasta('');
          }}
        />
      )}

      {/* Tabla a pantalla completa */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div
          className="min-h-0 w-full max-w-full flex-1 overflow-auto border border-[var(--ac-borde)] bg-[var(--ac-superficie)]/40"
          onScroll={(e) => {
            const el = e.currentTarget;
            if (
              el.scrollTop + el.clientHeight >= el.scrollHeight - 200 &&
              cantidad < filtrados.length
            ) {
              setCantidad((n) => n + POR_TANDA);
            }
          }}
        >
          <table className="w-full min-w-max table-auto border-collapse">
            <thead className="sticky top-0 z-10 bg-[var(--ac-superficie)]">
              <tr className="bg-[var(--ac-superficie)] text-[11px] font-semibold tracking-wide text-white/60 uppercase">
                <th className="w-8 border-r border-b border-[var(--ac-borde)] px-2 py-1">
                  <input
                    type="checkbox"
                    aria-label="Seleccionar estudiantes"
                    checked={todosVisiblesMarcados}
                    onChange={(e) => {
                      if (e.target.checked) setModal('seleccionar');
                      else
                        setSeleccion((s) =>
                          s.filter(
                            (id) => !mostrados.some((m) => m.userId === id)
                          )
                        );
                    }}
                    className="size-4 rounded-[3px] accent-[var(--ac-primario)]"
                  />
                </th>
                {visibles.map((c) => (
                  <th
                    key={c.id}
                    className="border-r border-b border-[var(--ac-borde)] px-3 py-1 text-left font-semibold"
                  >
                    <span className="truncate">{c.label}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="text-[12px]">
              {filaNueva && (
                <tr className="h-9 bg-[var(--ac-primario)]/10 [&>td]:border-r [&>td]:border-b [&>td]:border-[var(--ac-borde)]">
                  <td className="px-2 text-center">
                    <button
                      type="button"
                      onClick={() => setFilaNueva(null)}
                      aria-label="Cancelar fila"
                      className="text-white/50 hover:text-red-400"
                    >
                      <X className="size-3.5" />
                    </button>
                  </td>
                  {visibles.map((c) => (
                    <td key={c.id} className="px-2">
                      {c.id === 'nombre' || c.id === 'correo' ? (
                        <input
                          autoFocus={c.id === 'nombre'}
                          placeholder={
                            c.id === 'nombre' ? 'Nombre completo' : 'Correo'
                          }
                          value={
                            c.id === 'nombre'
                              ? filaNueva.nombre
                              : filaNueva.email
                          }
                          onChange={(e) =>
                            setFilaNueva(
                              (f) =>
                                f && {
                                  ...f,
                                  [c.id === 'nombre' ? 'nombre' : 'email']:
                                    e.target.value,
                                }
                            )
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') void crearFila();
                            if (e.key === 'Escape') setFilaNueva(null);
                          }}
                          className="h-7 w-full min-w-40 rounded border border-[var(--ac-primario)]/40 bg-transparent px-2 text-white placeholder:text-white/40 focus:outline-none"
                        />
                      ) : c.id === 'grupos' ? (
                        <button
                          type="button"
                          onClick={() => void crearFila()}
                          className="inline-flex h-7 items-center gap-1 rounded-full bg-[var(--ac-primario)] px-3 text-[11px] font-semibold text-[var(--ac-primario-texto)]"
                        >
                          <Check className="size-3.5" /> Crear
                        </button>
                      ) : null}
                    </td>
                  ))}
                </tr>
              )}
              {mostrados.length === 0 && !filaNueva ? (
                <tr>
                  <td
                    colSpan={visibles.length + 1}
                    className="px-4 py-10 text-center text-white/50"
                  >
                    {estudiantes.length === 0
                      ? 'Todavía no hay estudiantes en la academia.'
                      : 'Ningún estudiante coincide con los filtros.'}
                  </td>
                </tr>
              ) : (
                mostrados.map((e) => {
                  const marcado = seleccion.includes(e.userId);
                  return (
                    <tr
                      key={e.id}
                      className={`group h-9 text-white [&>td]:border-r [&>td]:border-b [&>td]:border-[var(--ac-borde)] ${
                        marcado
                          ? 'bg-[var(--ac-primario)]/10'
                          : 'hover:bg-white/[0.03]'
                      }`}
                    >
                      <td className="px-2 text-center">
                        <input
                          type="checkbox"
                          aria-label={`Seleccionar ${e.name ?? e.email}`}
                          checked={marcado}
                          onChange={(ev) =>
                            setSeleccion((s) =>
                              ev.target.checked
                                ? [...s, e.userId]
                                : s.filter((id) => id !== e.userId)
                            )
                          }
                          className="size-4 rounded-[3px] accent-[var(--ac-primario)]"
                        />
                      </td>
                      {visibles.map((c) => (
                        <td
                          key={c.id}
                          className="p-0 group-hover:bg-[var(--ac-primario)]/5"
                        >
                          <Celda
                            estudiante={e}
                            columna={c}
                            opciones={opcionesCelda}
                            acciones={{
                              guardar: (valor) =>
                                c.id === 'nombre'
                                  ? void renombrar(e.userId, valor)
                                  : void guardar([e.userId], c.id, valor),
                              correo: (email) =>
                                void accionFila(
                                  { accion: 'correo', userId: e.userId, email },
                                  'Correo actualizado'
                                ),
                              grupos: (grupoIds) =>
                                void accionFila(
                                  {
                                    accion: 'grupos',
                                    userId: e.userId,
                                    grupoIds,
                                  },
                                  'Grupos actualizados'
                                ),
                              matricular: (courseIds) =>
                                void matricularUno(e.userId, courseIds),
                              cuenta: (activo) =>
                                void cambiarCuenta(e.userId, activo),
                              verCursos: () => setCursosDe(e.userId),
                            }}
                          />
                        </td>
                      ))}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-1 pt-1 text-[11px] text-white/50">
          <span>
            Mostrando {mostrados.length} de {filtrados.length}
            {seleccion.length > 0 && (
              <>
                {' · '}
                {seleccion.length} seleccionados ·{' '}
                <button
                  type="button"
                  onClick={() => setSeleccion([])}
                  className="text-[var(--ac-primario)] hover:underline"
                >
                  Quitar selección
                </button>
              </>
            )}
          </span>
          {cantidad < filtrados.length && (
            <button
              type="button"
              onClick={() => setCantidad((n) => n + POR_TANDA)}
              className="text-[var(--ac-primario)] hover:underline"
            >
              Cargar más
            </button>
          )}
        </div>
      </div>

      {modal === 'seleccionar' && (
        <Modal
          titulo="Seleccionar estudiantes"
          onClose={() => setModal(null)}
          ancho="max-w-sm"
        >
          <div className="grid gap-2">
            <button
              type="button"
              onClick={() => {
                setSeleccion((s) => [
                  ...new Set([...s, ...mostrados.map((m) => m.userId)]),
                ]);
                setModal(null);
              }}
              className="rounded-xl border border-[var(--ac-borde)] px-4 py-3 text-left text-sm hover:bg-white/5"
            >
              <span className="font-semibold">Visibles</span>
              <span className="block text-xs text-white/50">
                {mostrados.length} en pantalla
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                setSeleccion((s) => [
                  ...new Set([...s, ...filtrados.map((m) => m.userId)]),
                ]);
                setModal(null);
              }}
              className="rounded-xl border border-[var(--ac-borde)] px-4 py-3 text-left text-sm hover:bg-white/5"
            >
              <span className="font-semibold">Filtrados (total)</span>
              <span className="block text-xs text-white/50">
                {filtrados.length} con los filtros actuales
              </span>
            </button>
          </div>
        </Modal>
      )}

      {modal === 'columnas' && (
        <PanelColumnas
          columnas={columnas}
          ocultas={ocultas}
          setOcultas={setOcultas}
          onQuitarPropia={async (clave) => {
            try {
              await enviar(
                `${api}?columna=${encodeURIComponent(clave)}`,
                'DELETE'
              );
              toast.success('Columna eliminada');
              await mutate();
            } catch (error) {
              toast.error((error as Error).message);
            }
          }}
          onClose={() => setModal(null)}
        />
      )}

      {modal === 'agregar-columna' && (
        <AgregarColumna
          api={api}
          onClose={() => setModal(null)}
          onCreada={async () => {
            setModal(null);
            await mutate();
          }}
        />
      )}

      {modal === 'crear' && (
        <CrearUsuario
          slug={slug}
          inicial={prellenado}
          onClose={() => setModal(null)}
          onCreado={async (email, telefono) => {
            setModal(null);
            const nuevos = await mutate();
            const creado = nuevos?.estudiantes.find(
              (e) => e.email.toLowerCase() === email.toLowerCase()
            );
            if (creado && telefono) {
              await guardar([creado.userId], 'telefono', telefono);
            }
          }}
        />
      )}

      {modal === 'correo' && (
        <EnviarCorreo
          slug={slug}
          destinatarios={seleccionados}
          onClose={() => setModal(null)}
        />
      )}

      {modal === 'masivo' && (
        <EditarMasivamente
          columnas={columnas.filter(
            (c) => c.tipo !== 'derivada' && c.id !== 'nombre'
          )}
          cantidad={seleccion.length}
          onClose={() => setModal(null)}
          onAplicar={async (campo, valor) => {
            await guardar(seleccion, campo, valor);
            toast.success(`${seleccion.length} estudiantes actualizados`);
            setModal(null);
          }}
        />
      )}

      {modal === 'matricular' && (
        <MatricularACurso
          slug={slug}
          userIds={seleccion}
          onClose={() => setModal(null)}
          onListo={async () => {
            setModal(null);
            setSeleccion([]);
            await mutate();
          }}
        />
      )}

      {cursosDe && estudiantes.some((x) => x.userId === cursosDe) && (
        <CursosEstudiante
          slug={slug}
          estudiante={estudiantes.find((x) => x.userId === cursosDe)!}
          onClose={() => setCursosDe(null)}
          onCambio={() => mutate()}
        />
      )}

      {modal === 'comentarios' && seleccionados[0] && (
        <Comentarios
          slug={slug}
          estudiante={seleccionados[0]}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}

// --------------------------------------------------------------- Celda ---

// Colores del estado de inscripción (los mismos de Builders).
const COLOR_ESTADO: Record<string, string> = {
  Nuevo: 'border-cyan-500/30 bg-cyan-500/15 text-cyan-400',
  Estudiante: 'border-sky-500/30 bg-sky-500/15 text-sky-400',
  Graduando: 'border-violet-500/30 bg-violet-500/15 text-violet-400',
  Egresado: 'border-emerald-500/30 bg-emerald-500/15 text-emerald-400',
  Aplaza: 'border-orange-500/30 bg-orange-500/15 text-orange-400',
  Retirado: 'border-rose-500/30 bg-rose-500/15 text-rose-400',
};

const COLOR_CARTERA: Record<string, string> = {
  'Al día': 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30',
  'En cartera': 'bg-red-500/15 text-red-300 ring-red-500/30',
  'No verificado': 'bg-gray-500/15 text-gray-300 ring-gray-500/30',
};

// Input de celda: siempre visible, sin borde hasta pasar o enfocar (Builders).
const inputCelda =
  'w-full min-w-28 rounded-lg border border-transparent bg-transparent px-1 py-0.5 text-[12px] text-white/90 transition-all duration-150 hover:border-white/10 hover:bg-white/5 focus:border-[var(--ac-primario)]/40 focus:bg-white/5 focus:outline-none [&>option]:bg-[var(--ac-superficie)]';
const verMas =
  'ml-2 inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1 text-xs font-medium text-white';

export interface OpcionesCelda {
  grupos: { id: number; nombre: string }[];
  programas: { id: number; title: string; cursos: { id: number }[] }[];
  cursos: { id: number; title: string }[];
}

export interface AccionesCelda {
  guardar: (valor: string) => void;
  correo: (email: string) => void;
  grupos: (ids: number[]) => void;
  matricular: (courseIds: number[]) => void;
  cuenta: (activo: boolean) => void;
  verCursos: () => void;
}

/** Fecha: muestra la fecha larga; al hacer clic se edita (FechaCelda). */
function FechaCelda({
  valor,
  onGuardar,
}: {
  valor: string;
  onGuardar: (v: string) => void;
}) {
  const [editando, setEditando] = useState(false);
  if (editando) {
    return (
      <input
        type="date"
        autoFocus
        defaultValue={valor.slice(0, 10)}
        onBlur={(e) => {
          setEditando(false);
          if (e.target.value !== valor.slice(0, 10)) onGuardar(e.target.value);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur();
          if (e.key === 'Escape') setEditando(false);
        }}
        className="w-full rounded-lg border border-[var(--ac-primario)]/40 bg-white/5 px-2 py-1 text-xs text-white/80 [color-scheme:dark] focus:outline-none"
      />
    );
  }
  return (
    <button
      type="button"
      onClick={() => setEditando(true)}
      title="Editar fecha"
      className="w-full rounded-md border border-transparent px-1 py-0.5 text-left text-[12px] whitespace-nowrap text-white/90 transition-all duration-150 hover:border-white/10 hover:bg-white/5"
    >
      {fmtFecha(valor) || '\u00a0'}
    </button>
  );
}

/** Grupos: etiquetas que se quitan con ✕ y un select para agregar. */
function GruposCelda({
  ids,
  grupos,
  onCambiar,
}: {
  ids: number[];
  grupos: { id: number; nombre: string }[];
  onCambiar: (ids: number[]) => void;
}) {
  const disponibles = grupos.filter((g) => !ids.includes(g.id));
  return (
    <div className="flex min-w-40 flex-wrap items-center gap-1 py-0.5">
      {grupos
        .filter((g) => ids.includes(g.id))
        .map((g) => (
          <span
            key={g.id}
            className="inline-flex items-center gap-1 rounded-full bg-[var(--ac-primario)]/15 px-2 py-0.5 text-[11px] text-[var(--ac-primario)]"
          >
            {g.nombre}
            <button
              type="button"
              aria-label={`Quitar de ${g.nombre}`}
              onClick={() => onCambiar(ids.filter((x) => x !== g.id))}
              className="opacity-70 hover:opacity-100"
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
      {disponibles.length > 0 && (
        <select
          value=""
          onChange={(e) =>
            e.target.value && onCambiar([...ids, Number(e.target.value)])
          }
          className="w-24 cursor-pointer rounded-md border border-transparent bg-transparent text-[11px] text-white/40 hover:border-white/10 focus:outline-none [&>option]:bg-[var(--ac-superficie)] [&>option]:text-white"
        >
          <option value="">+ Grupo</option>
          {disponibles.map((g) => (
            <option key={g.id} value={g.id}>
              {g.nombre}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}

/** Celda editable como en Builders (cada columna con su editor). */
function Celda({
  estudiante: e,
  columna,
  opciones,
  acciones,
}: {
  estudiante: EstudianteAcademia;
  columna: Columna;
  opciones: OpcionesCelda;
  acciones: AccionesCelda;
}) {
  const valor = valorDe(e, columna.id);
  const td = 'px-2 py-px align-middle';

  switch (columna.id) {
    case 'correo':
      return e.cuentaPropia ? (
        <div className={td}>
          <input
            key={valor}
            type="email"
            defaultValue={valor}
            onBlur={(ev) => {
              const nuevo = ev.target.value.trim();
              if (nuevo && nuevo !== valor) acciones.correo(nuevo);
              else ev.target.value = valor;
            }}
            onKeyDown={(ev) => ev.key === 'Enter' && ev.currentTarget.blur()}
            className={`${inputCelda} min-w-52`}
          />
        </div>
      ) : (
        <div
          className={`${td} text-[12px] whitespace-nowrap text-white/70`}
          title="Cuenta de Artiefy vinculada: su correo se cambia en Artiefy"
        >
          {valor}
        </div>
      );

    case 'grupos':
      return (
        <div className={td}>
          <GruposCelda
            ids={e.grupoIds}
            grupos={opciones.grupos}
            onCambiar={acciones.grupos}
          />
        </div>
      );

    case 'programa':
      return (
        <div className={`${td} flex items-center whitespace-nowrap`}>
          <select
            value={
              opciones.programas.find((p) => e.programas.includes(p.title))
                ?.id ?? ''
            }
            onChange={(ev) => {
              const programa = opciones.programas.find(
                (p) => p.id === Number(ev.target.value)
              );
              if (programa)
                acciones.matricular(programa.cursos.map((c) => c.id));
            }}
            className={`${inputCelda} min-w-36`}
            title="Matricular en todos los cursos del programa"
          >
            <option value="">-- Seleccionar --</option>
            {opciones.programas.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={acciones.verCursos}
            className={`${verMas} bg-blue-600 hover:bg-blue-700`}
          >
            Ver más
          </button>
        </div>
      );

    case 'ultimo_curso':
    case 'cursos':
      return (
        <div className={`${td} flex items-center whitespace-nowrap`}>
          <select
            value={ultimoCurso(e)?.id ?? ''}
            onChange={(ev) =>
              ev.target.value && acciones.matricular([Number(ev.target.value)])
            }
            className={`${inputCelda} min-w-36`}
            title="Matricular en el curso"
          >
            <option value="">-- Seleccionar --</option>
            {opciones.cursos.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={acciones.verCursos}
            className={`${verMas} bg-green-600 hover:bg-green-700`}
          >
            Ver más
          </button>
        </div>
      );

    case 'en_curso':
      // Se calcula de las matrículas (como en Builders, no se edita).
      return (
        <div className={td}>
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
              valor === 'Sí'
                ? 'bg-emerald-500/15 text-emerald-400'
                : 'bg-white/5 text-white/50'
            }`}
          >
            {valor}
          </span>
        </div>
      );

    case 'cuenta':
      return (
        <div className={td}>
          <select
            value={e.activo ? 'activa' : 'desactivada'}
            onChange={(ev) => acciones.cuenta(ev.target.value === 'activa')}
            className={`field-sizing-content cursor-pointer appearance-none rounded-full border px-2 py-0.5 text-[11px] font-medium focus:outline-none [&>option]:bg-[var(--ac-superficie)] [&>option]:text-white ${
              e.activo
                ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-400'
                : 'border-red-500/30 bg-red-500/15 text-red-400'
            }`}
          >
            <option value="activa">Activa</option>
            <option value="desactivada">Desactivada</option>
          </select>
        </div>
      );

    case 'estado':
      return (
        <div className={td}>
          <select
            value={valor}
            onChange={(ev) => acciones.guardar(ev.target.value)}
            className={`field-sizing-content cursor-pointer appearance-none rounded-full border px-2 py-0.5 text-[11px] font-medium focus:outline-none [&>option]:bg-[var(--ac-superficie)] [&>option]:text-white ${
              COLOR_ESTADO[valor] ?? 'border-white/15 bg-white/5 text-white/70'
            }`}
          >
            <option value="">-- Seleccionar --</option>
            {ESTADOS_INSCRIPCION.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>
      );

    case 'cartera':
      return (
        <div className={td}>
          <select
            value={valor}
            onChange={(ev) => acciones.guardar(ev.target.value)}
            className={`field-sizing-content cursor-pointer appearance-none rounded-full px-2.5 py-1 text-xs font-medium ring-1 focus:outline-none [&>option]:bg-[var(--ac-superficie)] [&>option]:text-white ${
              COLOR_CARTERA[valor] ?? 'bg-white/5 text-white/50 ring-white/10'
            }`}
          >
            <option value="">-- Seleccionar --</option>
            {CARTERA.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>
      );
  }

  if (columna.tipo === 'lista') {
    return (
      <div className={td}>
        <select
          value={valor}
          onChange={(ev) => acciones.guardar(ev.target.value)}
          className={inputCelda}
        >
          <option value="">-- Seleccionar --</option>
          {(columna.opciones ?? []).map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (columna.tipo === 'fecha') {
    return (
      <div className={td}>
        <FechaCelda valor={valor} onGuardar={acciones.guardar} />
      </div>
    );
  }

  return (
    <div className={td}>
      <input
        key={valor}
        type="text"
        defaultValue={valor}
        onBlur={(ev) => {
          const nuevo = ev.target.value.trim();
          if (nuevo === valor) return;
          if (columna.id === 'nombre' && !nuevo) {
            ev.target.value = valor;
            return;
          }
          acciones.guardar(nuevo);
        }}
        onKeyDown={(ev) => ev.key === 'Enter' && ev.currentTarget.blur()}
        className={`${inputCelda} ${columna.id === 'nombre' ? 'min-w-44 font-medium' : ''}`}
      />
    </div>
  );
}

// ------------------------------------------- Ver más: cursos del alumno ---

function CursosEstudiante({
  slug,
  estudiante,
  onClose,
  onCambio,
}: {
  slug: string;
  estudiante: EstudianteAcademia;
  onClose: () => void;
  onCambio: () => Promise<unknown>;
}) {
  const [ocupado, setOcupado] = useState<number | null>(null);
  const base = (id: number) => `/api/academia/${slug}/cursos/${id}/estudiantes`;

  const accion = async (id: number, fn: () => Promise<unknown>, ok: string) => {
    setOcupado(id);
    try {
      await fn();
      toast.success(ok);
      await onCambio();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setOcupado(null);
    }
  };

  return (
    <Modal
      titulo={`Cursos · ${estudiante.name ?? estudiante.email}`}
      onClose={onClose}
      ancho="max-w-xl"
    >
      {estudiante.programas.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          {estudiante.programas.map((p) => (
            <span
              key={p}
              className="rounded-full border border-green-500/30 bg-green-500/10 px-2.5 py-1 text-xs text-green-400"
            >
              {p}
            </span>
          ))}
        </div>
      )}
      {estudiante.cursos.length === 0 ? (
        <p className="text-sm text-white/50">No inscrito en ningún curso.</p>
      ) : (
        <ul className="space-y-2">
          {estudiante.cursos.map((c) => (
            <li
              key={c.id}
              className="flex flex-wrap items-center gap-2 rounded-xl border border-[var(--ac-borde)] px-3 py-2"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">
                  {c.title}
                </p>
                <p className="text-[11px] text-white/50">
                  Matriculado {fmtFecha(c.enrolledAt)}
                </p>
              </div>
              <button
                type="button"
                disabled={ocupado === c.id}
                onClick={() =>
                  void accion(
                    c.id,
                    () =>
                      enviar(base(c.id), 'PATCH', {
                        userIds: [estudiante.userId],
                        completed: !c.completed,
                      }),
                    c.completed ? 'Marcado en curso' : 'Marcado como completado'
                  )
                }
                className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                  c.completed
                    ? 'bg-emerald-500/15 text-emerald-400'
                    : 'bg-[var(--ac-primario)]/15 text-[var(--ac-primario)]'
                }`}
              >
                {c.completed ? 'Completado' : 'En curso'}
              </button>
              <button
                type="button"
                disabled={ocupado === c.id}
                title="Quitar del curso"
                onClick={() =>
                  void accion(
                    c.id,
                    () =>
                      enviar(
                        `${base(c.id)}?userId=${encodeURIComponent(estudiante.userId)}`,
                        'DELETE'
                      ),
                    'Quitado del curso'
                  )
                }
                className="rounded-md p-1 text-white/40 hover:bg-red-500/10 hover:text-red-400"
              >
                {ocupado === c.id ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Trash2 className="size-4" />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}

// ------------------------------------------------------------ Filtros ---

function FiltrosExtra(props: {
  slug: string;
  cartera: string;
  setCartera: (v: string) => void;
  curso: string;
  setCurso: (v: string) => void;
  desde: string;
  setDesde: (v: string) => void;
  hasta: string;
  setHasta: (v: string) => void;
  hayFiltros: boolean;
  limpiar: () => void;
}) {
  const cursos = useCursosAcademia(props.slug);
  return (
    <div className="flex flex-wrap items-start gap-2">
      <select
        value={props.cartera}
        onChange={(e) => props.setCartera(e.target.value)}
        className={campoFiltro}
      >
        <option value="">Cartera</option>
        {CARTERA.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
      <input
        type="date"
        value={props.desde}
        onChange={(e) => props.setDesde(e.target.value)}
        title="Compra desde"
        className={campoFiltro}
      />
      <input
        type="date"
        value={props.hasta}
        onChange={(e) => props.setHasta(e.target.value)}
        title="Compra hasta"
        className={campoFiltro}
      />
      <select
        value={props.curso}
        onChange={(e) => props.setCurso(e.target.value)}
        className={`${campoFiltro} w-60`}
      >
        <option value="">Cursos…</option>
        {cursos.map((c) => (
          <option key={c.id} value={c.id}>
            {c.title}
          </option>
        ))}
      </select>
      {props.hayFiltros && (
        <button
          type="button"
          onClick={props.limpiar}
          title="Limpiar todos los filtros"
          className="inline-flex h-7 items-center justify-center gap-1 rounded-md border border-red-500/40 bg-red-500/10 px-2.5 text-[11px] font-medium text-red-300 hover:bg-red-500/20"
        >
          <X className="size-4" /> Limpiar filtros
        </button>
      )}
    </div>
  );
}

// ------------------------------------------------------------ Columnas ---

function PanelColumnas({
  columnas,
  ocultas,
  setOcultas,
  onQuitarPropia,
  onClose,
}: {
  columnas: Columna[];
  ocultas: string[];
  setOcultas: (v: string[]) => void;
  onQuitarPropia: (clave: string) => Promise<void>;
  onClose: () => void;
}) {
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />
      <div className="fixed top-0 right-0 z-50 flex h-full w-80 flex-col border-l border-[var(--ac-borde)] bg-[var(--ac-fondo)] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--ac-borde)] px-5 py-4">
          <div>
            <p className="text-sm font-semibold text-white">
              Columnas visibles
            </p>
            <p className="text-xs text-white/50">
              {columnas.length - ocultas.length} de {columnas.length}{' '}
              seleccionadas
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-lg p-1.5 text-white/50 hover:bg-white/10 hover:text-white"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="flex gap-2 border-b border-[var(--ac-borde)] px-5 py-3">
          <button
            type="button"
            onClick={() => setOcultas([])}
            className="flex-1 rounded-lg border border-[var(--ac-borde)] bg-white/5 py-1.5 text-xs text-white/80 hover:bg-white/10"
          >
            Mostrar todas
          </button>
          <button
            type="button"
            onClick={() =>
              setOcultas(columnas.filter((c) => !c.porDefecto).map((c) => c.id))
            }
            className="flex-1 rounded-lg border border-[var(--ac-borde)] bg-white/5 py-1.5 text-xs text-white/80 hover:bg-white/10"
          >
            Por defecto
          </button>
        </div>
        <div className="flex-1 space-y-1 overflow-y-auto px-5 py-3">
          {columnas.map((c) => {
            const activa = !ocultas.includes(c.id);
            const alternar = () =>
              setOcultas(
                activa ? [...ocultas, c.id] : ocultas.filter((x) => x !== c.id)
              );
            return (
              <div
                key={c.id}
                onClick={alternar}
                className="flex cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-2.5 hover:bg-white/5"
              >
                <span className="flex-1 text-sm text-white/80">{c.label}</span>
                {c.propia && (
                  <button
                    type="button"
                    title="Eliminar columna"
                    onClick={(e) => {
                      e.stopPropagation();
                      void onQuitarPropia(c.id);
                    }}
                    className="text-white/30 hover:text-red-400"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  role="switch"
                  aria-checked={activa}
                  onClick={(e) => {
                    e.stopPropagation();
                    alternar();
                  }}
                  className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border-2 border-transparent transition-colors ${
                    activa ? 'bg-[var(--ac-primario)]' : 'bg-white/20'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block size-4 rounded-full bg-[#ffffff] shadow transition-transform ${
                      activa ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </div>
        <div className="border-t border-[var(--ac-borde)] px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-[var(--ac-primario)] py-2.5 text-sm font-semibold text-[var(--ac-primario-texto)]"
          >
            Listo
          </button>
        </div>
      </div>
    </>
  );
}

const campo =
  'h-10 w-full rounded-xl border border-[var(--ac-borde)] bg-[var(--ac-fondo)] px-3 text-sm text-white placeholder:text-white/30 focus:border-[var(--ac-primario)] focus:outline-none';
const area =
  'min-h-28 w-full rounded-xl border border-[var(--ac-borde)] bg-[var(--ac-fondo)] px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-[var(--ac-primario)] focus:outline-none';
const boton =
  'inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[var(--ac-primario)] px-4 text-sm font-semibold text-[var(--ac-primario-texto)] disabled:opacity-40';
const etiqueta = 'mb-1 block text-xs font-semibold text-white/70';

function AgregarColumna({
  api,
  onClose,
  onCreada,
}: {
  api: string;
  onClose: () => void;
  onCreada: () => Promise<void>;
}) {
  const [nombre, setNombre] = useState('');
  const [opciones, setOpciones] = useState('');
  const [guardando, setGuardando] = useState(false);

  const crear = async () => {
    setGuardando(true);
    try {
      await enviar(api, 'POST', {
        etiqueta: nombre,
        opciones: opciones.split(','),
      });
      toast.success('Columna agregada');
      await onCreada();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal titulo="Agregar columna" onClose={onClose} ancho="max-w-md">
      <div className="space-y-4">
        <label className="block">
          <span className={etiqueta}>Nombre de la columna</span>
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej. Talla de uniforme"
            className={campo}
          />
        </label>
        <label className="block">
          <span className={etiqueta}>Opciones (opcional)</span>
          <input
            value={opciones}
            onChange={(e) => setOpciones(e.target.value)}
            placeholder="Separadas por coma: S, M, L"
            className={campo}
          />
          <span className="mt-1 block text-xs text-white/50">
            Sin opciones, la columna es de texto libre.
          </span>
        </label>
        <button
          type="button"
          onClick={() => void crear()}
          disabled={guardando || !nombre.trim()}
          className={`${boton} w-full`}
        >
          {guardando && <Loader2 className="size-4 animate-spin" />}
          Agregar columna
        </button>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------- Crear usuario ---

function CrearUsuario({
  slug,
  inicial,
  onClose,
  onCreado,
}: {
  slug: string;
  inicial: { nombre: string; apellido: string; email: string } | null;
  onClose: () => void;
  onCreado: (email: string, telefono: string) => Promise<void>;
}) {
  const [nombre, setNombre] = useState(inicial?.nombre ?? '');
  const [apellido, setApellido] = useState(inicial?.apellido ?? '');
  const [email, setEmail] = useState(inicial?.email ?? '');
  const [telefono, setTelefono] = useState('');
  const [guardando, setGuardando] = useState(false);

  const crear = async () => {
    setGuardando(true);
    try {
      const r = (await enviar(`/api/academia/${slug}/usuarios`, 'POST', {
        nombre: `${nombre} ${apellido}`.trim(),
        email,
        rol: 'estudiante',
      })) as { correoEnviado?: boolean; vinculado?: boolean };
      toast.success(
        r.vinculado
          ? 'Ya tenía cuenta: se agregó a la academia'
          : r.correoEnviado
            ? 'Estudiante creado y credenciales enviadas'
            : 'Estudiante agregado'
      );
      await onCreado(email, telefono.trim());
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal titulo="Crear Usuario" onClose={onClose} ancho="max-w-md">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className={etiqueta}>Nombre</span>
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Nombre"
              className={campo}
            />
          </label>
          <label className="block">
            <span className={etiqueta}>Apellido</span>
            <input
              value={apellido}
              onChange={(e) => setApellido(e.target.value)}
              placeholder="Apellido"
              className={campo}
            />
          </label>
        </div>
        <label className="block">
          <span className={etiqueta}>Correo electrónico</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ejemplo@correo.com"
            className={campo}
          />
        </label>
        <label className="block">
          <span className={etiqueta}>Teléfono</span>
          <input
            value={telefono}
            onChange={(e) =>
              setTelefono(e.target.value.replace(/[^\d+ ]/g, ''))
            }
            placeholder="3001234567"
            className={campo}
          />
        </label>
        <p className="text-xs text-white/50">
          Si el correo ya tiene cuenta, se agrega con esa misma cuenta. Si no,
          se crea y se le envían sus credenciales.
        </p>
        <button
          type="button"
          onClick={() => void crear()}
          disabled={guardando || !nombre.trim() || !email.trim()}
          className={`${boton} w-full`}
        >
          {guardando && <Loader2 className="size-4 animate-spin" />}
          Crear Usuario
        </button>
      </div>
    </Modal>
  );
}

// ------------------------------------------------------- Comunicación ---

function EnviarCorreo({
  slug,
  destinatarios,
  onClose,
}: {
  slug: string;
  destinatarios: EstudianteAcademia[];
  onClose: () => void;
}) {
  const [asunto, setAsunto] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [enviando, setEnviando] = useState(false);

  const enviarCorreo = async () => {
    setEnviando(true);
    try {
      const r = (await enviar(
        `/api/academia/${slug}/estudiantes/correo`,
        'POST',
        { userIds: destinatarios.map((d) => d.userId), asunto, mensaje }
      )) as { enviados?: number; total?: number };
      toast.success(`Correo enviado a ${r.enviados ?? 0} de ${r.total ?? 0}`);
      onClose();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Modal titulo="Enviar correo" onClose={onClose} ancho="max-w-lg">
      <div className="space-y-4">
        {destinatarios.length === 0 ? (
          <p className="text-sm text-amber-300">
            Selecciona en la tabla a quién enviar el correo.
          </p>
        ) : (
          <p className="text-sm text-white/70">
            Para {destinatarios.length} estudiante
            {destinatarios.length === 1 ? '' : 's'}:{' '}
            <span className="text-white/50">
              {destinatarios
                .slice(0, 3)
                .map((d) => d.email)
                .join(', ')}
              {destinatarios.length > 3 ? '…' : ''}
            </span>
          </p>
        )}
        <input
          value={asunto}
          onChange={(e) => setAsunto(e.target.value)}
          placeholder="Asunto"
          className={campo}
        />
        <textarea
          value={mensaje}
          onChange={(e) => setMensaje(e.target.value)}
          placeholder="Mensaje"
          className={area}
        />
        <button
          type="button"
          onClick={() => void enviarCorreo()}
          disabled={
            enviando ||
            destinatarios.length === 0 ||
            !asunto.trim() ||
            !mensaje.trim()
          }
          className={`${boton} w-full`}
        >
          {enviando && <Loader2 className="size-4 animate-spin" />}
          Enviar correo
        </button>
      </div>
    </Modal>
  );
}

// ------------------------------------------------ Editar masivamente ---

function EditarMasivamente({
  columnas,
  cantidad,
  onClose,
  onAplicar,
}: {
  columnas: Columna[];
  cantidad: number;
  onClose: () => void;
  onAplicar: (campo: string, valor: string) => Promise<void>;
}) {
  const [campoId, setCampoId] = useState(columnas[0]?.id ?? '');
  const [valor, setValor] = useState('');
  const [guardando, setGuardando] = useState(false);
  const columna = columnas.find((c) => c.id === campoId);

  return (
    <Modal titulo="Editar Masivamente" onClose={onClose} ancho="max-w-md">
      <div className="space-y-4">
        <p className="text-sm text-white/70">
          {cantidad} estudiantes seleccionados.
        </p>
        <label className="block">
          <span className={etiqueta}>Campo</span>
          <select
            value={campoId}
            onChange={(e) => {
              setCampoId(e.target.value);
              setValor('');
            }}
            className={`${campo} [&>option]:bg-[var(--ac-fondo)]`}
          >
            {columnas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className={etiqueta}>Nuevo valor</span>
          {columna?.tipo === 'lista' ? (
            <select
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              className={`${campo} [&>option]:bg-[var(--ac-fondo)]`}
            >
              <option value="">— Vacío —</option>
              {(columna.opciones ?? []).map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          ) : (
            <input
              type={columna?.tipo === 'fecha' ? 'date' : 'text'}
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder="Vacío borra el valor"
              className={campo}
            />
          )}
        </label>
        <button
          type="button"
          disabled={guardando || !campoId}
          onClick={() => {
            setGuardando(true);
            void onAplicar(campoId, valor).finally(() => setGuardando(false));
          }}
          className={`${boton} w-full`}
        >
          {guardando && <Loader2 className="size-4 animate-spin" />}
          Aplicar a {cantidad}
        </button>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------- Matricular ---

function MatricularACurso({
  slug,
  userIds,
  onClose,
  onListo,
}: {
  slug: string;
  userIds: string[];
  onClose: () => void;
  onListo: () => Promise<void>;
}) {
  const cursos = useCursosAcademia(slug);
  const [busqueda, setBusqueda] = useState('');
  const [elegidos, setElegidos] = useState<number[]>([]);
  const [guardando, setGuardando] = useState(false);
  const visibles = cursos.filter((c) =>
    c.title.toLowerCase().includes(busqueda.trim().toLowerCase())
  );

  const matricular = async () => {
    setGuardando(true);
    try {
      let total = 0;
      for (const courseId of elegidos) {
        const r = (await enviar(`/api/academia/${slug}/matriculas`, 'POST', {
          courseId,
          userIds,
        })) as { matriculados?: number };
        total += r.matriculados ?? 0;
      }
      toast.success(`${total} matrículas nuevas`);
      await onListo();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal titulo="Matricular a Curso" onClose={onClose} ancho="max-w-md">
      <div className="space-y-4">
        <p className="text-sm text-white/70">
          {userIds.length} estudiantes seleccionados.
        </p>
        <input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar curso..."
          className={campo}
        />
        <div className="max-h-64 space-y-1 overflow-y-auto">
          {visibles.map((c) => {
            const activo = elegidos.includes(c.id);
            return (
              <button
                key={c.id}
                type="button"
                onClick={() =>
                  setElegidos((v) =>
                    activo ? v.filter((x) => x !== c.id) : [...v, c.id]
                  )
                }
                className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm ${
                  activo
                    ? 'border-[var(--ac-primario)] bg-[var(--ac-primario)]/10'
                    : 'border-[var(--ac-borde)] hover:bg-white/5'
                }`}
              >
                <span className="truncate">{c.title}</span>
                {activo && (
                  <Check className="size-4 text-[var(--ac-primario)]" />
                )}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => void matricular()}
          disabled={guardando || elegidos.length === 0}
          className={`${boton} w-full`}
        >
          {guardando && <Loader2 className="size-4 animate-spin" />}
          Matricular en {elegidos.length} curso
          {elegidos.length === 1 ? '' : 's'}
        </button>
      </div>
    </Modal>
  );
}

// --------------------------------------------------------- Comentarios ---

function Comentarios({
  slug,
  estudiante,
  onClose,
}: {
  slug: string;
  estudiante: EstudianteAcademia;
  onClose: () => void;
}) {
  const url = `/api/academia/${slug}/estudiantes/comentarios?userId=${encodeURIComponent(estudiante.userId)}`;
  const { data, mutate, error } = useSWR(
    [url, 'comentarios'],
    async ([u]: [string, string]) => {
      const res = await fetch(u);
      const j = (await res.json().catch(() => ({}))) as {
        comentarios?: {
          id: number;
          autor: string;
          texto: string;
          createdAt: string;
        }[];
        error?: string;
      };
      if (!res.ok) throw new Error(j.error ?? 'No se pudieron cargar');
      return j.comentarios ?? [];
    }
  );
  const [texto, setTexto] = useState('');
  const [guardando, setGuardando] = useState(false);

  const agregar = async () => {
    setGuardando(true);
    try {
      await enviar(`/api/academia/${slug}/estudiantes/comentarios`, 'POST', {
        userId: estudiante.userId,
        texto,
      });
      setTexto('');
      await mutate();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal
      titulo={`Comentarios · ${estudiante.name ?? estudiante.email}`}
      onClose={onClose}
      ancho="max-w-lg"
    >
      <div className="space-y-4">
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Escribe un comentario…"
          className={area}
        />
        <button
          type="button"
          onClick={() => void agregar()}
          disabled={guardando || !texto.trim()}
          className={`${boton} w-full`}
        >
          {guardando && <Loader2 className="size-4 animate-spin" />}
          Agregar comentario
        </button>
        {error ? (
          <p className="text-sm text-amber-300">{(error as Error).message}</p>
        ) : !data ? (
          <p className="text-sm text-white/50">Cargando…</p>
        ) : data.length === 0 ? (
          <p className="text-sm text-white/50">Sin comentarios todavía.</p>
        ) : (
          <ul className="max-h-72 space-y-2 overflow-y-auto">
            {data.map((c) => (
              <li
                key={c.id}
                className="rounded-xl border border-[var(--ac-borde)] bg-white/[0.03] p-3"
              >
                <p className="text-sm whitespace-pre-line text-white">
                  {c.texto}
                </p>
                <p className="mt-1 text-[11px] text-white/50">
                  {c.autor} ·{' '}
                  {new Date(c.createdAt).toLocaleString('es-CO', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
}
