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
import { Check, X, Clock, MessageSquare } from 'lucide-react';

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

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="relative m-6 max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-slate-800 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botón de cerrar */}
        <div className="sticky top-0 z-50 flex w-full justify-end bg-slate-800/1">
          <Button
            variant="ghost"
            size="icon"
            className="text-slate-400 hover:bg-slate-700 hover:text-white"
            onClick={onClose}
          >
            <span className="sr-only">Cerrar</span>
            <svg
              width={24}
              height={24}
              viewBox="0 0 16 16"
              className="text-white"
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

        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-white">
            Gestión de Solicitudes
          </h2>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-cyan-400" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Solicitudes de Participación Pendientes */}
              <Card className="border-slate-700 bg-slate-800/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Clock className="h-5 w-5 text-yellow-400" />
                    Solicitudes de Participación (
                    {solicitudesParticipacionPendientes.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {solicitudesParticipacionPendientes.length === 0 ? (
                    <p className="text-slate-400 italic">
                      No hay solicitudes de participación pendientes
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {solicitudesParticipacionPendientes.map((solicitud) => (
                        <div
                          key={solicitud.id}
                          className="flex items-start justify-between rounded-lg border border-slate-600 bg-slate-700/50 p-4"
                        >
                          <div className="flex items-start gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback className="bg-green-600 text-white">
                                {(solicitud.userName ?? 'AN')
                                  .split(' ')
                                  .map((n) => n[0])
                                  .join('')
                                  .toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <h4 className="font-semibold text-white">
                                {solicitud.userName ?? 'Usuario desconocido'}
                              </h4>
                              <p className="text-sm text-slate-400">
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
                                    <MessageSquare className="h-3 w-3" />
                                    Mensaje:
                                  </div>
                                  <p className="text-sm text-slate-300">
                                    {solicitud.requestMessage}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleAprobar(solicitud)}
                              disabled={processingId === solicitud.id}
                            >
                              <Check className="mr-1 h-3 w-3" />
                              {processingId === solicitud.id
                                ? 'Procesando...'
                                : 'Aprobar'}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleRechazar(solicitud)}
                              disabled={processingId === solicitud.id}
                            >
                              <X className="mr-1 h-3 w-3" />
                              {processingId === solicitud.id
                                ? 'Procesando...'
                                : 'Rechazar'}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Solicitudes de Renuncia Pendientes */}
              <Card className="border-slate-700 bg-slate-800/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Clock className="h-5 w-5 text-orange-400" />
                    Solicitudes de Renuncia (
                    {solicitudesRenunciaPendientes.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {solicitudesRenunciaPendientes.length === 0 ? (
                    <p className="text-slate-400 italic">
                      No hay solicitudes de renuncia pendientes
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {solicitudesRenunciaPendientes.map((solicitud) => (
                        <div
                          key={solicitud.id}
                          className="flex items-start justify-between rounded-lg border border-orange-600 bg-orange-900/20 p-4"
                        >
                          <div className="flex items-start gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback className="bg-orange-600 text-white">
                                {(solicitud.userName ?? 'AN')
                                  .split(' ')
                                  .map((n) => n[0])
                                  .join('')
                                  .toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <h4 className="font-semibold text-white">
                                {solicitud.userName ?? 'Usuario desconocido'}
                              </h4>
                              <p className="text-sm text-slate-400">
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
                                    <MessageSquare className="h-3 w-3" />
                                    Motivo:
                                  </div>
                                  <p className="text-sm text-orange-200">
                                    {solicitud.requestMessage}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="bg-orange-600 hover:bg-orange-700"
                              onClick={() => handleAprobar(solicitud)}
                              disabled={processingId === solicitud.id}
                            >
                              <Check className="mr-1 h-3 w-3" />
                              {processingId === solicitud.id
                                ? 'Procesando...'
                                : 'Aprobar Renuncia'}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-slate-400 text-slate-300 hover:bg-slate-700"
                              onClick={() => handleRechazar(solicitud)}
                              disabled={processingId === solicitud.id}
                            >
                              <X className="mr-1 h-3 w-3" />
                              {processingId === solicitud.id
                                ? 'Procesando...'
                                : 'Rechazar'}
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
                <Card className="border-slate-700 bg-slate-800/50">
                  <CardHeader>
                    <CardTitle className="text-white">
                      Historial de Solicitudes ({solicitudesProcesadas.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {solicitudesProcesadas.map((solicitud) => (
                        <div
                          key={solicitud.id}
                          className="flex items-start justify-between rounded-lg border border-slate-600 bg-slate-700/30 p-3"
                        >
                          <div className="flex items-start gap-3">
                            <Avatar className="h-8 w-8">
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
                            <div>
                              <h5 className="text-sm font-medium text-white">
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
                              <Badge
                                className={`mt-1 text-xs ${
                                  solicitud.requestType === 'participation'
                                    ? 'bg-green-700 text-white'
                                    : 'bg-orange-700 text-white'
                                }`}
                              >
                                {solicitud.requestType === 'participation'
                                  ? 'Participación'
                                  : 'Renuncia'}
                              </Badge>
                              {solicitud.responseMessage && (
                                <p className="mt-1 text-xs text-slate-300">
                                  "{solicitud.responseMessage}"
                                </p>
                              )}
                            </div>
                          </div>
                          <Badge
                            className={
                              solicitud.status === 'approved'
                                ? 'bg-green-600 text-white'
                                : 'bg-red-600 text-white'
                            }
                          >
                            {solicitud.status === 'approved'
                              ? 'Aprobada'
                              : 'Rechazada'}
                          </Badge>
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
