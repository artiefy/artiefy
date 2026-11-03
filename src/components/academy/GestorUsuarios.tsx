'use client';

import { useState } from 'react';

import { Loader2, Mail, Trash2, UserPlus } from 'lucide-react';
import useSWR from 'swr';

type Rol = 'super-admin' | 'educador' | 'estudiante';

interface Usuario {
  userId: string;
  email: string;
  name: string | null;
  role: Rol;
  // false: cuenta existente (de Artiefy u otra academia) vinculada.
  cuentaPropia: boolean;
}

const ROLES: { valor: Rol; etiqueta: string }[] = [
  { valor: 'super-admin', etiqueta: 'Super-admin' },
  { valor: 'educador', etiqueta: 'Educador' },
  { valor: 'estudiante', etiqueta: 'Estudiante' },
];

// Colores de la academia (variables CSS) con los de Artiefy por defecto.
const PRIMARIO = 'var(--ac-primario,#22C4D3)';
const SUPERFICIE = 'var(--ac-superficie,#061c37)';
const BORDE = 'var(--ac-borde,rgba(255,255,255,0.1))';

/**
 * Cuentas de una academia: listar, agregar por correo (crea la cuenta y envía
 * credenciales si no existe), cambiar rol y eliminar. `apiBase` decide quién
 * opera: el panel de Artiefy o el super-admin de la propia academia.
 */
