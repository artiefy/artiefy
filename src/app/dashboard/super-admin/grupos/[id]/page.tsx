'use client';

import { use, useCallback, useEffect, useRef, useState } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import {
  ArrowLeft,
  Check,
  FileText,
  Filter,
  GraduationCap,
  Link2,
  Loader2,
  Pencil,
  Plus,
  Printer,
  Search,
  Trash2,
  UserPlus,
  UserPlus2,
  Video,
  X,
} from 'lucide-react';
import { createPortal } from 'react-dom';
import useSWR from 'swr';

import AltaMasivaGrupo from '~/app/dashboard/super-admin/grupos/AltaMasivaGrupo';
import { ModalCrearGrupo } from '~/app/dashboard/super-admin/grupos/ModalCrearGrupo';
import { CalendarioPopover } from '~/components/shared/CalendarioPopover';
import { formatFechaLarga } from '~/lib/formatDate';

interface Miembro {
  id: string;
  name: string | null;
  email: string;
  phone?: string | null;
  identificacionNumero: string | null;
  programa?: string | null;
  modalidad?: string | null;
  observaciones?: string | null;
  carteraStatus?: string | null;
}
interface Sesion {
  id: number;
  fecha: string;
  titulo: string | null;
  courseId: number | null;
}
interface ClaseVirtual {
  id: number;
  title: string;
  startDateTime: string;
  endDateTime: string;
  joinUrl: string;
}
interface CursoHoja {
  courseId: number;
  curso: string;
  educador: string | null;
  horario: string | null;
  espacio: string | null;
  instructorId: string | null;
  scheduleOptionId: number | null;
  spaceOptionId: number | null;
}
interface Hoja {
  id: number;
  nombre: string;
  parentId: number | null;
  programa: string | null;
  programasIds: number[];
  empresa: string | null;
  teamsJoinUrl: string | null;
  cursoHoja: CursoHoja | null;
  miembros: Miembro[];
  sesiones: Sesion[];
  asistencia: Record<number, Record<string, string>>;
}
interface GrupoDetalle {
  rootNombre: string;
  hojas: Hoja[];
  cursosDisponibles: { id: number; title: string; programas: string[] }[];
  programas: string[];
  programasOpciones: { id: number; title: string }[];
}

type Estado = 'presente' | 'ausente' | 'tarde';

const MARCA: Record<Estado, { letra: string; clase: string }> = {
  presente: { letra: 'X', clase: 'bg-emerald-500/20 text-emerald-300' },
  ausente: { letra: 'A', clase: 'bg-red-500/20 text-red-300' },
  tarde: { letra: 'T', clase: 'bg-amber-500/20 text-amber-300' },
};

function splitNombre(name: string | null): {
  nombres: string;
  apellidos: string;
} {
  const p = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (p.length === 0) return { nombres: '', apellidos: '' };
  if (p.length === 1) return { nombres: p[0], apellidos: '' };
  if (p.length === 2) return { nombres: p[0], apellidos: p[1] };
  if (p.length === 3) return { nombres: p[0], apellidos: p.slice(1).join(' ') };
  return { nombres: p.slice(0, 2).join(' '), apellidos: p.slice(2).join(' ') };
}

const fmtFecha = (f: string | null) => {
  return formatFechaLarga(f);
};

// Fecha larga para las columnas de clases (verticales).
const fmtFechaVert = (f: string | null) => {
  return formatFechaLarga(f);
};

function CampoCabecera({
  label,
  valor,
  onSave,
  placeholder,
}: {
  label: string;
  valor: string | null;
  onSave: (valor: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="w-24 shrink-0 text-[11px] font-semibold tracking-wide text-slate-400 uppercase">
        {label}
      </span>
      <input
        defaultValue={valor ?? ''}
        placeholder={placeholder}
        onBlur={(e) => {
          if (e.target.value !== (valor ?? '')) onSave(e.target.value);
        }}
        className="min-w-0 flex-1 border-b border-transparent bg-transparent px-1 py-0.5 text-sm text-white/80 placeholder:text-white/25 focus:border-[#22C4D3] focus:outline-none"
      />
    </div>
  );
}

// Posición fija para un dropdown en portal anclado a `rect`: abre hacia donde
// haya más espacio, se limita al alto disponible y no se sale por los bordes.
function posDropdown(rect: DOMRect, ancho: number, altoMax: number) {
  const margen = 8;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const espacioAbajo = vh - rect.bottom - margen;
  const espacioArriba = rect.top - margen;
  const abajo = espacioAbajo >= altoMax || espacioAbajo >= espacioArriba;
  const w = Math.min(Math.max(ancho, rect.width), vw - margen * 2);
  return {
    left: Math.max(margen, Math.min(rect.left, vw - w - margen)),
    width: w,
    maxHeight: Math.min(altoMax, abajo ? espacioAbajo : espacioArriba),
    ...(abajo ? { top: rect.bottom + 2 } : { bottom: vh - rect.top + 2 }),
  };
}

// Combobox: al dar click abre la lista completa; al escribir filtra; si el
// texto no coincide con ninguna opción se guarda como texto libre. El dropdown
// va en portal para que no lo clipee la tabla.
function ComboCampo({
  label,
  valor,
  opciones,
  disabled,
  onElegir,
  onTexto,
}: {
  label: string;
  valor: string | null;
  opciones: { id: string | number; name: string }[];
  disabled?: boolean;
  onElegir: (o: { id: string | number; name: string }) => void;
  onTexto: (texto: string) => void;
}) {
  const [texto, setTexto] = useState(valor ?? '');
  const [abierto, setAbierto] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => setTexto(valor ?? ''), [valor]);

  const abrir = () => {
    if (disabled) return;
    if (inputRef.current) setRect(inputRef.current.getBoundingClientRect());
    setAbierto(true);
  };

  const confirmarTexto = () => {
    const v = texto.trim();
    if (v === (valor ?? '').trim()) return;
    const match = opciones.find(
      (o) => o.name.trim().toLowerCase() === v.toLowerCase()
    );
    if (match) onElegir(match);
    else onTexto(v);
  };

  // Cierra (y guarda el texto) al hacer click fuera, y reposiciona en scroll.
  useEffect(() => {
    if (!abierto) return;
    const recalc = () => {
      if (inputRef.current) setRect(inputRef.current.getBoundingClientRect());
    };
    const fuera = (e: MouseEvent) => {
      const t = e.target as Node;
      if (inputRef.current?.contains(t) || dropRef.current?.contains(t)) return;
      confirmarTexto();
      setAbierto(false);
    };
    window.addEventListener('scroll', recalc, true);
    window.addEventListener('resize', recalc);
    document.addEventListener('mousedown', fuera);
    return () => {
      window.removeEventListener('scroll', recalc, true);
      window.removeEventListener('resize', recalc);
      document.removeEventListener('mousedown', fuera);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto, texto, valor, opciones]);

  const q = texto.trim().toLowerCase();
  const filtradas = q
    ? opciones.filter((o) => o.name.toLowerCase().includes(q))
    : opciones;

  return (
    <div className="flex items-baseline gap-2">
      <span className="w-24 shrink-0 text-[11px] font-semibold tracking-wide text-slate-400 uppercase">
        {label}
      </span>
      <input
        ref={inputRef}
        value={texto}
        disabled={disabled}
        onChange={(e) => {
          setTexto(e.target.value);
          abrir();
        }}
        onFocus={abrir}
        onClick={abrir}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            confirmarTexto();
            setAbierto(false);
          } else if (e.key === 'Tab') {
            confirmarTexto();
            setAbierto(false);
          } else if (e.key === 'Escape') {
            setTexto(valor ?? '');
            setAbierto(false);
          }
        }}
        placeholder="— Seleccionar —"
        title="Click para ver la lista; escribe para filtrar o poner un valor libre"
        className="min-w-0 flex-1 border-b border-transparent bg-transparent px-1 py-0.5 text-sm text-white/80 placeholder:text-white/25 focus:border-[#22C4D3] focus:outline-none disabled:opacity-40"
      />
      {abierto &&
        rect &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={dropRef}
            className="fixed z-[9999] overflow-y-auto rounded-lg border border-[#22C4D3]/40 bg-[#061c37] shadow-2xl"
            style={posDropdown(rect, 256, 208)}
          >
            {filtradas.length === 0 ? (
              <div className="px-3 py-2 text-xs text-white/40">
                Sin coincidencias — se guardará el texto
              </div>
            ) : (
              filtradas.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => {
                    setTexto(o.name);
                    setAbierto(false);
                    if (o.name.trim() !== (valor ?? '').trim()) onElegir(o);
                  }}
                  className="block w-full px-3 py-1.5 text-left text-sm text-white hover:bg-white/5"
                >
                  {o.name}
                </button>
              ))
            )}
          </div>,
          document.body
        )}
    </div>
  );
}

// Multi-selección de programas: buscador con chips; cada chip se quita solo.
function ProgramasMultiCampo({
  opciones,
  seleccion,
  onChange,
}: {
  opciones: { id: number; title: string }[];
  seleccion: number[];
  onChange: (ids: number[]) => void;
}) {
  const [texto, setTexto] = useState('');
  const [abierto, setAbierto] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const cajaRef = useRef<HTMLDivElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  const abrir = () => {
    if (cajaRef.current) setRect(cajaRef.current.getBoundingClientRect());
    setAbierto(true);
  };

  useEffect(() => {
    if (!abierto) return;
    const recalc = () => {
      if (cajaRef.current) setRect(cajaRef.current.getBoundingClientRect());
    };
    const fuera = (e: MouseEvent) => {
      const t = e.target as Node;
      if (cajaRef.current?.contains(t) || dropRef.current?.contains(t)) return;
      setAbierto(false);
      setTexto('');
    };
    window.addEventListener('scroll', recalc, true);
    window.addEventListener('resize', recalc);
    document.addEventListener('mousedown', fuera);
    return () => {
      window.removeEventListener('scroll', recalc, true);
      window.removeEventListener('resize', recalc);
      document.removeEventListener('mousedown', fuera);
    };
  }, [abierto]);

  const elegidos = seleccion
    .map((id) => opciones.find((o) => o.id === id))
    .filter((o): o is { id: number; title: string } => !!o);
  const q = texto.trim().toLowerCase();
  const disponibles = opciones.filter(
    (o) => !seleccion.includes(o.id) && o.title.toLowerCase().includes(q)
  );
  const agregar = (id: number) => {
    if (seleccion.includes(id)) return;
    onChange([...seleccion, id]);
    setTexto('');
  };

  return (
    <div className="flex items-baseline gap-2">
      <span className="w-24 shrink-0 text-[11px] font-semibold tracking-wide text-slate-400 uppercase">
        Programas
      </span>
      <div
        ref={cajaRef}
        className="flex min-w-0 flex-1 flex-wrap items-center gap-x-1 gap-y-0.5 px-1 py-0.5"
        onClick={abrir}
      >
        {elegidos.map((o) => (
          <span
            key={o.id}
            className="inline-flex max-w-full items-center gap-0.5 rounded-full bg-[#22C4D3]/15 px-1.5 text-[11px] leading-5 text-[#22C4D3]"
          >
            <span className="truncate">{o.title}</span>
            <button
              type="button"
              aria-label={`Quitar ${o.title}`}
              onClick={(e) => {
                e.stopPropagation();
                onChange(seleccion.filter((id) => id !== o.id));
              }}
              className="hover:text-white"
            >
              <X className="size-2.5" />
            </button>
          </span>
        ))}
        <input
          value={texto}
          onChange={(e) => {
            setTexto(e.target.value);
            abrir();
          }}
          onFocus={abrir}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              if (disponibles[0]) agregar(disponibles[0].id);
            } else if (e.key === 'Escape') {
              setAbierto(false);
              setTexto('');
            } else if (
              e.key === 'Backspace' &&
              !texto &&
              seleccion.length > 0
            ) {
              onChange(seleccion.slice(0, -1));
            }
          }}
          placeholder={elegidos.length ? 'Agregar…' : '— Buscar programas —'}
          className="min-w-[70px] flex-1 bg-transparent text-sm leading-5 text-white/80 placeholder:text-white/25 focus:outline-none"
        />
      </div>
      {abierto &&
        rect &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={dropRef}
            className="fixed z-[9999] overflow-y-auto rounded-lg border border-[#22C4D3]/40 bg-[#061c37] shadow-2xl"
            style={posDropdown(rect, Math.max(rect.width, 256), 208)}
          >
            {disponibles.length === 0 ? (
              <div className="px-3 py-2 text-xs text-white/40">
                Sin coincidencias
              </div>
            ) : (
              disponibles.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => agregar(o.id)}
                  className="block w-full px-3 py-1.5 text-left text-sm text-white hover:bg-white/5"
                >
                  {o.title}
                </button>
              ))
            )}
          </div>,
          document.body
        )}
    </div>
  );
}

