'use client';

import { useState } from 'react';

import {
  CheckCircle,
  Edit,
  Eye,
  GraduationCap,
  Loader2,
  Mail,
  Paperclip,
  Trash2,
  UserPlus,
  X,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import useSWR from 'swr';

import { type UsuarioDetalle } from '~/server/academy/usuarios-detalle';

import { enviar, useCursosAcademia, useDatosAcademia } from './seccion/comun';

// "Administrador de usuarios" de una academia: la misma pantalla que el de
// Artiefy (/dashboard/super-admin): acciones masivas, filtros por rol y
// estado, tabla con rol editable, ver / editar / eliminar, paginación y los
// modales de crear, detalles, editar, correo y asignar a curso o
// programa, con los colores de la marca de la academia.

type Rol = UsuarioDetalle['role'];

const ROLES: { valor: Rol; texto: string }[] = [
  { valor: 'estudiante', texto: 'Estudiante' },
  { valor: 'educador', texto: 'Educador' },
  { valor: 'super-admin', texto: 'Super Admin' },
];

const nombreDe = (u: UsuarioDetalle) => u.name?.trim() || u.email;
const partes = (u: UsuarioDetalle) => {
  const [first = '', ...rest] = (u.name ?? '').trim().split(/\s+/);
  return { first, last: rest.join(' ') };
};
const iniciales = (u: UsuarioDetalle) => {
  const { first, last } = partes(u);
  return `${first[0] ?? u.email[0] ?? '?'}${last[0] ?? ''}`.toUpperCase();
};
const fmtFecha = (iso: string) =>
  new Date(iso).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

// Botón de la barra (mismo estilo que Artiefy: borde, brillo al pasar).
function BotonAccion({
  texto,
  icono,
  onClick,
  disabled,
  tono,
}: {
  texto: React.ReactNode;
  icono: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  tono: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`group/button relative inline-flex items-center justify-center gap-1 overflow-hidden rounded-md border px-2 py-1.5 text-xs transition-all sm:gap-2 sm:px-4 sm:py-2 sm:text-sm [&_svg]:relative [&_svg]:z-10 [&_svg]:size-3.5 sm:[&_svg]:size-4 ${
        disabled ? 'cursor-not-allowed border-white/15 text-white/40' : tono
      }`}
    >
      <span className="relative z-10 font-medium">{texto}</span>
      {icono}
      <div className="absolute inset-0 z-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 transition-all duration-500 group-hover/button:[transform:translateX(100%)] group-hover/button:opacity-100" />
    </button>
  );
}

const tonoPrimario =
  'border-white/20 bg-[var(--ac-fondo)] text-[var(--ac-primario)] hover:bg-[var(--ac-primario)]/10';
const tonoVerde =
  'border-green-500/20 bg-green-500/10 text-green-500 hover:bg-green-500/20';
const tonoRojo =
  'border-red-500/20 bg-red-500/10 text-red-500 hover:bg-red-500/20';
const tonoAmarillo =
  'border-yellow-500/20 bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20';
const tonoAzul =
  'border-blue-500/20 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20';

const tarjetaFiltro =
  'rounded-lg bg-[var(--ac-superficie)]/60 p-4 shadow-lg backdrop-blur-sm';
const campoFiltro =
  'w-full rounded-md border border-[var(--ac-borde)] bg-[var(--ac-fondo)]/60 px-4 py-2 text-white placeholder:text-white/40 [&>option]:bg-[var(--ac-fondo)]';
const campoModal =
  'w-full rounded-lg border border-[var(--ac-borde)] bg-[var(--ac-fondo)] px-4 py-2.5 text-white placeholder:text-white/40 focus:border-[var(--ac-primario)] focus:ring-2 focus:ring-[var(--ac-primario)]/20 focus:outline-none [&>option]:bg-[var(--ac-fondo)]';
const etiquetaModal = 'mb-2 block text-sm font-medium text-white/70';

