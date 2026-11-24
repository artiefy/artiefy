'use client';

import { useState } from 'react';

import { Loader2, Mail, Send } from 'lucide-react';
import { toast } from 'sonner';
import useSWR from 'swr';

import { enviar } from './seccion/comun';

// "Correo de la academia" (Configuraciones). Sin contraseñas: los correos de
// la academia (credenciales, avisos de acceso, "Correo" a estudiantes,
// inscripciones) salen desde Artiefy con el nombre de la academia como
// remitente, y al darle "Responder" la respuesta llega al correo de la
// academia.

interface Correo {
  remitenteNombre: string | null;
  correoRespuesta: string | null;
}

const campo =
  'h-11 w-full rounded-xl border border-[var(--ac-borde)] bg-[var(--ac-superficie)] px-3 text-sm text-white placeholder:text-white/30 focus:border-[var(--ac-primario)] focus:outline-none';
const etiqueta = 'mb-1.5 block text-sm font-medium text-white/80';

export function CorreoAcademia({
  slug,
  nombreAcademia,
}: {
  slug: string;
  nombreAcademia?: string;
}) {
  const api = `/api/academia/${slug}/correo`;
  const { data, mutate } = useSWR([api, 'correo'], async ([url]) => {
    const res = await fetch(url);
    const j = (await res.json().catch(() => ({}))) as Correo & {
      error?: string;
    };
    if (!res.ok) throw new Error(j.error ?? 'No se pudo cargar');
    return j;
  });

  if (!data) {
    return (
      <section className="mt-8 border-t border-[var(--ac-borde)] pt-8">
        <Loader2 className="size-5 animate-spin text-white/50" />
      </section>
    );
  }

  return (
    <FormularioCorreo
      key={`${data.remitenteNombre ?? ''}|${data.correoRespuesta ?? ''}`}
      api={api}
      inicial={data}
      nombreAcademia={nombreAcademia}
      onGuardado={(c) => void mutate(c, { revalidate: false })}
    />
  );
}

function FormularioCorreo({
  api,
  inicial,
  nombreAcademia,
  onGuardado,
}: {
  api: string;
  inicial: Correo;
  nombreAcademia?: string;
  onGuardado: (c: Correo) => void;
}) {
  const [remitente, setRemitente] = useState(inicial.remitenteNombre ?? '');
  const [respuesta, setRespuesta] = useState(inicial.correoRespuesta ?? '');
  const [ocupado, setOcupado] = useState<'guardar' | 'probar' | null>(null);
  const cambios =
    remitente.trim() !== (inicial.remitenteNombre ?? '') ||
    respuesta.trim().toLowerCase() !== (inicial.correoRespuesta ?? '');
  const nombreVisible = remitente.trim() || nombreAcademia || 'Tu academia';

  const guardar = async () => {
    setOcupado('guardar');
    try {
      const c = (await enviar(api, 'PUT', {
        remitenteNombre: remitente,
        correoRespuesta: respuesta,
      })) as Correo;
      onGuardado(c);
      toast.success('Correo de la academia guardado');
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
      toast.success(`Correo de prueba enviado a ${inicial.correoRespuesta}`);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setOcupado(null);
    }
  };

  return (
    <section className="mt-8 space-y-5 border-t border-[var(--ac-borde)] pt-8">
      <div>
        <h2 className="flex items-center gap-2 text-xl font-bold text-white">
          <Mail className="size-5 text-[var(--ac-primario)]" />
          Correo de la academia
        </h2>
        <p className="text-sm text-white/60">
          Los correos de la academia (credenciales, avisos, inscripciones y
          mensajes a estudiantes) llegan con el nombre de la academia como
          remitente. Cuando un estudiante responde, la respuesta llega a tu
          correo. No necesitas contraseña.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label>
          <span className={etiqueta}>Nombre del remitente</span>
          <input
            value={remitente}
            onChange={(e) => setRemitente(e.target.value)}
            placeholder={nombreAcademia ?? 'Nombre de la academia'}
            maxLength={80}
            className={campo}
          />
        </label>
        <label>
          <span className={etiqueta}>Correo para respuestas</span>
          <input
            type="email"
            value={respuesta}
            onChange={(e) => setRespuesta(e.target.value)}
            placeholder="admisiones@tuacademia.com"
            className={campo}
          />
        </label>
      </div>

      <p className="rounded-xl border border-[var(--ac-borde)] bg-[var(--ac-superficie)] px-4 py-3 text-sm text-white/70">
        Así lo verán tus estudiantes:{' '}
        <strong className="text-white">De:</strong> {nombreVisible}
        {respuesta.trim() && (
          <>
            {' · '}
            <strong className="text-white">Responder a:</strong>{' '}
            {respuesta.trim()}
          </>
        )}
      </p>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void guardar()}
          disabled={!cambios || ocupado !== null}
          className="inline-flex h-10 items-center gap-2 rounded-full bg-[var(--ac-primario)] px-5 text-sm font-semibold text-[var(--ac-primario-texto)] disabled:opacity-40"
        >
          {ocupado === 'guardar' && <Loader2 className="size-4 animate-spin" />}
          Guardar
        </button>
        {inicial.correoRespuesta && (
          <button
            type="button"
            onClick={() => void probar()}
            disabled={ocupado !== null}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-[var(--ac-borde)] px-5 text-sm text-white hover:bg-white/5 disabled:opacity-40"
          >
            {ocupado === 'probar' ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
            Enviar correo de prueba
          </button>
        )}
      </div>
    </section>
  );
}