export default function GrupoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  // La hoja activa se guarda en la URL (?hoja=) para conservarla al recargar.
  // Cambiar de pestaña sigue siendo inmediato (sin navegación de Next).
  const [activeId, setActiveId] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const h = Number(new URLSearchParams(window.location.search).get('hoja'));
      if (Number.isFinite(h) && h > 0) return h;
    }
    return Number(id);
  });
  // Datos del grupo con SWR: una sola petición por la familia (raíz + hojas),
  // con revalidación al volver a la pestaña y tras cada cambio (mutate).
  const {
    data,
    isLoading: cargando,
    mutate: mutateGrupo,
  } = useSWR<GrupoDetalle>(
    `/api/super-admin/grupos/${Number(id)}`,
    (url: string) =>
      fetch(url, { cache: 'no-store' }).then((r) => {
        if (!r.ok) throw new Error('No se pudo cargar el grupo');
        return r.json() as Promise<GrupoDetalle>;
      })
  );
  const [error, setError] = useState<string | null>(null);
  // El modal de nueva hoja se conserva pero ya no se abre desde el "+": la hoja
  // se crea directo con `crearHojaDirecta`.
  const [nuevaHojaAbierta, setNuevaHojaAbierta] = useState(false);
  const [creandoHoja, setCreandoHoja] = useState(false);
  // Cartera abierta (id del estudiante): se muestra la MISMA ventana de
  // cartera de Estudiantes, embebida en un iframe sobre la planilla.
  const [carteraDe, setCarteraDe] = useState<string | null>(null);
  // El iframe queda invisible hasta que la cartera avisa que ya abrió.
  const [carteraLista, setCarteraLista] = useState(false);
  // La ventana de cartera se precarga en segundo plano (la página de
  // Estudiantes es pesada): al pulsar "En cartera" solo se le manda un mensaje.
  const [precargarCartera, setPrecargarCartera] = useState(false);
  const carteraIframe = useRef<HTMLIFrameElement>(null);
  const carteraEmbedLista = useRef(false);
  const carteraPendiente = useRef<string | null>(null);
  const [carteraEmbedListaOk, setCarteraEmbedListaOk] = useState(false);
  const ultimaCartera = useRef<string | null>(null);
  const pedirPrecalentar = (userIds: string[]) =>
    carteraIframe.current?.contentWindow?.postMessage(
      { type: 'precalentar-cartera', userIds },
      window.location.origin
    );
  const abrirCartera = (userId: string) => {
    ultimaCartera.current = userId;
    setPrecargarCartera(true);
    setCarteraLista(false);
    setCarteraDe(userId);
    if (carteraEmbedLista.current) {
      carteraIframe.current?.contentWindow?.postMessage(
        { type: 'abrir-cartera', userId },
        window.location.origin
      );
    } else {
      carteraPendiente.current = userId;
    }
  };
  // Ids de los estudiantes de la hoja activa (hasta 40): se precalientan los
  // datos de su cartera para que "En cartera" abra al instante.
  const miembrosKey =
    data?.hojas
      .find((h) => h.id === activeId)
      ?.miembros.slice(0, 40)
      .map((m) => m.id)
      .join(',') ?? '';
  useEffect(() => {
    if (!carteraEmbedListaOk || !miembrosKey) return;
    carteraIframe.current?.contentWindow?.postMessage(
      { type: 'precalentar-cartera', userIds: miembrosKey.split(',') },
      window.location.origin
    );
  }, [carteraEmbedListaOk, miembrosKey]);
  useEffect(() => {
    const t = setTimeout(() => setPrecargarCartera(true), 1500);
    return () => clearTimeout(t);
  }, []);
  const [buscarAbierto, setBuscarAbierto] = useState(false);
  // Columna de fecha nueva (aún sin guardar) en esta hoja.
  const [fechaNuevaEn, setFechaNuevaEn] = useState<number | null>(null);
  const [cursoModal, setCursoModal] = useState(false);
  // Clases virtuales del curso de la hoja (mismas class_meetings del curso).
  const [claseModal, setClaseModal] = useState(false);
  const [enlaces, setEnlaces] = useState<ClaseVirtual[] | null>(null);
  const [cargandoEnlaces, setCargandoEnlaces] = useState(false);
  const [confirmarEliminar, setConfirmarEliminar] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [renombrando, setRenombrando] = useState(false);
  // Fila nueva estilo Excel para dar de alta un estudiante.
  const filaVacia = {
    identificacion: '',
    nombres: '',
    apellidos: '',
    email: '',
    phone: '',
    modalidad: '',
    existingId: '', // si se elige un usuario ya existente
  };
  const [draft, setDraft] = useState<typeof filaVacia | null>(null);
  const [guardandoFila, setGuardandoFila] = useState(false);
  const [avisoFila, setAvisoFila] = useState<string | null>(null);
  const [sugerencias, setSugerencias] = useState<Miembro[]>([]);
  // Autocompletado de la fila nueva: campo que dispara la búsqueda y posición
  // del dropdown (en portal para que no lo clipee la tabla).
  const [campoBusqueda, setCampoBusqueda] = useState<
    'email' | 'identificacion'
  >('email');
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const identInputRef = useRef<HTMLInputElement>(null);
  // Edición de correo por fila (borrador + estado de guardado).
  const [correoDraft, setCorreoDraft] = useState<Record<string, string>>({});
  const [guardandoCorreo, setGuardandoCorreo] = useState<string | null>(null);
  // Opciones para editar los datos del curso desde el encabezado (igual que en
  // la edición del curso): educadores, horarios y espacios.
  const [educadores, setEducadores] = useState<{ id: string; name: string }[]>(
    []
  );
  const [horarios, setHorarios] = useState<{ id: number; name: string }[]>([]);
  const [espacios, setEspacios] = useState<{ id: number; name: string }[]>([]);

  // Autocompletar mientras escribes en Correo o # Identidad: el mismo endpoint
  // busca por nombre, correo e identificación.
  useEffect(() => {
    const q =
      (campoBusqueda === 'identificacion'
        ? draft?.identificacion
        : draft?.email
      )?.trim() ?? '';
    if (!draft || draft.existingId || q.length < 3) {
      setSugerencias([]);
      return;
    }
    const t = setTimeout(() => {
      void fetch(
        `/api/super-admin/grupos/${activeId}/miembros?q=${encodeURIComponent(q)}`
      )
        .then((r) => (r.ok ? r.json() : null))
        .then((d: { estudiantes?: Miembro[] } | null) =>
          setSugerencias(d?.estudiantes ?? [])
        )
        .catch(() => undefined);
    }, 300);
    return () => clearTimeout(t);
  }, [draft, activeId, campoBusqueda]);

  // Mantiene el dropdown pegado al input activo al hacer scroll o redimensionar.
  useEffect(() => {
    if (sugerencias.length === 0) return;
    const recalcular = () => {
      const el =
        campoBusqueda === 'identificacion'
          ? identInputRef.current
          : emailInputRef.current;
      if (el) setAnchorRect(el.getBoundingClientRect());
    };
    recalcular();
    window.addEventListener('scroll', recalcular, true);
    window.addEventListener('resize', recalcular);
    return () => {
      window.removeEventListener('scroll', recalcular, true);
      window.removeEventListener('resize', recalcular);
    };
  }, [sugerencias.length, campoBusqueda]);

  // Revalida la familia (SWR). Mantiene la firma antigua cargar(x) para no
  // tocar los puntos que la llaman; el id da igual porque el endpoint devuelve
  // toda la familia. Cambiar de pestaña NO refetch: se lee de lo ya cargado.
  // Si hay un guardado de programas en curso (sincroniza matrículas y puede
  // tardar), espera a que termine: si no, la recarga lee la hoja sin programas.
  const guardadoProgramas = useRef<Promise<unknown>>(Promise.resolve());
  const cargar = useCallback(
    (_fetchId?: number) => {
      void guardadoProgramas.current.then(() => mutateGrupo());
    },
    [mutateGrupo]
  );

  // Actualiza una hoja de la familia en memoria (optimista, sin refetch).
  const patchHoja = (hojaId: number, updater: (h: Hoja) => Hoja) =>
    void mutateGrupo(
      (prev) =>
        prev
          ? {
              ...prev,
              hojas: prev.hojas.map((h) => (h.id === hojaId ? updater(h) : h)),
            }
          : prev,
      { revalidate: false }
    );

  // Refleja la hoja activa en la URL (?hoja=) sin navegación, para conservarla
  // al recargar la página.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    if (String(activeId) === String(id)) url.searchParams.delete('hoja');
    else url.searchParams.set('hoja', String(activeId));
    // Conserva el estado de Next: con `null` el router re-renderiza la ruta y
    // aparece el loading.
    window.history.replaceState(window.history.state, '', url.toString());
  }, [activeId, id]);

  // Si la hoja activa ya no existe (p. ej. se eliminó), vuelve a la raíz.
  useEffect(() => {
    if (!data) return;
    if (!data.hojas.some((h) => h.id === activeId)) {
      setActiveId(Number(id));
    }
  }, [data, activeId, id]);

  // Crea una hoja idéntica (mismo curso y fechas, sin estudiantes) y la abre.
  useEffect(() => {
    const alMensaje = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      const data = e.data as { type?: string; error?: string } | null;
      if (data?.type === 'cartera-embed-lista') {
        carteraEmbedLista.current = true;
        setCarteraEmbedListaOk(true);
        const pendiente = carteraPendiente.current;
        if (pendiente) {
          carteraPendiente.current = null;
          carteraIframe.current?.contentWindow?.postMessage(
            { type: 'abrir-cartera', userId: pendiente },
            window.location.origin
          );
        }
        return;
      }
      if (data?.type === 'cartera-abierta') {
        setCarteraLista(true);
        return;
      }
      if (data?.type !== 'cartera-cerrada') return;
      // Los datos pudieron cambiar en la ventana: se vuelven a precalentar.
      if (ultimaCartera.current) pedirPrecalentar([ultimaCartera.current]);
      setCarteraDe(null);
      setCarteraLista(false);
      if (data.error) setAvisoFila(data.error);
      // El estado de cartera pudo cambiar: recarga la planilla.
      void cargar(activeId);
    };
    window.addEventListener('message', alMensaje);
    return () => window.removeEventListener('message', alMensaje);
  }, [cargar, activeId]);

  // Guarda el correo de un estudiante (solo el correo: Clerk + BD, mismo id).
  const guardarCorreo = async (userId: string, emailActual: string) => {
    const nuevo = (correoDraft[userId] ?? emailActual).trim();
    const limpiarDraft = () =>
      setCorreoDraft((d) => {
        const { [userId]: _omit, ...resto } = d;
        return resto;
      });

    if (!nuevo || nuevo === (emailActual ?? '')) {
      limpiarDraft();
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nuevo)) {
      setAvisoFila('Correo inválido');
      return;
    }

    setGuardandoCorreo(userId);
    try {
      const res = await fetch('/api/super-admin/udateUser/updateEmail', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, email: nuevo }),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setAvisoFila(j.error ?? 'No se pudo actualizar el correo');
        setCorreoDraft((d) => ({ ...d, [userId]: emailActual ?? '' }));
        return;
      }
      // Optimista: actualiza el correo del miembro en todas las hojas.
      void mutateGrupo(
        (prev) =>
          prev
            ? {
                ...prev,
                hojas: prev.hojas.map((h) => ({
                  ...h,
                  miembros: h.miembros.map((mm) =>
                    mm.id === userId ? { ...mm, email: nuevo } : mm
                  ),
                })),
              }
            : prev,
        { revalidate: false }
      );
      limpiarDraft();
      setAvisoFila(`✓ Correo actualizado a ${nuevo}`);
    } catch {
      setAvisoFila('Error al actualizar el correo');
      setCorreoDraft((d) => ({ ...d, [userId]: emailActual ?? '' }));
    } finally {
      setGuardandoCorreo(null);
    }
  };

  // Guarda un campo del usuario (name / phone / identificacionNumero) sin tocar
  // ningún otro dato. Para el nombre también actualiza Clerk.
  const guardarCampoUsuario = async (
    userId: string,
    field: 'name' | 'phone' | 'identificacionNumero',
    value: string
  ) => {
    try {
      const res = await fetch('/api/super-admin/udateUser/updateCampo', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, field, value }),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setAvisoFila(j.error ?? 'No se pudo guardar el cambio');
        return;
      }
      // Optimista: refleja el cambio del miembro en todas las hojas.
      void mutateGrupo(
        (prev) =>
          prev
            ? {
                ...prev,
                hojas: prev.hojas.map((h) => ({
                  ...h,
                  miembros: h.miembros.map((mm) =>
                    mm.id === userId ? { ...mm, [field]: value || null } : mm
                  ),
                })),
              }
            : prev,
        { revalidate: false }
      );
      setAvisoFila('✓ Dato actualizado');
    } catch {
      setAvisoFila('Error al guardar el cambio');
    }
  };

  // Carga las opciones para editar el curso desde el encabezado (una vez).
  useEffect(() => {
    void (async () => {
      try {
        const [edRes, hoRes, esRes] = await Promise.all([
          fetch('/api/super-admin/changeEducators'),
          fetch('/api/super-admin/schedule-options'),
          fetch('/api/super-admin/space-options'),
        ]);
        if (edRes.ok) {
          const ed = (await edRes.json()) as { id: string; name: string }[];
          setEducadores(Array.isArray(ed) ? ed : []);
        }
        if (hoRes.ok) {
          const h = (await hoRes.json()) as {
            data?: { id: number; name: string }[];
          };
          setHorarios(h.data ?? []);
        }
        if (esRes.ok) {
          const e = (await esRes.json()) as {
            data?: { id: number; name: string }[];
          };
          setEspacios(e.data ?? []);
        }
      } catch {
        // opciones opcionales; si fallan, los selects quedan vacíos.
      }
    })();
  }, []);

  // Guarda un dato del CURSO de la hoja (título, educador, horario, espacio).
  // Se refleja en el curso (courses) en todas partes.
  const guardarCampoCurso = async (
    courseId: number,
    patch: {
      title?: string;
      instructor?: string;
      educadorTexto?: string;
      scheduleOptionId?: number | null;
      horarioTexto?: string | null;
      spaceOptionId?: number | null;
      espacioTexto?: string | null;
    }
  ) => {
    try {
      const res = await fetch(
        `/api/super-admin/grupos/${activeId}/curso-datos`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ courseId, ...patch }),
        }
      );
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setAvisoFila(j.error ?? 'No se pudo guardar el curso');
        return;
      }
      setAvisoFila('✓ Curso actualizado');
      // Revalida para traer los nombres derivados (educador/horario/espacio).
      void mutateGrupo();
    } catch {
      setAvisoFila('Error al guardar el curso');
    }
  };

  const verEnlaces = async () => {
    setCargandoEnlaces(true);
    try {
      const res = await fetch(`/api/super-admin/grupos/${activeId}/clases`);
      const j = (await res.json().catch(() => null)) as {
        clases?: ClaseVirtual[];
        error?: string;
      } | null;
      if (!res.ok) throw new Error(j?.error ?? 'No se pudieron cargar');
      setEnlaces(j?.clases ?? []);
    } catch (e) {
      setAvisoFila(e instanceof Error ? e.message : 'Error');
    } finally {
      setCargandoEnlaces(false);
    }
  };

  const agregarCurso = async (courseId: number) => {
    const res = await fetch(`/api/super-admin/grupos/${activeId}/hojas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseId }),
    });
    if (res.ok) {
      const j = (await res.json().catch(() => null)) as {
        matriculados?: number;
      } | null;
      setCursoModal(false);
      setAvisoFila(
        `✓ Curso asignado · ${j?.matriculados ?? 0} estudiante(s) matriculado(s)`
      );
      cargar(activeId);
    } else {
      setAvisoFila('No se pudo agregar el curso');
    }
  };

  // Crea la hoja de una vez (sin pedir datos) con las fechas de clase de la
  // primera hoja de la familia. Optimista: la pestaña aparece y se activa al
  // instante; cuando el servidor responde se reemplaza por la hoja real.
  const crearHojaDirecta = async () => {
    const raiz = data?.hojas[0];
    if (!data || !raiz || creandoHoja) return;
    setCreandoHoja(true);
    const previaId = activeId;
    const tempId = -Date.now();
    const nombreBase = raiz.nombre.replace(/\s*\(\d+\)\s*$/, '').trim();
    const temporal: Hoja = {
      id: tempId,
      nombre: `${nombreBase} (${data.hojas.length + 1})`,
      parentId: raiz.id,
      programa: null,
      programasIds: [],
      empresa: null,
      teamsJoinUrl: null,
      cursoHoja: null,
      miembros: [],
      sesiones: raiz.sesiones.map((x, i) => ({
        ...x,
        id: tempId - i - 1,
        courseId: null,
      })),
      asistencia: {},
    };
    void mutateGrupo(
      (prev) => (prev ? { ...prev, hojas: [...prev.hojas, temporal] } : prev),
      { revalidate: false }
    );
    setActiveId(tempId);
    try {
      const res = await fetch('/api/super-admin/grupos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parentId: raiz.id, copiarFechasDe: raiz.id }),
      });
      const j = (await res.json().catch(() => null)) as {
        id?: number;
        error?: string;
      } | null;
      if (!res.ok || !j?.id) {
        throw new Error(j?.error ?? 'No se pudo crear la hoja');
      }
      const nuevaId = j.id;
      // La temporal toma el id real antes de activarla: así no hay un instante
      // sin hoja activa (que mostraría la primera) mientras se recarga.
      void mutateGrupo(
        (prev) =>
          prev
            ? {
                ...prev,
                hojas: prev.hojas.map((h) =>
                  h.id === tempId ? { ...h, id: nuevaId } : h
                ),
              }
            : prev,
        { revalidate: false }
      );
      setActiveId(nuevaId);
      void mutateGrupo();
    } catch (e) {
      void mutateGrupo(
        (prev) =>
          prev
            ? { ...prev, hojas: prev.hojas.filter((h) => h.id !== tempId) }
            : prev,
        { revalidate: false }
      );
      setActiveId(previaId);
      setAvisoFila(e instanceof Error ? e.message : 'No se pudo crear la hoja');
    } finally {
      setCreandoHoja(false);
    }
  };

  const eliminarGrupo = async () => {
    setEliminando(true);
    const parentId =
      data?.hojas.find((h) => h.id === activeId)?.parentId ?? null;
    try {
      const res = await fetch(`/api/super-admin/grupos/${activeId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('No se pudo eliminar');
      const j = (await res.json().catch(() => null)) as {
        nuevaRaizId?: number | null;
      } | null;
      setConfirmarEliminar(false);
      if (parentId) {
        // Era una hoja hija: vuelve a la raíz.
        cargar(parentId);
        setActiveId(parentId);
      } else if (j?.nuevaRaizId) {
        // Era la raíz pero había más hojas: la más antigua pasó a ser la raíz.
        router.push(`/dashboard/super-admin/grupos/${j.nuevaRaizId}`);
      } else {
        // Era la única hoja: vuelve a la lista.
        router.push('/dashboard/super-admin/grupos');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setEliminando(false);
    }
  };

  const renombrarHoja = async (nombre: string) => {
    const limpio = nombre.trim();
    if (!limpio) return;
    patchHoja(activeId, (h) => ({ ...h, nombre: limpio }));
    await fetch(`/api/super-admin/grupos/${activeId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: limpio }),
    });
  };

  const quitarMiembro = async (userId: string) => {
    patchHoja(activeId, (h) => ({
      ...h,
      miembros: h.miembros.filter((m) => m.id !== userId),
    }));
    await fetch(
      `/api/super-admin/grupos/${activeId}/miembros?userId=${userId}`,
      {
        method: 'DELETE',
      }
    );
  };

  // Guarda la fecha de la columna nueva: recién ahí se crea la clase.
  const crearSesion = async (fecha: string) => {
    setFechaNuevaEn(null);
    const res = await fetch(`/api/super-admin/grupos/${activeId}/asistencia`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fecha,
        courseId: cursoHoja?.courseId ?? undefined,
      }),
    });
    if (!res.ok) setAvisoFila('No se pudo agregar la fecha');
    cargar(activeId);
  };

  const cambiarFechaSesion = async (sesionId: number, fecha: string) => {
    patchHoja(activeId, (h) => ({
      ...h,
      sesiones: h.sesiones
        .map((s) => (s.id === sesionId ? { ...s, fecha } : s))
        .sort((a, b) => (a.fecha ?? '').localeCompare(b.fecha ?? '')),
    }));
    const res = await fetch(`/api/super-admin/grupos/${activeId}/asistencia`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sesionId, fecha }),
    });
    if (!res.ok) {
      setAvisoFila('No se pudo cambiar la fecha');
      cargar(activeId);
    }
  };

  const quitarSesion = async (sesionId: number) => {
    patchHoja(activeId, (h) => ({
      ...h,
      sesiones: h.sesiones.filter((s) => s.id !== sesionId),
    }));
    await fetch(
      `/api/super-admin/grupos/${activeId}/asistencia?sesionId=${sesionId}`,
      { method: 'DELETE' }
    );
  };

  const marcar = async (sesionId: number, userId: string, estado: Estado) => {
    patchHoja(activeId, (h) => ({
      ...h,
      asistencia: {
        ...h.asistencia,
        [sesionId]: { ...(h.asistencia[sesionId] ?? {}), [userId]: estado },
      },
    }));
    await fetch(`/api/super-admin/grupos/${activeId}/asistencia`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sesionId, marcas: [{ userId, estado }] }),
    });
  };

  const guardarEmpresa = async (valor: string) => {
    patchHoja(activeId, (h) => ({ ...h, empresa: valor }));
    await fetch(`/api/super-admin/grupos/${activeId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ empresa: valor }),
    });
  };

  // Reemplaza la lista de programas de la hoja (muchos-a-muchos). El primero es
  // el principal (grupos.programa) y el que matricula a los estudiantes.
  const asignarProgramas = async (programaIds: number[]) => {
    const ids = [...new Set(programaIds)];
    const titulos = ids
      .map((i) => data?.programasOpciones.find((p) => p.id === i)?.title)
      .filter((t): t is string => !!t);
    const principal = titulos[0] ?? null;
    const previo = data?.hojas.find((h) => h.id === activeId)?.programa;
    patchHoja(activeId, (h) => ({
      ...h,
      programa: principal,
      programasIds: ids,
      miembros:
        principal && principal !== previo
          ? h.miembros.map((m) => ({ ...m, programa: principal }))
          : h.miembros,
    }));
    const hojaId = activeId;
    // Guardados en cola: dos cambios seguidos no se pisan entre sí.
    guardadoProgramas.current = guardadoProgramas.current
      .then(() =>
        fetch(`/api/super-admin/grupos/${hojaId}/programas`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ programaIds: ids }),
        })
      )
      .then((res) => {
        if (res.ok) return;
        setAvisoFila('No se pudieron guardar los programas');
        void mutateGrupo();
      })
      .catch(() => {
        setAvisoFila('No se pudieron guardar los programas');
        void mutateGrupo();
      });
    await guardadoProgramas.current;
  };

  const guardarNota = async (
    userId: string,
    campo: 'modalidad' | 'observaciones',
    valor: string
  ) => {
    patchHoja(activeId, (h) => ({
      ...h,
      miembros: h.miembros.map((m) =>
        m.id === userId ? { ...m, [campo]: valor } : m
      ),
    }));
    await fetch(`/api/super-admin/grupos/${activeId}/miembros`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, [campo]: valor }),
    });
  };

  // Alta de estudiante desde la fila (crea cuenta, envía credenciales,
  // matricula al programa y al curso de la hoja).
  const guardarFila = async () => {
    if (!draft) return;
    if (!draft.nombres.trim() || !draft.email.trim()) {
      setAvisoFila('Nombre y correo son obligatorios');
      return;
    }
    setGuardandoFila(true);
    setAvisoFila(null);
    // Programa efectivo de la hoja (el de los estudiantes si comparten uno).
    const hojaAct = data?.hojas.find((h) => h.id === activeId);
    const progs = [
      ...new Set(
        (hojaAct?.miembros ?? [])
          .map((m) => m.programa)
          .filter((p): p is string => !!p)
      ),
    ];
    const programaEfectivo =
      progs.length === 1 ? progs[0] : (hojaAct?.programa ?? null);
    const esExistente = Boolean(draft.existingId);
    try {
      const res = await fetch(
        `/api/super-admin/grupos/${activeId}/alta-estudiante`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(
            esExistente
              ? { existingUserId: draft.existingId, programa: programaEfectivo }
              : {
                  nombres: draft.nombres,
                  apellidos: draft.apellidos,
                  identificacionNumero: draft.identificacion,
                  email: draft.email,
                  phone: draft.phone,
                  modalidad: draft.modalidad,
                  programa: programaEfectivo,
                }
          ),
        }
      );
      const j = (await res.json()) as {
        error?: string;
        correoOk?: boolean | null;
        existente?: boolean;
        matriculadoEnCurso?: string | null;
      };
      if (!res.ok) {
        setAvisoFila(j.error ?? 'No se pudo guardar');
        return;
      }
      cargar(activeId);
      if (j.existente) {
        setAvisoFila(`✓ ${draft.email} agregado a la hoja (usuario existente)`);
      } else {
        setAvisoFila(
          j.correoOk
            ? `✓ Creado. Credenciales enviadas a ${draft.email}${
                j.matriculadoEnCurso
                  ? ` · matriculado en ${j.matriculadoEnCurso}`
                  : ''
              }`
            : '✓ Creado, pero no se pudo enviar el correo. Reenvía las credenciales manualmente.'
        );
      }
      setSugerencias([]);
      setDraft({ ...filaVacia }); // limpia para seguir agregando (estilo Excel)
    } catch {
      setAvisoFila('Error al guardar el estudiante');
    } finally {
      setGuardandoFila(false);
    }
  };

  const imprimir = () => {
    if (!data) return;
    const g = data.hojas.find((h) => h.id === activeId) ?? data.hojas[0];
    if (!g) return;
    const curso = g.cursoHoja;
    const programasTxt =
      g.programasIds
        .map((i) => data.programasOpciones.find((p) => p.id === i)?.title)
        .filter((t): t is string => !!t)
        .join(', ') ||
      (g.programa ?? '');
    const ses = g.sesiones;
    const filas = g.miembros
      .map((m, i) => {
        const { nombres, apellidos } = splitNombre(m.name);
        const xs = ses
          .map((s) => {
            const e = g.asistencia[s.id]?.[m.id] as Estado | undefined;
            return `<td style="text-align:center">${
              e ? MARCA[e].letra : ''
            }</td>`;
          })
          .join('');
        return `<tr>
          <td>${i + 1}</td>
          <td>${m.identificacionNumero ?? ''}</td>
          <td>${nombres}</td>
          <td>${apellidos}</td>
          <td>${m.email}</td>
          <td>${m.phone ?? ''}</td>
          ${xs}
          <td>${m.modalidad ?? ''}</td>
          <td>${m.carteraStatus === 'activo' ? 'Al día' : 'En cartera'}</td>
          <td>${m.observaciones ?? ''}</td>
        </tr>`;
      })
      .join('');
    const cols = ses.map((s) => `<th>${fmtFecha(s.fecha)}</th>`).join('');
    const win = window.open('', '_blank', 'width=1100,height=800');
    if (!win) return;
    win.document.write(`<!doctype html><html><head><meta charset="utf-8">
      <title>Planilla ${g.nombre}</title>
      <style>
        body{font-family:Arial,Helvetica,sans-serif;color:#111;padding:20px}
        h1{font-size:16px;margin:0 0 4px}
        .info{display:grid;grid-template-columns:1fr 1fr;gap:2px 24px;margin:10px 0 14px;font-size:12px}
        .info b{color:#333}
        table{width:100%;border-collapse:collapse;font-size:11px}
        th,td{border:1px solid #999;padding:4px 6px;text-align:left}
        th{background:#eee}
      </style></head><body>
      <h1>PLANILLA DE ASISTENCIA — ${curso?.curso ?? g.programa ?? g.nombre}</h1>
      <div class="info">
        <div><b>ESPACIO:</b> ${curso?.espacio ?? ''}</div>
        <div><b>EMPRESA:</b> ${g.empresa ?? ''}</div>
        <div><b>PROGRAMAS:</b> ${programasTxt}</div>
        <div><b>EDUCADOR:</b> ${curso?.educador ?? ''}</div>
        <div><b>HORARIO:</b> ${curso?.horario ?? ''}</div>
        <div><b>CURSO:</b> ${curso?.curso ?? ''}</div>
      </div>
      <table><thead><tr>
        <th>No.</th><th># Identidad</th><th>Nombres</th><th>Apellidos</th>
        <th>Correo</th><th>Celular</th>${cols}
        <th>Modalidad</th><th>Estado</th><th>Observaciones</th>
      </tr></thead><tbody>${filas}</tbody></table>
      </body></html>`);
    win.document.close();
    win.focus();
    win.print();
  };

  if (cargando) {
    return (
      <div className="flex items-center justify-center gap-2 py-20 text-white/50">
        <Loader2 className="size-5 animate-spin" /> Cargando…
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 text-center text-red-400">
        {error ?? 'Grupo no encontrado'}
      </div>
    );
  }

  const { hojas, rootNombre, programasOpciones } = data;
  const hoja = hojas.find((h) => h.id === activeId) ?? hojas[0] ?? null;
  if (!hoja) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 text-center text-white/50">
        Este grupo no tiene hojas.
      </div>
    );
  }
  // Alias: la "hoja" activa es el grupo que se muestra en la planilla.
  const grupo = hoja;
  const miembros = hoja.miembros;
  const cursoHoja = hoja.cursoHoja;
  const sesiones = hoja.sesiones;
  const fechaNueva = fechaNuevaEn === activeId;
  const nFechas = sesiones.length + (fechaNueva ? 1 : 0);
  const asistencia = hoja.asistencia;
  // Programa efectivo: el de la hoja, o el de los estudiantes si es uno solo.
  const programasMiembros = [
    ...new Set(miembros.map((m) => m.programa).filter((p): p is string => !!p)),
  ];
  // Muestra el programa de los estudiantes cuando comparten uno solo (de donde
  // los trajiste); si están mezclados, usa el programa guardado de la hoja.
  const programaSel =
    programasMiembros.length === 1
      ? programasMiembros[0]
      : (grupo.programa ?? '');
  // Títulos de todos los programas de la hoja (para filtrar cursos).
  const programasHojaTitulos = hoja.programasIds
    .map((i) => programasOpciones.find((p) => p.id === i)?.title)
    .filter((t): t is string => !!t);
  const tituloPlanilla =
    cursoHoja?.curso ?? (programaSel || grupo.programa || grupo.nombre);

  return (
    <div
      // -mt/min-h van divididos entre el zoom (0.7) para cubrir de verdad los
      // 44px del header del layout y el alto completo de la pantalla.
      // flex-col + mt-auto en la barra de hojas: siempre queda abajo.
      className="relative -mt-[62.857px] flex min-h-[calc(100vh/0.7)] flex-col bg-[#031a35] px-3 pt-20 text-white md:pt-7"
      style={{ zoom: 0.7 }}
    >
      {/* En desktop el título queda a la altura del header fijo del layout
          (z-40, transparente); z-50 lo deja clicable por encima. */}
      <Link
        href="/dashboard/super-admin/grupos"
        className="relative z-50 inline-flex h-12 items-center gap-3 self-start text-white hover:text-white/75"
      >
        <ArrowLeft className="size-5" />
        <span className="text-2xl font-bold">{rootNombre}</span>
        <span className="text-sm font-normal text-white/50">
          {hojas.length} {hojas.length === 1 ? 'hoja' : 'hojas'}
        </span>
      </Link>

      <div className="flex min-h-[61px] items-center gap-2 overflow-x-auto border-b border-white/10 py-2">
        <input
          key={`${grupo.id}:${grupo.nombre}`}
          aria-label="Nombre de la hoja"
          defaultValue={grupo.nombre}
          onBlur={(e) => {
            if (e.target.value.trim() !== grupo.nombre) {
              void renombrarHoja(e.target.value);
            }
          }}
          className="h-9 w-[min(384px,40vw)] min-w-[180px] shrink-0 rounded-full border border-white/10 bg-[#021832] px-5 text-base text-white focus:border-white/30 focus:outline-none"
        />
        <button
          type="button"
          onClick={() => setBuscarAbierto(true)}
          className="inline-flex h-9 shrink-0 items-center gap-2 rounded-full border border-white/10 px-3 text-sm font-medium text-white/90 hover:bg-white/5"
        >
          <Plus className="size-4" /> Estudiante
        </button>
        <button
          type="button"
          onClick={() => setFechaNuevaEn(activeId)}
          className="inline-flex h-9 shrink-0 items-center gap-2 rounded-full border border-white/10 px-3 text-sm font-medium text-white/90 hover:bg-white/5"
        >
          <Plus className="size-4" /> Fecha
        </button>
        <AltaMasivaGrupo
          grupoId={activeId}
          programa={programaSel}
          onDone={() => void cargar(activeId)}
        />
        <button
          type="button"
          onClick={() => setConfirmarEliminar(true)}
          className="inline-flex h-9 shrink-0 items-center gap-2 px-3 text-sm font-medium text-red-500 hover:bg-red-500/10"
        >
          <Trash2 className="size-4" /> Eliminar hoja
        </button>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setClaseModal(true)}
            disabled={!cursoHoja}
            title={
              cursoHoja
                ? 'Programar clases de Teams para el curso de la hoja'
                : 'Asigna primero un curso a la hoja'
            }
            className="inline-flex h-9 items-center gap-2 rounded-full border border-blue-500/60 bg-blue-500/15 px-3 text-sm font-medium text-blue-400 hover:bg-blue-500/25 disabled:opacity-50"
          >
            <Video className="size-4" />
            Agregar Clases Virtuales
          </button>
          <button
            type="button"
            onClick={() => void verEnlaces()}
            disabled={!cursoHoja || cargandoEnlaces}
            title={
              cursoHoja
                ? 'Ver los enlaces de las clases del curso'
                : 'Asigna primero un curso a la hoja'
            }
            className="inline-flex h-9 items-center gap-2 rounded-full border border-white/10 px-3 text-sm font-medium text-white/90 hover:bg-white/5 disabled:text-white/30"
          >
            {cargandoEnlaces ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Link2 className="size-4" />
            )}
            Ver Enlaces Clases
          </button>
          <button
            type="button"
            onClick={imprimir}
            className="inline-flex h-9 items-center gap-2 rounded-full bg-[#19bfd0] px-3 text-sm font-semibold text-[#04101f] hover:bg-[#3ad4e2]"
          >
            <Printer className="size-4" /> Imprimir
          </button>
        </div>
      </div>

      {/* Planilla */}
      <div key={grupo.id} className="w-full">
        <div className="border-b border-white/10 px-1 pt-5 pb-3">
          <h2 className="text-lg font-bold text-white uppercase">
            Planilla de asistencia — {tituloPlanilla}
          </h2>
        </div>

        {/* Aviso del alta en fila */}
        {avisoFila && (
          <div
            className={`mt-3 rounded-lg border px-3 py-2 text-sm ${
              avisoFila.startsWith('✓')
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                : 'border-amber-500/30 bg-amber-500/10 text-amber-300'
            }`}
          >
            {avisoFila}
          </div>
        )}

        {/* Tabla */}
        <div className="overflow-x-auto border-b border-white/10">
          <table className="w-full min-w-[1320px] border-collapse text-sm">
            <thead className="bg-[#10213b] text-xs text-white/90">
              {/* Cabecera de la planilla: datos de la hoja a la izquierda y
                  el cuadro CLASES encima de las columnas de asistencia. */}
              <tr className="bg-[#031a35]">
                <th
                  colSpan={6}
                  rowSpan={2}
                  className="border-b border-white/10 p-0 text-left align-bottom font-normal"
                >
                  <div className="grid grid-cols-2 gap-x-4 pr-4 pb-1">
                    <div className="border-b border-white/10 py-1">
                      <ComboCampo
                        label="Espacio"
                        valor={cursoHoja?.espacio ?? null}
                        opciones={espacios}
                        disabled={!cursoHoja}
                        onElegir={(o) =>
                          cursoHoja &&
                          void guardarCampoCurso(cursoHoja.courseId, {
                            spaceOptionId: Number(o.id),
                          })
                        }
                        onTexto={(v) =>
                          cursoHoja &&
                          void guardarCampoCurso(cursoHoja.courseId, {
                            espacioTexto: v,
                          })
                        }
                      />
                    </div>
                    <div className="border-b border-white/10 py-1">
                      <CampoCabecera
                        label="Empresa"
                        valor={grupo.empresa}
                        onSave={(v) => void guardarEmpresa(v)}
                      />
                    </div>
                    <div className="border-b border-white/10 py-1">
                      <ProgramasMultiCampo
                        opciones={programasOpciones}
                        seleccion={hoja.programasIds}
                        onChange={(ids) => void asignarProgramas(ids)}
                      />
                    </div>
                    <div className="border-b border-white/10 py-1">
                      <ComboCampo
                        label="Educador"
                        valor={cursoHoja?.educador ?? null}
                        opciones={educadores}
                        disabled={!cursoHoja}
                        onElegir={(o) =>
                          cursoHoja &&
                          void guardarCampoCurso(cursoHoja.courseId, {
                            instructor: String(o.id),
                          })
                        }
                        onTexto={(v) =>
                          cursoHoja &&
                          void guardarCampoCurso(cursoHoja.courseId, {
                            educadorTexto: v,
                          })
                        }
                      />
                    </div>
                    <div className="border-b border-white/10 py-1">
                      <ComboCampo
                        label="Horario"
                        valor={cursoHoja?.horario ?? null}
                        opciones={horarios}
                        disabled={!cursoHoja}
                        onElegir={(o) =>
                          cursoHoja &&
                          void guardarCampoCurso(cursoHoja.courseId, {
                            scheduleOptionId: Number(o.id),
                          })
                        }
                        onTexto={(v) =>
                          cursoHoja &&
                          void guardarCampoCurso(cursoHoja.courseId, {
                            horarioTexto: v,
                          })
                        }
                      />
                    </div>
                    <div className="border-b border-white/10 py-1">
                      <div className="flex items-baseline gap-2">
                        <span className="w-24 shrink-0 text-[11px] font-semibold tracking-wide text-slate-400 uppercase">
                          Curso
                        </span>
                        {cursoHoja ? (
                          <>
                            <input
                              key={`${cursoHoja.courseId}:${cursoHoja.curso}`}
                              defaultValue={cursoHoja.curso}
                              onBlur={(e) => {
                                const nv = e.target.value.trim();
                                if (nv && nv !== cursoHoja.curso)
                                  void guardarCampoCurso(cursoHoja.courseId, {
                                    title: nv,
                                  });
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') e.currentTarget.blur();
                              }}
                              title="Edita el título del curso (se guarda en el curso)"
                              className="min-w-0 flex-1 border-b border-transparent bg-transparent px-1 py-0.5 text-sm text-white/80 focus:border-[#22C4D3] focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => setCursoModal(true)}
                              title="Cambiar de curso"
                              className="shrink-0 text-white/25 hover:text-[#22C4D3]"
                            >
                              <Pencil className="size-3" />
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setCursoModal(true)}
                            className="min-w-0 flex-1 px-1 py-0.5 text-left text-sm font-medium text-[#22C4D3] hover:underline"
                          >
                            Agregar curso
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </th>
                <th
                  colSpan={Math.max(nFechas, 1)}
                  className="h-9 border border-white/10 bg-[#0a1d36] text-center text-sm font-bold"
                >
                  CLASES
                </th>
                <th
                  colSpan={3}
                  rowSpan={2}
                  className="border-b border-white/10"
                />
              </tr>
              <tr className="bg-[#0a1d36]">
                {sesiones.map((s) => (
                  <EncabezadoFecha
                    key={s.id}
                    fecha={s.fecha}
                    titulo={s.titulo}
                    onElegir={(f) => {
                      if (f && f !== s.fecha) void cambiarFechaSesion(s.id, f);
                    }}
                    onQuitar={() => void quitarSesion(s.id)}
                  />
                ))}
                {fechaNueva && (
                  <EncabezadoFecha
                    fecha={null}
                    onElegir={(f) => {
                      if (f) void crearSesion(f);
                    }}
                    onQuitar={() => setFechaNuevaEn(null)}
                  />
                )}
                {nFechas === 0 && (
                  <th className="h-[120px] border border-white/10" />
                )}
              </tr>
              <tr className="text-left">
                <th className="w-12 border border-white/10 px-2 py-1.5 text-center">
                  No.
                </th>
                <th className="w-[108px] border border-white/10 px-2 py-1.5">
                  # Identidad
                </th>
                <th className="sticky left-0 z-10 w-[142px] border border-white/10 bg-[#10213b] px-2 py-1.5">
                  Nombres
                </th>
                <th className="w-[168px] border border-white/10 px-2 py-1.5">
                  Apellidos
                </th>
                <th className="w-[240px] border border-white/10 px-2 py-1.5">
                  Correo
                </th>
                <th className="w-[168px] border border-white/10 px-2 py-1.5">
                  Celular
                </th>
                {nFechas > 0 ? (
                  <th
                    colSpan={nFechas}
                    className="border border-white/10 px-2 py-1.5 text-center text-sm font-bold"
                  >
                    (X) PARA ALUMNO PRESENTE
                  </th>
                ) : (
                  <th className="border border-white/10 px-3 py-1.5 font-normal text-white/30">
                    + Fecha →
                  </th>
                )}
                <th className="w-[92px] border border-white/10 px-2 py-1.5">
                  Modalidad
                </th>
                <th className="w-[168px] border border-white/10 px-2 py-1.5">
                  Estado
                </th>
                <th className="w-[268px] border border-white/10 px-2 py-1.5">
                  Observaciones
                </th>
              </tr>
            </thead>
            <tbody>
              {miembros.map((m, i) => {
                const { nombres, apellidos } = splitNombre(m.name);
                return (
                  <tr key={m.id} className="group/row hover:bg-white/[0.02]">
                    <td className="relative border border-white/10 px-2 py-1.5 text-center text-white/50">
                      <span className="group-hover/row:opacity-0">{i + 1}</span>
                      <button
                        type="button"
                        onClick={() => void quitarMiembro(m.id)}
                        className="absolute inset-0 m-auto flex items-center justify-center text-white/0 group-hover/row:text-red-400"
                        aria-label="Quitar del grupo"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </td>
                    <td className="border border-white/10 px-1 py-0.5 text-white/70">
                      <input
                        defaultValue={m.identificacionNumero ?? ''}
                        onBlur={(e) => {
                          if (e.target.value !== (m.identificacionNumero ?? ''))
                            void guardarCampoUsuario(
                              m.id,
                              'identificacionNumero',
                              e.target.value
                            );
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') e.currentTarget.blur();
                        }}
                        className="w-full min-w-[110px] rounded border border-transparent bg-transparent px-1 py-0.5 text-xs text-white/70 hover:border-white/15 focus:border-[#22C4D3] focus:outline-none"
                      />
                    </td>
                    <td className="sticky left-0 z-10 border border-white/10 bg-[#0a1a30] px-1 py-0.5 text-white">
                      <input
                        defaultValue={nombres}
                        placeholder={m.name ?? m.email ?? ''}
                        onBlur={(e) => {
                          const nv = e.target.value.trim();
                          if (nv !== nombres)
                            void guardarCampoUsuario(
                              m.id,
                              'name',
                              `${nv} ${apellidos}`.trim()
                            );
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') e.currentTarget.blur();
                        }}
                        className="w-full min-w-[120px] rounded border border-transparent bg-transparent px-1 py-0.5 text-xs text-white placeholder:text-white/30 hover:border-white/15 focus:border-[#22C4D3] focus:outline-none"
                      />
                    </td>
                    <td className="border border-white/10 px-1 py-0.5 text-white/70">
                      <input
                        defaultValue={apellidos}
                        onBlur={(e) => {
                          const nv = e.target.value.trim();
                          if (nv !== apellidos)
                            void guardarCampoUsuario(
                              m.id,
                              'name',
                              `${nombres} ${nv}`.trim()
                            );
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') e.currentTarget.blur();
                        }}
                        className="w-full min-w-[120px] rounded border border-transparent bg-transparent px-1 py-0.5 text-xs text-white/70 hover:border-white/15 focus:border-[#22C4D3] focus:outline-none"
                      />
                    </td>
                    <td className="border border-white/10 px-1 py-0.5 text-white/60">
                      <input
                        type="email"
                        value={correoDraft[m.id] ?? m.email ?? ''}
                        onChange={(e) =>
                          setCorreoDraft((d) => ({
                            ...d,
                            [m.id]: e.target.value,
                          }))
                        }
                        onBlur={() => void guardarCorreo(m.id, m.email ?? '')}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') e.currentTarget.blur();
                        }}
                        disabled={guardandoCorreo === m.id}
                        title="Editar correo (se guarda al salir del campo)"
                        className="w-full min-w-[180px] rounded border border-transparent bg-transparent px-1 py-0.5 text-xs text-white/70 hover:border-white/15 focus:border-[#22C4D3] focus:outline-none disabled:opacity-50"
                      />
                    </td>
                    <td className="border border-white/10 px-1 py-0.5 text-white/60">
                      <input
                        defaultValue={m.phone ?? ''}
                        onBlur={(e) => {
                          if (e.target.value !== (m.phone ?? ''))
                            void guardarCampoUsuario(
                              m.id,
                              'phone',
                              e.target.value
                            );
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') e.currentTarget.blur();
                        }}
                        className="w-full min-w-[110px] rounded border border-transparent bg-transparent px-1 py-0.5 text-xs text-white/60 hover:border-white/15 focus:border-[#22C4D3] focus:outline-none"
                      />
                    </td>
                    {sesiones.map((s) => {
                      const estado = (asistencia[s.id]?.[m.id] ?? '') as
                        Estado | '';
                      const siguiente: Estado =
                        estado === 'presente'
                          ? 'ausente'
                          : estado === 'ausente'
                            ? 'tarde'
                            : 'presente';
                      return (
                        <td
                          key={s.id}
                          className="w-[42px] border border-white/10 px-2 py-1.5 text-center"
                        >
                          <button
                            type="button"
                            onClick={() => void marcar(s.id, m.id, siguiente)}
                            className={`inline-flex size-6 items-center justify-center rounded text-[11px] font-bold ${
                              estado
                                ? MARCA[estado].clase
                                : 'bg-white/5 text-white/25'
                            }`}
                            title={estado || 'marcar'}
                          >
                            {estado ? MARCA[estado].letra : '·'}
                          </button>
                        </td>
                      );
                    })}
                    {fechaNueva && <td className="border border-white/10" />}
                    {nFechas === 0 && <td className="border border-white/10" />}
                    <td className="border border-white/10 px-2 py-1.5">
                      <input
                        defaultValue={m.modalidad ?? ''}
                        onBlur={(e) => {
                          if (e.target.value !== (m.modalidad ?? '')) {
                            void guardarNota(m.id, 'modalidad', e.target.value);
                          }
                        }}
                        className="w-24 rounded border border-transparent bg-transparent px-1 py-0.5 text-xs text-white/80 placeholder:text-white/25 hover:border-white/15 focus:border-[#22C4D3] focus:outline-none"
                      />
                    </td>
                    <td className="border border-white/10 px-3 py-1.5 whitespace-nowrap">
                      {/* Abre la misma ventana de cartera de Estudiantes. */}
                      <button
                        type="button"
                        onClick={() => abrirCartera(m.id)}
                        title="Gestionar cartera"
                        className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium hover:brightness-125 ${
                          m.carteraStatus === 'activo'
                            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                            : 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                        }`}
                      >
                        {m.carteraStatus === 'activo' ? 'Al día' : 'En cartera'}
                      </button>
                    </td>
                    <td className="border border-white/10 px-2 py-1.5">
                      <input
                        defaultValue={m.observaciones ?? ''}
                        onBlur={(e) => {
                          if (e.target.value !== (m.observaciones ?? '')) {
                            void guardarNota(
                              m.id,
                              'observaciones',
                              e.target.value
                            );
                          }
                        }}
                        className="w-full min-w-[160px] rounded border border-transparent bg-transparent px-1 py-0.5 text-xs text-white/80 placeholder:text-white/25 hover:border-white/15 focus:border-[#22C4D3] focus:outline-none"
                      />
                    </td>
                  </tr>
                );
              })}

              {/* Fila editable estilo Excel (al final, como una hoja) */}
              {draft && (
                <tr className="bg-[#22C4D3]/[0.06]">
                  <td className="border border-white/10 px-2 py-1.5 text-center text-[#22C4D3]">
                    <div className="flex items-center justify-center gap-1">
                      <UserPlus2 className="size-4" />
                      <button
                        type="button"
                        onClick={() => void guardarFila()}
                        disabled={guardandoFila}
                        title="Crear y enviar credenciales"
                        className="inline-flex size-7 items-center justify-center rounded-md bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 disabled:opacity-50"
                      >
                        {guardandoFila ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Check className="size-4" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDraft(null);
                          setAvisoFila(null);
                        }}
                        title="Cancelar"
                        className="inline-flex size-7 items-center justify-center rounded-md text-white/40 hover:bg-white/5 hover:text-red-400"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  </td>
                  <td className="border border-white/10 p-1">
                    <input
                      ref={identInputRef}
                      value={draft.identificacion}
                      onChange={(e) => {
                        setCampoBusqueda('identificacion');
                        setAnchorRect(e.currentTarget.getBoundingClientRect());
                        setDraft({
                          ...draft,
                          identificacion: e.target.value,
                          existingId: '',
                        });
                      }}
                      onFocus={(e) => {
                        setCampoBusqueda('identificacion');
                        setAnchorRect(e.currentTarget.getBoundingClientRect());
                      }}
                      placeholder="# Identidad"
                      className="w-full min-w-[110px] rounded bg-transparent px-1 py-0.5 text-xs text-white placeholder:text-white/30 focus:outline-none"
                    />
                  </td>
                  <td className="sticky left-0 z-10 border border-white/10 bg-[#0a1a30] p-1">
                    <input
                      autoFocus
                      value={draft.nombres}
                      onChange={(e) =>
                        setDraft({ ...draft, nombres: e.target.value })
                      }
                      placeholder="Nombres *"
                      className="w-full min-w-[120px] rounded bg-transparent px-1 py-0.5 text-xs text-white placeholder:text-white/30 focus:outline-none"
                    />
                  </td>
                  <td className="border border-white/10 p-1">
                    <input
                      value={draft.apellidos}
                      onChange={(e) =>
                        setDraft({ ...draft, apellidos: e.target.value })
                      }
                      placeholder="Apellidos"
                      className="w-full min-w-[120px] rounded bg-transparent px-1 py-0.5 text-xs text-white placeholder:text-white/30 focus:outline-none"
                    />
                  </td>
                  <td className="border border-white/10 p-1">
                    <input
                      ref={emailInputRef}
                      type="email"
                      value={draft.email}
                      onChange={(e) => {
                        setCampoBusqueda('email');
                        setAnchorRect(e.currentTarget.getBoundingClientRect());
                        setDraft({
                          ...draft,
                          email: e.target.value,
                          existingId: '',
                        });
                      }}
                      onFocus={(e) => {
                        setCampoBusqueda('email');
                        setAnchorRect(e.currentTarget.getBoundingClientRect());
                      }}
                      placeholder="correo@ejemplo.com *"
                      className="w-full min-w-[160px] rounded bg-transparent px-1 py-0.5 text-xs text-white placeholder:text-white/30 focus:outline-none"
                    />
                    {draft.existingId && (
                      <span className="mt-0.5 block text-[10px] text-emerald-300">
                        ✓ usuario existente
                      </span>
                    )}
                  </td>
                  <td className="border border-white/10 p-1">
                    <input
                      value={draft.phone}
                      onChange={(e) =>
                        setDraft({ ...draft, phone: e.target.value })
                      }
                      placeholder="Celular"
                      className="w-full min-w-[110px] rounded bg-transparent px-1 py-0.5 text-xs text-white placeholder:text-white/30 focus:outline-none"
                    />
                  </td>
                  {sesiones.map((s) => (
                    <td key={s.id} className="border border-white/10" />
                  ))}
                  {fechaNueva && <td className="border border-white/10" />}
                  {nFechas === 0 && <td className="border border-white/10" />}
                  <td className="border border-white/10 p-1">
                    <input
                      value={draft.modalidad}
                      onChange={(e) =>
                        setDraft({ ...draft, modalidad: e.target.value })
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') void guardarFila();
                      }}
                      placeholder="Modalidad"
                      className="w-full min-w-[100px] rounded bg-transparent px-1 py-0.5 text-xs text-white placeholder:text-white/30 focus:outline-none"
                    />
                  </td>
                  <td className="border border-white/10 text-center text-white/25">
                    —
                  </td>
                </tr>
              )}

              {/* Botón "Nueva fila" debajo del último estudiante (estilo Excel) */}
              {!draft && (
                <tr>
                  <td
                    colSpan={6 + Math.max(nFechas, 1) + 3}
                    className="border border-white/10 p-0"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setAvisoFila(null);
                        setDraft({ ...filaVacia });
                      }}
                      className="flex w-full items-center gap-2 px-3 py-1 text-sm text-[#22C4D3] opacity-0 hover:bg-[#22C4D3]/5 hover:opacity-100 focus:opacity-100"
                    >
                      <UserPlus2 className="size-4" /> Nueva fila (crear
                      estudiante y enviar credenciales)
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dropdown de sugerencias en portal: posición fija para que no lo
          clipee la tabla ni se esconda; se voltea hacia arriba si no cabe. */}
      {typeof document !== 'undefined' &&
        draft &&
        !draft.existingId &&
        sugerencias.length > 0 &&
        anchorRect &&
        createPortal(
          (() => {
            return (
              <div
                className="fixed z-[9999] overflow-y-auto rounded-lg border border-[#22C4D3]/40 bg-[#061c37] shadow-2xl"
                style={posDropdown(anchorRect, 288, 224)}
              >
                {sugerencias.map((s) => {
                  const { nombres, apellidos } = splitNombre(s.name);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setDraft({
                          identificacion: s.identificacionNumero ?? '',
                          nombres,
                          apellidos,
                          email: s.email,
                          phone: s.phone ?? '',
                          modalidad: s.modalidad ?? '',
                          existingId: s.id,
                        });
                        setSugerencias([]);
                      }}
                      className="block w-full px-3 py-2 text-left hover:bg-white/5"
                    >
                      <span className="block truncate text-xs text-white">
                        {s.email}
                      </span>
                      <span className="block truncate text-[11px] text-white/50">
                        {s.name ?? '—'}
                        {s.identificacionNumero
                          ? ` · ${s.identificacionNumero}`
                          : ''}
                      </span>
                    </button>
                  );
                })}
              </div>
            );
          })(),
          document.body
        )}

      {/* Pestañas de hojas (sub-grupos) dentro del grupo */}
      <div className="sticky bottom-0 z-30 mt-auto border-t border-white/10 bg-[#04101f]/95 backdrop-blur">
        {/* pr-32 deja libre el botón flotante del asistente (fixed bottom-right) */}
        <div className="flex items-center gap-2 py-2 pr-32 pl-3">
          <button
            type="button"
            onClick={() => void crearHojaDirecta()}
            disabled={creandoHoja}
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-white/15 text-white/60 hover:bg-white/5 disabled:opacity-50"
            title="Nueva hoja"
          >
            <Plus className="size-4" />
          </button>
          <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
            {hojas.map((h) => {
              const activa = h.id === activeId;
              if (activa && renombrando) {
                return (
                  <input
                    key={h.id}
                    autoFocus
                    defaultValue={h.nombre}
                    onBlur={(e) => {
                      setRenombrando(false);
                      if (e.target.value.trim() !== h.nombre) {
                        void renombrarHoja(e.target.value);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') e.currentTarget.blur();
                      if (e.key === 'Escape') setRenombrando(false);
                    }}
                    className="w-40 shrink-0 rounded-lg border border-[#22C4D3]/60 bg-[#0b1a2f] px-3 py-1.5 text-sm text-white focus:outline-none"
                  />
                );
              }
              return (
                <div
                  key={h.id}
                  className={`inline-flex shrink-0 items-center rounded-lg text-sm whitespace-nowrap transition-colors ${
                    activa
                      ? 'bg-[#22C4D3]/15 font-semibold text-[#22C4D3]'
                      : 'text-white/60 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      if (activa) setRenombrando(true);
                      else setActiveId(h.id);
                    }}
                    title={activa ? 'Clic para renombrar' : h.nombre}
                    className="inline-flex items-center gap-1.5 py-1.5 pr-1 pl-3"
                  >
                    <FileText className="size-4" />
                    {h.nombre}
                    {activa && <Pencil className="size-3 opacity-50" />}
                  </button>
                  {h.id > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveId(h.id);
                        setConfirmarEliminar(true);
                      }}
                      title="Eliminar hoja"
                      aria-label={`Eliminar ${h.nombre}`}
                      className="mr-1.5 rounded p-0.5 text-current opacity-40 hover:bg-red-500/20 hover:text-red-400 hover:opacity-100"
                    >
                      <X className="size-3" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {buscarAbierto && (
        <ModalAgregar
          grupoId={String(activeId)}
          onCerrar={() => setBuscarAbierto(false)}
          onAgregado={() => void cargar(activeId)}
        />
      )}

      {claseModal && cursoHoja && (
        <ModalClasesVirtuales
          grupoId={activeId}
          courseId={cursoHoja.courseId}
          curso={cursoHoja.curso}
          sesiones={sesiones}
          onCerrar={() => setClaseModal(false)}
          onCreadas={(n) => {
            setClaseModal(false);
            setAvisoFila(
              `✓ ${n} clase(s) virtual(es) creada(s) en ${cursoHoja.curso}`
            );
          }}
        />
      )}

      {enlaces && (
        <ModalEnlacesClases
          curso={cursoHoja?.curso ?? ''}
          clases={enlaces}
          onCerrar={() => setEnlaces(null)}
        />
      )}

      {(Boolean(carteraDe) || precargarCartera) &&
        createPortal(
          <div
            className={
              carteraDe
                ? 'fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm'
                : 'pointer-events-none invisible fixed inset-0 z-[100]'
            }
          >
            {carteraDe && !carteraLista && (
              // Mismo tamaño que la ventana de cartera mientras carga.
              <div className="absolute inset-0 flex items-end justify-center sm:items-center">
                <div className="flex h-[95vh] w-full flex-col items-center justify-center gap-3 rounded-t-3xl bg-white text-gray-500 shadow-2xl sm:h-[70vh] sm:max-w-[min(100vw-1rem,72rem)] sm:rounded-lg">
                  <Loader2 className="size-7 animate-spin text-[#22C4D3]" />
                  <p className="text-sm">Cargando cartera…</p>
                  <button
                    type="button"
                    onClick={() => setCarteraDe(null)}
                    className="mt-2 rounded-lg border border-gray-200 px-4 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
            <iframe
              ref={carteraIframe}
              title="Cartera del estudiante"
              src="/dashboard/super-admin/programs/enrolled_users?embed=1"
              className={`absolute inset-0 size-full border-0 transition-all duration-200 ${
                carteraDe && carteraLista
                  ? 'scale-100 opacity-100'
                  : 'pointer-events-none scale-95 opacity-0'
              }`}
            />
          </div>,
          document.body
        )}

      {nuevaHojaAbierta && (
        <ModalCrearGrupo
          parentId={grupo.id}
          programaInicial={programaSel}
          onCerrar={() => setNuevaHojaAbierta(false)}
          onCreado={(nuevaId) => {
            setNuevaHojaAbierta(false);
            void mutateGrupo().then(() => setActiveId(nuevaId));
          }}
        />
      )}

      {cursoModal && (
        <ModalAgregarCurso
          programa={programasHojaTitulos.join(', ')}
          cursos={data.cursosDisponibles.filter((c) =>
            c.programas.some((p) => programasHojaTitulos.includes(p))
          )}
          onCerrar={() => setCursoModal(false)}
          onAgregar={(cid) => void agregarCurso(cid)}
        />
      )}

      {confirmarEliminar && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => !eliminando && setConfirmarEliminar(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-red-500/30 bg-[#061c37] p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center gap-2">
              <span className="flex size-9 items-center justify-center rounded-full bg-red-500/15 text-red-400">
                <Trash2 className="size-4" />
              </span>
              <h2 className="text-lg font-bold text-white">Eliminar hoja</h2>
            </div>
            <p className="text-sm text-white/70">
              ¿Eliminar la hoja{' '}
              <span className="font-semibold text-white">“{grupo.nombre}”</span>
              ? Se borran sus estudiantes, fechas y asistencia. No se puede
              deshacer.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmarEliminar(false)}
                disabled={eliminando}
                className="rounded-xl border border-white/15 px-4 py-2 text-sm text-white/70 hover:bg-white/5 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void eliminarGrupo()}
                disabled={eliminando}
                className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50"
              >
                {eliminando ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Trash2 className="size-4" />
                )}
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Fecha y hora de Colombia: "junio 20, 2026 · 7:30 a. m. – 9:30 a. m."
const horaCo = (iso: string) =>
  new Date(iso).toLocaleTimeString('es-CO', {
    timeZone: 'America/Bogota',
    hour: 'numeric',
    minute: '2-digit',
  });
const fechaCo = (iso: string) =>
  formatFechaLarga(
    new Date(iso).toLocaleDateString('en-CA', { timeZone: 'America/Bogota' })
  );

/**
 * Encabezado de una columna de clase: la fecha en vertical. Al hacer clic
 * abre el calendario para cambiarla. Con `fecha={null}` es la columna nueva
 * (aún sin guardar): al hacer clic se elige su fecha.
 */
function EncabezadoFecha({
  fecha,
  titulo,
  onElegir,
  onQuitar,
}: {
  fecha: string | null;
  titulo?: string | null;
  onElegir: (fecha: string) => void;
  onQuitar: () => void;
}) {
  const [ancla, setAncla] = useState<HTMLElement | null>(null);

  return (
    <th
      className={`group/fecha relative h-[180px] w-[42px] border border-white/10 p-0 text-center ${
        fecha ? '' : 'bg-[#22C4D3]/10'
      } ${ancla ? 'bg-[#22C4D3]/15' : ''}`}
      title={
        fecha ? (titulo ?? 'Clic para cambiar la fecha') : 'Elige la fecha'
      }
    >
      <button
        type="button"
        onClick={onQuitar}
        className={`absolute top-1 left-1/2 z-10 -translate-x-1/2 ${
          fecha
            ? 'text-white/0 group-hover/fecha:text-red-400 focus:text-red-400'
            : 'text-white/50 hover:text-red-400'
        }`}
        title={fecha ? 'Quitar fecha' : 'Cancelar'}
        aria-label={fecha ? 'Quitar fecha' : 'Cancelar'}
      >
        <X className="size-3" />
      </button>
      <button
        type="button"
        onClick={(e) => setAncla(ancla ? null : e.currentTarget)}
        aria-label={fecha ? 'Cambiar fecha' : 'Elegir fecha'}
        className="absolute inset-x-0 top-5 bottom-0 flex cursor-pointer items-center justify-center hover:bg-white/5"
      >
        <span
          className={`inline-block rotate-180 text-[11px] font-semibold whitespace-nowrap [writing-mode:vertical-rl] ${
            fecha ? '' : 'text-[#22C4D3]'
          }`}
        >
          {fecha ? fmtFechaVert(fecha) : 'ELEGIR FECHA'}
        </span>
      </button>
      {ancla && (
        <CalendarioPopover
          ancla={ancla}
          valor={fecha}
          onElegir={(f) => {
            setAncla(null);
            onElegir(f);
          }}
          onCerrar={() => setAncla(null)}
        />
      )}
    </th>
  );
}

// Día de la semana en Colombia ("sábado"), como lo espera /api/super-admin/teams.
const diaSemanaCo = (fecha: string) =>
  new Intl.DateTimeFormat('es-CO', {
    weekday: 'long',
    timeZone: 'America/Bogota',
  })
    .format(new Date(`${fecha}T12:00:00-05:00`))
    .toLowerCase();

/**
 * Crea clases de Teams para las FECHAS de la planilla que se elijan (una
 * clase por fecha, misma hora y duración). Usa el mismo endpoint que el
 * detalle del curso, así que quedan en las clases del curso.
 */
function ModalClasesVirtuales({
  grupoId,
  courseId,
  curso,
  sesiones,
  onCerrar,
  onCreadas,
}: {
  grupoId: number;
  courseId: number;
  curso: string;
  sesiones: Sesion[];
  onCerrar: () => void;
  onCreadas: (n: number) => void;
}) {
  const fechas = [
    ...new Set(
      sesiones.map((s) => s.fecha).filter((f): f is string => Boolean(f))
    ),
  ].sort();
  const [titulo, setTitulo] = useState(curso);
  const [hora, setHora] = useState('');
  const [duracion, setDuracion] = useState(60);
  const [coHostEmail, setCoHostEmail] = useState(
    'educadorsoftwarem@ponao.com.co'
  );
  const [elegidas, setElegidas] = useState<Set<string>>(new Set());
  const [conEnlace, setConEnlace] = useState<Set<string>>(new Set());
  const [progreso, setProgreso] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // Fechas que ya tienen una clase del curso ese día (para marcarlas).
  useEffect(() => {
    void fetch(`/api/super-admin/grupos/${grupoId}/clases`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { clases?: { startDateTime: string }[] } | null) => {
        const dias = (j?.clases ?? []).map((m) =>
          new Date(m.startDateTime).toLocaleDateString('en-CA', {
            timeZone: 'America/Bogota',
          })
        );
        setConEnlace(new Set(dias));
      })
      .catch(() => undefined);
  }, [grupoId]);

  const alternar = (f: string) =>
    setElegidas((prev) => {
      const s = new Set(prev);
      if (s.has(f)) s.delete(f);
      else s.add(f);
      return s;
    });

  const crear = async () => {
    setErr(null);
    if (!titulo.trim()) return setErr('Escribe un título.');
    if (!hora) return setErr('Elige la hora de inicio.');
    if (duracion < 15) return setErr('La duración mínima es 15 minutos.');
    const coHost = coHostEmail.trim();
    if (coHost && !/^\S+@\S+\.\S+$/.test(coHost)) {
      return setErr('El email del coanfitrión no es válido.');
    }
    const lista = fechas.filter((f) => elegidas.has(f));
    if (lista.length === 0) return setErr('Elige al menos una fecha.');

    let creadas = 0;
    const fallidas: string[] = [];
    for (const [i, f] of lista.entries()) {
      setProgreso(`Creando ${i + 1} de ${lista.length}…`);
      try {
        const res = await fetch('/api/super-admin/teams', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            courseId,
            title: titulo.trim(),
            startDateTime: `${f}T${hora}`,
            durationMinutes: duracion,
            repeatCount: 1,
            daysOfWeek: [diaSemanaCo(f)],
            customTitles: [formatFechaLarga(f)],
            coHostEmail: coHost || undefined,
          }),
        });
        if (!res.ok) throw new Error();
        creadas++;
      } catch {
        fallidas.push(formatFechaLarga(f));
      }
    }
    setProgreso(null);
    if (fallidas.length > 0) {
      setErr(
        `No se pudieron crear: ${fallidas.join(', ')}.` +
          (creadas > 0 ? ` Se crearon ${creadas}.` : '')
      );
      return;
    }
    onCreadas(creadas);
  };

  const campo =
    'w-full rounded-xl border border-white/10 bg-[#0b1a2f] px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-[#22C4D3]/60 focus:outline-none';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={progreso ? undefined : onCerrar}
    >
      <div
        className="flex max-h-[97vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-[#22C4D3]/30 bg-[#061c37] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-[#22C4D3]">
              Agregar clases virtuales
            </h2>
            <p className="truncate text-xs text-white/50">{curso}</p>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            disabled={Boolean(progreso)}
            className="text-white/50 hover:text-white disabled:opacity-30"
            aria-label="Cerrar"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          <div>
            <label className="mb-1 block text-xs text-white/50">Título</label>
            <input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className={campo}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-white/50">
                Hora de inicio
              </label>
              <input
                type="time"
                value={hora}
                onChange={(e) => setHora(e.target.value)}
                className={`${campo} [color-scheme:dark]`}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-white/50">
                Duración (min)
              </label>
              <input
                type="number"
                min={15}
                step={15}
                value={duracion}
                onChange={(e) => setDuracion(Number(e.target.value))}
                className={campo}
              />
            </div>
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="text-xs text-white/50">
                Fechas de la planilla
              </label>
              {fechas.length > 0 && (
                <button
                  type="button"
                  onClick={() =>
                    setElegidas(
                      elegidas.size === fechas.length
                        ? new Set()
                        : new Set(fechas)
                    )
                  }
                  className="text-xs text-[#22C4D3] hover:underline"
                >
                  {elegidas.size === fechas.length
                    ? 'Quitar todas'
                    : 'Elegir todas'}
                </button>
              )}
            </div>
            {fechas.length === 0 ? (
              <p className="rounded-xl border border-white/10 px-3 py-4 text-center text-sm text-white/40">
                La hoja no tiene fechas. Agrégalas con + Fecha.
              </p>
            ) : (
              <div className="rounded-xl border border-white/10">
                {fechas.map((f) => (
                  <label
                    key={f}
                    className="flex cursor-pointer items-center gap-3 border-b border-white/5 px-3 py-2 text-sm last:border-b-0 hover:bg-white/5"
                  >
                    <input
                      type="checkbox"
                      checked={elegidas.has(f)}
                      onChange={() => alternar(f)}
                      className="size-4 accent-[#22C4D3]"
                    />
                    <span className="min-w-0 flex-1 text-white">
                      <span className="text-white/50 capitalize">
                        {diaSemanaCo(f)}
                      </span>{' '}
                      {formatFechaLarga(f)}
                    </span>
                    {conEnlace.has(f) && (
                      <span className="shrink-0 rounded-full bg-blue-500/15 px-2 py-0.5 text-[11px] text-blue-300">
                        ya tiene enlace
                      </span>
                    )}
                  </label>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="mb-1 block text-xs text-white/50">
              Email del coanfitrión
            </label>
            <input
              type="email"
              value={coHostEmail}
              onChange={(e) => setCoHostEmail(e.target.value)}
              placeholder="email@ejemplo.com"
              className={campo}
            />
            <p className="mt-1 text-xs text-white/40">
              Este correo recibirá permisos de coorganizador en todas las
              clases.
            </p>
          </div>

          {err && <p className="text-sm text-red-400">{err}</p>}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-white/10 px-5 py-3">
          <button
            type="button"
            onClick={onCerrar}
            disabled={Boolean(progreso)}
            className="rounded-xl border border-white/15 px-4 py-2 text-sm text-white/70 hover:bg-white/5 disabled:opacity-40"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => void crear()}
            disabled={Boolean(progreso) || elegidas.size === 0}
            className="inline-flex items-center gap-2 rounded-xl bg-[#22C4D3] px-4 py-2 text-sm font-semibold text-[#04101f] hover:bg-[#3ad4e2] disabled:opacity-50"
          >
            {progreso ? (
              <>
                <Loader2 className="size-4 animate-spin" /> {progreso}
              </>
            ) : (
              <>
                <Video className="size-4" /> Crear {elegidas.size} clase(s)
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function ModalEnlacesClases({
  curso,
  clases,
  onCerrar,
}: {
  curso: string;
  clases: ClaseVirtual[];
  onCerrar: () => void;
}) {
  const [copiado, setCopiado] = useState<number | null>(null);

  const copiar = async (c: ClaseVirtual) => {
    try {
      await navigator.clipboard.writeText(c.joinUrl);
      setCopiado(c.id);
    } catch {
      setCopiado(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onCerrar}
    >
      <div
        className="flex max-h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[#22C4D3]/30 bg-[#061c37] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-[#22C4D3]">
              Enlaces de clases
            </h2>
            <p className="truncate text-xs text-white/50">{curso}</p>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            className="text-white/50 hover:text-white"
            aria-label="Cerrar"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="max-h-[65vh] overflow-y-auto p-3">
          {clases.length === 0 ? (
            <p className="py-6 text-center text-sm text-white/40">
              Este curso aún no tiene clases virtuales. Créalas con el botón
              Agregar Clases Virtuales.
            </p>
          ) : (
            clases.map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-white/5"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">
                    {c.title}
                  </p>
                  <p className="text-xs text-white/50">
                    {fechaCo(c.startDateTime)} · {horaCo(c.startDateTime)} –{' '}
                    {horaCo(c.endDateTime)}
                  </p>
                </div>
                {c.joinUrl ? (
                  <>
                    <button
                      type="button"
                      onClick={() => void copiar(c)}
                      className="shrink-0 rounded-full border border-white/10 px-3 py-1 text-xs text-white/80 hover:bg-white/5"
                    >
                      {copiado === c.id ? 'Copiado' : 'Copiar'}
                    </button>
                    <a
                      href={c.joinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-blue-500/15 px-3 py-1 text-xs font-medium text-blue-400 hover:bg-blue-500/25"
                    >
                      <Video className="size-3.5" /> Abrir
                    </a>
                  </>
                ) : (
                  <span className="shrink-0 text-xs text-white/30">
                    Sin enlace
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function ModalAgregarCurso({
  programa,
  cursos,
  onCerrar,
  onAgregar,
}: {
  programa: string;
  cursos: { id: number; title: string }[];
  onCerrar: () => void;
  onAgregar: (courseId: number) => void;
}) {
  const [busqueda, setBusqueda] = useState('');
  const q = busqueda.trim().toLowerCase();
  const visibles = q
    ? cursos.filter((c) => c.title.toLowerCase().includes(q))
    : cursos;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onCerrar}
    >
      <div
        className="flex max-h-[80vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-[#22C4D3]/30 bg-[#061c37] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
          <h2 className="text-lg font-bold text-[#22C4D3]">Agregar curso</h2>
          <button
            type="button"
            onClick={onCerrar}
            className="text-white/50 hover:text-white"
            aria-label="Cerrar"
          >
            <X className="size-5" />
          </button>
        </div>
        {cursos.length > 0 && (
          <div className="border-b border-white/10 px-4 py-2">
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-[#021832] px-3">
              <Search className="size-4 shrink-0 text-white/40" />
              <input
                autoFocus
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar curso…"
                className="h-9 min-w-0 flex-1 bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none"
              />
            </div>
          </div>
        )}
        <div className="max-h-[60vh] overflow-y-auto p-3">
          {cursos.length === 0 ? (
            <p className="py-6 text-center text-sm text-white/40">
              {programa
                ? `No hay cursos de: ${programa}.`
                : 'Asigna primero uno o más programas a la hoja.'}
            </p>
          ) : visibles.length === 0 ? (
            <p className="py-6 text-center text-sm text-white/40">
              Sin coincidencias.
            </p>
          ) : (
            visibles.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => onAgregar(c.id)}
                className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-white hover:bg-white/5"
              >
                <span className="min-w-0 truncate">{c.title}</span>
                <Plus className="size-4 shrink-0 text-[#22C4D3]" />
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

interface OpcionesFiltro {
  programas: string[];
  columnasDisponibles: { clave: string; label: string; tipo?: 'fecha' }[];
  valores: Record<string, string[]>;
}
interface EstudianteFiltro {
  id: string;
  name: string | null;
  email: string;
  identificacionNumero: string | null;
}

function ModalAgregar({
  grupoId,
  onCerrar,
  onAgregado,
}: {
  grupoId: string;
  onCerrar: () => void;
  onAgregado: () => void;
}) {
  const [modo, setModo] = useState<'buscar' | 'filtros'>('buscar');

  // ── Modo buscar (por nombre/correo/documento) ──────────────────────────
  const [q, setQ] = useState('');
  const [resultados, setResultados] = useState<EstudianteFiltro[]>([]);
  const [buscando, setBuscando] = useState(false);

  useEffect(() => {
    if (modo !== 'buscar' || q.trim().length < 2) {
      setResultados([]);
      return;
    }
    const t = setTimeout(() => {
      setBuscando(true);
      void fetch(
        `/api/super-admin/grupos/${grupoId}/miembros?q=${encodeURIComponent(q.trim())}`
      )
        .then((r) => (r.ok ? r.json() : null))
        .then((d: { estudiantes: EstudianteFiltro[] } | null) =>
          setResultados(d?.estudiantes ?? [])
        )
        .catch(() => undefined)
        .finally(() => setBuscando(false));
    }, 350);
    return () => clearTimeout(t);
  }, [q, grupoId, modo]);

  const agregar = async (userId: string) => {
    await fetch(`/api/super-admin/grupos/${grupoId}/miembros`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    onAgregado();
    setResultados((prev) => prev.filter((r) => r.id !== userId));
  };

  // ── Modo filtros (mismos filtros que al crear el grupo) ────────────────
  const [opciones, setOpciones] = useState<OpcionesFiltro | null>(null);
  const [programa, setPrograma] = useState('');
  const [columna, setColumna] = useState('');
  const [valor, setValor] = useState('');
  const [preview, setPreview] = useState<EstudianteFiltro[]>([]);
  const [seleccion, setSeleccion] = useState<Set<string>>(new Set());
  const [cargandoPrev, setCargandoPrev] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (modo !== 'filtros' || opciones) return;
    void fetch('/api/super-admin/grupos/opciones')
      .then((r) => (r.ok ? r.json() : null))
      .then((d: OpcionesFiltro | null) => d && setOpciones(d))
      .catch(() => undefined);
  }, [modo, opciones]);

  const buscarPorFiltros = async () => {
    setCargandoPrev(true);
    setErr(null);
    try {
      const res = await fetch('/api/super-admin/grupos/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          programa: programa || null,
          columna: columna || null,
          valor: valor || null,
        }),
      });
      if (!res.ok) throw new Error('No se pudo buscar');
      const json = (await res.json()) as { estudiantes: EstudianteFiltro[] };
      setPreview(json.estudiantes ?? []);
      setSeleccion(new Set((json.estudiantes ?? []).map((e) => e.id)));
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Error');
    } finally {
      setCargandoPrev(false);
    }
  };

  const toggle = (id: string) => {
    setSeleccion((prev) => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id);
      else s.add(id);
      return s;
    });
  };

  const agregarLote = async () => {
    if (seleccion.size === 0) return;
    setGuardando(true);
    setErr(null);
    try {
      const res = await fetch(`/api/super-admin/grupos/${grupoId}/miembros`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds: [...seleccion] }),
      });
      if (!res.ok) throw new Error('No se pudieron agregar');
      onAgregado();
      onCerrar();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Error');
    } finally {
      setGuardando(false);
    }
  };

  const valoresCol =
    columna && opciones ? (opciones.valores[columna] ?? []) : [];
  const colEsFecha =
    opciones?.columnasDisponibles.find((c) => c.clave === columna)?.tipo ===
    'fecha';

  const anchoModal = modo === 'filtros' ? 'max-w-2xl' : 'max-w-md';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onCerrar}
    >
      <div
        className={`flex max-h-[90vh] w-full ${anchoModal} flex-col overflow-hidden rounded-2xl border border-[#22C4D3]/30 bg-[#061c37] shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
          <h2 className="text-lg font-bold text-[#22C4D3]">
            Agregar estudiante
          </h2>
          <button
            type="button"
            onClick={onCerrar}
            className="text-white/50 hover:text-white"
            aria-label="Cerrar"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Selector de modo */}
        <div className="flex gap-1 border-b border-white/10 px-5 pt-3">
          <button
            type="button"
            onClick={() => setModo('buscar')}
            className={`inline-flex items-center gap-1.5 rounded-t-lg px-3 py-2 text-sm font-medium transition-colors ${
              modo === 'buscar'
                ? 'bg-white/[0.06] text-[#22C4D3]'
                : 'text-white/50 hover:text-white'
            }`}
          >
            <Search className="size-4" /> Por nombre
          </button>
          <button
            type="button"
            onClick={() => setModo('filtros')}
            className={`inline-flex items-center gap-1.5 rounded-t-lg px-3 py-2 text-sm font-medium transition-colors ${
              modo === 'filtros'
                ? 'bg-white/[0.06] text-[#22C4D3]'
                : 'text-white/50 hover:text-white'
            }`}
          >
            <Filter className="size-4" /> Por filtros
          </button>
        </div>

        {modo === 'buscar' ? (
          <div className="p-5">
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por nombre, correo o documento…"
              className="w-full rounded-xl border border-white/10 bg-[#0b1a2f] px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-[#22C4D3]/60 focus:outline-none"
            />
            <div className="mt-3 max-h-64 overflow-y-auto">
              {buscando && (
                <p className="py-4 text-center text-sm text-white/40">
                  Buscando…
                </p>
              )}
              {!buscando &&
                resultados.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => void agregar(r.id)}
                    className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-white/5"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-white">
                        {r.name ?? r.email}
                      </span>
                      <span className="block truncate text-xs text-white/40">
                        {r.identificacionNumero ?? r.email}
                      </span>
                    </span>
                    <GraduationCap className="size-4 shrink-0 text-[#22C4D3]" />
                  </button>
                ))}
              {!buscando && q.trim().length >= 2 && resultados.length === 0 && (
                <p className="py-4 text-center text-sm text-white/40">
                  Sin resultados.
                </p>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-4 overflow-y-auto p-5">
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs text-white/50">
                    Programa
                  </label>
                  <select
                    value={programa}
                    onChange={(e) => setPrograma(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#0b1a2f] px-3 py-2.5 text-sm text-white focus:border-[#22C4D3]/60 focus:outline-none [&>option]:bg-[#061c37]"
                  >
                    <option value="">Todos</option>
                    {opciones?.programas.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-white/50">
                    Columna
                  </label>
                  <select
                    value={columna}
                    onChange={(e) => {
                      setColumna(e.target.value);
                      setValor('');
                    }}
                    className="w-full rounded-xl border border-white/10 bg-[#0b1a2f] px-3 py-2.5 text-sm text-white focus:border-[#22C4D3]/60 focus:outline-none [&>option]:bg-[#061c37]"
                  >
                    <option value="">Sin filtro extra</option>
                    {opciones?.columnasDisponibles.map((c) => (
                      <option key={c.clave} value={c.clave}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-white/50">
                    Valor
                  </label>
                  <select
                    value={valor}
                    onChange={(e) => setValor(e.target.value)}
                    disabled={!columna}
                    className="w-full rounded-xl border border-white/10 bg-[#0b1a2f] px-3 py-2.5 text-sm text-white focus:border-[#22C4D3]/60 focus:outline-none disabled:opacity-40 [&>option]:bg-[#061c37]"
                  >
                    <option value="">Selecciona…</option>
                    {valoresCol.map((v) => (
                      <option key={v} value={v}>
                        {colEsFecha ? formatFechaLarga(v) : v}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="button"
                onClick={() => void buscarPorFiltros()}
                disabled={cargandoPrev}
                className="inline-flex items-center gap-2 rounded-xl border border-[#22C4D3]/40 bg-[#22C4D3]/10 px-4 py-2 text-sm font-semibold text-[#22C4D3] hover:bg-[#22C4D3]/20 disabled:opacity-50"
              >
                {cargandoPrev ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Search className="size-4" />
                )}
                Buscar estudiantes
              </button>

              {err && <p className="text-sm text-red-400">{err}</p>}

              {preview.length > 0 && (
                <div className="rounded-xl border border-white/10">
                  <div className="flex items-center justify-between border-b border-white/10 px-3 py-2 text-xs text-white/60">
                    <span>
                      {seleccion.size} de {preview.length} seleccionados
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setSeleccion(
                          seleccion.size === preview.length
                            ? new Set()
                            : new Set(preview.map((e) => e.id))
                        )
                      }
                      className="text-[#22C4D3] hover:underline"
                    >
                      {seleccion.size === preview.length
                        ? 'Quitar todos'
                        : 'Seleccionar todos'}
                    </button>
                  </div>
                  <div className="max-h-56 overflow-y-auto">
                    {preview.map((e) => (
                      <label
                        key={e.id}
                        className="flex cursor-pointer items-center gap-3 border-b border-white/5 px-3 py-2 text-sm last:border-b-0 hover:bg-white/5"
                      >
                        <input
                          type="checkbox"
                          checked={seleccion.has(e.id)}
                          onChange={() => toggle(e.id)}
                          className="size-4 accent-[#22C4D3]"
                        />
                        <span className="min-w-0 flex-1 truncate text-white">
                          {e.name ?? e.email}
                        </span>
                        <span className="shrink-0 text-xs text-white/40">
                          {e.identificacionNumero ?? ''}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t border-white/10 px-5 py-3">
              <button
                type="button"
                onClick={onCerrar}
                className="rounded-xl border border-white/15 px-4 py-2 text-sm text-white/70 hover:bg-white/5"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void agregarLote()}
                disabled={guardando || seleccion.size === 0}
                className="inline-flex items-center gap-2 rounded-xl bg-[#22C4D3] px-4 py-2 text-sm font-semibold text-[#04101f] hover:bg-[#3ad4e2] disabled:opacity-50"
              >
                {guardando ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <UserPlus className="size-4" />
                )}
                Agregar ({seleccion.size})
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
