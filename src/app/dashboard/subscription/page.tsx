'use client';

import { useEffect, useState } from 'react';

import Image from 'next/image';

import { AlertCircle, CheckCircle, Clock, Search } from 'lucide-react';

import { NotificationToast, type ToastType } from './notification-toast';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
  subtitle?: string;
}

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
  const [searchType, setSearchType] = useState<'email' | 'document' | 'name'>(
    'email'
  );
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

        // Manejo de respuesta ESP32
        if (data.esp32?.ok) {
          setEsp32MessageType('success');
          setEsp32Message(
            type === 'entry'
              ? '✓ Entrada registrada - Puerta abierta'
              : '✓ Salida registrada - Puerta abierta'
          );
          addToast(
            data.message,
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

            {/* Campo de búsqueda */}
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
          </div>

          {/* Resultados */}
          {renderResult()}
        </div>
      </div>
    </>
  );
}
