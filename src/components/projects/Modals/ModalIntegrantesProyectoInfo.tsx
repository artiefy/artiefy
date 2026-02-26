import React, { useEffect, useState } from 'react';

import { Loader2, Mail, Trash2, Users, X } from 'lucide-react';

import { Badge } from '~/components/projects/ui/badge';
import { Button } from '~/components/projects/ui/button';
import { Card, CardContent } from '~/components/projects/ui/card';

import ModalInvitarIntegrante from './ModalInvitarIntegrante';

interface Integrante {
  id: number | string;
  nombre: string;
  rol: string;
  especialidad: string;
  email: string;
  esResponsable?: boolean;
  isInvited?: boolean;
}

interface Proyecto {
  titulo: string;
  rama: string;
  especialidades: number | string;
  participacion: string;
}

interface ModalIntegrantesProyectoInfoProps {
  isOpen: boolean;
  onClose: () => void;
  proyecto: Proyecto & { id: number | string };
  integrantes?: Integrante[];
  allowInvite?: boolean;
  isProjectOwner?: boolean; // Para saber si puede eliminar invitados
  onInvitationRemoved?: () => void; // Callback para refrescar datos
}

const ModalIntegrantesProyectoInfo: React.FC<
  ModalIntegrantesProyectoInfoProps
