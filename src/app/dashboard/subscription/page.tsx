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
  };
  message?: string;
}

export default function BuscarSuscripcionPage() {
  const [searchTerm, setSearchTerm] = useState('');
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

  // Limpiar resultado después de 5 segundos de completar la acción
  useEffect(() => {
    if (result && !loading) {
      const timer = setTimeout(() => {
        setResult(null);
        setSearchTerm('');
        setEsp32Message(null);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [result, loading]);

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
        <div className="xs:mt-5 xs:p-4 mt-4 rounded-lg border border-red-500/30 bg-red-950/20 p-3 sm:mt-6 sm:p-6">
          <div className="xs:gap-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <AlertCircle className="xs:h-6 xs:w-6 h-5 w-5 flex-shrink-0 text-red-400 sm:h-6 sm:w-6" />
            <div className="flex-1">
              <h3 className="xs:text-base text-sm font-semibold text-red-400 sm:text-lg">
                Usuario no encontrado
              </h3>
              <p className="xs:text-xs mt-1 text-xs text-gray-400 sm:text-sm">
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
      <div className="xs:mt-5 xs:space-y-3 mt-4 space-y-2 sm:mt-6 sm:space-y-4 md:space-y-5">
        {/* Información del usuario */}
        <div className="xs:p-4 rounded-lg border border-gray-700 bg-gray-800/50 p-3 sm:p-6">
          <h3 className="xs:mb-3 xs:text-lg mb-2 text-base font-bold text-cyan-400 sm:mb-4 sm:text-xl">
            Información del Usuario
          </h3>
          <div className="xs:space-y-2 xs:text-sm space-y-1.5 text-xs text-gray-300 sm:text-base">
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
          <div className="xs:p-4 rounded-lg border border-green-500/30 bg-green-950/20 p-3 sm:p-6">
            <div className="xs:gap-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
              <CheckCircle className="xs:h-6 xs:w-6 h-5 w-5 flex-shrink-0 text-green-400 sm:h-6 sm:w-6" />
              <div className="flex-1">
                <h3 className="xs:mb-2 xs:text-base mb-2 text-sm font-semibold text-green-400 sm:text-lg">
                  Suscripción Activa
                </h3>
                <div className="xs:space-y-2 xs:text-sm space-y-1.5 text-xs text-gray-300 sm:text-base">
                  <div className="flex items-center gap-2">
                    <Clock className="xs:h-4 xs:w-4 h-3.5 w-3.5 flex-shrink-0 text-cyan-400 sm:h-5 sm:w-5" />
                    <span className="xs:text-xs text-xs sm:text-sm">
                      <span className="font-semibold text-cyan-400">
                        {daysRemaining}
                      </span>{' '}
                      {daysRemaining === 1 ? 'día restante' : 'días restantes'}
                    </span>
                  </div>
                  {user?.subscriptionEndDate && (
                    <p className="xs:text-xs text-xs text-gray-400 sm:text-sm">
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
                    className={`xs:mt-2.5 xs:p-2.5 mt-2 rounded border p-2 sm:mt-3 sm:p-3 ${
                      esp32MessageType === 'success'
                        ? 'border-green-500/30 bg-green-950/20'
                        : esp32MessageType === 'warning'
                          ? 'border-blue-500/30 bg-blue-950/20'
                          : 'border-red-500/30 bg-red-950/20'
                    }`}
                  >
                    <p
                      className={`text-xs ${
                        esp32MessageType === 'success'
                          ? 'text-green-300'
                          : esp32MessageType === 'warning'
                            ? 'text-blue-300'
                            : 'text-red-300'
                      }`}
                    >
                      {esp32Message}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="xs:p-4 rounded-lg border border-yellow-500/30 bg-yellow-950/20 p-3 sm:p-6">
            <div className="xs:gap-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              <AlertCircle className="xs:h-6 xs:w-6 h-5 w-5 flex-shrink-0 text-yellow-400 sm:h-6 sm:w-6" />
              <div className="flex-1">
                <h3 className="xs:text-base text-sm font-semibold text-yellow-400 sm:text-lg">
                  Suscripción Vencida o Inactiva
                </h3>
                <p className="xs:mt-1 xs:text-xs mt-1 text-xs text-gray-400 sm:text-sm">
                  Este usuario no tiene una suscripción activa
                </p>
                {user?.subscriptionEndDate && (
                  <p className="xs:mt-2 mt-1.5 text-xs text-gray-500 sm:text-sm">
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
      <style jsx global>{`
        body.no-chrome nav.bg-background,
        body.no-chrome aside[aria-label='Sidebar'] {
          display: none !important;
        }
        body.no-chrome .with-sidebar,
        body.no-chrome .content-with-sidebar,
        body.no-chrome .pt-20,
        body.no-chrome .pl-64 {
          margin: 0 !important;
          padding: 0 !important;
        }
        body.no-chrome {
          overflow: auto !important;
          height: auto !important;
        }
        html,
        body {
          overflow-x: hidden;
          overflow-y: auto;
        }
      `}</style>

      <div className="min-h-screen w-full bg-gray-950 px-3 py-4 sm:px-4 sm:py-6 md:px-6 md:py-8">
        <div className="xs:p-5 mx-auto w-full max-w-4xl rounded-lg border border-gray-700 bg-gray-900 p-4 shadow-xl shadow-cyan-500/10 sm:p-6 md:p-8 lg:p-10">
          {/* Logo */}
          <div className="xs:mb-5 mb-4 sm:mb-6 md:mb-8">
            <div className="mx-auto flex max-w-xs items-center justify-center">
              <Image
                src="/artiefy-logo.png"
                alt="Artiefy"
                width={220}
                height={64}
                className="xs:w-[140px] h-auto w-[120px] object-contain sm:w-[160px] md:w-[200px]"
                priority
              />
            </div>
          </div>

          {/* Título */}
          <h1 className="xs:text-2xl mb-2 text-center text-xl font-extrabold tracking-tight text-cyan-400 sm:mb-3 sm:text-3xl md:text-4xl">
            Verificación de Suscripción
          </h1>
          <p className="xs:mb-5 xs:text-sm mx-auto mb-4 max-w-3xl text-center text-xs text-gray-300 sm:mb-6 sm:text-base md:mb-8">
            Busca un usuario por correo electrónico, número de documento o
            nombre para verificar el estado de su suscripción.
          </p>

          {/* Formulario de búsqueda */}
          <div className="xs:space-y-4 space-y-3 sm:space-y-5 md:space-y-6">
            {/* Selector de tipo de búsqueda */}
            <div>
              <label className="mb-2 block text-xs font-medium text-gray-300">
                Buscar por:
              </label>
              <div className="xs:gap-2.5 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-3">
                <button
                  type="button"
                  onClick={() => setSearchType('email')}
                  className={`xs:py-2.5 xs:px-4 flex-1 rounded-lg px-3 py-2 text-xs font-medium transition sm:w-auto sm:text-sm ${
                    searchType === 'email'
                      ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/30'
                      : 'border border-gray-600 bg-gray-800 text-gray-300 hover:border-cyan-500'
                  }`}
                >
                  Correo
                </button>
                <button
                  type="button"
                  onClick={() => setSearchType('document')}
                  className={`xs:py-2.5 xs:px-4 flex-1 rounded-lg px-3 py-2 text-xs font-medium transition sm:w-auto sm:text-sm ${
                    searchType === 'document'
                      ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/30'
                      : 'border border-gray-600 bg-gray-800 text-gray-300 hover:border-cyan-500'
                  }`}
                >
                  Documento
                </button>
                <button
                  type="button"
                  onClick={() => setSearchType('name')}
                  className={`xs:py-2.5 xs:px-4 flex-1 rounded-lg px-3 py-2 text-xs font-medium transition sm:w-auto sm:text-sm ${
                    searchType === 'name'
                      ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/30'
                      : 'border border-gray-600 bg-gray-800 text-gray-300 hover:border-cyan-500'
                  }`}
                >
                  Nombre
                </button>
              </div>
            </div>

            {/* Campo de búsqueda */}
            <div>
              <label
                htmlFor="search"
                className="mb-2 block text-xs font-medium text-gray-300"
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
                  className="xs:px-4 xs:py-2.5 xs:pr-11 w-full rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 pr-9 text-sm text-white placeholder-gray-500 transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none sm:py-3 sm:pr-12 sm:text-base"
                />
                <Search className="xs:right-3 absolute top-1/2 right-2.5 h-4 w-4 -translate-y-1/2 text-gray-500 sm:right-4 sm:h-5 sm:w-5" />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="xs:p-3.5 rounded-lg border border-red-500/30 bg-red-950/20 p-3 sm:p-4">
                <p className="xs:text-xs text-xs text-red-400 sm:text-sm">
                  {error}
                </p>
              </div>
            )}

            {/* Botón Inteligente - Registrar Acceso */}
            <div className="xs:pt-3 flex flex-col gap-3 pt-2 sm:flex-row sm:justify-center sm:gap-4 sm:pt-4">
              <button
                type="button"
                onClick={handleRegister}
                disabled={loading}
                className={`xs:px-5 xs:py-2.5 flex-1 rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-md transition focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none sm:px-8 sm:py-3 sm:text-lg ${
                  result?.user?.hasOpenEntry
                    ? 'bg-red-600 hover:bg-red-500 hover:shadow-red-400/50 focus:ring-2 focus:ring-red-500'
                    : 'bg-green-600 hover:bg-green-500 hover:shadow-green-400/50 focus:ring-2 focus:ring-green-500'
                }`}
              >
                {loading ? (
                  <span className="xs:gap-2 flex items-center justify-center gap-2 sm:gap-2">
                    <svg
                      className="xs:h-4 xs:w-4 h-4 w-4 animate-spin sm:h-5 sm:w-5"
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
                      : 'Registrando salida...'}
                  </span>
                ) : result?.user?.hasOpenEntry ? (
                  '✗ Registrar Salida'
                ) : (
                  '✓ Registrar Entrada'
                )}
              </button>
            </div>
          </div>

          {/* Resultados */}
          {renderResult()}
        </div>
      </div>

      <style jsx global>{`
        body.no-chrome nav.bg-background,
        body.no-chrome aside[aria-label='Sidebar'] {
          display: none !important;
        }
        body.no-chrome .with-sidebar,
        body.no-chrome .content-with-sidebar,
        body.no-chrome .pt-20,
        body.no-chrome .pl-64 {
          margin: 0 !important;
          padding: 0 !important;
        }
        body.no-chrome {
          overflow: auto !important;
          height: auto !important;
        }
        html,
        body {
          overflow-x: hidden;
          overflow-y: auto;
        }
      `}</style>
    </>
  );
}
