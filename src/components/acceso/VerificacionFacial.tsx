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
  /** Persona a la que pertenece la foto de referencia. */
  userId?: string | null;
  /** Se llama tras guardar una foto nueva, con su URL pública. */
  onFotoGuardada?: (url: string) => void;
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
  userId,
  onFotoGuardada,
}: Props) {
  const { estado, descriptorDe, distanciaEntre } = useFaceApi();
  const videoRef = useRef<HTMLVideoElement>(null);
  const flujoRef = useRef<MediaStream | null>(null);
  const archivoRef = useRef<HTMLInputElement>(null);

  const [camara, setCamara] = useState<'apagada' | 'encendida' | 'error'>(
    'apagada'
  );
  const [verificando, setVerificando] = useState(false);
  const [guardando, setGuardando] = useState(false);
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

  /** Sube la imagen ya validada y avisa al padre. */
  const subirReferencia = useCallback(
    async (imagen: string) => {
      const res = await fetch('/api/acceso/foto-referencia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, imagen }),
      });

      if (!res.ok) {
        setMensaje('No se pudo guardar la foto.');
        return;
      }

      const data = (await res.json()) as { url?: string };
      setMensaje('Foto de referencia guardada.');
      if (data.url) onFotoGuardada?.(data.url);
    },
    [onFotoGuardada, userId]
  );

  /**
   * Foto de referencia desde un archivo del equipo.
   *
   * Se comprueba que tenga una cara antes de subirla, igual que con la
   * cámara: una referencia sin rostro dejaría a esa persona sin poder entrar.
   */
  const subirDesdeArchivo = useCallback(
    async (archivo: File) => {
      if (!userId) return;

      setGuardando(true);
      setMensaje(null);

      try {
        const imagen = await new Promise<string>((resolve, reject) => {
          const lector = new FileReader();
          lector.onload = () => resolve(String(lector.result));
          lector.onerror = () => reject(new Error('no se pudo leer'));
          lector.readAsDataURL(archivo);
        });

        const img = new Image();
        img.src = imagen;
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error('imagen inválida'));
        });

        if (!(await descriptorDe(img))) {
          setMensaje('En esa imagen no se distingue una cara.');
          return;
        }

        await subirReferencia(imagen);
      } catch (e) {
        console.error('[FACIAL] error subiendo el archivo:', e);
        setMensaje('No se pudo procesar la imagen.');
      } finally {
        setGuardando(false);
        if (archivoRef.current) archivoRef.current.value = '';
      }
    },
    [descriptorDe, subirReferencia, userId]
  );

  /**
   * Toma un fotograma de la cámara y lo guarda como foto de referencia.
   *
   * Antes de subir comprueba que se distinga una cara: guardar una foto sin
   * rostro dejaría a esa persona sin poder entrar nunca, y el fallo solo se
   * notaría al intentar pasar.
   */
  const capturarReferencia = useCallback(async () => {
    if (!videoRef.current || !userId) return;

    setGuardando(true);
    setMensaje(null);

    try {
      const rostro = await descriptorDe(videoRef.current);
      if (!rostro) {
        setMensaje('No se ve una cara. Acércate y mira de frente.');
        return;
      }

      const video = videoRef.current;
      const lienzo = document.createElement('canvas');
      lienzo.width = video.videoWidth;
      lienzo.height = video.videoHeight;
      lienzo.getContext('2d')?.drawImage(video, 0, 0);
      const imagen = lienzo.toDataURL('image/jpeg', 0.9);

      await subirReferencia(imagen);
    } catch (e) {
      console.error('[FACIAL] error guardando la referencia:', e);
      setMensaje('Error al guardar la foto.');
    } finally {
      setGuardando(false);
    }
  }, [descriptorDe, subirReferencia, userId]);

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

      {userId && (
        <button
          type="button"
          onClick={() => void capturarReferencia()}
          disabled={estado !== 'listo' || camara !== 'encendida' || guardando}
          className="
            w-full max-w-sm rounded-lg border border-cyan-500/40 px-4 py-2
            text-sm font-semibold text-cyan-300 transition-colors
            hover:bg-cyan-500/10
            disabled:cursor-not-allowed disabled:opacity-50
          "
        >
          {guardando
            ? 'Guardando…'
            : fotoReferencia
              ? 'Reemplazar foto de referencia'
              : 'Tomar foto de referencia'}
        </button>
      )}

      {userId && (
        <>
          <input
            ref={archivoRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void subirDesdeArchivo(f);
            }}
          />
          <button
            type="button"
            onClick={() => archivoRef.current?.click()}
            disabled={estado !== 'listo' || guardando}
            className="
              w-full max-w-sm rounded-lg border border-white/20 px-4 py-2
              text-sm text-white/70 transition-colors
              hover:bg-white/5
              disabled:cursor-not-allowed disabled:opacity-50
            "
          >
            Subir foto desde el equipo
          </button>
        </>
      )}

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