export function GestorUsuarios({
  apiBase,
  yoUserId,
}: {
  apiBase: string;
  yoUserId?: string;
}) {
  const [aviso, setAviso] = useState<{ ok: boolean; texto: string } | null>(
    null
  );
  const [form, setForm] = useState({
    nombre: '',
    email: '',
    rol: 'estudiante' as Rol,
  });
  const [guardando, setGuardando] = useState(false);
  const [porEliminar, setPorEliminar] = useState<Usuario | null>(null);

  const { data: usuarios, mutate } = useSWR(apiBase, async (url: string) => {
    const res = await fetch(url);
    const j = (await res.json().catch(() => ({}))) as {
      usuarios?: Usuario[];
      error?: string;
    };
    if (!res.ok) throw new Error(j.error ?? 'No se pudo cargar');
    return j.usuarios ?? [];
  });

  const enviar = async (
    metodo: 'POST' | 'PATCH' | 'PUT' | 'DELETE',
    body?: object
  ) => {
    const url =
      metodo === 'DELETE' && body && 'userId' in body
        ? `${apiBase}?userId=${encodeURIComponent(String(body.userId))}`
        : apiBase;
    const res = await fetch(url, {
      method: metodo,
      headers: { 'Content-Type': 'application/json' },
      body: metodo === 'DELETE' ? undefined : JSON.stringify(body),
    });
    const j = (await res.json().catch(() => ({}))) as {
      error?: string;
      creado?: boolean;
      vinculado?: boolean;
      correoEnviado?: boolean;
      nuevaClave?: boolean;
    };
    if (!res.ok) throw new Error(j.error ?? 'No se pudo guardar');
    return j;
  };

  const agregar = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    setAviso(null);
    try {
      const j = await enviar('POST', form);
      setAviso({
        ok: true,
        texto: j.vinculado
          ? `${form.email} ya tenía cuenta: se agregó a la academia y entra con su misma contraseña.${
              j.correoEnviado
                ? ' Se le envió un aviso por correo.'
                : ' No se pudo enviar el aviso por correo.'
            }`
          : !j.creado
            ? 'La cuenta ya estaba en esta academia: se actualizó su rol.'
            : j.correoEnviado
              ? `Cuenta creada. Se enviaron las credenciales a ${form.email}.`
              : 'Cuenta creada, pero no se pudo enviar el correo de credenciales.',
      });
      setForm({ nombre: '', email: '', rol: form.rol });
      await mutate();
    } catch (error) {
      setAviso({ ok: false, texto: (error as Error).message });
    } finally {
      setGuardando(false);
    }
  };

  const cambiarRol = async (u: Usuario, rol: Rol) => {
    void mutate(
      (prev) =>
        prev?.map((x) => (x.userId === u.userId ? { ...x, role: rol } : x)),
      { revalidate: false }
    );
    try {
      await enviar('PATCH', { userId: u.userId, rol });
    } catch (error) {
      setAviso({ ok: false, texto: (error as Error).message });
      await mutate();
    }
  };

  const [reenviando, setReenviando] = useState<string | null>(null);
  const reenviar = async (u: Usuario) => {
    setReenviando(u.userId);
    setAviso(null);
    try {
      const j = await enviar('PUT', { userId: u.userId });
      setAviso({
        ok: Boolean(j.correoEnviado),
        texto: !j.correoEnviado
          ? `No se pudo enviar el correo a ${u.email}.`
          : j.nuevaClave
            ? `Se generó una contraseña nueva y se envió a ${u.email}.`
            : `Se reenvió el aviso de acceso a ${u.email} (entra con su contraseña de siempre).`,
      });
    } catch (error) {
      setAviso({ ok: false, texto: (error as Error).message });
    } finally {
      setReenviando(null);
    }
  };

  const eliminar = async () => {
    if (!porEliminar) return;
    try {
      await enviar('DELETE', { userId: porEliminar.userId });
      void mutate(
        (prev) => prev?.filter((x) => x.userId !== porEliminar.userId),
        { revalidate: false }
      );
    } catch (error) {
      setAviso({ ok: false, texto: (error as Error).message });
    } finally {
      setPorEliminar(null);
    }
  };

  const campo =
    'h-10 w-full rounded-xl border bg-transparent px-3 text-sm text-white placeholder:text-white/30 focus:outline-none';

  return (
    <section
      className="rounded-2xl border p-4 sm:p-5"
      style={{ background: SUPERFICIE, borderColor: BORDE }}
    >
      <h2 className="text-lg font-bold text-white">Usuarios</h2>
      <p className="mb-4 text-sm text-white/50">
        Si el correo ya tiene cuenta (por ejemplo en Artiefy), se agrega con esa
        misma cuenta. Si no, se crea y se le envían sus credenciales.
      </p>

      <form
        onSubmit={(e) => void agregar(e)}
        className="grid gap-2 sm:grid-cols-[1fr_1fr_160px_auto]"
      >
        <input
          required
          value={form.nombre}
          onChange={(e) => setForm({ ...form, nombre: e.target.value })}
          placeholder="Nombre completo"
          className={campo}
          style={{ borderColor: BORDE }}
        />
        <input
          required
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder="correo@ejemplo.com"
          className={campo}
          style={{ borderColor: BORDE }}
        />
        <select
          value={form.rol}
          onChange={(e) => setForm({ ...form, rol: e.target.value as Rol })}
          className={`${campo} [&>option]:bg-[#061c37]`}
          style={{ borderColor: BORDE }}
        >
          {ROLES.map((r) => (
            <option key={r.valor} value={r.valor}>
              {r.etiqueta}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={guardando}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold disabled:opacity-50"
          style={{
            background: PRIMARIO,
            color: 'var(--ac-primario-texto,#04101F)',
          }}
        >
          {guardando ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <UserPlus className="size-4" />
          )}
          Agregar
        </button>
      </form>

      {aviso && (
        <p
          className={`mt-3 rounded-lg px-3 py-2 text-sm ${
            aviso.ok
              ? 'bg-emerald-500/10 text-emerald-300'
              : 'bg-red-500/10 text-red-300'
          }`}
        >
          {aviso.texto}
        </p>
      )}

      <div className="mt-4 divide-y" style={{ borderColor: BORDE }}>
        {!usuarios ? (
          <p className="flex items-center gap-2 py-6 text-sm text-white/50">
            <Loader2 className="size-4 animate-spin" /> Cargando…
          </p>
        ) : usuarios.length === 0 ? (
          <p className="py-6 text-sm text-white/50">
            Todavía no hay usuarios en esta academia.
          </p>
        ) : (
          usuarios.map((u) => {
            const soyYo = u.userId === yoUserId;
            return (
              <div
                key={u.userId}
                className="flex flex-wrap items-center gap-x-3 gap-y-2 py-3"
                style={{ borderColor: BORDE }}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">
                    {u.name ?? u.email}
                    {soyYo && <span className="text-white/40"> (tú)</span>}
                  </p>
                  <p className="truncate text-xs text-white/50">{u.email}</p>
                </div>
                <select
                  value={u.role}
                  disabled={soyYo}
                  onChange={(e) => void cambiarRol(u, e.target.value as Rol)}
                  className="h-8 rounded-lg border bg-transparent px-2 text-xs text-white disabled:opacity-50 [&>option]:bg-[#061c37]"
                  style={{ borderColor: BORDE }}
                >
                  {ROLES.map((r) => (
                    <option key={r.valor} value={r.valor}>
                      {r.etiqueta}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => void reenviar(u)}
                  disabled={reenviando === u.userId}
                  title={
                    u.cuentaPropia
                      ? 'Generar contraseña nueva y enviarla por correo'
                      : 'Reenviar el aviso de acceso por correo'
                  }
                  aria-label={`Reenviar acceso a ${u.email}`}
                  className="rounded-lg p-1.5 text-white/40 hover:bg-white/10 hover:text-white disabled:opacity-50"
                >
                  {reenviando === u.userId ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Mail className="size-4" />
                  )}
                </button>
                {!soyYo && (
                  <button
                    type="button"
                    onClick={() => setPorEliminar(u)}
                    aria-label={`Eliminar ${u.email}`}
                    className="rounded-lg p-1.5 text-white/40 hover:bg-red-500/15 hover:text-red-400"
                  >
                    <Trash2 className="size-4" />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {porEliminar && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setPorEliminar(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-red-500/30 bg-[#061c37] p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-white">
              Quitar de la academia
            </h3>
            <p className="mt-2 text-sm text-white/70">
              <span className="font-semibold text-white">
                {porEliminar.email}
              </span>{' '}
              ya no podrá entrar a la academia.{' '}
              {porEliminar.cuentaPropia
                ? 'Como la cuenta la creó la academia, también se elimina (si no está en otra academia). No se puede deshacer.'
                : 'Su cuenta (por ejemplo la de Artiefy) no se toca.'}
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPorEliminar(null)}
                className="rounded-xl border border-white/15 px-4 py-2 text-sm text-white/70 hover:bg-white/5"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void eliminar()}
                className="rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
