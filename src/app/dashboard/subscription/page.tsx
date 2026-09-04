'use client';

import { useEffect, useRef, useState } from 'react';

import Image from 'next/image';

import { AlertCircle, Camera, CheckCircle, Clock, Search } from 'lucide-react';

import { NotificationToast, type ToastType } from './notification-toast';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
  subtitle?: string;
}

import {
  UMBRAL_COINCIDENCIA,
  useFaceApi,
} from '~/components/acceso/useFaceApi';
import {
  type ResultadoFacial,
  VerificacionFacial,
} from '~/components/acceso/VerificacionFacial';

interface SearchResult {
  found: boolean;
  user?: {
    id: string;
    name: string;
    email: string;
    document?: string;
    subscriptionStatus: string;
    subscriptionEndDate?: string;
    daysRemaining?: number;
    hasOpenEntry?: boolean; // Agregar para saber si tiene entrada sin cerrar
    /** Clave en S3 de la foto de referencia para la verificación facial. */
    profileImageKey?: string | null;
  };
  message?: string;
}

export default function BuscarSuscripcionPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [verificacion, setVerificacion] = useState<ResultadoFacial | null>(
    null
  );
  /** true cuando el acceso ya quedó registrado: dispara el reinicio. */
  const [accesoRegistrado, setAccesoRegistrado] = useState(false);
  const [searchType, setSearchType] = useState<
    'camera' | 'email' | 'document' | 'name'
  >('camera');

  // Cámara del control de acceso. Se abre bajo demanda con "Abrir cámara"
  // para que el navegador pida permisos con un gesto del operador (algunos
  // bloquean getUserMedia sin interacción). La identificación 1:N contra las
  // fotos de los usuarios se conecta después, cuando definamos dónde se
  // guardan esas fotos.
  const videoAccesoRef = useRef<HTMLVideoElement>(null);
  const canvasAccesoRef = useRef<HTMLCanvasElement>(null);
  const flujoAccesoRef = useRef<MediaStream | null>(null);
  const [camaraEstado, setCamaraEstado] = useState<
    'apagada' | 'pidiendo' | 'encendida' | 'error'
  >('apagada');

  // Reconocimiento facial (modelos en el navegador): dibuja los puntos de IA
  // que siguen el rostro y compara el rostro en vivo contra las fotos de los
  // usuarios (búsqueda 1:N).
  const {
    estado: estadoModelos,
    detectarLandmarks,
    descriptorDe,
    distanciaEntre,
  } = useFaceApi();

  const [identificando, setIdentificando] = useState(false);
  // Descriptores de las fotos de los candidatos, calculados una sola vez y
  // reutilizados entre intentos.
  const descriptoresCache = useRef<Map<string, Float32Array | null>>(new Map());

  const abrirCamara = async () => {
    setCamaraEstado('pidiendo');
    try {
      const flujo = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 },
        audio: false,
      });
      flujoAccesoRef.current = flujo;
      // El <video> está montado siempre en el panel, así que el ref ya
      // existe y podemos engancharle el stream de una vez. Antes el <video>
      // solo se renderizaba cuando el estado era "encendida", por lo que al
      // asignar srcObject el ref era null y la imagen quedaba en negro
      // aunque la cámara sí encendiera.
      if (videoAccesoRef.current) {
        videoAccesoRef.current.srcObject = flujo;
        await videoAccesoRef.current.play().catch(() => undefined);
      }
      setCamaraEstado('encendida');
    } catch (err) {
      console.error('[ACCESO] no se pudo abrir la cámara:', err);
      setCamaraEstado('error');
    }
  };

  const cerrarCamara = () => {
    flujoAccesoRef.current?.getTracks().forEach((t) => t.stop());
    flujoAccesoRef.current = null;
    if (videoAccesoRef.current) videoAccesoRef.current.srcObject = null;
    setCamaraEstado('apagada');
  };

  // Puntos de IA que siguen el rostro: mientras la cámara está encendida y los
  // modelos listos, detecta los 68 landmarks por fotograma y los dibuja sobre
  // un lienzo superpuesto, con líneas y un recuadro tipo escáner para dar el
  // aire futurista. Todo ocurre en el navegador; nada se envía a un servidor.
  useEffect(() => {
    if (camaraEstado !== 'encendida' || estadoModelos !== 'listo') return;

    const canvasFijo = canvasAccesoRef.current;

    let animId = 0;
    let activo = true;
    let procesando = false;

    type Punto = { x: number; y: number };
    type Caja = { x: number; y: number; width: number; height: number };

    // "objetivo" = última detección real. "suave*" = valores interpolados que
    // se acercan al objetivo cada fotograma para que el movimiento sea fluido.
    let objetivoPuntos: Punto[] | null = null;
    let objetivoCaja: Caja | null = null;
    let suavePuntos: Punto[] | null = null;
    let suaveCaja: Caja | null = null;
    let dims: { ancho: number; alto: number } | null = null;
    let ultimaDeteccion = 0;
    let alfa = 0; // aparición/desaparición suave

    // Cuánto se acerca lo suavizado al objetivo por fotograma (0-1).
    const LERP = 0.35;
    // Se mantiene visible este tiempo tras la última cara vista, para que un
    // fotograma sin detección no lo haga parpadear.
    const GRACIA_MS = 500;

    const lerp = (a: number, b: number) => a + (b - a) * LERP;

    const dibujar = () => {
      const video = videoAccesoRef.current;
      const canvas = canvasAccesoRef.current;
      if (!activo || !video || !canvas) return;

      if (!procesando && video.videoWidth > 0) {
        procesando = true;
        void detectarLandmarks(video)
          .then((res) => {
            if (res) {
              objetivoPuntos = res.puntos;
              objetivoCaja = res.caja;
              dims = { ancho: res.ancho, alto: res.alto };
              ultimaDeteccion = performance.now();
            }
          })
          .catch(() => undefined)
          .finally(() => {
            procesando = false;
          });
      }

      const ctx = canvas.getContext('2d');
      if (ctx && dims) {
        if (canvas.width !== dims.ancho || canvas.height !== dims.alto) {
          canvas.width = dims.ancho;
          canvas.height = dims.alto;
        }

        // Interpolar hacia el objetivo.
        if (objetivoPuntos && objetivoCaja) {
          if (!suavePuntos || suavePuntos.length !== objetivoPuntos.length) {
            suavePuntos = objetivoPuntos.map((p) => ({ ...p }));
            suaveCaja = { ...objetivoCaja };
          } else {
            for (let i = 0; i < suavePuntos.length; i++) {
              suavePuntos[i].x = lerp(suavePuntos[i].x, objetivoPuntos[i].x);
              suavePuntos[i].y = lerp(suavePuntos[i].y, objetivoPuntos[i].y);
            }
            if (suaveCaja) {
              suaveCaja.x = lerp(suaveCaja.x, objetivoCaja.x);
              suaveCaja.y = lerp(suaveCaja.y, objetivoCaja.y);
              suaveCaja.width = lerp(suaveCaja.width, objetivoCaja.width);
              suaveCaja.height = lerp(suaveCaja.height, objetivoCaja.height);
            }
          }
        }

        const vigente =
          performance.now() - ultimaDeteccion < GRACIA_MS && !!suavePuntos;
        // Subir/bajar alfa suavemente.
        alfa = lerp(alfa, vigente ? 1 : 0);

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (alfa > 0.01 && suavePuntos && suaveCaja) {
          const cian = '#22C4D3';
          ctx.globalAlpha = alfa;
          ctx.shadowColor = cian;

          // Recuadro tipo escáner (solo esquinas).
          const { x, y, width, height } = suaveCaja;
          const c = Math.min(width, height) * 0.22;
          ctx.strokeStyle = cian;
          ctx.lineWidth = 2;
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.moveTo(x, y + c);
          ctx.lineTo(x, y);
          ctx.lineTo(x + c, y);
          ctx.moveTo(x + width - c, y);
          ctx.lineTo(x + width, y);
          ctx.lineTo(x + width, y + c);
          ctx.moveTo(x + width, y + height - c);
          ctx.lineTo(x + width, y + height);
          ctx.lineTo(x + width - c, y + height);
          ctx.moveTo(x + c, y + height);
          ctx.lineTo(x, y + height);
          ctx.lineTo(x, y + height - c);
          ctx.stroke();

          // Puntos con brillo.
          ctx.fillStyle = cian;
          ctx.shadowBlur = 6;
          for (const p of suavePuntos) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, 1.6, 0, Math.PI * 2);
            ctx.fill();
          }

          ctx.globalAlpha = 1;
          ctx.shadowBlur = 0;
        }
      }

      animId = requestAnimationFrame(dibujar);
    };

    animId = requestAnimationFrame(dibujar);

    return () => {
      activo = false;
      cancelAnimationFrame(animId);
      const ctx = canvasFijo?.getContext('2d');
      if (canvasFijo && ctx)
        ctx.clearRect(0, 0, canvasFijo.width, canvasFijo.height);
    };
  }, [camaraEstado, estadoModelos, detectarLandmarks]);

  // Apaga la cámara al salir de la página o al cambiar de pestaña.
  useEffect(() => {
    if (searchType !== 'camera') cerrarCamara();
    return () => cerrarCamara();
  }, [searchType]);
  const [loading, setLoading] = useState(false);
  const [actionType, setActionType] = useState<'entry' | 'exit' | null>(null);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [esp32Message, setEsp32Message] = useState<string | null>(null);
  const [esp32MessageType, setEsp32MessageType] = useState<
    'success' | 'warning' | 'error'
  >('success');
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    document.body.classList.add('no-chrome');
    document.body.style.overflow = 'auto';
    return () => {
      document.body.classList.remove('no-chrome');
      document.body.style.overflow = '';
    };
  }, []);

  const addToast = (
    message: string,
    type: ToastType,
    duration = 5000,
    subtitle?: string
  ) => {
    const id = `toast-${Date.now()}`;
    setToasts((prev) => [...prev, { id, message, type, duration, subtitle }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  /**
   * Limpia la pantalla para la siguiente persona.
   *
   * Solo tras REGISTRAR el acceso, nunca tras buscar. Antes se disparaba en
   * cuanto terminaba la búsqueda y la ficha desaparecía a los 5 segundos,
   * con la cámara abierta y sin haber dado tiempo a verificar el rostro.
   */
  useEffect(() => {
    if (!accesoRegistrado) return;

    const timer = setTimeout(() => {
      setResult(null);
      setSearchTerm('');
      setEsp32Message(null);
      setVerificacion(null);
      setAccesoRegistrado(false);
    }, 8000);

    return () => clearTimeout(timer);
  }, [accesoRegistrado]);

  /** Calcula el descriptor facial de una foto por URL (con caché por id). */
  const descriptorDeFoto = async (
    url: string
  ): Promise<Float32Array | null> => {
    // `document.createElement('img')` y no `new Image()`: aquí `Image` es el
    // componente de next/image, que no es constructor.
    const img = document.createElement('img');
    img.crossOrigin = 'anonymous';
    img.src = url;
    try {
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('no se pudo cargar la foto'));
      });
      return await descriptorDe(img);
    } catch {
      return null;
    }
  };

  /**
   * Identificación 1:N: toma el rostro de la cámara y busca a quién pertenece
   * entre las personas con foto biométrica. Si encuentra coincidencia, carga
   * sus datos y marca la verificación como positiva para poder registrar el
   * acceso. Todo el reconocimiento ocurre en el navegador.
   */
  // Convierte la distancia euclídea (0 = idéntico) a un porcentaje de
  // coincidencia entendible: 100% sería la misma cara.
  const aPorcentaje = (distancia: number) =>
    Math.max(0, Math.min(100, Math.round((1 - distancia) * 100)));

  const identificar = async () => {
    const video = videoAccesoRef.current;
    if (!video || camaraEstado !== 'encendida') return;
    if (estadoModelos !== 'listo') {
      addToast('Cargando modelos…', 'warning', 3000, 'Espera un momento');
      return;
    }

    setIdentificando(true);
    setError(null);
    try {
      const enVivo = await descriptorDe(video);
      if (!enVivo) {
        addToast(
          'No se detectó ningún rostro',
          'error',
          4000,
          'Acércate y mira a la cámara'
        );
        return;
      }

      const res = await fetch('/api/acceso/candidatos');
      const data: unknown = await res.json().catch(() => null);
      const candidatos =
        data &&
        typeof data === 'object' &&
        'candidatos' in data &&
        Array.isArray((data as { candidatos: unknown }).candidatos)
          ? (
              data as {
                candidatos: {
                  id: string;
                  name: string;
                  email: string;
                  fotoUrl: string | null;
                }[];
              }
            ).candidatos
          : [];

      if (candidatos.length === 0) {
        addToast(
          'No hay fotos biométricas registradas',
          'warning',
          4000,
          'Sube fotos desde el administrador de usuarios'
        );
        return;
      }

      let mejorEmail: string | null = null;
      let mejorDist = Number.POSITIVE_INFINITY;

      for (const c of candidatos) {
        if (!c.fotoUrl) continue;
        let desc = descriptoresCache.current.get(c.id);
        if (desc === undefined) {
          desc = await descriptorDeFoto(c.fotoUrl);
          descriptoresCache.current.set(c.id, desc);
        }
        if (!desc) continue;
        const dist = distanciaEntre(enVivo, desc);
        if (dist < mejorDist) {
          mejorDist = dist;
          mejorEmail = c.email;
        }
      }

      if (mejorEmail && mejorDist < UMBRAL_COINCIDENCIA) {
        // Cargar los datos completos (suscripción, etc.) de la persona.
        const sr = await fetch('/api/super-admin/search-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ searchTerm: mejorEmail, searchType: 'email' }),
        });
        const srData: unknown = await sr.json().catch(() => null);
        if (
          sr.ok &&
          srData &&
          typeof srData === 'object' &&
          'found' in srData &&
          (srData as SearchResult).found
        ) {
          const identificado = srData as SearchResult;
          setResult(identificado);
          setVerificacion({ coincide: true, distancia: mejorDist });
          addToast(
            `Identificado: ${identificado.user?.name ?? mejorEmail}`,
            'success',
            5000,
            `Coincidencia ${aPorcentaje(mejorDist)}%`
          );

          // Auditoría de la verificación (no bloquea el acceso).
          void fetch('/api/acceso/verificacion-facial', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: identificado.user?.id ?? null,
              searchTerm: mejorEmail,
              granted: true,
              distance: mejorDist,
              reason: null,
            }),
          }).catch(() => undefined);

          // Registrar acceso y activar el ESP32 automáticamente.
          await registrarAcceso(identificado);
        } else {
          addToast(
            'Rostro reconocido, pero sin datos',
            'warning',
            4000,
            'La persona no aparece en la búsqueda'
          );
        }
      } else {
        addToast(
          'No se identificó a la persona',
          'error',
          4000,
          mejorDist < Number.POSITIVE_INFINITY
            ? `El rostro no coincide (mejor ${aPorcentaje(mejorDist)}%)`
            : 'No se pudo comparar con ninguna foto'
        );
      }
    } catch (error) {
      console.error('[ACCESO] error identificando:', error);
      addToast('Error al identificar', 'error', 4000);
    } finally {
      setIdentificando(false);
    }
  };

  const handleRegister = async () => {
    if (!searchTerm.trim()) {
      setError('Por favor ingresa un término de búsqueda');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setEsp32Message(null);

    try {
      // Paso 1: Buscar usuario
      const searchResponse = await fetch('/api/super-admin/search-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          searchTerm: searchTerm.trim(),
          searchType,
        }),
      });

      const searchData: unknown = await searchResponse.json();

      if (!searchResponse.ok) {
        const errorMessage =
          typeof searchData === 'object' &&
          searchData !== null &&
          'error' in searchData
            ? (searchData as { error: string }).error
            : 'Error en la búsqueda';
        throw new Error(errorMessage);
      }

      if (
        typeof searchData !== 'object' ||
        searchData === null ||
        !('found' in searchData)
      ) {
        throw new Error('Respuesta inválida del servidor');
      }

      const searchResult = searchData as SearchResult;

      if (!searchResult.found) {
        setResult(searchResult);
        addToast(
          'Usuario no encontrado',
          'error',
          4000,
          'Verifica email, documento o nombre'
        );
        return;
      }

      // Encontrada: aquí termina la búsqueda. El registro NO se dispara
      // solo — antes hay que verificar el rostro (ver registrarAcceso).
      setResult(searchResult);
      setVerificacion(null);
      setAccesoRegistrado(false);
      return;
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : 'Error en la búsqueda';
      setError(errorMsg);
      addToast('Error en la búsqueda', 'error', 5000, errorMsg);
    } finally {
      setLoading(false);
    }
  };

  /** URL pública de la foto de referencia, o null si no tiene. */
  const fotoReferencia = (() => {
    const key = result?.user?.profileImageKey;
    if (!key) return null;
    if (key.startsWith('http')) return key;
    return `https://s3.us-east-2.amazonaws.com/artiefy-upload/${key}`;
  })();

  /**
   * Veredicto de la verificación facial.
   *
   * Todo intento queda registrado, conceda o deniegue: los denegados son
   * precisamente los que hay que poder auditar después. El registro se hace
   * en segundo plano y nunca bloquea el acceso de quien sí coincide.
   */
  const alVerificarRostro = (resultado: ResultadoFacial) => {
    setVerificacion(resultado);

    void fetch('/api/acceso/verificacion-facial', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: result?.user?.id ?? null,
        searchTerm: searchTerm.trim(),
        granted: resultado.coincide,
        distance: resultado.distancia,
        reason: resultado.motivo ?? null,
      }),
    }).catch(() => {
      // El registro es auditoría, no un requisito para abrir la puerta.
    });

    if (!resultado.coincide) {
      const detalle =
        resultado.motivo === 'sin_referencia'
          ? 'La persona no tiene foto de referencia registrada'
          : resultado.motivo === 'sin_rostro'
            ? 'No se detectó un rostro en la cámara'
            : 'El rostro no coincide con la foto registrada';
      addToast('Acceso denegado', 'error', 6000, detalle);
      return;
    }

    if (result) void registrarAcceso(result);
  };

  /**
   * Registra la entrada o salida. Solo se llama cuando la verificación
   * facial ha dado positivo.
   */
  const registrarAcceso = async (searchResult: SearchResult) => {
    setLoading(true);
    setError(null);
    setEsp32Message(null);

    try {
      // Usuario encontrado
      setResult(searchResult);
      const userId = searchResult.user?.id;

      if (!userId) {
        throw new Error('ID de usuario no disponible');
      }

      // Determinar si es entrada o salida
      const type = searchResult.user?.hasOpenEntry ? 'exit' : 'entry';
      setActionType(type);

      // Paso 2: Registrar entrada o salida
      const registerResponse = await fetch('/api/super-admin/register-access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          action: type,
        }),
      });

      const registerData: unknown = await registerResponse.json();

      if (!registerResponse.ok) {
        const errorMsg =
          typeof registerData === 'object' &&
          registerData !== null &&
          'error' in registerData
            ? (registerData as { error: string }).error
            : 'Error al registrar';

        const errorDetails =
          typeof registerData === 'object' &&
          registerData !== null &&
          'details' in registerData
            ? (registerData as { details: string }).details
            : '';

        setEsp32MessageType('error');
        setEsp32Message(`⚠ ${errorMsg}`);
        addToast(`Error: ${errorMsg}`, 'error', 6000, errorDetails);
        setTimeout(() => setEsp32Message(null), 6000);
        return;
      }

      // Procesar respuesta exitosa
      if (
        typeof registerData === 'object' &&
        registerData !== null &&
        'success' in registerData &&
        (registerData as { success: boolean }).success
      ) {
        const data = registerData as {
          success: boolean;
          message: string;
          esp32?: {
            ok: boolean;
            status?: number;
            reason?:
              | 'success'
              | 'timeout'
              | 'error'
              | 'not_configured'
              | 'inactive'
              | 'unauthorized';
          };
        };

        const nombre = searchResult.user?.name ?? 'Usuario';

        // Manejo de respuesta ESP32
        if (data.esp32?.ok) {
          setEsp32MessageType('success');
          setEsp32Message(
            type === 'entry'
              ? `✓ Entrada de ${nombre} — Puerta abierta`
              : `✓ Salida de ${nombre} — Puerta abierta`
          );
          addToast(
            `${type === 'entry' ? 'Entrada' : 'Salida'} de ${nombre}`,
            'success',
            5000,
            'ESP32: Activo • Acceso permitido'
          );
          setTimeout(() => setEsp32Message(null), 5000);
        } else if (data.esp32?.reason === 'timeout') {
          setEsp32MessageType('error');
          setEsp32Message('⚠ Timeout: ESP32 no responde');
          addToast(
            data.message,
            type === 'exit' ? 'warning' : 'error',
            6000,
            'ESP32: Timeout (5000ms)'
          );
          setTimeout(() => setEsp32Message(null), 6000);
        } else if (data.esp32?.reason === 'error') {
          setEsp32MessageType('error');
          setEsp32Message('⚠ Error conectando a ESP32');
          addToast(
            data.message,
            type === 'exit' ? 'warning' : 'error',
            6000,
            'ESP32: Error de conexión'
          );
          setTimeout(() => setEsp32Message(null), 6000);
        } else if (data.esp32?.reason === 'not_configured') {
          setEsp32MessageType('warning');
          setEsp32Message('ℹ ESP32 no configurado');
          addToast(data.message, 'warning', 4000, 'ESP32: No configurado');
          setTimeout(() => setEsp32Message(null), 4000);
        } else if (data.esp32?.reason === 'inactive') {
          setEsp32MessageType('warning');
          setEsp32Message(
            type === 'exit'
              ? '✓ Salida registrada (suscripción inactiva)'
              : '⚠ Suscripción inactiva'
          );
          addToast(
            data.message,
            type === 'exit' ? 'success' : 'warning',
            5000,
            type === 'exit' ? 'Salida permitida sin ESP32' : 'Acceso denegado'
          );
          setTimeout(() => setEsp32Message(null), 5000);
        } else {
          setEsp32MessageType('success');
          setEsp32Message(
            `✓ ${type === 'entry' ? 'Entrada' : 'Salida'} registrada`
          );
          addToast(data.message, 'success', 4000);
          setTimeout(() => setEsp32Message(null), 4000);
        }
      }
      // Registrado: a partir de aquí sí tiene sentido reiniciar la pantalla
      // para la siguiente persona.
      setAccesoRegistrado(true);
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : 'Error al registrar acceso';
      setError(errorMsg);
      addToast('Error al registrar acceso', 'error', 5000, errorMsg);
    } finally {
      setLoading(false);
      setActionType(null);
    }
  };

  const renderResult = () => {
    if (!result) return null;

    if (!result.found) {
      return (
        <div
          className="
            xs:mt-5 xs:p-4
            mt-4 rounded-lg border border-red-500/30 bg-red-950/20 p-3
            sm:mt-6 sm:p-6
          "
        >
          <div
            className="
              xs:gap-3
              flex flex-col gap-3
              sm:flex-row sm:items-center sm:gap-4
            "
          >
            <AlertCircle
              className="
                xs:h-6 xs:w-6
                size-5 flex-shrink-0 text-red-400
                sm:size-6
              "
            />
            <div className="flex-1">
              <h3
                className="
                  xs:text-base
                  text-sm font-semibold text-red-400
                  sm:text-lg
                "
              >
                Usuario no encontrado
              </h3>
              <p
                className="
                  xs:text-xs
                  mt-1 text-xs text-gray-400
                  sm:text-sm
                "
              >
                {result.message ??
                  'No se encontró ningún usuario con los datos proporcionados'}
              </p>
            </div>
          </div>
        </div>
      );
    }

    const { user } = result;
    const isActive = user?.subscriptionStatus === 'active';
    const daysRemaining = user?.daysRemaining ?? 0;

    return (
      <div
        className="
          xs:mt-5 xs:space-y-3
          mt-4 space-y-2
          sm:mt-6 sm:space-y-4
          md:space-y-5
        "
      >
        {/* Verificación facial: sin ella no se registra el acceso. La
            comparación ocurre en este navegador; la cámara no envía la
            imagen a ningún servidor. */}
        {!verificacion?.coincide && (
          <div
            className="
              rounded-lg border border-cyan-500/30 bg-slate-900/60 p-4
            "
          >
            <p className="mb-3 text-center text-sm font-semibold text-cyan-300">
              Verifica el rostro para continuar
            </p>
            {/* Solo verifica. Subir la foto de referencia se hace desde
                otro sitio, no en la puerta. */}
            <VerificacionFacial
              fotoReferencia={fotoReferencia}
              onResultado={alVerificarRostro}
              ocupado={loading}
            />
          </div>
        )}

        {/* Información del usuario */}
        <div
          className="
            xs:p-4
            rounded-lg border border-gray-700 bg-gray-800/50 p-3
            sm:p-6
          "
        >
          <h3
            className="
              xs:mb-3 xs:text-lg
              mb-2 text-base font-bold text-cyan-400
              sm:mb-4 sm:text-xl
            "
          >
            Información del Usuario
          </h3>
          <div
            className="
              xs:space-y-2 xs:text-sm
              space-y-1.5 text-xs text-gray-300
              sm:text-base
            "
          >
            <p className="break-words">
              <span className="font-semibold text-gray-400">Nombre:</span>{' '}
              {user?.name ?? 'N/A'}
            </p>
            <p className="break-all">
              <span className="font-semibold text-gray-400">Email:</span>{' '}
              {user?.email}
            </p>
            {user?.document && (
              <p className="break-all">
                <span className="font-semibold text-gray-400">Documento:</span>{' '}
                {user.document}
              </p>
            )}
          </div>
        </div>

        {/* Estado de suscripción */}
        {isActive ? (
          <div
            className="
              xs:p-4
              rounded-lg border border-green-500/30 bg-green-950/20 p-3
              sm:p-6
            "
          >
            <div
              className="
                xs:gap-3
                flex flex-col gap-3
                sm:flex-row sm:items-start sm:gap-4
              "
            >
              <CheckCircle
                className="
                  xs:h-6 xs:w-6
                  size-5 flex-shrink-0 text-green-400
                  sm:size-6
                "
              />
              <div className="flex-1">
                <h3
                  className="
                    xs:mb-2 xs:text-base
                    mb-2 text-sm font-semibold text-green-400
                    sm:text-lg
                  "
                >
                  Suscripción Activa
                </h3>
                <div
                  className="
                    xs:space-y-2 xs:text-sm
                    space-y-1.5 text-xs text-gray-300
                    sm:text-base
                  "
                >
                  <div className="flex items-center gap-2">
                    <Clock
                      className="
                        xs:h-4 xs:w-4
                        size-3.5 flex-shrink-0 text-cyan-400
                        sm:size-5
                      "
                    />
                    <span
                      className="
                        xs:text-xs
                        text-xs
                        sm:text-sm
                      "
                    >
                      <span className="font-semibold text-cyan-400">
                        {daysRemaining}
                      </span>{' '}
                      {daysRemaining === 1 ? 'día restante' : 'días restantes'}
                    </span>
                  </div>
                  {user?.subscriptionEndDate && (
                    <p
                      className="
                        xs:text-xs
                        text-xs text-gray-400
                        sm:text-sm
                      "
                    >
                      Vence el:{' '}
                      {new Date(user.subscriptionEndDate).toLocaleDateString(
                        'es-ES',
                        {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        }
                      )}
                    </p>
                  )}
                </div>
                {esp32Message && (
                  <div
                    className={`
                      xs:mt-2.5 xs:p-2.5
                      mt-2 rounded border p-2
                      sm:mt-3 sm:p-3
                      ${
                        esp32MessageType === 'success'
                          ? 'border-green-500/30 bg-green-950/20'
                          : esp32MessageType === 'warning'
                            ? 'border-blue-500/30 bg-blue-950/20'
                            : 'border-red-500/30 bg-red-950/20'
                      }
                    `}
                  >
                    <p
                      className={`
                        text-xs
                        ${
                          esp32MessageType === 'success'
                            ? 'text-green-300'
                            : esp32MessageType === 'warning'
                              ? 'text-blue-300'
                              : 'text-red-300'
                        }
                      `}
                    >
                      {esp32Message}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div
            className="
              xs:p-4
              rounded-lg border border-yellow-500/30 bg-yellow-950/20 p-3
              sm:p-6
            "
          >
            <div
              className="
                xs:gap-3
                flex flex-col gap-3
                sm:flex-row sm:items-center sm:gap-4
              "
            >
              <AlertCircle
                className="
                  xs:h-6 xs:w-6
                  size-5 flex-shrink-0 text-yellow-400
                  sm:size-6
                "
              />
              <div className="flex-1">
                <h3
                  className="
                    xs:text-base
                    text-sm font-semibold text-yellow-400
                    sm:text-lg
                  "
                >
                  Suscripción Vencida o Inactiva
                </h3>
                <p
                  className="
                    xs:mt-1 xs:text-xs
                    mt-1 text-xs text-gray-400
                    sm:text-sm
                  "
                >
                  Este usuario no tiene una suscripción activa
                </p>
                {user?.subscriptionEndDate && (
                  <p
                    className="
                      xs:mt-2
                      mt-1.5 text-xs text-gray-500
                      sm:text-sm
                    "
                  >
                    Venció el:{' '}
                    {new Date(user.subscriptionEndDate).toLocaleDateString(
                      'es-ES',
                      {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      }
                    )}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <NotificationToast toasts={toasts} onRemove={removeToast} />
      {/* Fondo vivo: azul noche de marca, rejilla técnica muy tenue y dos
          auroras cian que derivan despacio. Todo decorativo y detrás del
          contenido; se detiene si el sistema pide menos movimiento. */}
      <div
        className="
          relative flex min-h-screen w-full items-center justify-center
          overflow-hidden bg-[#04101f] px-4 py-10
        "
      >
        <div aria-hidden className="rejilla-tenue absolute inset-0" />
        <div
          aria-hidden
          className="
            aurora pointer-events-none absolute -top-1/4 left-1/4 size-[42rem]
            rounded-full bg-[#22C4D3]/20 blur-[140px]
          "
        />
        <div
          aria-hidden
          className="
            aurora-lenta pointer-events-none absolute right-1/4 -bottom-1/3
            size-[38rem] rounded-full bg-[#1c7ed6]/15 blur-[140px]
          "
        />

        <div className="relative w-full max-w-2xl">
          {/* Cabecera: logo pequeño arriba, etiqueta de sección y un título
              grande. La descripción larga se resume: quien opera la puerta ya
              sabe para qué sirve esta pantalla. */}
          <div className="mb-8 flex flex-col items-center text-center">
            <Image
              src="/artiefy-logo.png"
              alt="Artiefy"
              width={220}
              height={64}
              className="mb-6 h-auto w-[130px] object-contain opacity-90"
              priority
            />

            <span
              className="
                mb-4 inline-flex items-center gap-2 rounded-full border
                border-[#22C4D3]/25 bg-[#22C4D3]/10 px-3 py-1 text-[11px]
                font-semibold tracking-[0.14em] text-[#22C4D3] uppercase
              "
            >
              <span className="relative flex size-1.5">
                <span
                  className="
                    absolute inline-flex size-full animate-ping rounded-full
                    bg-[#22C4D3] opacity-75
                  "
                />
                <span
                  className="
                    relative inline-flex size-1.5 rounded-full bg-[#22C4D3]
                  "
                />
              </span>
              Control de acceso
            </span>

            <h1
              className="
                text-4xl font-bold tracking-tight text-balance text-white
                sm:text-5xl
              "
            >
              Verificación de{' '}
              <span
                className="
                  bg-gradient-to-r from-[#22C4D3] to-[#7ee8f2] bg-clip-text
                  text-transparent
                "
              >
                suscripción
              </span>
            </h1>

            <p className="mt-3 max-w-md text-sm text-white/45">
              Busca por correo, documento o nombre para registrar el acceso.
            </p>
          </div>

          {/* Formulario, en tarjeta de cristal sobre el fondo vivo. */}
          <div
            className="
              space-y-5 rounded-2xl border border-white/10 bg-white/[0.04] p-6
              shadow-2xl shadow-black/50 backdrop-blur-2xl
              sm:p-8
            "
          >
            {/* Selector de tipo de búsqueda: control segmentado, con la
                pastilla activa marcada en el cian de marca. Ocupa una sola
                fila y deja claro que son opciones excluyentes. */}
            <div>
              <label className="mb-2 block text-xs font-medium text-white/50">
                Buscar por
              </label>
              <div
                className="
                  flex gap-1 rounded-xl border border-white/10 bg-black/20 p-1
                "
              >
                {(
                  [
                    ['camera', 'Cámara'],
                    ['email', 'Correo'],
                    ['document', 'Documento'],
                    ['name', 'Nombre'],
                  ] as const
                ).map(([valor, etiqueta]) => (
                  <button
                    key={valor}
                    type="button"
                    onClick={() => setSearchType(valor)}
                    className={`
                      flex-1 rounded-lg px-3 py-2 text-xs font-semibold
                      transition-all duration-200
                      sm:text-sm
                      ${
                        searchType === valor
                          ? `
                            bg-[#22C4D3] text-[#04101f]
                            shadow-lg shadow-[#22C4D3]/25
                          `
                          : `
                            text-white/60
                            hover:bg-white/5 hover:text-white
                          `
                      }
                    `}
                  >
                    {etiqueta}
                  </button>
                ))}
              </div>
            </div>

            {/* Panel de cámara: primera opción del control de acceso.
                La foto capturada NO se envía a ningún servidor; la
                identificación 1:N se hará en el navegador contra los
                descriptores precalculados de los usuarios con foto. */}
            {searchType === 'camera' && (
              <div>
                <label className="mb-2 block text-xs font-medium text-white/50">
                  Foto de verificación
                </label>
                <div
                  className="
                    relative flex aspect-[4/3] w-full items-center
                    justify-center overflow-hidden rounded-xl border
                    border-white/10 bg-black/30
                  "
                >
                  {/* El <video> se monta siempre para que su ref exista
                      cuando enganchamos el stream; se oculta hasta que la
                      cámara esté encendida. */}
                  <video
                    ref={videoAccesoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`size-full -scale-x-100 object-cover ${
                      camaraEstado === 'encendida' ? '' : 'invisible'
                    }`}
                  />

                  {/* Lienzo para los puntos de IA que siguen el rostro. */}
                  <canvas
                    ref={canvasAccesoRef}
                    className="pointer-events-none absolute inset-0 size-full -scale-x-100"
                  />

                  {camaraEstado !== 'encendida' && (
                    <div
                      className="
                        absolute inset-0 flex flex-col items-center
                        justify-center gap-2 px-4 text-center text-white/40
                      "
                    >
                      <Camera className="size-8" />
                      <span className="text-sm">
                        {camaraEstado === 'pidiendo'
                          ? 'Solicitando acceso a la cámara…'
                          : camaraEstado === 'error'
                            ? 'No se pudo abrir la cámara. Revisa los permisos del navegador.'
                            : 'Activa la cámara para verificar'}
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => void abrirCamara()}
                    disabled={camaraEstado === 'pidiendo'}
                    className="
                      flex w-full items-center justify-center gap-2 rounded-xl
                      bg-[#22C4D3] px-4 py-2.5 text-sm font-semibold
                      text-[#04101f] transition-colors
                      hover:bg-[#3ad4e2]
                      focus:ring-2 focus:ring-[#22C4D3]/50 focus:outline-none
                      disabled:cursor-not-allowed disabled:opacity-50
                    "
                  >
                    <Camera className="size-4" />
                    {camaraEstado === 'encendida'
                      ? 'Reiniciar cámara'
                      : 'Abrir cámara'}
                  </button>

                  {camaraEstado === 'encendida' && (
                    <button
                      type="button"
                      onClick={() => void identificar()}
                      disabled={identificando || estadoModelos !== 'listo'}
                      className="
                        mt-2 flex w-full items-center justify-center gap-2
                        rounded-xl border border-[#22C4D3]/40 bg-[#22C4D3]/10
                        px-4 py-2.5 text-sm font-semibold text-[#22C4D3]
                        transition-colors
                        hover:bg-[#22C4D3]/20
                        focus:ring-2 focus:ring-[#22C4D3]/50 focus:outline-none
                        disabled:cursor-not-allowed disabled:opacity-50
                      "
                    >
                      {identificando ? (
                        <>
                          <span className="size-4 animate-spin rounded-full border-2 border-[#22C4D3] border-t-transparent" />
                          Identificando…
                        </>
                      ) : estadoModelos !== 'listo' ? (
                        'Cargando modelos…'
                      ) : (
                        <>
                          <Search className="size-4" />
                          Identificar persona
                        </>
                      )}
                    </button>
                  )}
                </div>

                <p className="mt-3 text-center text-xs text-white/40">
                  La identificación automática por rostro se activará en cuanto
                  registremos las fotos biométricas de los usuarios.
                </p>
              </div>
            )}

            {/* Campo de búsqueda */}
            {searchType !== 'camera' && (
              <div>
                <label
                  htmlFor="search"
                  className="mb-2 block text-xs font-medium text-white/50"
                >
                  {searchType === 'email'
                    ? 'Correo electrónico'
                    : searchType === 'document'
                      ? 'Número de documento'
                      : 'Nombre del usuario'}
                </label>
                <div className="relative">
                  <input
                    type={searchType === 'email' ? 'email' : 'text'}
                    id="search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={
                      searchType === 'email'
                        ? 'ejemplo@correo.com'
                        : searchType === 'document'
                          ? '1234567890'
                          : 'Juan Pérez'
                    }
                    onKeyDown={(e) => {
                      // Enter busca: es un formulario de un solo campo y obliga
                      // a bajar el ratón hasta el botón sin motivo.
                      if (e.key === 'Enter' && !loading) void handleRegister();
                    }}
                    className="
                    w-full rounded-xl border border-white/10 bg-black/25 py-3
                    pr-4 pl-11 text-base text-white transition-all
                    placeholder:text-white/30
                    focus:border-[#22C4D3]/60 focus:bg-black/40
                    focus:ring-2 focus:ring-[#22C4D3]/25 focus:outline-none
                  "
                  />
                  <Search
                    className="
                    absolute top-1/2 left-4 size-4 -translate-y-1/2
                    text-white/40
                  "
                  />
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div
                className="
                  xs:p-3.5
                  rounded-lg border border-red-500/30 bg-red-950/20 p-3
                  sm:p-4
                "
              >
                <p
                  className="
                    xs:text-xs
                    text-xs text-red-400
                    sm:text-sm
                  "
                >
                  {error}
                </p>
              </div>
            )}

            {/* Botón Inteligente - Registrar Acceso */}
            {searchType !== 'camera' && (
              <div
                className="
                xs:pt-3
                flex flex-col gap-3 pt-2
                sm:flex-row sm:justify-center sm:gap-4 sm:pt-4
              "
              >
                <button
                  type="button"
                  onClick={handleRegister}
                  disabled={loading}
                  className="
                  flex-1 rounded-xl bg-[#22C4D3] px-6 py-3 text-base
                  font-bold text-[#04101f] shadow-lg shadow-[#22C4D3]/25
                  transition-all duration-200
                  hover:-translate-y-0.5 hover:bg-[#3ad4e2]
                  hover:shadow-xl hover:shadow-[#22C4D3]/35
                  focus:ring-2 focus:ring-[#22C4D3]/50 focus:outline-none
                  disabled:cursor-not-allowed disabled:opacity-50
                  disabled:hover:translate-y-0
                  sm:flex-none sm:px-10
                "
                >
                  {loading ? (
                    <span
                      className="
                      xs:gap-2
                      flex items-center justify-center gap-2
                      sm:gap-2
                    "
                    >
                      <svg
                        className="
                        xs:h-4 xs:w-4
                        size-4 animate-spin
                        sm:size-5
                      "
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      {actionType === 'entry'
                        ? 'Registrando entrada...'
                        : actionType === 'exit'
                          ? 'Registrando salida...'
                          : 'Buscando...'}
                    </span>
                  ) : (
                    // Este botón ya solo busca: el registro ocurre después de
                    // que la verificación facial dé positivo.
                    '🔎 Buscar persona'
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Resultados */}
          {renderResult()}
        </div>
      </div>
    </>
  );
}