> = ({
  isOpen,
  onClose,
  proyecto,
  integrantes: integrantesProp,
  allowInvite = true,
  isProjectOwner = false,
  onInvitationRemoved,
}) => {
  const [integrantes, setIntegrantes] = useState<Integrante[]>(
    integrantesProp ?? []
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [deletingId, setDeletingId] = useState<number | string | null>(null);

  // Obtener integrantes cuando se abre el modal
  useEffect(() => {
    if (isOpen && proyecto?.id) {
      const fetchIntegrantes = async () => {
        setLoading(true);
        setError(null);
        try {
          const response = await fetch(
            `/api/projects/taken?projectId=${proyecto.id}`
          );
          if (response.ok) {
            const data: unknown = await response.json();
            // Safe type check for data.integrantes
            if (
              data &&
              typeof data === 'object' &&
              'integrantes' in data &&
              Array.isArray((data as { integrantes?: unknown }).integrantes)
            ) {
              setIntegrantes(
                (data as { integrantes: Integrante[] }).integrantes
              );
            } else {
              setIntegrantes([]);
            }
          } else {
            setError('Error al cargar los integrantes');
          }
        } catch (err) {
          setError('Error de conexión');
          console.error('Error fetching integrantes:', err);
        } finally {
          setLoading(false);
        }
      };

      fetchIntegrantes();
    }
  }, [isOpen, proyecto?.id]);

  const handleRemoveInvitation = async (integrante: Integrante) => {
    if (!isProjectOwner) {
      console.error('No tienes permisos para eliminar invitaciones');
      return;
    }

    try {
      setDeletingId(integrante.id);
      const response = await fetch('/api/projects/taken', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: integrante.id,
          projectId: proyecto.id,
        }),
      });

      if (!response.ok) {
        throw new Error('No se pudo eliminar la invitación');
      }

      // Actualizar lista local
      setIntegrantes((prev) => prev.filter((i) => i.id !== integrante.id));

      // Llamar callback si existe
      onInvitationRemoved?.();
    } catch (err) {
      console.error('Error al eliminar invitación:', err);
      setError('Error al eliminar la invitación');
    } finally {
      setDeletingId(null);
    }
  };

  if (!isOpen) return null;

  // Evita errores si no hay datos
  const safeProyecto = proyecto ?? {
    titulo: '',
    rama: '',
    especialidades: 0,
    participacion: '',
  };
  const safeIntegrantes = integrantes ?? [];

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <>
      <div
        onClick={handleOverlayClick}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-4"
      >
        <div className="relative mx-auto max-h-[85vh] w-full max-w-4xl overflow-hidden rounded-lg bg-gradient-to-br from-slate-900 via-blue-900 to-teal-800 shadow-2xl sm:rounded-xl">
          {/* Header del Modal */}
          <div className="flex items-center justify-between border-b border-white/10 bg-gradient-to-r from-slate-900/80 to-blue-900/80 p-3 sm:p-4">
            <div className="flex min-w-0 flex-1 items-center gap-2 pr-2 sm:gap-3 sm:pr-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-teal-400 to-cyan-300 sm:h-12 sm:w-12">
                <Users className="h-5 w-5 text-slate-900 sm:h-6 sm:w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="mb-0.5 text-base font-bold break-words text-white sm:text-lg md:text-xl">
                  {safeProyecto.titulo}
                </h1>
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge
                    variant="secondary"
                    className="max-w-[150px] truncate border-teal-400/30 bg-teal-500/20 text-[10px] text-teal-300 sm:text-xs"
                  >
                    {safeProyecto.rama}
                  </Badge>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 flex-shrink-0 text-white hover:bg-white/10 sm:h-10 sm:w-10"
              onClick={onClose}
              aria-label="Cerrar"
            >
              <X className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </div>

          {/* Contenido con scroll */}
          <div className="max-h-[calc(85vh-120px)] overflow-y-auto p-3 sm:p-4">
            {/* Sección de Integrantes */}
            <div className="mb-3">
              <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-white sm:text-lg">
                <Users className="h-4 w-4 flex-shrink-0 text-teal-400 sm:h-5 sm:w-5" />
                Integrantes del Proyecto ({safeIntegrantes.length})
              </h2>

              {loading ? (
                <div className="py-6 text-center sm:py-8">
                  <Loader2 className="mx-auto mb-2 h-10 w-10 animate-spin text-teal-400 sm:mb-3 sm:h-12 sm:w-12" />
                  <p className="text-sm text-gray-400 sm:text-base">
                    Cargando integrantes...
                  </p>
                </div>
              ) : error ? (
                <div className="py-6 text-center sm:py-8">
                  <Users className="mx-auto mb-2 h-10 w-10 text-red-500 sm:mb-3 sm:h-12 sm:w-12" />
                  <p className="mb-1.5 text-sm text-red-400 sm:mb-2 sm:text-base">
                    {error}
                  </p>
                  <p className="text-xs text-gray-500 sm:text-sm">
                    No se pudieron cargar los integrantes
                  </p>
                </div>
              ) : safeIntegrantes.length === 0 ? (
                <div className="py-6 text-center sm:py-8">
                  <Users className="mx-auto mb-2 h-10 w-10 text-gray-500 sm:mb-3 sm:h-12 sm:w-12" />
                  <p className="mb-1.5 text-sm text-gray-400 sm:mb-2 sm:text-base">
                    No hay integrantes inscritos
                  </p>
                  <p className="text-xs text-gray-500 sm:text-sm">
                    Este proyecto aún no tiene miembros del equipo
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {safeIntegrantes.map((integrante) => (
                    <Card
                      key={integrante.id}
                      className="group border-white/20 bg-white/10 backdrop-blur-sm transition-all duration-300 hover:bg-white/15"
                    >
                      <CardContent className="p-3 sm:p-4">
                        <div className="flex flex-col items-center space-y-2 text-center">
                          {/* Avatar con iniciales del nombre */}
                          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full border-2 border-teal-400/50 bg-gradient-to-br from-teal-400 to-cyan-300 text-sm font-semibold text-slate-900 sm:h-16 sm:w-16 sm:text-base">
                            {integrante.nombre?.trim()
                              ? integrante.nombre
                                  .trim()
                                  .split(' ')
                                  .map((n) => n[0]?.toUpperCase() || '')
                                  .join('')
                                  .slice(0, 2)
                              : '??'}
                          </div>

                          {/* Información del integrante */}
                          <div className="w-full min-w-0 space-y-1.5">
                            <h3 className="text-sm font-semibold break-words text-white transition-colors group-hover:text-teal-300 sm:text-base">
                              {integrante.nombre || 'Sin nombre'}
                            </h3>
                            <div className="flex flex-wrap justify-center gap-1">
                              {integrante.esResponsable && (
                                <Badge className="max-w-full truncate border-yellow-400/30 bg-yellow-500/20 text-[10px] text-yellow-300 sm:text-xs">
                                  👑 Responsable
                                </Badge>
                              )}
                              {integrante.isInvited &&
                                !integrante.esResponsable && (
                                  <Badge className="max-w-full truncate border-blue-400/30 bg-blue-500/20 text-[10px] text-blue-300 sm:text-xs">
                                    📨 Invitado
                                  </Badge>
                                )}
                              {integrante.rol && !integrante.esResponsable && (
                                <Badge className="max-w-full truncate border-teal-400/30 bg-teal-500/20 text-[10px] text-teal-300 sm:text-xs">
                                  {integrante.rol}
                                </Badge>
                              )}
                            </div>
                            {integrante.especialidad && (
                              <p className="text-[11px] break-words text-gray-300 sm:text-xs">
                                {integrante.especialidad}
                              </p>
                            )}
                          </div>

                          {/* Enlaces de contacto */}
                          <div className="flex flex-wrap items-center justify-center gap-1.5 pt-0.5">
                            {integrante.email && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 p-1.5 text-gray-300 hover:bg-teal-500/20 hover:text-teal-300 sm:h-8 sm:p-2"
                                title={`Enviar email a ${integrante.nombre}`}
                                asChild
                              >
                                <a
                                  href={`mailto:${integrante.email}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <Mail className="h-4 w-4" />
                                </a>
                              </Button>
                            )}
                            {isProjectOwner &&
                              integrante.isInvited &&
                              !integrante.esResponsable && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 p-1.5 text-red-400 hover:bg-red-500/20 hover:text-red-300 sm:h-8 sm:p-2"
                                  title={`Quitar invitación a ${integrante.nombre}`}
                                  onClick={() =>
                                    handleRemoveInvitation(integrante)
                                  }
                                  disabled={deletingId === integrante.id}
                                >
                                  {deletingId === integrante.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                </Button>
                              )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {/* Botón para invitar nuevo integrante */}
                  {allowInvite && (
                    <Card
                      className="group flex cursor-pointer flex-col items-center justify-center border-2 border-dashed border-teal-400/40 bg-white/5 backdrop-blur-sm transition-all duration-300 hover:bg-white/10"
                      onClick={() => setShowInviteModal(true)}
                      tabIndex={0}
                      role="button"
                      aria-label="Invitar nuevo integrante"
                    >
                      <CardContent className="flex h-full min-h-[150px] flex-col items-center justify-center p-3 sm:p-4">
                        <div className="mb-2 flex h-14 w-14 items-center justify-center rounded-full border-2 border-teal-400/50 bg-gradient-to-br from-teal-400 to-cyan-300 text-2xl font-bold text-slate-900 sm:mb-3 sm:h-16 sm:w-16 sm:text-3xl">
                          +
                        </div>
                        <div className="text-center">
                          <span className="block text-sm font-semibold text-teal-300 sm:text-base">
                            Invitar Integrante
                          </span>
                          <span className="mt-0.5 block text-[11px] text-gray-400 sm:mt-1 sm:text-xs">
                            Añadir nuevo miembro al equipo
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Estadísticas del equipo */}
          <div className="border-t border-white/10 bg-gradient-to-r from-slate-900/50 to-blue-900/50 p-2 sm:p-3">
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <Card className="border-white/20 bg-white/10 backdrop-blur-sm">
                <CardContent className="p-2 text-center sm:p-3">
                  <div className="mb-0.5 text-lg font-bold text-teal-300 sm:mb-1 sm:text-xl">
                    {
                      safeIntegrantes.filter(
                        (integrante) => !integrante.esResponsable
                      ).length
                    }
                  </div>
                  <div className="text-[10px] text-gray-300 sm:text-xs">
                    Integrantes Inscritos
                  </div>
                </CardContent>
              </Card>
              <Card className="border-white/20 bg-white/10 backdrop-blur-sm">
                <CardContent className="p-2 text-center sm:p-3">
                  <div className="mb-0.5 text-lg font-bold text-cyan-300 sm:mb-1 sm:text-xl">
                    {safeProyecto.participacion}
                  </div>
                  <div className="text-[10px] text-gray-300 sm:text-xs">
                    Estado del Proyecto
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
      {/* Modal de Invitación */}
      {allowInvite && (
        <ModalInvitarIntegrante
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          proyectoId={safeProyecto.id}
          projectMembers={safeIntegrantes.map((i) => String(i.id))}
        />
      )}
    </>
  );
};

export default ModalIntegrantesProyectoInfo;
