'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '~/components/projects/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '~/components/projects/ui/card';
import { Badge } from '~/components/projects/ui/badge';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '~/components/projects/ui/avatar';
import { Check, X, Clock, MessageSquare, Trash2 } from 'lucide-react';

interface SolicitudParticipacion {
  id: number;
  userId: string;
  projectId: number;
  requestType: 'participation' | 'resignation';
  status: 'pending' | 'approved' | 'rejected';
  requestMessage: string | null;
  responseMessage: string | null;
  createdAt: string;
  updatedAt: string;
  respondedAt: string | null;
  respondedBy: string | null;
  userName: string | null;
  userEmail: string | null;
}

interface ModalSolicitudesParticipacionProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
  userId: string;
  onSolicitudProcesada?: () => void;
}

export default function ModalSolicitudesParticipacion({
  isOpen,
  onClose,
  projectId,
  userId,
  onSolicitudProcesada,
}: ModalSolicitudesParticipacionProps) {
  const [solicitudes, setSolicitudes] = useState<SolicitudParticipacion[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [eliminandoTodas, setEliminandoTodas] = useState(false);

  // MEJORADA: Función única para cargar solicitudes con mejor manejo de errores
  const fetchSolicitudes = async () => {
    if (!projectId || !userId) {
      console.log('⚠️ No se pueden cargar solicitudes - faltan datos:', {
        projectId,
        userId,
      });
      setSolicitudes([]);
      return;
    }

    console.log('🔄 Cargando solicitudes para proyecto:', projectId);
    setLoading(true);

    try {
      const url = `/api/projects/participation-requests?projectId=${projectId}`;
      console.log('🌐 Fetching desde:', url);

      const response = await fetch(url);

      console.log('📡 Respuesta de carga:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
      });

      if (!response.ok) {
        if (response.status === 404) {
          console.log('ℹ️ No hay solicitudes (404)');
          setSolicitudes([]);
          return;
        }

        const errorText = await response.text();
        console.error('❌ Error cargando solicitudes:', errorText);
        throw new Error(`Error ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('📋 Solicitudes recibidas:', data);

      // Mostrar TODAS las solicitudes, no solo las pendientes
      const todasLasSolicitudes = Array.isArray(data) ? data : [];

      console.log('📋 Todas las solicitudes:', todasLasSolicitudes);
      setSolicitudes(todasLasSolicitudes);
    } catch (error) {
      console.error('❌ Error completo al cargar solicitudes:', error);
      setSolicitudes([]);

      if (error instanceof Error) {
        alert(`Error al cargar solicitudes: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Cargar solicitudes cuando se abre el modal
  useEffect(() => {
    if (isOpen && projectId) {
      fetchSolicitudes();
    }
  }, [isOpen, projectId]);

  const handleResponderSolicitud = async (
    solicitudId: number,
    accion: 'approved' | 'rejected',
    motivoRechazo?: string
  ) => {
    console.log('🔄 === INICIO RESPUESTA SOLICITUD ===');
    console.log('📋 Parámetros recibidos:', {
      solicitudId,
      accion,
      motivoRechazo,
      projectId,
      userId,
      tipoSolicitudId: typeof solicitudId,
      tipoProjectId: typeof projectId,
      tipoUserId: typeof userId,
    });

    // Validaciones mejoradas
    if (!solicitudId || solicitudId <= 0) {
      console.error('❌ solicitudId inválido:', solicitudId);
      alert('Error: ID de solicitud inválido');
      return;
    }

    if (!projectId || projectId <= 0) {
      console.error('❌ projectId inválido:', projectId);
      alert('Error: ID de proyecto inválido');
      return;
    }

    if (!userId || userId.trim() === '') {
      console.error('❌ userId inválido:', userId);
      alert('Error: ID de usuario inválido');
      return;
    }

    // CAMBIADO: approved en lugar de accepted
    if (!['approved', 'rejected'].includes(accion)) {
      console.error('❌ acción inválida:', accion);
      alert('Error: Acción inválida');
      return;
    }

    console.log('✅ Validaciones básicas pasadas');

    setProcessingId(solicitudId);
    try {
      const url = `/api/projects/participation-requests/${solicitudId}`;

      // MEJORADO: Payload más completo y específico
      const payload = {
        status: accion, // Ahora será 'approved' o 'rejected'
        responseMessage: motivoRechazo || null,
        projectId: Number(projectId),
        respondedBy: userId.toString(),
        respondedAt: new Date().toISOString(),
      };

      console.log('🌐 URL final:', url);
      console.log('📦 Payload completo:', JSON.stringify(payload, null, 2));

      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json', // Agregar Accept header
        },
        body: JSON.stringify(payload),
      });

      console.log('📡 === RESPUESTA DEL SERVIDOR ===');
      console.log('Status Code:', response.status);
      console.log('Status Text:', response.statusText);
      console.log('Headers:', Object.fromEntries(response.headers.entries()));
      console.log('URL solicitada:', response.url);

      // MEJORADO: Manejo de respuesta más robusto
      let responseData;
      let responseText = '';

      try {
        // Primero intentar leer como texto para ver qué devuelve
        responseText = await response.text();
        console.log('📋 Respuesta RAW (texto):', responseText);

        // Luego intentar parsear como JSON
        if (responseText.trim()) {
          try {
            responseData = JSON.parse(responseText);
            console.log('📋 Respuesta parseada como JSON:', responseData);
          } catch (parseError) {
            console.warn('⚠️ No se pudo parsear como JSON:', parseError);
            responseData = { error: responseText };
          }
        } else {
          console.warn('⚠️ Respuesta vacía del servidor');
          responseData = { error: 'Respuesta vacía del servidor' };
        }
      } catch (readError) {
        console.error('❌ Error leyendo respuesta:', readError);
        responseData = { error: 'Error leyendo respuesta del servidor' };
      }

      if (!response.ok) {
        console.error('❌ === ERROR HTTP ===');
        console.error('Status:', response.status);
        console.error('Response Data:', responseData);

        // Mensajes de error específicos por código de estado
        let errorMessage = 'Error desconocido';

        switch (response.status) {
          case 400:
            errorMessage = `Error de solicitud incorrecta: ${
              responseData?.error || responseData?.message || 'Datos inválidos'
            }`;
            break;
          case 401:
            errorMessage =
              'No autorizado. Por favor, inicia sesión nuevamente.';
            break;
          case 403:
            errorMessage = 'No tienes permisos para realizar esta acción.';
            break;
          case 404:
            errorMessage =
              'Solicitud no encontrada. Puede que ya haya sido procesada.';
            break;
          case 500:
            errorMessage = `Error interno del servidor: ${
              responseData?.error ||
              responseData?.message ||
              'Error no especificado'
            }`;
            break;
          default:
            errorMessage = `Error ${response.status}: ${
              responseData?.error ||
              responseData?.message ||
              response.statusText
            }`;
        }

        console.error('❌ Mensaje de error final:', errorMessage);
        throw new Error(errorMessage);
      }

      console.log('✅ === RESPUESTA EXITOSA ===');
      console.log('📋 Datos de respuesta exitosa:', responseData);

      // Recargar las solicitudes para reflejar el cambio
      console.log('🔄 Recargando solicitudes...');
      await fetchSolicitudes();

      // Notificar al componente padre para actualizar el contador
      if (onSolicitudProcesada) {
        console.log('🔔 Notificando actualización de contador...');
        onSolicitudProcesada();
      }

      // Mensaje de éxito
      const mensajeExito =
        accion === 'approved'
          ? `✅ Solicitud aprobada exitosamente`
          : `✅ Solicitud rechazada exitosamente`;

      console.log('🎉 Proceso completado:', mensajeExito);
      alert(mensajeExito);
    } catch (error) {
      console.error('❌ === ERROR GENERAL ===');
      console.error('Tipo de error:', typeof error);
      console.error('Error completo:', error);
      console.error('Stack trace:', (error as Error)?.stack);
      console.error('Message:', (error as Error)?.message);

      let errorMessage = 'Error desconocido al procesar la solicitud';

      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object') {
        errorMessage = JSON.stringify(error);
      }

      console.error('❌ Mensaje final de error:', errorMessage);
      alert(`❌ Error al procesar la solicitud: ${errorMessage}`);
    } finally {
      console.log('🏁 Finalizando handleResponderSolicitud');
      setProcessingId(null);
    }
  };

  // MEJORADO: Función para filtrar solo solicitudes realmente pendientes
  const getSolicitudesPendientesReales = React.useCallback(() => {
    return solicitudes.filter((s) => {
      // Solo considerar verdaderamente pendientes las que tienen status 'pending'
      const esPendiente = s.status === 'pending';
      console.log(
        `🔍 Solicitud ${s.id}: status="${s.status}", esPendiente=${esPendiente}`
      );
      return esPendiente;
    });
  }, [solicitudes]);

  // MEJORADO: Función de aprobación con verificación de estado en tiempo real
  const handleAprobar = async (solicitud: SolicitudParticipacion) => {
    console.log('✅ === INICIO APROBACIÓN ===');
    console.log('📋 Solicitud completa:', solicitud);

    if (!solicitud) {
      console.error('❌ Solicitud es null/undefined');
      alert('Error: Solicitud no válida');
      return;
    }

    if (
      !solicitud.id ||
      typeof solicitud.id !== 'number' ||
      solicitud.id <= 0
    ) {
      console.error('❌ ID de solicitud inválido:', {
        id: solicitud.id,
        tipo: typeof solicitud.id,
      });
      alert('Error: La solicitud no tiene un ID válido');
      return;
    }

    // MEJORADO: Verificar estado actual antes de procesar
    console.log('🔍 Verificando estado actual de la solicitud...');
    try {
      const verificacionRes = await fetch(
        `/api/projects/participation-requests?projectId=${projectId}`
      );

      if (verificacionRes.ok) {
        const todasLasSolicitudes = await verificacionRes.json();
        const solicitudActual = Array.isArray(todasLasSolicitudes)
          ? todasLasSolicitudes.find((s: any) => s.id === solicitud.id)
          : null;

        console.log('📋 Estado actual de la solicitud:', solicitudActual);

        if (!solicitudActual) {
          console.error('❌ Solicitud no encontrada en verificación');
          alert('Error: La solicitud ya no existe');
          await fetchSolicitudes(); // Refrescar lista
          return;
        }

        if (solicitudActual.status !== 'pending') {
          console.warn(
            '⚠️ Solicitud ya no está pendiente:',
            solicitudActual.status
          );
          alert(
            `Esta solicitud ya fue ${solicitudActual.status === 'approved' ? 'aprobada' : 'procesada'}`
          );
          await fetchSolicitudes(); // Refrescar lista
          return;
        }
      }
    } catch (error) {
      console.warn('⚠️ Error verificando estado actual:', error);
      // Continuar con la aprobación pero alertar al usuario
    }

    const nombreUsuario = solicitud.userName || 'usuario desconocido';
    console.log('👤 Usuario a aprobar:', nombreUsuario);

    if (
      !confirm(
        `¿Estás seguro de que quieres aprobar la solicitud de ${nombreUsuario}?`
      )
    ) {
      console.log('🚫 Aprobación cancelada por el usuario');
      return;
    }

    console.log('✅ Confirmación recibida, procesando aprobación...');
    await handleResponderSolicitud(solicitud.id, 'approved');
  };

  // MEJORADO: Función de rechazo con verificación similar
  const handleRechazar = async (solicitud: SolicitudParticipacion) => {
    console.log('❌ === INICIO RECHAZO ===');
    console.log('📋 Solicitud completa:', solicitud);

    if (!solicitud) {
      console.error('❌ Solicitud es null/undefined');
      alert('Error: Solicitud no válida');
      return;
    }

    if (
      !solicitud.id ||
      typeof solicitud.id !== 'number' ||
      solicitud.id <= 0
    ) {
      console.error('❌ ID de solicitud inválido:', {
        id: solicitud.id,
        tipo: typeof solicitud.id,
      });
      alert('Error: La solicitud no tiene un ID válido');
      return;
    }

    // Verificar estado actual antes de procesar
    console.log('🔍 Verificando estado actual de la solicitud...');
    try {
      const verificacionRes = await fetch(
        `/api/projects/participation-requests?projectId=${projectId}`
      );

      if (verificacionRes.ok) {
        const todasLasSolicitudes = await verificacionRes.json();
        const solicitudActual = Array.isArray(todasLasSolicitudes)
          ? todasLasSolicitudes.find((s: any) => s.id === solicitud.id)
          : null;

        if (!solicitudActual || solicitudActual.status !== 'pending') {
          alert('Esta solicitud ya ha sido procesada');
          await fetchSolicitudes(); // Refrescar lista
          return;
        }
      }
    } catch (error) {
      console.warn('⚠️ Error verificando estado actual:', error);
    }

    const motivo = prompt('Motivo del rechazo (opcional):');

    if (motivo === null) {
      console.log('🚫 Rechazo cancelado por el usuario');
      return;
    }

    const nombreUsuario = solicitud.userName || 'usuario desconocido';

    if (
      !confirm(
        `¿Estás seguro de que quieres rechazar la solicitud de ${nombreUsuario}?`
      )
    ) {
      console.log('🚫 Rechazo cancelado por el usuario en confirmación');
      return;
    }

    console.log('✅ Confirmación recibida, procesando rechazo...');
    await handleResponderSolicitud(
      solicitud.id,
      'rejected',
      motivo || undefined
    );
  };

  // Filtrar solicitudes por tipo
  const solicitudesParticipacion = solicitudes.filter(
    (s) => s.requestType === 'participation'
  );
  const solicitudesRenuncia = solicitudes.filter(
    (s) => s.requestType === 'resignation'
  );

  const solicitudesParticipacionPendientes = solicitudesParticipacion.filter(
    (s) => s.status === 'pending'
  );
  const solicitudesRenunciaPendientes = solicitudesRenuncia.filter(
    (s) => s.status === 'pending'
  );

  const solicitudesProcesadas = solicitudes.filter(
    (s) => s.status !== 'pending'
  );

  // MEJORADO: Actualizar las variables de estado usando la función de filtrado mejorada
  const solicitudesPendientes = getSolicitudesPendientesReales();
  const solicitudesProcesadasFiltradas = solicitudes.filter(
    (s) => s.status !== 'pending'
  );

  console.log('📊 Estado actual de solicitudes:', {
    total: solicitudes.length,
    pendientes: solicitudesPendientes.length,
    procesadas: solicitudesProcesadasFiltradas.length,
  });

  // Función para eliminar todas las solicitudes
  const handleEliminarTodasLasSolicitudes = async () => {
    if (solicitudes.length === 0) {
      alert('No hay solicitudes para eliminar');
      return;
    }

    const confirmacion = confirm(
      `¿Estás seguro de que quieres eliminar TODAS las ${solicitudes.length} solicitudes de este proyecto?\n\nEsta acción no se puede deshacer.`
    );

    if (!confirmacion) {
      return;
    }

    const confirmacionFinal = confirm(
      '⚠️ CONFIRMACIÓN FINAL ⚠️\n\nEsto eliminará permanentemente todas las solicitudes (pendientes, aprobadas y rechazadas).\n\n¿Continuar?'
    );

    if (!confirmacionFinal) {
      return;
    }

    setEliminandoTodas(true);

    try {
      console.log(
        '🗑️ Eliminando todas las solicitudes del proyecto:',
        projectId
      );

      const response = await fetch(
        `/api/projects/participation-requests?projectId=${projectId}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al eliminar solicitudes');
      }

      const resultado = await response.json();
      console.log('✅ Solicitudes eliminadas:', resultado);

      // Actualizar la lista local
      setSolicitudes([]);

      // Notificar al componente padre
      if (onSolicitudProcesada) {
        onSolicitudProcesada();
      }

      alert(`✅ ${resultado.deletedCount} solicitudes eliminadas exitosamente`);
    } catch (error) {
      console.error('❌ Error eliminando solicitudes:', error);
      alert(
        `❌ Error al eliminar solicitudes: ${
          error instanceof Error ? error.message : 'Error desconocido'
        }`
      );
    } finally {
      setEliminandoTodas(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-4"
      onClick={onClose}
    >
      <div
        className="relative max-h-[95vh] w-full max-w-xs overflow-hidden overflow-y-auto rounded-lg bg-slate-800 p-3 sm:max-h-[90vh] sm:max-w-lg sm:rounded-xl sm:p-4 md:max-w-2xl lg:max-w-4xl lg:rounded-2xl lg:p-6 xl:max-w-5xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botón de cerrar */}
        <div className="sticky top-0 z-50 flex w-full justify-end bg-slate-800/95 pb-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 text-slate-400 hover:bg-slate-700 hover:text-white sm:h-10 sm:w-10"
            onClick={onClose}
          >
            <span className="sr-only">Cerrar</span>
            <svg
              width={20}
              height={20}
              viewBox="0 0 16 16"
              className="text-white sm:h-6 sm:w-6"
            >
              <path
                d="M4 4l8 8M12 4l-8 8"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
              />
            </svg>
          </Button>
        </div>

        <div className="space-y-4 sm:space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-bold break-words text-white sm:text-2xl">
              Gestión de Solicitudes
            </h2>

            {/* Botón para eliminar todas las solicitudes */}
            {solicitudes.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleEliminarTodasLasSolicitudes}
                disabled={eliminandoTodas || loading}
                className="w-full shrink-0 bg-red-600 text-xs hover:bg-red-700 sm:w-auto sm:text-sm"
              >
                <Trash2 className="mr-1 h-3 w-3 shrink-0 sm:mr-2 sm:h-4 sm:w-4" />
                <span className="break-words">
                  {eliminandoTodas
                    ? 'Eliminando...'
                    : `Eliminar Todas (${solicitudes.length})`}
                </span>
              </Button>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-6 sm:py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-cyan-400 sm:h-8 sm:w-8" />
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-6">
              {/* Solicitudes de Participación Pendientes */}
              <Card className="overflow-hidden border-slate-700 bg-slate-800/50">
                <CardHeader className="pb-3 sm:pb-4">
                  <CardTitle className="flex items-center gap-2 text-base text-white sm:text-lg">
                    <Clock className="h-4 w-4 shrink-0 text-yellow-400 sm:h-5 sm:w-5" />
                    <span className="min-w-0 break-words">
                      Solicitudes de Participación
                    </span>
                    <span className="shrink-0 text-sm sm:text-base">
                      ({solicitudesParticipacionPendientes.length})
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {solicitudesParticipacionPendientes.length === 0 ? (
                    <p className="text-sm text-slate-400 italic sm:text-base">
                      No hay solicitudes de participación pendientes
                    </p>
                  ) : (
                    <div className="space-y-3 sm:space-y-4">
                      {solicitudesParticipacionPendientes.map((solicitud) => (
                        <div
                          key={solicitud.id}
                          className="flex flex-col gap-3 overflow-hidden rounded-lg border border-slate-600 bg-slate-700/50 p-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4 sm:p-4"
                        >
                          <div className="flex min-w-0 flex-1 items-start gap-2 sm:gap-3">
                            <Avatar className="h-8 w-8 flex-shrink-0 sm:h-10 sm:w-10">
                              <AvatarFallback className="bg-green-600 text-xs text-white sm:text-sm">
                                {(solicitud.userName ?? 'AN')
                                  .split(' ')
                                  .map((n) => n[0])
                                  .join('')
                                  .toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <h4 className="text-sm font-semibold break-words text-white sm:text-base">
                                {solicitud.userName ?? 'Usuario desconocido'}
                              </h4>
                              <p className="text-xs break-all text-slate-400 sm:text-sm">
                                {solicitud.userEmail}
                              </p>
                              <p className="text-xs text-slate-500">
                                Solicitado el{' '}
                                {new Date(
                                  solicitud.createdAt
                                ).toLocaleDateString('es-ES')}
                              </p>
                              <Badge className="mt-1 bg-green-600 text-xs text-white">
                                Participación
                              </Badge>
                              {solicitud.requestMessage && (
                                <div className="mt-2 rounded bg-slate-600/50 p-2">
                                  <div className="mb-1 flex items-center gap-1 text-xs text-slate-400">
                                    <MessageSquare className="h-3 w-3 flex-shrink-0" />
                                    <span className="shrink-0">Mensaje:</span>
                                  </div>
                                  <p className="text-xs break-words whitespace-pre-wrap text-slate-300 sm:text-sm">
                                    {solicitud.requestMessage}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex w-full gap-2 sm:w-auto sm:flex-shrink-0">
                            <Button
                              size="sm"
                              className="min-w-0 flex-1 bg-green-600 text-xs hover:bg-green-700 sm:flex-none sm:text-sm"
                              onClick={() => handleAprobar(solicitud)}
                              disabled={processingId === solicitud.id}
                            >
                              <Check className="mr-1 h-3 w-3 shrink-0" />
                              <span className="break-words">
                                {processingId === solicitud.id
                                  ? 'Procesando...'
                                  : 'Aprobar'}
                              </span>
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="min-w-0 flex-1 text-xs sm:flex-none sm:text-sm"
                              onClick={() => handleRechazar(solicitud)}
                              disabled={processingId === solicitud.id}
                            >
                              <X className="mr-1 h-3 w-3 shrink-0" />
                              <span className="break-words">
                                {processingId === solicitud.id
                                  ? 'Procesando...'
                                  : 'Rechazar'}
                              </span>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Solicitudes de Renuncia Pendientes */}
              <Card className="overflow-hidden border-slate-700 bg-slate-800/50">
                <CardHeader className="pb-3 sm:pb-4">
                  <CardTitle className="flex items-center gap-2 text-base text-white sm:text-lg">
                    <Clock className="h-4 w-4 shrink-0 text-orange-400 sm:h-5 sm:w-5" />
                    <span className="min-w-0 break-words">
                      Solicitudes de Renuncia
                    </span>
                    <span className="shrink-0 text-sm sm:text-base">
                      ({solicitudesRenunciaPendientes.length})
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {solicitudesRenunciaPendientes.length === 0 ? (
                    <p className="text-sm text-slate-400 italic sm:text-base">
                      No hay solicitudes de renuncia pendientes
                    </p>
                  ) : (
                    <div className="space-y-3 sm:space-y-4">
                      {solicitudesRenunciaPendientes.map((solicitud) => (
                        <div
                          key={solicitud.id}
                          className="flex flex-col gap-3 overflow-hidden rounded-lg border border-orange-600 bg-orange-900/20 p-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4 sm:p-4"
                        >
                          <div className="flex min-w-0 flex-1 items-start gap-2 sm:gap-3">
                            <Avatar className="h-8 w-8 flex-shrink-0 sm:h-10 sm:w-10">
                              <AvatarFallback className="bg-orange-600 text-xs text-white sm:text-sm">
                                {(solicitud.userName ?? 'AN')
                                  .split(' ')
                                  .map((n) => n[0])
                                  .join('')
                                  .toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <h4 className="text-sm font-semibold break-words text-white sm:text-base">
                                {solicitud.userName ?? 'Usuario desconocido'}
                              </h4>
                              <p className="text-xs break-all text-slate-400 sm:text-sm">
                                {solicitud.userEmail}
                              </p>
                              <p className="text-xs text-slate-500">
                                Solicitado el{' '}
                                {new Date(
                                  solicitud.createdAt
                                ).toLocaleDateString('es-ES')}
                              </p>
                              <Badge className="mt-1 bg-orange-600 text-xs text-white">
                                Renuncia
                              </Badge>
                              {solicitud.requestMessage && (
                                <div className="mt-2 rounded bg-orange-600/20 p-2">
                                  <div className="mb-1 flex items-center gap-1 text-xs text-orange-300">
                                    <MessageSquare className="h-3 w-3 flex-shrink-0" />
                                    <span className="shrink-0">Motivo:</span>
                                  </div>
                                  <p className="text-xs break-words whitespace-pre-wrap text-orange-200 sm:text-sm">
                                    {solicitud.requestMessage}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex w-full gap-2 sm:w-auto sm:flex-shrink-0">
                            <Button
                              size="sm"
                              className="min-w-0 flex-1 bg-orange-600 text-xs hover:bg-orange-700 sm:flex-none sm:text-sm"
                              onClick={() => handleAprobar(solicitud)}
                              disabled={processingId === solicitud.id}
                            >
                              <Check className="mr-1 h-3 w-3 shrink-0" />
                              <span className="break-words">
                                {processingId === solicitud.id
                                  ? 'Procesando...'
                                  : 'Aprobar Renuncia'}
                              </span>
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="min-w-0 flex-1 border-slate-400 text-xs text-slate-300 hover:bg-slate-700 sm:flex-none sm:text-sm"
                              onClick={() => handleRechazar(solicitud)}
                              disabled={processingId === solicitud.id}
                            >
                              <X className="mr-1 h-3 w-3 shrink-0" />
                              <span className="break-words">
                                {processingId === solicitud.id
                                  ? 'Procesando...'
                                  : 'Rechazar'}
                              </span>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Historial de Solicitudes Procesadas */}
              {solicitudesProcesadas.length > 0 && (
                <Card className="overflow-hidden border-slate-700 bg-slate-800/50">
                  <CardHeader className="pb-3 sm:pb-4">
                    <CardTitle className="text-base break-words text-white sm:text-lg">
                      Historial de Solicitudes ({solicitudesProcesadas.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2 sm:space-y-3">
                      {solicitudesProcesadas.map((solicitud) => (
                        <div
                          key={solicitud.id}
                          className="flex flex-col gap-2 overflow-hidden rounded-lg border border-slate-600 bg-slate-700/30 p-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3 sm:p-3"
                        >
                          <div className="flex min-w-0 flex-1 items-start gap-2 sm:gap-3">
                            <Avatar className="h-6 w-6 flex-shrink-0 sm:h-8 sm:w-8">
                              <AvatarFallback
                                className={`${
                                  solicitud.requestType === 'participation'
                                    ? 'bg-green-600'
                                    : 'bg-orange-600'
                                } text-xs text-white`}
                              >
                                {(solicitud.userName ?? 'AN')
                                  .split(' ')
                                  .map((n) => n[0])
                                  .join('')
                                  .toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <h5 className="text-xs font-medium break-words text-white sm:text-sm">
                                {solicitud.userName ?? 'Usuario desconocido'}
                              </h5>
                              <p className="text-xs text-slate-400">
                                Procesado el{' '}
                                {solicitud.respondedAt
                                  ? new Date(
                                      solicitud.respondedAt
                                    ).toLocaleDateString('es-ES')
                                  : 'Fecha desconocida'}
                              </p>
                              <div className="mt-1 flex flex-wrap gap-1">
                                <Badge
                                  className={`text-xs ${
                                    solicitud.requestType === 'participation'
                                      ? 'bg-green-700 text-white'
                                      : 'bg-orange-700 text-white'
                                  }`}
                                >
                                  {solicitud.requestType === 'participation'
                                    ? 'Participación'
                                    : 'Renuncia'}
                                </Badge>
                              </div>
                              {solicitud.responseMessage && (
                                <p className="mt-1 text-xs break-words whitespace-pre-wrap text-slate-300">
                                  "{solicitud.responseMessage}"
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex justify-end sm:flex-shrink-0">
                            <Badge
                              className={`text-xs ${
                                solicitud.status === 'approved'
                                  ? 'bg-green-600 text-white'
                                  : 'bg-red-600 text-white'
                              }`}
                            >
                              {solicitud.status === 'approved'
                                ? 'Aprobada'
                                : 'Rechazada'}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
