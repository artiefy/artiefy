'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { UMBRAL_COINCIDENCIA, useFaceApi } from './useFaceApi';

export type MotivoRechazo = 'sin_rostro' | 'sin_referencia' | 'no_coincide';

export interface ResultadoFacial {
  coincide: boolean;
  distancia: number | null;
  motivo?: MotivoRechazo;
}

interface Props {
  /** URL pública de la foto de referencia (la que se subió antes). */
  fotoReferencia: string | null;
  /** Se llama con el veredicto cuando el operador pulsa Verificar. */
  onResultado: (resultado: ResultadoFacial) => void;
  /** Bloquea el botón mientras el flujo de acceso está ocupado. */
  ocupado?: boolean;
}

/**
 * Verificación facial contra la foto de referencia de la persona.
 *
 * Todo ocurre en el navegador: el rostro capturado NO se envía a ningún
 * servidor, solo el veredicto y la distancia. Los modelos se sirven desde
 * /public y pesan ~7 MB la primera vez.
 */
export function VerificacionFacial({
  fotoReferencia,
  onResultado,
  ocupado = false,
}: Props) {
  const { estado, descriptorDe, distanciaEntre } = useFaceApi();
  const videoRef = useRef<HTMLVideoElement>(null);
  const flujoRef = useRef<MediaStream | null>(null);

  const [camara, setCamara] = useState<'apagada' | 'encendida' | 'error'>(
    'apagada'
  );
  const [verificando, setVerificando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);

  // Encender la cámara en cuanto los modelos estén listos.
  useEffect(() => {
    if (estado !== 'listo') return;

    let cancelado = false;

    const encender = async () => {
      try {
        const flujo = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: 640, height: 480 },
          audio: false,
        });
        if (cancelado) {
          flujo.getTracks().forEach((t) => t.stop());
          return;
        }
        flujoRef.current = flujo;
        if (videoRef.current) videoRef.current.srcObject = flujo;
        setCamara('encendida');
      } catch (e) {
        console.error('[FACIAL] no se pudo abrir la cámara:', e);
        setCamara('error');
      }
    };

    void encender();

    return () => {
      cancelado = true;
      flujoRef.current?.getTracks().forEach((t) => t.stop());
      flujoRef.current = null;
    };
  }, [estado]);

  const verificar = useCallback(async () => {
    if (!videoRef.current) return;

    setVerificando(true);
    setMensaje(null);

    try {
      // 1) Rostro de la cámara
      const enVivo = await descriptorDe(videoRef.current);
      if (!enVivo) {
        setMensaje('No se detectó ningún rostro. Acércate y mira a la cámara.');
        onResultado({
          coincide: false,
          distancia: null,
          motivo: 'sin_rostro',
        });
        return;
      }

      // 2) Rostro de la foto de referencia
      if (!fotoReferencia) {
        setMensaje('Esta persona no tiene foto de referencia registrada.');
        onResultado({
          coincide: false,
          distancia: null,
          motivo: 'sin_referencia',
        });
        return;
      }

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = fotoReferencia;
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('no se pudo cargar la foto'));
      });

      const referencia = await descriptorDe(img);
      if (!referencia) {
        setMensaje('En la foto de referencia no se distingue una cara.');
        onResultado({
          coincide: false,
          distancia: null,
          motivo: 'sin_referencia',
        });
        return;
      }

      // 3) Comparar
      const distancia = distanciaEntre(enVivo, referencia);
      const coincide = distancia < UMBRAL_COINCIDENCIA;

      setMensaje(
        coincide
          ? `Coincide (${distancia.toFixed(3)})`
          : `No coincide (${distancia.toFixed(3)})`
      );
      onResultado({
        coincide,
        distancia,
        motivo: coincide ? undefined : 'no_coincide',
      });
    } catch (e) {
      console.error('[FACIAL] error verificando:', e);
      setMensaje('Error al verificar. Inténtalo de nuevo.');
      onResultado({ coincide: false, distancia: null, motivo: 'sin_rostro' });
    } finally {
      setVerificando(false);
    }
  }, [descriptorDe, distanciaEntre, fotoReferencia, onResultado]);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-full max-w-sm overflow-hidden rounded-xl border border-cyan-500/30 bg-black/40">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          // Espejo: la gente espera verse como en un espejo.
          className="w-full -scale-x-100"
        />
        {estado === 'cargando' && (
          <p className="absolute inset-0 flex items-center justify-center text-sm text-cyan-300">
            Cargando modelos…
          </p>
        )}
        {estado === 'error' && (
          <p className="absolute inset-0 flex items-center justify-center px-4 text-center text-sm text-red-400">
            No se pudieron cargar los modelos faciales.
          </p>
        )}
        {camara === 'error' && (
          <p className="absolute inset-0 flex items-center justify-center px-4 text-center text-sm text-red-400">
            No se pudo abrir la cámara. Revisa los permisos del navegador.
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={() => void verificar()}
        disabled={
          estado !== 'listo' || camara !== 'encendida' || verificando || ocupado
        }
        className="
          w-full max-w-sm rounded-lg bg-cyan-500 px-4 py-2.5 font-semibold
          text-slate-900 transition-colors
          hover:bg-cyan-400
          disabled:cursor-not-allowed disabled:opacity-50
        "
      >
        {verificando ? 'Verificando…' : 'Verificar rostro'}
      </button>

      {mensaje && (
        <p className="text-center text-sm text-white/70">{mensaje}</p>
      )}

      {!fotoReferencia && estado === 'listo' && (
        <p className="text-center text-xs text-amber-400">
          Sin foto de referencia: esta persona no puede verificarse.
        </p>
      )}
    </div>
  );
}
