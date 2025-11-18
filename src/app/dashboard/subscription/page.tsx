'use client';

import { useEffect, useState } from 'react';

import Image from 'next/image';

import { AlertCircle, CheckCircle, Clock, Search } from 'lucide-react';

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

// Tipo para la respuesta de error
interface ErrorResponse {
    error: string;
}

// Type guard para verificar si es un ErrorResponse
function isErrorResponse(data: unknown): data is ErrorResponse {
    return (
        typeof data === 'object' &&
        data !== null &&
        'error' in data &&
        typeof (data as ErrorResponse).error === 'string'
    );
}

// Type guard para verificar si es un SearchResult
function isSearchResult(data: unknown): data is SearchResult {
    return (
        typeof data === 'object' &&
        data !== null &&
        'found' in data &&
        typeof (data as SearchResult).found === 'boolean'
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

    useEffect(() => {
        document.body.classList.add('no-chrome');
        document.body.style.overflow = 'auto';
        return () => {
            document.body.classList.remove('no-chrome');
            document.body.style.overflow = '';
        };
    }, []);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!searchTerm.trim()) {
            setError('Por favor ingresa un término de búsqueda');
            return;
        }

        setLoading(true);
        setError(null);
        setResult(null);

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
                const errorMessage = isErrorResponse(data)
                    ? data.error
                    : 'Error en la búsqueda';
                throw new Error(errorMessage);
            }

            // Validar que data sea un SearchResult
            if (!isSearchResult(data)) {
                throw new Error('Respuesta inválida del servidor');
            }

            setResult(data);

            // Si tiene suscripción activa, enviar webhook
            if (data.found && data.user?.subscriptionStatus === 'active') {
                await fetch('/api/super-admin/webhook-subscription', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        userId: data.user.id,
                        email: data.user.email,
                        name: data.user.name,
                        daysRemaining: data.user.daysRemaining,
                        subscriptionEndDate: data.user.subscriptionEndDate,
                    }),
                });
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al buscar usuario');
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
                                <div className="mt-3 rounded border border-cyan-500/30 bg-cyan-950/20 p-2 sm:p-3">
                                    <p className="text-xs text-cyan-300">
                                        ✓ Webhook enviado exitosamente
                                    </p>
                                </div>
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
                                    className="w-full rounded-lg border border-gray-600 bg-gray-800 px-4 py-2.5 pr-10 text-sm text-white placeholder-gray-500 transition focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 sm:py-3 sm:pr-12 sm:text-base"
                                />
                                <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 sm:right-4 sm:h-5 sm:w-5" />
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