export function UsuariosAcademia({
  slug,
  yoUserId,
}: {
  slug: string;
  yoUserId: string;
}) {
  const api = `/api/academia/${slug}/usuarios`;
  const apiDetalle = `${api}/detalle`;
  const { data, mutate, isLoading } = useSWR(
    [apiDetalle, 'admin-usuarios'],
    async ([url]: [string, string]) => {
      const res = await fetch(url);
      const j = (await res.json().catch(() => ({}))) as {
        usuarios?: UsuarioDetalle[];
        roles?: { id: number; nombre: string }[];
        error?: string;
      };
      if (!res.ok) throw new Error(j.error ?? 'No se pudo cargar');
      return { usuarios: j.usuarios ?? [], roles: j.roles ?? [] };
    }
  );
  const usuarios = data?.usuarios ?? [];

  const [busqueda, setBusqueda] = useState('');
  const [filtroRol, setFiltroRol] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [porPagina, setPorPagina] = useState(10);
  const [pagina, setPagina] = useState(1);
  const [seleccion, setSeleccion] = useState<string[]>([]);
  const [ocupado, setOcupado] = useState(false);
  const [modal, setModal] = useState<'crear' | 'correo' | 'asignar' | null>(
    null
  );
  const [viendo, setViendo] = useState<UsuarioDetalle | null>(null);
  const [editando, setEditando] = useState<UsuarioDetalle | null>(null);
  const [confirmacion, setConfirmacion] = useState<{
    titulo: string;
    mensaje: string;
    accion: () => Promise<void>;
  } | null>(null);

  const q = busqueda.trim().toLowerCase();
  const filtrados = usuarios.filter(
    (u) =>
      (!q ||
        nombreDe(u).toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)) &&
      (!filtroRol || u.role === filtroRol) &&
      (!filtroEstado || (filtroEstado === 'activo' ? u.activo : !u.activo))
  );
  const tam = porPagina === -1 ? Math.max(filtrados.length, 1) : porPagina;
  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / tam));
  const paginaActual = Math.min(pagina, totalPaginas);
  const actuales = filtrados.slice(
    (paginaActual - 1) * tam,
    paginaActual * tam
  );
  const seleccionados = usuarios.filter((u) => seleccion.includes(u.userId));
  const sinSeleccion = seleccion.length === 0;

  // Corre `fn` para cada seleccionado; cuenta los que fallan.
  const enLote = async (
    fn: (u: UsuarioDetalle) => Promise<unknown>,
    exito: string
  ) => {
    setOcupado(true);
    let fallos = 0;
    let ultimoError = '';
    for (const u of seleccionados) {
      try {
        await fn(u);
      } catch (error) {
        fallos++;
        ultimoError = (error as Error).message;
      }
    }
    setOcupado(false);
    if (fallos) toast.error(`${fallos} no se pudieron: ${ultimoError}`);
    if (fallos < seleccionados.length) toast.success(exito);
    setSeleccion([]);
    await mutate();
  };

  const cambiarEstado = async (activo: boolean) => {
    setOcupado(true);
    try {
      await enviar(api, 'PATCH', { userIds: seleccion, activo });
      toast.success(activo ? 'Usuarios activados' : 'Usuarios desactivados');
      setSeleccion([]);
      await mutate();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setOcupado(false);
    }
  };

  const cambiarRol = async (u: UsuarioDetalle, rol: Rol) => {
    void mutate(
      (prev) =>
        prev && {
          ...prev,
          usuarios: prev.usuarios.map((x) =>
            x.userId === u.userId ? { ...x, role: rol } : x
          ),
        },
      { revalidate: false }
    );
    try {
      await enviar(api, 'PATCH', { userId: u.userId, rol });
      toast.success('Rol actualizado');
    } catch (error) {
      toast.error((error as Error).message);
      await mutate();
    }
  };

  const eliminar = (u: UsuarioDetalle) =>
    setConfirmacion({
      titulo: 'Eliminar Usuario',
      mensaje: `¿Estás seguro de que quieres eliminar a ${nombreDe(u)} de la academia? Esta acción no se puede deshacer.`,
      accion: async () => {
        await enviar(`${api}?userId=${encodeURIComponent(u.userId)}`, 'DELETE');
        toast.success('Usuario eliminado');
        await mutate();
      },
    });

  return (
    <>
      <div className="p-4 sm:p-6">
        {/* Header con efecto degradado */}
        <header className="group relative overflow-hidden rounded-lg p-[1px]">
          <div className="absolute -inset-0.5 animate-gradient bg-gradient-to-r from-[var(--ac-primario)] via-[var(--ac-primario)]/60 to-[var(--ac-fondo)] opacity-75 blur transition duration-500" />
          <div className="relative flex flex-col items-start justify-between rounded-lg bg-[var(--ac-superficie)] p-4 text-white shadow-lg transition-all duration-300 sm:flex-row sm:items-center sm:p-6">
            <h1 className="flex items-center gap-3 text-xl font-extrabold tracking-tight text-[var(--ac-primario)] sm:text-2xl lg:text-3xl">
              Administrador de usuarios
            </h1>
          </div>
        </header>
        <br />

        {/* Botones de acción */}
        <div className="mb-6 flex flex-wrap gap-2">
          <BotonAccion
            texto="Crear Usuario"
            icono={<UserPlus />}
            onClick={() => setModal('crear')}
            tono={tonoPrimario}
          />
          <BotonAccion
            texto="Activar"
            icono={<CheckCircle />}
            onClick={() => void cambiarEstado(true)}
            disabled={sinSeleccion || ocupado}
            tono={tonoVerde}
          />
          <BotonAccion
            texto="Desactivar"
            icono={<XCircle />}
            onClick={() => void cambiarEstado(false)}
            disabled={sinSeleccion || ocupado}
            tono={tonoRojo}
          />
          <BotonAccion
            texto="Quitar Rol"
            icono={<XCircle />}
            onClick={() =>
              setConfirmacion({
                titulo: 'Eliminar Roles',
                mensaje:
                  '¿Estás seguro de que quieres eliminar el rol de los usuarios seleccionados? Quedarán como estudiantes.',
                accion: () =>
                  enLote(
                    (u) =>
                      enviar(api, 'PATCH', {
                        userId: u.userId,
                        rol: 'estudiante',
                      }),
                    'Roles eliminados con éxito.'
                  ),
              })
            }
            disabled={sinSeleccion || ocupado}
            tono={tonoAmarillo}
          />
          <BotonAccion
            texto="Eliminar Seleccionados"
            icono={<Trash2 />}
            onClick={() =>
              setConfirmacion({
                titulo: 'Eliminar Usuarios',
                mensaje: `¿Estás seguro de que quieres eliminar ${seleccion.length} usuario(s) de la academia? Esta acción no se puede deshacer.`,
                accion: () =>
                  enLote(
                    (u) =>
                      enviar(
                        `${api}?userId=${encodeURIComponent(u.userId)}`,
                        'DELETE'
                      ),
                    'Usuarios eliminados.'
                  ),
              })
            }
            disabled={sinSeleccion || ocupado}
            tono={tonoRojo}
          />
          <BotonAccion
            texto={
              ocupado ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" /> Enviando...
                </span>
              ) : (
                'Reenviar Credenciales'
              )
            }
            icono={<Mail />}
            onClick={() =>
              void enLote(
                (u) => enviar(api, 'PUT', { userId: u.userId }),
                'Credenciales reenviadas.'
              )
            }
            disabled={sinSeleccion || ocupado}
            tono={tonoAzul}
          />
          <BotonAccion
            texto="Asignar a Curso o Programa"
            icono={<UserPlus />}
            onClick={() => setModal('asignar')}
            disabled={sinSeleccion}
            tono={tonoPrimario}
          />
          <BotonAccion
            texto="Enviar Correo"
            icono={<Paperclip />}
            onClick={() => setModal('correo')}
            tono={tonoPrimario}
          />
        </div>

        <div className="mt-6">
          {/* Búsqueda y filtros */}
          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className={tarjetaFiltro}>
              <input
                type="text"
                placeholder="Buscar por nombre o correo..."
                value={busqueda}
                onChange={(e) => {
                  setBusqueda(e.target.value);
                  setPagina(1);
                }}
                className={campoFiltro}
              />
            </div>
            <div className={tarjetaFiltro}>
              <select
                value={filtroRol}
                onChange={(e) => {
                  setFiltroRol(e.target.value);
                  setPagina(1);
                }}
                className={campoFiltro}
              >
                <option value="">Todos los Roles</option>
                <option value="super-admin">super-admin</option>
                <option value="educador">Educador</option>
                <option value="estudiante">Estudiante</option>
              </select>
            </div>
            <div className={tarjetaFiltro}>
              <select
                value={filtroEstado}
                onChange={(e) => {
                  setFiltroEstado(e.target.value);
                  setPagina(1);
                }}
                className={campoFiltro}
              >
                <option value="">Todos los Estados</option>
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </select>
            </div>
          </div>

          {/* Tabla */}
          <div className="mt-6 overflow-hidden rounded-lg bg-[var(--ac-superficie)]/60 shadow-xl backdrop-blur-sm">
            <div className="overflow-x-auto">
              <div className="mb-4 flex items-center gap-2 p-2 text-sm text-white">
                <span>Mostrar:</span>
                <select
                  value={porPagina}
                  onChange={(e) => {
                    setPorPagina(parseInt(e.target.value, 10));
                    setPagina(1);
                  }}
                  className="rounded bg-[var(--ac-fondo)] px-2 py-1 text-sm text-white"
                >
                  <option value={10}>10</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={-1}>Todos</option>
                </select>
                <span>usuarios</span>
              </div>
              <table className="min-w-full table-auto border-collapse overflow-hidden rounded-xl border border-[var(--ac-borde)] bg-[var(--ac-fondo)]">
                <thead>
                  <tr className="border-b border-[var(--ac-primario)] bg-[var(--ac-superficie)]">
                    <th className="w-10 p-3 text-center sm:px-4">
                      <input
                        type="checkbox"
                        aria-label="Seleccionar todos"
                        checked={
                          filtrados.length > 0 &&
                          seleccion.length === filtrados.length
                        }
                        onChange={(e) =>
                          setSeleccion(
                            e.target.checked
                              ? filtrados.map((u) => u.userId)
                              : []
                          )
                        }
                        className="rounded border-white/20 accent-[var(--ac-primario)]"
                      />
                    </th>
                    {['Usuario', 'Rol', 'Estado'].map((t) => (
                      <th
                        key={t}
                        className="p-3 text-left text-[10px] font-semibold tracking-[0.12em] text-[var(--ac-primario)] uppercase sm:px-4"
                      >
                        {t}
                      </th>
                    ))}
                    <th className="p-3 text-right text-[10px] font-semibold tracking-[0.12em] text-[var(--ac-primario)] uppercase sm:px-4">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-white/50">
                        <Loader2 className="mx-auto size-6 animate-spin" />
                      </td>
                    </tr>
                  ) : actuales.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-white/50">
                        No hay usuarios que coincidan.
                      </td>
                    </tr>
                  ) : (
                    actuales.map((u) => (
                      <tr
                        key={u.userId}
                        className="border-b border-[var(--ac-borde)] transition-colors last:border-0 hover:bg-white/[0.04]"
                      >
                        <td className="p-3 text-center sm:p-4">
                          <input
                            type="checkbox"
                            aria-label={`Seleccionar ${nombreDe(u)}`}
                            checked={seleccion.includes(u.userId)}
                            onChange={() =>
                              setSeleccion((s) =>
                                s.includes(u.userId)
                                  ? s.filter((id) => id !== u.userId)
                                  : [...s, u.userId]
                              )
                            }
                            className="rounded border-white/20 accent-[var(--ac-primario)]"
                          />
                        </td>
                        <td className="p-3 sm:p-4">
                          <div className="flex items-center gap-3">
                            <div className="flex size-8 shrink-0 items-center justify-center rounded-md border border-[var(--ac-primario)]/20 bg-[var(--ac-primario)]/10 text-[11px] font-semibold text-[var(--ac-primario)] sm:size-9">
                              {iniciales(u)}
                            </div>
                            <div>
                              <div className="text-xs font-medium text-white sm:text-sm">
                                {nombreDe(u)}
                              </div>
                              <div className="text-[11px] text-white/50">
                                {u.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 sm:p-4">
                          <select
                            value={u.role}
                            disabled={u.userId === yoUserId}
                            onChange={(e) =>
                              void cambiarRol(u, e.target.value as Rol)
                            }
                            className="rounded-md border border-[var(--ac-borde)] bg-[var(--ac-fondo)] px-2 py-1.5 text-[11px] text-white/80 transition-colors hover:border-[var(--ac-primario)]/40 focus:outline-none disabled:opacity-60 sm:text-xs [&>option]:bg-[var(--ac-fondo)]"
                          >
                            {ROLES.map((r) => (
                              <option key={r.valor} value={r.valor}>
                                {r.texto}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="p-3 sm:p-4">
                          <EstadoPill activo={u.activo} />
                        </td>
                        <td className="p-3 sm:p-4">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => setViendo(u)}
                              title="Ver detalles"
                              className="rounded-md p-1.5 text-white/40 transition-colors hover:bg-white/10 hover:text-[var(--ac-primario)]"
                            >
                              <Eye className="size-3.5 sm:size-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditando(u)}
                              title="Editar"
                              className="rounded-md p-1.5 text-white/40 transition-colors hover:bg-white/10 hover:text-[var(--ac-primario)]"
                            >
                              <Edit className="size-3.5 sm:size-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => eliminar(u)}
                              disabled={u.userId === yoUserId}
                              title="Eliminar"
                              className="rounded-md p-1.5 text-white/40 transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:opacity-30"
                            >
                              <Trash2 className="size-3.5 sm:size-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Paginación */}
          <div className="mt-6 flex flex-col items-center justify-between gap-4 p-4 sm:flex-row">
            <p className="text-sm text-white/70">
              Mostrando {actuales.length} de {filtrados.length} usuarios
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setPagina(Math.max(paginaActual - 1, 1))}
                disabled={paginaActual === 1}
                className="rounded bg-[var(--ac-superficie)] px-3 py-1 text-sm text-white hover:bg-white/10 disabled:opacity-50"
              >
                Anterior
              </button>
              <select
                value={paginaActual}
                onChange={(e) => setPagina(Number(e.target.value))}
                className="rounded-md bg-[var(--ac-superficie)] px-2 py-1 text-sm text-white [&>option]:bg-[var(--ac-fondo)]"
              >
                {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(
                  (p) => (
                    <option key={p} value={p}>
                      Página {p}
                    </option>
                  )
                )}
              </select>
              <button
                type="button"
                onClick={() =>
                  setPagina(Math.min(paginaActual + 1, totalPaginas))
                }
                disabled={paginaActual === totalPaginas}
                className="rounded bg-[var(--ac-superficie)] px-3 py-1 text-sm text-white hover:bg-white/10 disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
      </div>

      {modal === 'crear' && (
        <CrearUsuarioModal
          api={api}
          apiDetalle={apiDetalle}
          onClose={() => setModal(null)}
          onCreado={async () => {
            setModal(null);
            await mutate();
          }}
        />
      )}
      {viendo && (
        <DetallesModal
          usuario={viendo}
          roles={data?.roles ?? []}
          onClose={() => setViendo(null)}
        />
      )}
      {editando && (
        <EditarModal
          api={api}
          apiDetalle={apiDetalle}
          usuario={editando}
          roles={data?.roles ?? []}
          esYo={editando.userId === yoUserId}
          onClose={() => setEditando(null)}
          onGuardado={async () => {
            setEditando(null);
            await mutate();
          }}
        />
      )}
      {modal === 'correo' && (
        <CorreoModal
          slug={slug}
          destinatarios={seleccionados}
          onClose={() => setModal(null)}
        />
      )}
      {modal === 'asignar' && (
        <AsignarModal
          slug={slug}
          usuarios={seleccionados}
          onClose={() => setModal(null)}
          onListo={async () => {
            setModal(null);
            setSeleccion([]);
            await mutate();
          }}
        />
      )}
      {confirmacion && (
        <Confirmacion {...confirmacion} onClose={() => setConfirmacion(null)} />
      )}
    </>
  );
}

function EstadoPill({ activo }: { activo: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-[10px] font-semibold tracking-[0.08em] uppercase ${
        activo
          ? 'border border-[#00e676]/20 bg-[#0a2a1a] text-[#00e676]'
          : 'border border-[#ff5252]/20 bg-[#2a0a0a] text-[#ff5252]'
      }`}
    >
      <span
        className={`size-1.5 rounded-full ${activo ? 'bg-[#00e676]' : 'bg-[#ff5252]'}`}
      />
      <span className="hidden sm:inline">{activo ? 'activo' : 'inactivo'}</span>
      <span className="sm:hidden">{activo ? 'A' : 'I'}</span>
    </span>
  );
}

// ------------------------------------------------------------- Modales ---

/** Contenedor de modal con cabecera fija (como los de Artiefy). */
function Caja({
  titulo,
  onClose,
  ancho = 'max-w-2xl',
  children,
}: {
  titulo: string;
  onClose: () => void;
  ancho?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={`relative flex max-h-[90vh] w-full ${ancho} flex-col rounded-xl bg-[var(--ac-superficie)] shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[var(--ac-borde)] px-6 py-4">
          <h2 className="text-xl font-bold text-white sm:text-2xl">{titulo}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-lg p-2 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="size-5 sm:size-6" />
          </button>
        </div>
        <div className="overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
}

const botonPrincipal =
  'flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--ac-primario)] px-4 py-3 font-semibold text-[var(--ac-primario-texto)] transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50';

function Confirmacion({
  titulo,
  mensaje,
  accion,
  onClose,
}: {
  titulo: string;
  mensaje: string;
  accion: () => Promise<void>;
  onClose: () => void;
}) {
  const [corriendo, setCorriendo] = useState(false);
  return (
    <Caja titulo={titulo} onClose={onClose} ancho="max-w-md">
      <p className="text-sm text-white/70">{mensaje}</p>
      <div className="mt-6 flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          disabled={corriendo}
          className="rounded-lg border border-white/15 px-4 py-2 text-sm text-white/80 hover:bg-white/5"
        >
          Cancelar
        </button>
        <button
          type="button"
          disabled={corriendo}
          onClick={() => {
            setCorriendo(true);
            void accion()
              .catch((error: Error) => toast.error(error.message))
              .finally(() => {
                setCorriendo(false);
                onClose();
              });
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-50"
        >
          {corriendo && <Loader2 className="size-4 animate-spin" />}
          Confirmar
        </button>
      </div>
    </Caja>
  );
}

/** Guarda datos (teléfono, profesión…) cambiados de una cuenta. */
async function guardarDatos(
  apiDetalle: string,
  userId: string,
  cambios: Record<string, string>
) {
  for (const [campo, valor] of Object.entries(cambios)) {
    await enviar(apiDetalle, 'PATCH', { userIds: [userId], campo, valor });
  }
}

function CrearUsuarioModal({
  api,
  apiDetalle,
  onClose,
  onCreado,
}: {
  api: string;
  apiDetalle: string;
  onClose: () => void;
  onCreado: () => Promise<void>;
}) {
  const [f, setF] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'estudiante' as Rol,
    profesion: '',
    descripcion: '',
  });
  const [creando, setCreando] = useState(false);

  const crear = async () => {
    if (!f.firstName.trim() || !f.lastName.trim() || !f.email.trim()) {
      toast.error('Nombre, apellido y correo son obligatorios');
      return;
    }
    setCreando(true);
    try {
      const r = (await enviar(api, 'POST', {
        nombre: `${f.firstName} ${f.lastName}`.trim(),
        email: f.email,
        rol: f.role,
      })) as { vinculado?: boolean; correoEnviado?: boolean };
      // Datos extra: se guardan sobre la cuenta recién creada.
      const res = await fetch(apiDetalle);
      const j = (await res.json()) as { usuarios?: UsuarioDetalle[] };
      const nuevo = j.usuarios?.find(
        (u) => u.email.toLowerCase() === f.email.trim().toLowerCase()
      );
      if (nuevo) {
        const extra: Record<string, string> = {};
        if (f.phone) extra.telefono = f.phone;
        if (f.role === 'educador' && f.profesion) extra.profesion = f.profesion;
        if (f.role === 'educador' && f.descripcion) {
          extra.descripcion = f.descripcion;
        }
        await guardarDatos(apiDetalle, nuevo.userId, extra);
      }
      toast.success(
        r.vinculado
          ? 'Ya tenía cuenta: se agregó a la academia y se le avisó por correo'
          : r.correoEnviado
            ? 'Usuario creado y credenciales enviadas'
            : 'Usuario creado'
      );
      await onCreado();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setCreando(false);
    }
  };

  return (
    <Caja titulo="Crear Nuevo Usuario" onClose={onClose}>
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={etiquetaModal}>Nombre *</label>
            <input
              placeholder="Ej: Juan"
              value={f.firstName}
              maxLength={30}
              onChange={(e) =>
                setF({
                  ...f,
                  firstName: e.target.value.trim().split(' ')[0] ?? '',
                })
              }
              className={campoModal}
            />
          </div>
          <div>
            <label className={etiquetaModal}>Apellido *</label>
            <input
              placeholder="Ej: Pérez"
              value={f.lastName}
              onChange={(e) => setF({ ...f, lastName: e.target.value })}
              className={campoModal}
            />
          </div>
        </div>
        <div>
          <label className={etiquetaModal}>Correo electrónico *</label>
          <input
            type="email"
            placeholder="ejemplo@correo.com"
            value={f.email}
            onChange={(e) => setF({ ...f, email: e.target.value })}
            className={campoModal}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={etiquetaModal}>Teléfono</label>
            <input
              type="tel"
              placeholder="3001234567"
              value={f.phone}
              maxLength={10}
              onChange={(e) =>
                setF({ ...f, phone: e.target.value.replace(/\D/g, '') })
              }
              className={campoModal}
            />
          </div>
          <div>
            <label className={etiquetaModal}>Rol *</label>
            <select
              value={f.role}
              onChange={(e) => setF({ ...f, role: e.target.value as Rol })}
              className={campoModal}
            >
              {ROLES.map((r) => (
                <option key={r.valor} value={r.valor}>
                  {r.texto}
                </option>
              ))}
            </select>
          </div>
        </div>
        {f.role === 'educador' && (
          <CamposEducador
            profesion={f.profesion}
            descripcion={f.descripcion}
            onChange={(cambio) => setF({ ...f, ...cambio })}
          />
        )}
        <p className="text-xs text-white/50">
          Si el correo ya tiene cuenta (por ejemplo en Artiefy), se agrega con
          esa misma cuenta. Si no, se crea y se le envían sus credenciales.
        </p>
        <button
          type="button"
          onClick={() => void crear()}
          disabled={creando}
          className={botonPrincipal}
        >
          {creando ? (
            <>
              <Loader2 className="size-5 animate-spin" />
              <span>Creando usuario...</span>
            </>
          ) : (
            <>
              <UserPlus className="size-5" />
              <span>Crear Usuario</span>
            </>
          )}
        </button>
      </div>
    </Caja>
  );
}

function CamposEducador({
  profesion,
  descripcion,
  onChange,
}: {
  profesion: string;
  descripcion: string;
  onChange: (c: { profesion?: string; descripcion?: string }) => void;
}) {
  return (
    <div className="space-y-5 rounded-lg border border-[var(--ac-borde)] p-5">
      <div className="flex items-center gap-2 text-sm font-semibold text-[var(--ac-primario)]">
        <GraduationCap className="size-5" />
        Información del Educador
      </div>
      <div>
        <label className={etiquetaModal}>Profesión</label>
        <input
          placeholder="Ej: Profesor de Arte"
          value={profesion}
          onChange={(e) => onChange({ profesion: e.target.value })}
          className={campoModal}
        />
      </div>
      <div>
        <label className={`${etiquetaModal} flex items-center justify-between`}>
          <span>Descripción</span>
          <span className="text-xs text-white/40">
            {descripcion.length}/161
          </span>
        </label>
        <textarea
          placeholder="Breve descripción sobre su experiencia y especialidad..."
          value={descripcion}
          maxLength={161}
          rows={4}
          onChange={(e) => onChange({ descripcion: e.target.value })}
          className={campoModal}
        />
      </div>
    </div>
  );
}

function DetallesModal({
  usuario: u,
  roles,
  onClose,
}: {
  usuario: UsuarioDetalle;
  roles: { id: number; nombre: string }[];
  onClose: () => void;
}) {
  const permisos = roles.filter((r) => u.rolesIds.includes(r.id));
  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80"
      onClick={onClose}
    >
      <div
        className="relative m-4 flex w-full max-w-5xl flex-col rounded-xl bg-[var(--ac-fondo)] p-4 text-white shadow-2xl md:p-8"
        style={{ maxHeight: '90vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-center justify-between border-b border-white/10 pb-4">
          <h2 className="text-2xl font-bold text-[var(--ac-primario)]">
            Detalles del Usuario
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-lg bg-white/5 p-2 hover:bg-white/10"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="grid max-h-[70vh] w-full gap-6 overflow-y-auto md:grid-cols-[320px_1fr]">
          <div className="min-w-0 space-y-6">
            <div className="relative mx-auto flex size-40 max-w-full items-center justify-center overflow-hidden rounded-xl border-2 border-[var(--ac-primario)] bg-[var(--ac-primario)]/10 text-5xl font-bold text-[var(--ac-primario)] shadow-lg sm:size-56">
              {iniciales(u)}
            </div>
            <div className="w-full rounded-lg bg-white/5 p-4">
              <h3 className="mb-4 truncate text-xl font-bold text-white">
                {nombreDe(u)}
              </h3>
              <div className="space-y-3 text-sm">
                <p className="flex items-center gap-2 text-white/70">
                  <span>Email:</span>
                  <span className="truncate font-medium text-white">
                    {u.email}
                  </span>
                </p>
                <p className="flex items-center gap-2 text-white/70">
                  <span>Creado:</span>
                  <span className="font-medium text-white">
                    {fmtFecha(u.createdAt)}
                  </span>
                </p>
                {u.datos.telefono && (
                  <p className="flex items-center gap-2 text-white/70">
                    <span>Teléfono:</span>
                    <span className="font-medium text-white">
                      {u.datos.telefono}
                    </span>
                  </p>
                )}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <EstadoPill activo={u.activo} />
                <span className="rounded-full bg-[var(--ac-primario)]/15 px-3 py-1 text-xs font-medium text-[var(--ac-primario)]">
                  {u.role}
                </span>
              </div>
            </div>
          </div>
          <div className="w-full min-w-0 space-y-6">
            <div>
              <h3 className="mb-4 text-lg font-semibold text-[var(--ac-primario)]">
                Información de la cuenta
              </h3>
              <div className="grid w-full gap-4 rounded-lg bg-white/5 p-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-sm text-white/50">ID del usuario</p>
                  <p className="font-mono text-sm break-all">{u.userId}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-white/50">Tipo de cuenta</p>
                  <p className="text-sm">
                    {u.cuentaPropia
                      ? 'Creada por la academia'
                      : 'Cuenta existente vinculada'}
                  </p>
                </div>
                {u.datos.profesion && (
                  <div className="space-y-2">
                    <p className="text-sm text-white/50">Profesión</p>
                    <p className="text-sm">{u.datos.profesion}</p>
                  </div>
                )}
                {u.datos.descripcion && (
                  <div className="space-y-2 sm:col-span-2">
                    <p className="text-sm text-white/50">Descripción</p>
                    <p className="text-sm">{u.datos.descripcion}</p>
                  </div>
                )}
                {permisos.length > 0 && (
                  <div className="space-y-2 sm:col-span-2">
                    <p className="text-sm text-white/50">Permisos</p>
                    <div className="flex flex-wrap gap-1.5">
                      {permisos.map((p) => (
                        <span
                          key={p.id}
                          className="rounded-full border border-[var(--ac-primario)]/30 px-2 py-0.5 text-xs"
                        >
                          {p.nombre}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div>
              <h3 className="mb-4 text-lg font-semibold text-[var(--ac-primario)]">
                Cursos
              </h3>
              <div className="w-full rounded-lg bg-white/5 p-4">
                {u.cursos.length > 0 ? (
                  <ul className="grid gap-2 sm:grid-cols-2">
                    {u.cursos.map((c) => (
                      <li
                        key={`${c.como}-${c.id}`}
                        className="flex items-center justify-between gap-2 rounded-lg border border-[var(--ac-borde)] px-3 py-2 text-sm"
                      >
                        <span className="truncate">{c.title}</span>
                        <span className="shrink-0 text-[10px] text-white/50 uppercase">
                          {c.como}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-white/50">
                    No está inscrito en ningún curso
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EditarModal({
  api,
  apiDetalle,
  usuario: u,
  roles,
  esYo,
  onClose,
  onGuardado,
}: {
  api: string;
  apiDetalle: string;
  usuario: UsuarioDetalle;
  roles: { id: number; nombre: string }[];
  esYo: boolean;
  onClose: () => void;
  onGuardado: () => Promise<void>;
}) {
  const inicial = partes(u);
  const [f, setF] = useState({
    firstName: inicial.first,
    lastName: inicial.last,
    phone: u.datos.telefono ?? '',
    role: u.role,
    activo: u.activo,
    profesion: u.datos.profesion ?? '',
    descripcion: u.datos.descripcion ?? '',
    rolesIds: u.rolesIds,
  });
  const [guardando, setGuardando] = useState(false);

  const guardar = async () => {
    setGuardando(true);
    try {
      const nombre = `${f.firstName} ${f.lastName}`.trim();
      if (nombre !== (u.name ?? '') || f.role !== u.role) {
        await enviar(api, 'PATCH', {
          userId: u.userId,
          ...(nombre !== (u.name ?? '') ? { nombre } : {}),
          ...(f.role !== u.role ? { rol: f.role } : {}),
        });
      }
      if (f.activo !== u.activo) {
        await enviar(api, 'PATCH', { userIds: [u.userId], activo: f.activo });
      }
      const cambios: Record<string, string> = {};
      if (f.phone !== (u.datos.telefono ?? '')) cambios.telefono = f.phone;
      if (f.profesion !== (u.datos.profesion ?? '')) {
        cambios.profesion = f.profesion;
      }
      if (f.descripcion !== (u.datos.descripcion ?? '')) {
        cambios.descripcion = f.descripcion;
      }
      await guardarDatos(apiDetalle, u.userId, cambios);
      const antes = [...u.rolesIds].sort().join(',');
      if ([...f.rolesIds].sort().join(',') !== antes) {
        await enviar(apiDetalle, 'PUT', {
          userId: u.userId,
          rolIds: f.rolesIds,
        });
      }
      toast.success('Usuario actualizado');
      await onGuardado();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Caja titulo="Editar Usuario" onClose={onClose} ancho="max-w-3xl">
      <div className="space-y-6">
        <div className="grid gap-2 rounded-lg bg-white/5 p-4 text-sm sm:grid-cols-2">
          <div>
            <p className="text-white/50">ID del usuario</p>
            <p className="font-mono break-all">{u.userId}</p>
          </div>
          <div>
            <p className="text-white/50">Email</p>
            <p className="break-all">{u.email}</p>
          </div>
        </div>

        <section>
          <h3 className="mb-4 text-lg font-semibold text-[var(--ac-primario)]">
            Información Básica
          </h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className={etiquetaModal}>Nombre</label>
              <input
                value={f.firstName}
                onChange={(e) => setF({ ...f, firstName: e.target.value })}
                className={campoModal}
              />
            </div>
            <div>
              <label className={etiquetaModal}>Apellido</label>
              <input
                value={f.lastName}
                onChange={(e) => setF({ ...f, lastName: e.target.value })}
                className={campoModal}
              />
            </div>
            <div>
              <label className={etiquetaModal}>Teléfono</label>
              <input
                value={f.phone}
                onChange={(e) =>
                  setF({ ...f, phone: e.target.value.replace(/[^\d+ ]/g, '') })
                }
                className={campoModal}
              />
            </div>
          </div>
        </section>

        <section>
          <h3 className="mb-4 text-lg font-semibold text-[var(--ac-primario)]">
            Rol y Estado
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={etiquetaModal}>Rol</label>
              <select
                value={f.role}
                disabled={esYo}
                onChange={(e) => setF({ ...f, role: e.target.value as Rol })}
                className={`${campoModal} disabled:opacity-60`}
              >
                {ROLES.map((r) => (
                  <option key={r.valor} value={r.valor}>
                    {r.texto}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={etiquetaModal}>Estado</label>
              <select
                value={f.activo ? 'activo' : 'inactivo'}
                disabled={esYo}
                onChange={(e) =>
                  setF({ ...f, activo: e.target.value === 'activo' })
                }
                className={`${campoModal} disabled:opacity-60`}
              >
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </select>
            </div>
          </div>
        </section>

        {f.role === 'educador' && (
          <CamposEducador
            profesion={f.profesion}
            descripcion={f.descripcion}
            onChange={(cambio) => setF({ ...f, ...cambio })}
          />
        )}

        <section>
          <h3 className="mb-4 text-lg font-semibold text-[var(--ac-primario)]">
            Permisos
          </h3>
          {roles.length === 0 ? (
            <p className="text-sm text-white/50">
              La academia aún no tiene roles secundarios. Créalos en Usuarios y
              Roles › Roles Secundarios.
            </p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {roles.map((r) => (
                <label
                  key={r.id}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border border-[var(--ac-borde)] px-3 py-2 text-sm hover:bg-white/5"
                >
                  <input
                    type="checkbox"
                    checked={f.rolesIds.includes(r.id)}
                    onChange={(e) =>
                      setF({
                        ...f,
                        rolesIds: e.target.checked
                          ? [...f.rolesIds, r.id]
                          : f.rolesIds.filter((x) => x !== r.id),
                      })
                    }
                    className="accent-[var(--ac-primario)]"
                  />
                  {r.nombre}
                </label>
              ))}
            </div>
          )}
        </section>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/15 px-4 py-2 text-sm text-white/80 hover:bg-white/5"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => void guardar()}
            disabled={guardando}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--ac-primario)] px-5 py-2 text-sm font-semibold text-[var(--ac-primario-texto)] disabled:opacity-50"
          >
            {guardando && <Loader2 className="size-4 animate-spin" />}
            Guardar cambios
          </button>
        </div>
      </div>
    </Caja>
  );
}

function CorreoModal({
  slug,
  destinatarios,
  onClose,
}: {
  slug: string;
  destinatarios: UsuarioDetalle[];
  onClose: () => void;
}) {
  const [asunto, setAsunto] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [extra, setExtra] = useState('');
  const [extras, setExtras] = useState<string[]>([]);
  const [enviando, setEnviando] = useState(false);

  const agregarExtra = () => {
    const correo = extra.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) return;
    setExtras((v) => [...new Set([...v, correo])]);
    setExtra('');
  };

  const enviarCorreo = async () => {
    setEnviando(true);
    try {
      const r = (await enviar(
        `/api/academia/${slug}/estudiantes/correo`,
        'POST',
        {
          userIds: destinatarios.map((d) => d.userId),
          extras,
          asunto,
          mensaje,
        }
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
    <Caja titulo="Enviar Correo" onClose={onClose}>
      <div className="space-y-4">
        <input
          placeholder="Asunto del correo"
          value={asunto}
          onChange={(e) => setAsunto(e.target.value)}
          className={campoModal}
        />
        <div className="flex flex-wrap gap-1.5">
          {destinatarios.map((d) => (
            <span
              key={d.userId}
              className="rounded-full bg-[var(--ac-primario)]/15 px-2.5 py-1 text-xs text-[var(--ac-primario)]"
            >
              {d.email}
            </span>
          ))}
          {extras.map((c) => (
            <span
              key={c}
              className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-xs"
            >
              {c}
              <button
                type="button"
                onClick={() => setExtras((v) => v.filter((x) => x !== c))}
                aria-label={`Quitar ${c}`}
                className="text-white/50 hover:text-red-400"
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
        <input
          placeholder="Agregar correos manualmente y presiona Enter"
          value={extra}
          onChange={(e) => setExtra(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              agregarExtra();
            }
          }}
          className={campoModal}
        />
        <textarea
          placeholder="Mensaje"
          value={mensaje}
          rows={8}
          onChange={(e) => setMensaje(e.target.value)}
          className={campoModal}
        />
        <button
          type="button"
          onClick={() => void enviarCorreo()}
          disabled={
            enviando ||
            !asunto.trim() ||
            !mensaje.trim() ||
            destinatarios.length + extras.length === 0
          }
          className={botonPrincipal}
        >
          {enviando && <Loader2 className="size-4 animate-spin" />}
          Enviar Correo
        </button>
      </div>
    </Caja>
  );
}

function AsignarModal({
  slug,
  usuarios,
  onClose,
  onListo,
}: {
  slug: string;
  usuarios: UsuarioDetalle[];
  onClose: () => void;
  onListo: () => Promise<void>;
}) {
  const cursos = useCursosAcademia(slug);
  const { data: programasData } = useDatosAcademia<{
    programas: { id: number; title: string; cursos: { id: number }[] }[];
  }>(`/api/academia/${slug}/programas`);
  const programas = programasData?.programas ?? [];
  const [tipo, setTipo] = useState<'curso' | 'programa'>('curso');
  const [elegidos, setElegidos] = useState<number[]>([]);
  const [guardando, setGuardando] = useState(false);
  const estudiantes = usuarios.filter((u) => u.role === 'estudiante');
  const opciones =
    tipo === 'curso'
      ? cursos.map((c) => ({ id: c.id, title: c.title }))
      : programas.map((p) => ({ id: p.id, title: p.title }));

  const asignar = async () => {
    setGuardando(true);
    try {
      const courseIds =
        tipo === 'curso'
          ? elegidos
          : [
              ...new Set(
                programas
                  .filter((p) => elegidos.includes(p.id))
                  .flatMap((p) => p.cursos.map((c) => c.id))
              ),
            ];
      if (courseIds.length === 0) {
        throw new Error('El programa elegido no tiene cursos.');
      }
      let total = 0;
      for (const courseId of courseIds) {
        const r = (await enviar(`/api/academia/${slug}/matriculas`, 'POST', {
          courseId,
          userIds: estudiantes.map((u) => u.userId),
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
    <Caja titulo="Asignar a Curso o Programa" onClose={onClose}>
      <div className="space-y-4">
        <p className="text-sm text-white/70">
          {estudiantes.length} estudiante(s) de {usuarios.length}{' '}
          seleccionado(s).
          {estudiantes.length < usuarios.length &&
            ' Solo los estudiantes se matriculan.'}
        </p>
        <div className="flex gap-2">
          {(['curso', 'programa'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                setTipo(t);
                setElegidos([]);
              }}
              className={`flex-1 rounded-lg border px-3 py-2 text-sm capitalize ${
                tipo === t
                  ? 'border-[var(--ac-primario)] bg-[var(--ac-primario)]/10 text-[var(--ac-primario)]'
                  : 'border-[var(--ac-borde)] text-white/70 hover:bg-white/5'
              }`}
            >
              {t === 'curso' ? 'Cursos' : 'Programas'}
            </button>
          ))}
        </div>
        <div className="max-h-72 space-y-1 overflow-y-auto">
          {opciones.length === 0 ? (
            <p className="text-sm text-white/50">
              No hay {tipo === 'curso' ? 'cursos' : 'programas'} en la academia.
            </p>
          ) : (
            opciones.map((o) => {
              const activo = elegidos.includes(o.id);
              return (
                <label
                  key={o.id}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                    activo
                      ? 'border-[var(--ac-primario)] bg-[var(--ac-primario)]/10'
                      : 'border-[var(--ac-borde)] hover:bg-white/5'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={activo}
                    onChange={() =>
                      setElegidos((v) =>
                        activo ? v.filter((x) => x !== o.id) : [...v, o.id]
                      )
                    }
                    className="accent-[var(--ac-primario)]"
                  />
                  <span className="truncate">{o.title}</span>
                </label>
              );
            })
          )}
        </div>
        <button
          type="button"
          onClick={() => void asignar()}
          disabled={
            guardando || elegidos.length === 0 || estudiantes.length === 0
          }
          className={botonPrincipal}
        >
          {guardando && <Loader2 className="size-4 animate-spin" />}
          Asignar
        </button>
      </div>
    </Caja>
  );
}
