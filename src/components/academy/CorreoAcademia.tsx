'use client';

import { useState } from 'react';

import { CheckCircle2, Loader2, Mail, Send, Unplug } from 'lucide-react';
import { toast } from 'sonner';
import useSWR from 'swr';

import { enviar } from './seccion/comun';

// "Correo de la academia" (Configuraciones): conecta el correo desde el que
// salen todos los correos de la academia (credenciales, avisos de acceso y
// "Enviar correo"). Sin correo conectado salen desde el de Artiefy a nombre
// de la academia.

type Proveedor = 'gmail' | 'outlook' | 'otro';

interface Conectado {
  proveedor: Proveedor;
  host: string;
  puerto: number;
  usuario: string;
  remitenteNombre: string | null;
  verificadoAt: string | null;
}

const PROVEEDORES: { valor: Proveedor; texto: string; ayuda: string }[] = [
  {
    valor: 'gmail',
    texto: 'Gmail / Google Workspace',
    ayuda:
      'Usa una contraseña de aplicación: cuenta de Google › Seguridad › Verificación en dos pasos › Contraseñas de aplicaciones.',
  },
  {
    valor: 'outlook',
    texto: 'Outlook / Microsoft 365',
    ayuda:
      'Usa una contraseña de aplicación o pide a tu administrador habilitar SMTP autenticado para el buzón.',
  },
  {
    valor: 'otro',
    texto: 'Otro (SMTP)',
    ayuda: 'Los datos SMTP te los da tu proveedor de correo o hosting.',
  },
];

const campo =
  'h-11 w-full rounded-xl border border-[var(--ac-borde)] bg-[var(--ac-superficie)] px-3 text-sm text-white placeholder:text-white/30 focus:border-[var(--ac-primario)] focus:outline-none [&>option]:bg-[var(--ac-fondo)]';
const etiqueta = 'mb-1.5 block text-sm font-medium text-white/80';

