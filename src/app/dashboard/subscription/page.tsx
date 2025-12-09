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
  };
  message?: string;
}

interface WebhookSuccessResponse {
  success: true;
  message: string;
  payload: {
    userId: string;
    email: string;
    name: string;
    daysRemaining: number;
    subscriptionEndDate: string;
    timestamp: string;
  };
  esp32?: {
    ok: boolean;
    status?: number;
    reason?: 'not_configured' | 'timeout' | 'error' | 'success';
  };
}


// Type guard para verificar si es un WebhookSuccessResponse
function isWebhookSuccessResponse(data: unknown): data is WebhookSuccessResponse {
  return (
    typeof data === 'object' &&
    data !== null &&
    'success' in data &&
    (data as WebhookSuccessResponse).success === true
  );
}

export default function BuscarSuscripcionPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState<'email' | 'document' | 'name'>(
    'email'
  );
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [esp32Message, setEsp32Message] = useState<string | null>(null);
  const [esp32MessageType, setEsp32MessageType] = useState<'success' | 'warning' | 'error'>('success');
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    document.body.classList.add('no-chrome');
    document.body.style.overflow = 'auto';
    return () => {
      document.body.classList.remove('no-chrome');
      document.body.style.overflow = '';
    };
  }, []);

  const addToast = (message: string, type: ToastType, duration = 5000, subtitle?: string) => {
    const id = `toast-${Date.now()}`;
    setToasts((prev) => [...prev, { id, message, type, duration, subtitle }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!searchTerm.trim()) {
      setError('Por favor ingresa un término de búsqueda');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setEsp32Message(null);

    try {
      const response = await fetch('/api/super-admin/search-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          searchTerm: searchTerm.trim(),
          searchType,
        }),
      });

      const data: unknown = await response.json();

      if (!response.ok) {
        const errorMessage =
          typeof data === 'object' && data !== null && 'error' in data
            ? (data as { error: string }).error
            : 'Error en la búsqueda';
        throw new Error(errorMessage);
      }

      // Validar que data sea un SearchResult
      if (
        typeof data !== 'object' ||
        data === null ||
        !('found' in data)
      ) {
        throw new Error('Respuesta inválida del servidor');
      }

      const searchResult = data as SearchResult;
      setResult(searchResult);

      // Mostrar notificación según el resultado
      if (!searchResult.found) {
        // Usuario no encontrado
        addToast('Usuario no encontrado', 'error', 4000, 'Verifica email, documento o nombre');
      } else if (searchResult.user?.subscriptionStatus === 'active') {
        // Usuario con suscripción activa - notificación ya se envía después del webhook
      } else {
        // Usuario encontrado pero suscripción vencida/inactiva
        const endDate = searchResult.user?.subscriptionEndDate
          ? new Date(searchResult.user.subscriptionEndDate).toLocaleDateString('es-ES')
          : 'N/A';
        addToast('Suscripción vencida', 'warning', 4000, `Vencimiento: ${endDate}`);
      }

      // Si tiene suscripción activa, enviar webhook
      if (searchResult.found && searchResult.user?.subscriptionStatus === 'active') {
        // Notificación de usuario verificado
        const daysRemaining = searchResult.user?.daysRemaining ?? 0;
        addToast('✓ Usuario verificado', 'success', 3000, `${daysRemaining} días restantes`);

        try {
          const webhookResponse = await fetch('/api/super-admin/webhook-subscription', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: searchResult.user.id,
              email: searchResult.user.email,
              name: searchResult.user.name,
              daysRemaining: searchResult.user.daysRemaining,
              subscriptionEndDate: searchResult.user.subscriptionEndDate,
              timestamp: new Date().toISOString(),
            }),
          });

          if (webhookResponse.ok) {
            const webhookData: unknown = await webhookResponse.json();

            if (isWebhookSuccessResponse(webhookData)) {
              if (webhookData.esp32?.ok) {
                // Éxito: puerta abierta
                setEsp32MessageType('success');
                setEsp32Message('✓ Señal enviada al ESP32 - Puerta abierta 5s');
                addToast('✓ Puerta abierta - Acceso permitido', 'success', 5000, 'Webhook: Exitoso • Sensor: Activo');
                // Auto-desaparecer en 5 segundos (tipo Django)
                setTimeout(() => setEsp32Message(null), 5000);
              } else if (webhookData.esp32?.reason === 'timeout') {
                // Timeout
                setEsp32MessageType('error');
                setEsp32Message('⚠ Timeout: ESP32 no responde. Revisa conexión.');
                addToast('Timeout: ESP32 no responde. Revisa la conexión.', 'error', 6000, 'Webhook: Exitoso • Sensor: Timeout (1500ms)');
                setTimeout(() => setEsp32Message(null), 6000);
              } else if (webhookData.esp32?.reason === 'error') {
                // Error de conexión
                setEsp32MessageType('error');
                setEsp32Message('⚠ Error conectando a ESP32. Verifica red/URL.');
                addToast('Error conectando a ESP32. Verifica red/URL.', 'error', 6000, 'Webhook: Exitoso • Sensor: Error de conexión');
                setTimeout(() => setEsp32Message(null), 6000);
              } else {
                // ESP32 no configurado (sin esp32 en respuesta)
                setEsp32MessageType('warning');
                setEsp32Message('ℹ ESP32 no configurado. Usuario verificado.');
                addToast('Usuario verificado correctamente', 'info', 4000, 'Webhook: Exitoso • Sensor: No configurado');
                setTimeout(() => setEsp32Message(null), 4000);
              }
            }
          }
        } catch (err) {
          console.error('Error webhook:', err);
          setEsp32MessageType('error');
          setEsp32Message('⚠ Error enviando comando. Intenta de nuevo.');
          addToast('Error enviando comando. Intenta de nuevo.', 'error', 5000, 'Webhook: Fallido • Razón: Error de red');
          setTimeout(() => setEsp32Message(null), 5000);
        }
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error al buscar usuario';
      setError(errorMsg);
      addToast('Error en la búsqueda', 'error', 5000, errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const renderResult = () => {
    if (!result) return null;

    if (!result.found) {
      return (
        <div className="mt-6 rounded-lg border border-red-500/30 bg-red-950/20 p-4 sm:mt-8 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <AlertCircle className="h-6 w-6 flex-shrink-0 text-red-400" />
            <div className="flex-1">
              <h3 className="text-base font-semibold text-red-400 sm:text-lg">
                Usuario no encontrado
              </h3>
              <p className="mt-1 text-xs text-gray-400 sm:text-sm">
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
      <div className="mt-6 space-y-3 sm:mt-8 sm:space-y-4">
        {/* Información del usuario */}
        <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-4 sm:p-6">
          <h3 className="mb-3 text-lg font-bold text-cyan-400 sm:mb-4 sm:text-xl">
            Información del Usuario
          </h3>
          <div className="space-y-2 text-sm text-gray-300 sm:text-base">
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
          <div className="rounded-lg border border-green-500/30 bg-green-950/20 p-4 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
              <CheckCircle className="h-6 w-6 flex-shrink-0 text-green-400" />
              <div className="flex-1">
                <h3 className="mb-2 text-base font-semibold text-green-400 sm:text-lg">
                  Suscripción Activa
                </h3>
                <div className="space-y-2 text-sm text-gray-300">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 flex-shrink-0 text-cyan-400" />
                    <span className="text-xs sm:text-sm">
                      <span className="font-semibold text-cyan-400">
                        {daysRemaining}
                      </span>{' '}
                      {daysRemaining === 1 ? 'día restante' : 'días restantes'}
                    </span>
                  </div>
                  {user?.subscriptionEndDate && (
                    <p className="text-xs text-gray-400 sm:text-sm">
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
                  <div className={`mt-3 rounded border p-2 sm:p-3 ${esp32MessageType === 'success'
                    ? 'border-green-500/30 bg-green-950/20'
                    : esp32MessageType === 'warning'
                      ? 'border-blue-500/30 bg-blue-950/20'
                      : 'border-red-500/30 bg-red-950/20'
                    }`}>
                    <p className={`text-xs ${esp32MessageType === 'success'
                      ? 'text-green-300'
                      : esp32MessageType === 'warning'
                        ? 'text-blue-300'
                        : 'text-red-300'
                      }`}>
                      {esp32Message}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-yellow-500/30 bg-yellow-950/20 p-4 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <AlertCircle className="h-6 w-6 flex-shrink-0 text-yellow-400" />
              <div className="flex-1">
                <h3 className="text-base font-semibold text-yellow-400 sm:text-lg">
                  Suscripción Vencida o Inactiva
                </h3>
                <p className="mt-1 text-xs text-gray-400 sm:text-sm">
                  Este usuario no tiene una suscripción activa
                </p>
                {user?.subscriptionEndDate && (
                  <p className="mt-2 text-xs text-gray-500">
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

      <div className="">
        <div className="mx-auto w-full max-w-7xl -translate-x-8 rounded-xl border border-gray-700 bg-gray-900 p-5 shadow-xl shadow-cyan-500/10 sm:p-8 md:p-10">
          {/* Logo */}
          <div className="mb-6 sm:mb-8">
            <div className="mx-auto flex max-w-xs items-center justify-center sm:max-w-md">
              <Image
                src="/artiefy-logo.png"
                alt="Artiefy"
                width={220}
                height={64}
                className="h-auto w-[140px] object-contain sm:w-[180px] md:w-[200px]"
                priority
              />
            </div>
          </div>

          {/* Título */}
          <h1 className="mb-2 text-center text-2xl font-extrabold tracking-tight text-cyan-400 sm:mb-3 sm:text-3xl md:text-4xl">
            Verificación de Suscripción
          </h1>
          <p className="mx-auto mb-6 max-w-3xl text-center text-sm text-gray-300 sm:mb-8 sm:text-base">
            Busca un usuario por correo electrónico, número de documento o
            nombre para verificar el estado de su suscripción.
          </p>

          {/* Formulario de búsqueda */}
          <form onSubmit={handleSearch} className="space-y-5 sm:space-y-6">
            {/* Selector de tipo de búsqueda */}
            <div>
              <label className="mb-2 block text-xs font-medium text-gray-300 sm:text-sm">
                Buscar por:
              </label>
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-3">
                <button
                  type="button"
                  onClick={() => setSearchType('email')}
                  className={`w-full rounded-lg px-4 py-2.5 text-xs font-medium transition sm:w-auto sm:text-sm ${searchType === 'email'
                    ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/30'
                    : 'border border-gray-600 bg-gray-800 text-gray-300 hover:border-cyan-500'
                    }`}
                >
                  Correo electrónico
                </button>
                <button
                  type="button"
                  onClick={() => setSearchType('document')}
                  className={`w-full rounded-lg px-4 py-2.5 text-xs font-medium transition sm:w-auto sm:text-sm ${searchType === 'document'
                    ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/30'
                    : 'border border-gray-600 bg-gray-800 text-gray-300 hover:border-cyan-500'
                    }`}
                >
                  Número de documento
                </button>
                <button
                  type="button"
                  onClick={() => setSearchType('name')}
                  className={`w-full rounded-lg px-4 py-2.5 text-xs font-medium transition sm:w-auto sm:text-sm ${searchType === 'name'
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
                className="mb-2 block text-xs font-medium text-gray-300 sm:text-sm"
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
                  className="w-full rounded-lg border border-gray-600 bg-gray-800 px-4 py-2.5 pr-10 text-sm text-white placeholder-gray-500 transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none sm:py-3 sm:pr-12 sm:text-base"
                />
                <Search className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-gray-500 sm:right-4 sm:h-5 sm:w-5" />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-lg border border-red-500/30 bg-red-950/20 p-3 sm:p-4">
                <p className="text-xs text-red-400 sm:text-sm">{error}</p>
              </div>
            )}

            {/* Botón de búsqueda */}
            <div className="flex justify-center">
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-cyan-500 px-6 py-2.5 text-base font-semibold text-black shadow-md transition hover:bg-cyan-400 hover:shadow-cyan-300 focus:ring-2 focus:ring-cyan-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:px-8 sm:py-3 sm:text-lg"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="h-4 w-4 animate-spin sm:h-5 sm:w-5"
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
                    Buscando...
                  </span>
                ) : (
                  'Buscar usuario'
                )}
              </button>
            </div>
          </form>

          {/* Resultados */}
          {renderResult()}
        </div>
      </div>
    </>
  );
}
