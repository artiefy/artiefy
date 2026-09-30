'use client';

import { use, useCallback, useEffect, useState } from 'react';

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
}
interface Hoja {
  id: number;
  nombre: string;
  parentId: number | null;
  programa: string | null;
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

function CampoInfo({ label, valor }: { label: string; valor: string | null }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="w-24 shrink-0 text-[11px] font-semibold tracking-wide text-slate-400 uppercase">
        {label}
      </span>
      <span className="min-w-0 flex-1 px-1 py-0.5 text-sm text-white/80">
        {valor?.trim() ?? ''}
      </span>
    </div>
  );
}

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
        className="min-w-0 flex-1 border-b border-transparent bg-transparent px-1 py-0.5 text-sm text-white placeholder:text-white/25 hover:border-white/15 focus:border-[#22C4D3] focus:outline-none"
      />
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
  // La hoja activa se maneja por estado (no por ruta) para que cambiar/crear
  // hojas sea inmediato: solo se hace un fetch, sin navegación de Next.
  const [activeId, setActiveId] = useState<number>(Number(id));
  const [data, setData] = useState<GrupoDetalle | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nuevaHojaAbierta, setNuevaHojaAbierta] = useState(false);
  // Cartera abierta (id del estudiante): se muestra la MISMA ventana de
  // cartera de Estudiantes, embebida en un iframe sobre la planilla.
  const [carteraDe, setCarteraDe] = useState<string | null>(null);
  // El iframe queda invisible hasta que la cartera avisa que ya abrió.
  const [carteraLista, setCarteraLista] = useState(false);
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

  // Autocompletar por correo: busca usuarios existentes mientras escribes.
  useEffect(() => {
    const q = draft?.email?.trim() ?? '';
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
  }, [draft, activeId]);

  // Trae TODA la familia (raíz + hojas). Cambiar de pestaña NO refetch: se lee
  // de lo ya cargado, por eso es instantáneo.
  const cargar = useCallback(async (fetchId: number) => {
    try {
      const res = await fetch(`/api/super-admin/grupos/${fetchId}`, {
        cache: 'no-store',
      });
      if (!res.ok) throw new Error('No se pudo cargar el grupo');
      setData((await res.json()) as GrupoDetalle);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargar(Number(id));
  }, [cargar, id]);

  // Actualiza una hoja de la familia en memoria (optimista).
  const patchHoja = (hojaId: number, updater: (h: Hoja) => Hoja) =>
    setData((prev) =>
      prev
        ? {
            ...prev,
            hojas: prev.hojas.map((h) => (h.id === hojaId ? updater(h) : h)),
          }
        : prev
    );

  // Crea una hoja idéntica (mismo curso y fechas, sin estudiantes) y la abre.
  useEffect(() => {
    if (!carteraDe) return;
    const alMensaje = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      const data = e.data as { type?: string; error?: string } | null;
      if (data?.type === 'cartera-abierta') {
        setCarteraLista(true);
        return;
      }
      if (data?.type !== 'cartera-cerrada') return;
      setCarteraDe(null);
      setCarteraLista(false);
      if (data.error) setAvisoFila(data.error);
      // El estado de cartera pudo cambiar: recarga la planilla.
      void cargar(activeId);
    };
    window.addEventListener('message', alMensaje);
    return () => window.removeEventListener('message', alMensaje);
  }, [carteraDe, cargar, activeId]);

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
      await cargar(activeId);
    } else {
      setAvisoFila('No se pudo agregar el curso');
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
      setConfirmarEliminar(false);
      if (parentId) {
        // Era una hoja hija: vuelve a la raíz.
        await cargar(parentId);
        setActiveId(parentId);
      } else {
        // Era la raíz: se borró toda la familia, vuelve a la lista.
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
    await cargar(activeId);
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
      await cargar(activeId);
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

  // Cambiar el programa de la hoja matricula a sus estudiantes en ese programa.
  const asignarPrograma = async (programa: string) => {
    if (!programa) return;
    patchHoja(activeId, (h) => ({
      ...h,
      programa,
      miembros: h.miembros.map((m) => ({ ...m, programa })),
    }));
    await fetch(`/api/super-admin/grupos/${activeId}/programa`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ programa }),
    });
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
      await cargar(activeId);
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
        <div><b>PROGRAMA:</b> ${g.programa ?? ''}</div>
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

  const { hojas, rootNombre, programas } = data;
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
                  <div className="grid grid-cols-2 grid-rows-3 gap-x-4 pr-4 pb-2">
                    <div className="border-b border-white/10 py-3">
                      <CampoInfo
                        label="Espacio"
                        valor={cursoHoja?.espacio ?? null}
                      />
                    </div>
                    <div className="border-b border-white/10 py-3">
                      <CampoCabecera
                        label="Empresa"
                        valor={grupo.empresa}
                        onSave={(v) => void guardarEmpresa(v)}
                      />
                    </div>
                    <div className="border-b border-white/10 py-3">
                      <div className="flex items-baseline gap-2">
                        <span className="w-24 shrink-0 text-[11px] font-semibold tracking-wide text-slate-400 uppercase">
                          Programa
                        </span>
                        <select
                          value={programaSel}
                          onChange={(e) => void asignarPrograma(e.target.value)}
                          className="min-w-0 flex-1 border-b border-white/15 bg-transparent px-1 py-0.5 text-sm text-white focus:border-[#22C4D3] focus:outline-none [&>option]:bg-[#061c37]"
                          title="Al cambiarlo, se matriculan los estudiantes de la hoja en ese programa"
                        >
                          <option value="">— Seleccionar programa —</option>
                          {programas.map((p) => (
                            <option key={p} value={p}>
                              {p}
                            </option>
                          ))}
                          {programaSel && !programas.includes(programaSel) && (
                            <option value={programaSel}>{programaSel}</option>
                          )}
                        </select>
                      </div>
                    </div>
                    <div className="border-b border-white/10 py-3">
                      <CampoInfo
                        label="Educador"
                        valor={cursoHoja?.educador ?? null}
                      />
                    </div>
                    <div className="border-b border-white/10 py-3">
                      <CampoInfo
                        label="Horario"
                        valor={cursoHoja?.horario ?? null}
                      />
                    </div>
                    <div className="border-b border-white/10 py-3">
                      <div className="flex items-baseline gap-2">
                        <span className="w-24 shrink-0 text-[11px] font-semibold tracking-wide text-slate-400 uppercase">
                          Curso
                        </span>
                        <button
                          type="button"
                          onClick={() => setCursoModal(true)}
                          className="min-w-0 flex-1 px-1 py-0.5 text-left text-sm hover:underline"
                        >
                          {cursoHoja ? (
                            <span className="text-white/80">
                              {cursoHoja.curso}
                            </span>
                          ) : (
                            <span className="font-medium text-[#22C4D3]">
                              Agregar curso
                            </span>
                          )}
                        </button>
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
                    <td className="border border-white/10 px-3 py-1.5 whitespace-nowrap text-white/70">
                      {m.identificacionNumero}
                    </td>
                    <td className="sticky left-0 z-10 border border-white/10 bg-[#0a1a30] px-3 py-1.5 text-white">
                      {nombres || (m.name ?? m.email)}
                    </td>
                    <td className="border border-white/10 px-3 py-1.5 text-white/70">
                      {apellidos}
                    </td>
                    <td className="border border-white/10 px-3 py-1.5 whitespace-nowrap text-white/60">
                      {m.email}
                    </td>
                    <td className="border border-white/10 px-3 py-1.5 whitespace-nowrap text-white/60">
                      {m.phone}
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
                        onClick={() => {
                          setCarteraLista(false);
                          setCarteraDe(m.id);
                        }}
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
                      value={draft.identificacion}
                      onChange={(e) =>
                        setDraft({ ...draft, identificacion: e.target.value })
                      }
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
                  <td className="relative border border-white/10 p-1">
                    <input
                      type="email"
                      value={draft.email}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          email: e.target.value,
                          existingId: '',
                        })
                      }
                      placeholder="correo@ejemplo.com *"
                      className="w-full min-w-[160px] rounded bg-transparent px-1 py-0.5 text-xs text-white placeholder:text-white/30 focus:outline-none"
                    />
                    {draft.existingId && (
                      <span className="mt-0.5 block text-[10px] text-emerald-300">
                        ✓ usuario existente
                      </span>
                    )}
                    {!draft.existingId && sugerencias.length > 0 && (
                      <div className="absolute top-full left-1 z-50 mt-1 max-h-56 w-72 overflow-y-auto rounded-lg border border-[#22C4D3]/40 bg-[#061c37] shadow-2xl">
                        {sugerencias.map((s) => {
                          const { nombres, apellidos } = splitNombre(s.name);
                          return (
                            <button
                              key={s.id}
                              type="button"
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

      {/* Pestañas de hojas (sub-grupos) dentro del grupo */}
      <div className="sticky bottom-0 z-30 mt-auto border-t border-white/10 bg-[#04101f]/95 backdrop-blur">
        {/* pr-32 deja libre el botón flotante del asistente (fixed bottom-right) */}
        <div className="flex items-center gap-2 py-2 pr-32 pl-3">
          <button
            type="button"
            onClick={() => setNuevaHojaAbierta(true)}
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
                <button
                  key={h.id}
                  type="button"
                  onClick={() => {
                    if (activa) setRenombrando(true);
                    else setActiveId(h.id);
                  }}
                  title={activa ? 'Clic para renombrar' : h.nombre}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm whitespace-nowrap transition-colors ${
                    activa
                      ? 'bg-[#22C4D3]/15 font-semibold text-[#22C4D3]'
                      : 'text-white/60 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <FileText className="size-4" />
                  {h.nombre}
                  {activa && <Pencil className="size-3 opacity-50" />}
                </button>
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

      {carteraDe &&
        createPortal(
          <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm">
            {!carteraLista && (
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
              title="Cartera del estudiante"
              src={`/dashboard/super-admin/programs/enrolled_users?cartera=${encodeURIComponent(carteraDe)}&embed=1`}
              className={`absolute inset-0 size-full border-0 transition-all duration-200 ${
                carteraLista
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
            void cargar(nuevaId).then(() => setActiveId(nuevaId));
          }}
        />
      )}

      {cursoModal && (
        <ModalAgregarCurso
          programa={programaSel}
          cursos={
            programaSel
              ? data.cursosDisponibles.filter((c) =>
                  c.programas.includes(programaSel)
                )
              : []
          }
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
        className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-[#22C4D3]/30 bg-[#061c37] shadow-2xl"
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

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
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
              <div className="max-h-60 overflow-y-auto rounded-xl border border-white/10">
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
        <div className="max-h-[60vh] overflow-y-auto p-3">
          {cursos.length === 0 ? (
            <p className="py-6 text-center text-sm text-white/40">
              {programa
                ? `No hay cursos del programa ${programa}.`
                : 'Selecciona primero el programa de la hoja.'}
            </p>
          ) : (
            cursos.map((c) => (
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