export function CorreoAcademia({ slug }: { slug: string }) {
  const api = `/api/academia/${slug}/correo`;
  const { data, mutate, isLoading } = useSWR(
    [api, 'correo'],
    async ([url]: [string, string]) => {
      const res = await fetch(url);
      const j = (await res.json().catch(() => ({}))) as {
        correo?: Conectado | null;
        disponible?: boolean;
        error?: string;
        sqlPendiente?: boolean;
      };
      if (!res.ok) throw new Error(j.error ?? 'No se pudo cargar');
      return { correo: j.correo ?? null, disponible: j.disponible !== false };
    }
  );
  const conectado = data?.correo ?? null;

  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState({
    proveedor: 'gmail' as Proveedor,
    usuario: '',
    clave: '',
    host: '',
    puerto: '587',
    remitenteNombre: '',
  });
  const [ocupado, setOcupado] = useState<
    'conectar' | 'probar' | 'quitar' | null
  >(null);

  const abrirFormulario = () => {
    setForm({
      proveedor: conectado?.proveedor ?? 'gmail',
      usuario: conectado?.usuario ?? '',
      clave: '',
      host: conectado?.proveedor === 'otro' ? conectado.host : '',
      puerto: String(conectado?.puerto ?? 587),
      remitenteNombre: conectado?.remitenteNombre ?? '',
    });
    setEditando(true);
  };

  const conectar = async () => {
    setOcupado('conectar');
    try {
      await enviar(api, 'PUT', { ...form, puerto: Number(form.puerto) });
      toast.success('Correo conectado', {
        description: `Los correos de la academia saldrán desde ${form.usuario}.`,
      });
      setEditando(false);
      await mutate();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setOcupado(null);
    }
  };

  const probar = async () => {
    setOcupado('probar');
    try {
      await enviar(api, 'POST');
      toast.success(`Correo de prueba enviado a ${conectado?.usuario}`);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setOcupado(null);
    }
  };

  const desconectar = async () => {
    setOcupado('quitar');
    try {
      await enviar(api, 'DELETE');
      toast.success('Correo desconectado');
      await mutate();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setOcupado(null);
    }
  };

  const ayuda = PROVEEDORES.find((p) => p.valor === form.proveedor)?.ayuda;

  return (
    <section className="mt-8 space-y-5 border-t border-[var(--ac-borde)] pt-8">
      <div>
        <h2 className="flex items-center gap-2 text-xl font-bold text-white">
          <Mail className="size-5 text-[var(--ac-primario)]" />
          Correo de la academia
        </h2>
        <p className="text-sm text-white/60">
          Conecta el correo desde el que se envían todos los correos de la
          academia: credenciales, avisos de acceso y mensajes a estudiantes.
        </p>
      </div>

      {isLoading ? (
        <Loader2 className="size-5 animate-spin text-white/50" />
      ) : data && !data.disponible ? (
        <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-sm text-amber-300">
          Esta opción aún no está habilitada en el servidor. Mientras tanto, los
          correos salen desde Artiefy a nombre de la academia.
        </p>
      ) : !editando ? (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[var(--ac-borde)] bg-[var(--ac-superficie)] p-4">
          {conectado ? (
            <div className="flex items-center gap-3">
              <CheckCircle2 className="size-6 shrink-0 text-emerald-400" />
              <div>
                <p className="font-semibold text-white">{conectado.usuario}</p>
                <p className="text-xs text-white/60">
                  {conectado.remitenteNombre
                    ? `Aparece como “${conectado.remitenteNombre}” · `
                    : ''}
                  {PROVEEDORES.find((p) => p.valor === conectado.proveedor)
                    ?.texto ?? conectado.host}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-white/70">
              Sin correo conectado: los correos salen desde Artiefy a nombre de
              la academia.
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            {conectado && (
              <>
                <button
                  type="button"
                  onClick={() => void probar()}
                  disabled={ocupado !== null}
                  className="inline-flex h-10 items-center gap-2 rounded-full border border-[var(--ac-borde)] px-4 text-sm font-medium text-white hover:bg-white/5 disabled:opacity-50"
                >
                  {ocupado === 'probar' ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Send className="size-4" />
                  )}
                  Enviar prueba
                </button>
                <button
                  type="button"
                  onClick={() => void desconectar()}
                  disabled={ocupado !== null}
                  className="inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-medium text-red-400 hover:bg-red-500/10 disabled:opacity-50"
                >
                  {ocupado === 'quitar' ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Unplug className="size-4" />
                  )}
                  Desconectar
                </button>
              </>
            )}
            <button
              type="button"
              onClick={abrirFormulario}
              className="inline-flex h-10 items-center gap-2 rounded-full bg-[var(--ac-primario)] px-4 text-sm font-semibold text-[var(--ac-primario-texto)]"
            >
              <Mail className="size-4" />
              {conectado ? 'Cambiar correo' : 'Conectar correo'}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4 rounded-2xl border border-[var(--ac-borde)] bg-[var(--ac-superficie)] p-4 sm:p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className={etiqueta}>Proveedor</span>
              <select
                value={form.proveedor}
                onChange={(e) =>
                  setForm({ ...form, proveedor: e.target.value as Proveedor })
                }
                className={campo}
              >
                {PROVEEDORES.map((p) => (
                  <option key={p.valor} value={p.valor}>
                    {p.texto}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className={etiqueta}>Nombre del remitente</span>
              <input
                value={form.remitenteNombre}
                onChange={(e) =>
                  setForm({ ...form, remitenteNombre: e.target.value })
                }
                placeholder="Ej. Academia PONAO"
                className={campo}
              />
            </label>
            <label className="block">
              <span className={etiqueta}>Correo</span>
              <input
                type="email"
                value={form.usuario}
                onChange={(e) => setForm({ ...form, usuario: e.target.value })}
                placeholder="notificaciones@tuacademia.com"
                className={campo}
              />
            </label>
            <label className="block">
              <span className={etiqueta}>Contraseña de aplicación</span>
              <input
                type="password"
                autoComplete="new-password"
                value={form.clave}
                onChange={(e) => setForm({ ...form, clave: e.target.value })}
                placeholder={
                  conectado ? 'Déjala vacía para conservar la actual' : ''
                }
                className={campo}
              />
            </label>
            {form.proveedor === 'otro' && (
              <>
                <label className="block">
                  <span className={etiqueta}>Servidor SMTP</span>
                  <input
                    value={form.host}
                    onChange={(e) => setForm({ ...form, host: e.target.value })}
                    placeholder="smtp.tudominio.com"
                    className={campo}
                  />
                </label>
                <label className="block">
                  <span className={etiqueta}>Puerto</span>
                  <select
                    value={form.puerto}
                    onChange={(e) =>
                      setForm({ ...form, puerto: e.target.value })
                    }
                    className={campo}
                  >
                    <option value="587">587 (STARTTLS)</option>
                    <option value="465">465 (SSL)</option>
                  </select>
                </label>
              </>
            )}
          </div>
          {ayuda && <p className="text-xs text-white/50">{ayuda}</p>}
          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditando(false)}
              disabled={ocupado !== null}
              className="h-10 rounded-full px-4 text-sm font-medium text-white/80 hover:bg-white/5"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => void conectar()}
              disabled={ocupado !== null || !form.usuario.trim()}
              className="inline-flex h-10 items-center gap-2 rounded-full bg-[var(--ac-primario)] px-5 text-sm font-semibold text-[var(--ac-primario-texto)] disabled:opacity-50"
            >
              {ocupado === 'conectar' && (
                <Loader2 className="size-4 animate-spin" />
              )}
              Probar y conectar
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
