'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Reconocimiento facial en el navegador.
 *
 * La librería se importa de forma DINÁMICA y apuntando a `face-api.esm.js`
 * por dos motivos:
 *
 *  - Su `main` es `dist/face-api.node.js`, que exige `@tensorflow/tfjs-node`
 *    (módulo nativo que no usamos). Al resolverlo en el servidor, Next falla.
 *  - Así el paquete (~2 MB) solo se descarga cuando alguien abre de verdad la
 *    pantalla de control de acceso.
 */

type FaceApi = typeof import('@vladmandic/face-api/dist/face-api.esm.js');

/** Dónde viven los modelos descargados (public/models/face-api). */
const RUTA_MODELOS = '/models/face-api';

/**
 * Umbral de coincidencia: distancia euclídea entre descriptores faciales.
 *
 * 0 sería la misma imagen. Lo habitual es aceptar por debajo de 0.6; aquí se
 * usa 0.5 porque esto abre una puerta y conviene errar hacia el rechazo: es
 * preferible pedir un segundo intento que dejar pasar a quien no debe.
 */
export const UMBRAL_COINCIDENCIA = 0.5;

let apiCargada: Promise<FaceApi> | null = null;

/** La librería y sus modelos (~7 MB) se cargan una sola vez por pestaña. */
function cargarTodo(): Promise<FaceApi> {
  apiCargada ??= (async () => {
    const faceapi =
      (await import('@vladmandic/face-api/dist/face-api.esm.js')) as FaceApi;

    await faceapi.nets.tinyFaceDetector.loadFromUri(RUTA_MODELOS);
    await faceapi.nets.faceLandmark68Net.loadFromUri(RUTA_MODELOS);
    await faceapi.nets.faceRecognitionNet.loadFromUri(RUTA_MODELOS);

    return faceapi;
  })();
  return apiCargada;
}

export type EstadoModelos = 'cargando' | 'listo' | 'error';

export function useFaceApi() {
  const [estado, setEstado] = useState<EstadoModelos>('cargando');
  const apiRef = useRef<FaceApi | null>(null);
  const montado = useRef(true);

  useEffect(() => {
    montado.current = true;
    cargarTodo()
      .then((api) => {
        apiRef.current = api;
        if (montado.current) setEstado('listo');
      })
      .catch((e) => {
        console.error('[FACIAL] no se pudo cargar el reconocimiento:', e);
        if (montado.current) setEstado('error');
      });
    return () => {
      montado.current = false;
    };
  }, []);

  /**
   * Extrae el descriptor facial (128 números que representan el rostro) de una
   * imagen o de un fotograma de vídeo. Devuelve null si no hay ninguna cara.
   */
  const descriptorDe = useCallback(
    async (
      fuente: HTMLVideoElement | HTMLImageElement
    ): Promise<Float32Array | null> => {
      const api = apiRef.current;
      if (!api) return null;

      const deteccion = await api
        .detectSingleFace(fuente, new api.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      return deteccion?.descriptor ?? null;
    },
    []
  );

  /** Distancia entre dos rostros. Cuanto menor, más se parecen. */
  const distanciaEntre = useCallback(
    (a: Float32Array, b: Float32Array): number =>
      apiRef.current?.euclideanDistance(a, b) ?? Number.POSITIVE_INFINITY,
    []
  );

  return { estado, descriptorDe, distanciaEntre };
}
