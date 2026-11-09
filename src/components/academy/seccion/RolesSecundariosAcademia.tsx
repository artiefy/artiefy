'use client';

import { useState } from 'react';

import { Loader2, Pencil, Plus, ShieldCheck, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { PERMISOS_ACADEMIA } from '~/lib/academy/permisos';

import {
  ConfirmarEliminar,
  enviar,
  EstadoCarga,
  estilos,
  Modal,
  useDatosAcademia,
} from './comun';
import { SelectorCuentas } from './GruposAcademia';

// Usuarios y Roles › Roles Secundarios: roles con permisos sobre secciones
// del panel, asignados a cuentas de la academia.

interface Rol {
  id: number;
  nombre: string;
  permisos: string[];
  usuarios: { academyUserId: number; name: string | null; email: string }[];
}

const ETIQUETA = Object.fromEntries(PERMISOS_ACADEMIA) as Record<
  string,
  string
>;

export function RolesSecundariosAcademia({ slug }: { slug: string }) {
  const api = `/api/academia/${slug}/roles-secundarios`;
  const { data, error, isLoading, sqlPendiente, mutate } = useDatosAcademia<{
    roles: Rol[];
  }>(api);
  const { data: usuariosData } = useDatosAcademia<{
    usuarios: { id: number; name: string | null; email: string }[];
  }>(`/api/academia/${slug}/usuarios`);
  const cuentas = (usuariosData?.usuarios ?? []).map((u) => ({
    id: String(u.id),
    name: u.name ?? u.email,
    email: u.email,
  }));
  const [editando, setEditando] = useState<Rol | null>();
  const [borrando, setBorrando] = useState<Rol | null>(null);

  if (!data) {
    return (
      <EstadoCarga
        cargando={isLoading}
        error={error}
        sqlPendiente={sqlPendiente}
        script="academy_roles_secundarios.sql"
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setEditando(null)}
          className={estilos.boton}
        >
          <Plus className="size-4" /> Crear rol
        </button>
      </div>

      {data.roles.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-[var(--ac-borde)] p-10 text-center text-white/50">
          Todavía no hay roles secundarios.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.roles.map((r) => (
            <article
              key={r.id}
              className={`${estilos.tarjeta} flex flex-col gap-3`}
            >
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--ac-primario)]/15 text-[var(--ac-primario)]">
                  <ShieldCheck className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-white">{r.nombre}</h3>
                  <p className="text-xs text-white/60">
                    {r.usuarios.length}{' '}
                    {r.usuarios.length === 1 ? 'cuenta' : 'cuentas'}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                {r.permisos.length === 0 ? (
                  <span className="text-xs text-white/40">Sin permisos</span>
                ) : (
                  r.permisos.map((p) => (
                    <span
                      key={p}
                      className={`${estilos.chip} border-[var(--ac-primario)]/30 bg-[var(--ac-primario)]/10 text-[var(--ac-primario)]`}
                    >
                      {ETIQUETA[p] ?? p}
                    </span>
                  ))
                )}
              </div>
              <div className="mt-auto flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditando(r)}
                  className={`${estilos.botonSec} h-9 flex-1`}
                >
                  <Pencil className="size-4" /> Editar
                </button>
                <button
                  type="button"
                  onClick={() => setBorrando(r)}
                  aria-label={`Eliminar ${r.nombre}`}
                  className="inline-flex h-9 items-center justify-center rounded-full px-3 text-red-400 hover:bg-red-500/10"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {editando !== undefined && (
        <FormularioRol
          api={api}
          rol={editando}
          cuentas={cuentas}
          onClose={() => setEditando(undefined)}
          onSaved={async () => {
            setEditando(undefined);
            await mutate();
          }}
        />
      )}
      {borrando && (
        <ConfirmarEliminar
          titulo="Eliminar rol"
          texto={
            <>
              ¿Eliminar el rol{' '}
              <span className="font-semibold text-white">
                “{borrando.nombre}”
              </span>
              ? Se quita de las cuentas que lo tienen.
            </>
          }
          onClose={() => setBorrando(null)}
          onConfirmar={async () => {
            try {
              await enviar(`${api}/${borrando.id}`, 'DELETE');
              toast.success('Rol eliminado');
              setBorrando(null);
              await mutate();
            } catch (err) {
              toast.error((err as Error).message);
            }
          }}
        />
      )}
    </div>
  );
}

function FormularioRol({
  api,
  rol,
  cuentas,
  onClose,
  onSaved,
}: {
  api: string;
  rol: Rol | null;
  cuentas: { id: string; name: string; email: string }[];
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [nombre, setNombre] = useState(rol?.nombre ?? '');
  const [permisos, setPermisos] = useState<string[]>(rol?.permisos ?? []);
  const [asignados, setAsignados] = useState<string[]>(
    rol?.usuarios.map((u) => String(u.academyUserId)) ?? []
  );
  const [guardando, setGuardando] = useState(false);

  const guardar = async () => {
    setGuardando(true);
    try {
      await enviar(rol ? `${api}/${rol.id}` : api, rol ? 'PATCH' : 'POST', {
        nombre,
        permisos,
        academyUserIds: asignados.map(Number),
      });
      toast.success(rol ? 'Rol actualizado' : 'Rol creado');
      await onSaved();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal titulo={rol ? 'Editar rol' : 'Crear rol'} onClose={onClose}>
      <div className="space-y-4">
        <label className="block">
          <span className={estilos.etiqueta}>Nombre</span>
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Coordinador, Cartera…"
            className={estilos.campo}
          />
        </label>
        <div>
          <span className={estilos.etiqueta}>Permisos</span>
          <div className="grid grid-cols-2 gap-1 sm:grid-cols-3">
            {PERMISOS_ACADEMIA.map(([clave, texto]) => (
              <label
                key={clave}
                className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-white hover:bg-white/5"
              >
                <input
                  type="checkbox"
                  checked={permisos.includes(clave)}
                  onChange={(e) =>
                    setPermisos((ps) =>
                      e.target.checked
                        ? [...ps, clave]
                        : ps.filter((p) => p !== clave)
                    )
                  }
                  className="accent-[var(--ac-primario)]"
                />
                {texto}
              </label>
            ))}
          </div>
        </div>
        <div>
          <span className={estilos.etiqueta}>Cuentas con este rol</span>
          <SelectorCuentas
            cuentas={cuentas}
            seleccion={asignados}
            onChange={setAsignados}
            vacio="La academia aún no tiene cuentas."
          />
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className={estilos.botonSec}>
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => void guardar()}
            disabled={guardando || !nombre.trim()}
            className={estilos.boton}
          >
            {guardando && <Loader2 className="size-4 animate-spin" />}
            Guardar
          </button>
        </div>
      </div>
    </Modal>
  );
}
