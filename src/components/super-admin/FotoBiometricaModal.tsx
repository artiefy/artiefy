'use client';

import { useEffect, useRef, useState } from 'react';

import Image from 'next/image';

import { ImageUp, Loader2, UserRound, X } from 'lucide-react';
import { toast } from 'sonner';

interface PersonaResumen {
  id: string;
  nombre: string;
  email: string;
  rol?: string;
  telefono?: string;
}

interface Props {
  abierto: boolean;
  persona: PersonaResumen | null;
  onCerrar: () => void;
}

/**
 * Modal para subir o cambiar la foto biométrica de una persona.
 *
 * Muestra sus datos y la foto actual (si tiene), y permite subir una nueva.
 * La foto se guarda como `users.profileImageKey` a través del endpoint
 * `/api/acceso/foto-referencia`, que es la fuente del control de acceso facial.
 */
export function FotoBiometricaModal({ abierto, persona, onCerrar }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fotoActual, setFotoActual] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [subiendo, setSubiendo] = useState(false);

  // Carga la foto actual cada vez que se abre para una persona.
  useEffect(() => {
    if (!abierto || !persona) return;

    let cancelado = false;
    setFotoActual(null);
    setCargando(true);

    void fetch(`/api/acceso/foto-referencia?userId=${persona.id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: unknown) => {
        if (cancelado) return;
        const url =
          data &&
          typeof data === 'object' &&
          'url' in data &&
          typeof (data as { url: unknown }).url === 'string'
            ? (data as { url: string }).url
            : null;
        setFotoActual(url);
      })
      .catch(() => {
        if (!cancelado) setFotoActual(null);
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });

    return () => {
      cancelado = true;
    };
  }, [abierto, persona]);

  if (!abierto || !persona) return null;

  const alElegirArchivo = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const archivo = event.target.files?.[0];
    event.target.value = '';
    if (!archivo) return;

    setSubiendo(true);
    try {
      const imagen = await new Promise<string>((resolve, reject) => {
        const lector = new FileReader();
        lector.onload = () =>
          resolve(typeof lector.result === 'string' ? lector.result : '');
        lector.onerror = () => reject(new Error('No se pudo leer la imagen'));
        lector.readAsDataURL(archivo);
      });

      const res = await fetch('/api/acceso/foto-referencia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: persona.id, imagen }),
      });

      if (!res.ok) {
        const cuerpo: unknown = await res.json().catch(() => null);
        const motivo =
          cuerpo &&
          typeof cuerpo === 'object' &&
          'error' in cuerpo &&
          typeof (cuerpo as { error: unknown }).error === 'string'
            ? (cuerpo as { error: string }).error
            : 'No se pudo subir la foto';
        throw new Error(motivo);
      }

      const data: unknown = await res.json().catch(() => null);
      const url =
        data &&
        typeof data === 'object' &&
        'url' in data &&
        typeof (data as { url: unknown }).url === 'string'
          ? (data as { url: string }).url
          : null;
      // Cache-busting para ver la nueva foto de inmediato.
      setFotoActual(url ? `${url}?t=${Date.now()}` : null);
      toast.success('Foto biométrica guardada');
    } catch (error) {
      console.error('[FOTO BIOMETRICA]', error);
      toast.error(
        error instanceof Error ? error.message : 'No se pudo subir la foto'
      );
    } finally {
      setSubiendo(false);
    }
  };

  return (
    <div
      className="
        fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4
        backdrop-blur-sm
      "
      onClick={onCerrar}
    >
      <div
        className="
          relative w-full max-w-md rounded-2xl border border-[#22C4D3]/30
          bg-[#061c37] p-6 shadow-2xl
        "
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onCerrar}
          className="
            absolute top-4 right-4 text-white/50 transition-colors
            hover:text-white
          "
          aria-label="Cerrar"
        >
          <X className="size-5" />
        </button>

        <h2 className="mb-1 text-lg font-bold text-[#22C4D3]">
          Foto biométrica
        </h2>
        <p className="mb-4 text-xs text-white/50">
          Esta foto se usa para el reconocimiento facial en el control de
          acceso.
        </p>

        {/* Datos de la persona */}
        <div className="mb-4 rounded-xl border border-white/10 bg-white/5 p-3">
          <p className="text-sm font-semibold text-white">{persona.nombre}</p>
          <p className="text-xs break-all text-white/60">{persona.email}</p>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-white/50">
            {persona.rol && <span>Rol: {persona.rol}</span>}
            {persona.telefono && <span>Tel: {persona.telefono}</span>}
          </div>
        </div>

        {/* Foto actual */}
        <div
          className="
            relative mx-auto flex aspect-square w-48 items-center justify-center
            overflow-hidden rounded-xl border border-white/10 bg-black/30
          "
        >
          {cargando ? (
            <Loader2 className="size-6 animate-spin text-white/40" />
          ) : fotoActual ? (
            <Image
              src={fotoActual}
              alt={`Foto de ${persona.nombre}`}
              fill
              unoptimized
              className="object-cover"
            />
          ) : (
            <div className="flex flex-col items-center gap-2 text-white/40">
              <UserRound className="size-10" />
              <span className="text-xs">Sin foto registrada</span>
            </div>
          )}
        </div>

        {/* Subir / cambiar */}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={alElegirArchivo}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={subiendo}
          className="
            mt-5 flex w-full items-center justify-center gap-2 rounded-xl
            bg-[#22C4D3] px-4 py-2.5 text-sm font-semibold text-[#04101f]
            transition-colors
            hover:bg-[#3ad4e2]
            focus:ring-2 focus:ring-[#22C4D3]/50 focus:outline-none
            disabled:cursor-not-allowed disabled:opacity-50
          "
        >
          {subiendo ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Subiendo...
            </>
          ) : (
            <>
              <ImageUp className="size-4" />
              {fotoActual ? 'Cambiar foto' : 'Subir foto'}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
