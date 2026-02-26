import React, { useEffect, useState } from 'react';

import { RefreshCw } from 'lucide-react';

import { Avatar, AvatarFallback } from '~/components/projects/ui/avatar';
import { Badge } from '~/components/projects/ui/badge';
import { Button } from '~/components/projects/ui/button';
import { Card, CardContent } from '~/components/projects/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '~/components/projects/ui/dialog';

interface InvitacionApi {
  id: number;
  projectName: string;
  projectId?: number | string;
  fromUser: string;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected';
}

interface Invitacion extends InvitacionApi {
  projectId?: number | string;
}

interface ModalInvitacionesProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | undefined;
}

const ModalInvitaciones: React.FC<ModalInvitacionesProps> = ({
  isOpen,
  onClose,
  userId,
}) => {
  const [invitaciones, setInvitaciones] = useState<Invitacion[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [deleteAllLoading, setDeleteAllLoading] = useState(false);
  const [projectNames, setProjectNames] = useState<Record<string, string>>({});
  const [userNames, setUserNames] = useState<Record<string, string>>({});

  // Refrescar invitaciones y obtener nombres de proyectos y usuarios
  const fetchInvitaciones = React.useCallback(() => {
    if (!isOpen || !userId) return;
    setLoading(true);
    fetch(`/api/projects/invitaciones?userId=${userId}`)
      .then((res) => res.json())
      .then(async (data: unknown) => {
        if (Array.isArray(data)) {
          // Tipar cada invitación
          const invitacionesTyped: InvitacionApi[] = data.filter(
            (inv): inv is InvitacionApi =>
              typeof inv === 'object' &&
              inv !== null &&
              typeof (inv as InvitacionApi).id === 'number' &&
              typeof (inv as InvitacionApi).projectName === 'string' &&
              typeof (inv as InvitacionApi).fromUser === 'string'
          );
          const namesMap: Record<string, string> = {};
          invitacionesTyped.forEach((inv) => {
            if (inv.projectId) {
              namesMap[String(inv.projectId)] =
                inv.projectName ?? String(inv.projectId);
            }
          });
          setProjectNames(namesMap);

          // Obtener los nombres de los usuarios que invitaron
          const userIds = invitacionesTyped
            .map((inv) => inv.fromUser)
            .filter((id) => typeof id === 'string' && id.length > 0);
          const uniqueUserIds = Array.from(new Set(userIds));
          const userNamesMap: Record<string, string> = {};
          await Promise.all(
            uniqueUserIds.map(async (id) => {
              try {
                const res = await fetch(
                  `/api/user?userId=${encodeURIComponent(id)}`
                );
                if (res.ok) {
                  const userData = await res.json();
                  // Type guard para evitar acceso inseguro
                  let userName = String(id);
                  if (
                    userData &&
                    typeof userData === 'object' &&
                    'name' in userData &&
                    typeof (userData as { name?: unknown }).name === 'string'
                  ) {
                    userName = (userData as { name: string }).name;
                  }
                  userNamesMap[String(id)] = userName;
                }
              } catch {
                userNamesMap[String(id)] = String(id);
              }
            })
          );
          setUserNames(userNamesMap);

          setInvitaciones(invitacionesTyped);
        } else {
          setInvitaciones([]);
        }
      })
      .catch(() => setInvitaciones([]))
      .finally(() => setLoading(false));
  }, [isOpen, userId]);

  // Permitir recarga externa (ej: desde sistema de notificaciones)
  useEffect(() => {
    // Escuchar evento global para recargar invitaciones
    const handler = () => {
      fetchInvitaciones();
    };
    window.addEventListener('invitacion-notificacion', handler);
    return () => {
      window.removeEventListener('invitacion-notificacion', handler);
    };
  }, [fetchInvitaciones]);

  useEffect(() => {
    fetchInvitaciones();
  }, [fetchInvitaciones]);

  // Aceptar invitación
  const handleAceptar = async (id: number) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/projects/invitaciones`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'accepted' }),
      });
      if (res.ok) {
        // Registrar como tomado el proyecto con isInvited = true
        const invitacion = invitaciones.find((inv) => inv.id === id);
        if (invitacion && userId && invitacion.projectId) {
          console.log('📝 Registrando usuario en proyecto:', {
            userId,
            projectId: invitacion.projectId,
            isInvited: true,
          });

          const takenRes = await fetch('/api/projects/taken', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId,
              projectId: invitacion.projectId,
              isInvited: true, // Marca como invitado
            }),
          });

          if (takenRes.ok) {
            console.log('✅ Usuario registrado exitosamente en el proyecto');
          } else {
            try {
              const errorData = await takenRes.json();
              console.error(
                '❌ Error al registrar usuario en proyecto:',
                errorData
              );
            } catch {
              const errorText = await takenRes.text();
              console.error(
                '❌ Error al registrar usuario en proyecto (texto):',
                errorText
              );
            }
          }
        }

        setInvitaciones((prev) =>
          prev.map((inv) =>
            inv.id === id ? { ...inv, status: 'accepted' } : inv
          )
        );
      }
    } catch (error) {
      console.error('❌ Error al aceptar invitación:', error);
    } finally {
      setActionLoading(null);
    }
  };

  // Rechazar invitación
  const handleRechazar = async (id: number) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/projects/invitaciones`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'rejected' }),
      });
      if (res.ok) {
        setInvitaciones((prev) =>
          prev.map((inv) =>
            inv.id === id ? { ...inv, status: 'rejected' } : inv
          )
        );
      }
    } finally {
      setActionLoading(null);
    }
  };

  // Eliminar todas las invitaciones
  const handleEliminarTodas = async () => {
    if (!userId) return;
    setDeleteAllLoading(true);
    try {
      const res = await fetch(`/api/projects/invitaciones?userId=${userId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setInvitaciones([]);
      }
    } finally {
      setDeleteAllLoading(false);
    }
  };

  // Eliminar invitación individual
  const handleEliminarInvitacion = async (id: number) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/projects/invitaciones`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setInvitaciones((prev) => prev.filter((inv) => inv.id !== id));
      }
    } finally {
      setActionLoading(null);
    }
  };

  // Utilidad para avatar
  const getAvatarText = (name: string | undefined) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Utilidad para badge de estado
  const getStatusBadge = (status: Invitacion['status']) => {
    if (status === 'pending')
      return (
        <Badge className="bg-yellow-500 text-black" variant="secondary">
          Pendiente
        </Badge>
      );
    if (status === 'accepted')
      return (
        <Badge className="bg-green-600 text-white" variant="secondary">
          Aceptada
        </Badge>
      );
    return (
      <Badge className="bg-red-600 text-white" variant="secondary">
        Rechazada
      </Badge>
    );
  };

  // Ordenar invitaciones: pendientes primero, luego aceptadas, luego rechazadas
  const sortedInvitaciones = React.useMemo(() => {
    const statusOrder = { pending: 0, accepted: 1, rejected: 2 };
    return [...invitaciones].sort(
      (a, b) => statusOrder[a.status] - statusOrder[b.status]
    );
  }, [invitaciones]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="w-full max-w-lg"
        style={{
          width: '100%',
          maxWidth: 800,
          minWidth: 320,
          height: '70vh',
          maxHeight: 600,
          minHeight: 320,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <DialogHeader>
          <DialogTitle>Invitaciones a Proyectos</DialogTitle>
        </DialogHeader>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm text-slate-400">
            {invitaciones.length > 0 && 'Tus invitaciones'}
          </span>
          <div className="ml-auto flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10"
              onClick={fetchInvitaciones}
              aria-label="Recargar lista"
              title="Recargar lista"
              disabled={loading}
            >
              <RefreshCw
                className={`h-6 w-6 ${loading ? 'animate-spin' : ''}`}
              />
            </Button>
            {invitaciones.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleEliminarTodas}
                disabled={deleteAllLoading}
              >
                {deleteAllLoading ? 'Eliminando...' : 'Eliminar todas'}
              </Button>
            )}
          </div>
        </div>
        <div className="custom-scrollbar flex-1 overflow-y-auto">
          {loading ? (
            <div className="py-6 text-center text-slate-400">
              Cargando invitaciones...
            </div>
          ) : invitaciones.length === 0 ? (
            <div className="py-6 text-center text-slate-400">
              No tienes invitaciones pendientes.
            </div>
          ) : (
            <div className="space-y-4 py-2">
              {sortedInvitaciones.map((inv) => {
                const projectKey = inv.projectId ? String(inv.projectId) : '';
                const projectLabel =
                  projectKey && projectNames[projectKey]
                    ? projectNames[projectKey]
                    : (inv.projectName ?? 'Proyecto');
                const fromUserLabel =
                  inv.fromUser &&
                  typeof inv.fromUser === 'string' &&
                  userNames[inv.fromUser]
                    ? userNames[inv.fromUser]
                    : inv.fromUser;
                return (
                  <Card
                    key={inv.id}
                    className="relative border-slate-700 bg-slate-800/70"
                  >
                    <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4">
                      {/* Avatar y datos */}
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <Avatar className="h-10 w-10 flex-shrink-0">
                          <AvatarFallback className="bg-cyan-600 text-white">
                            {getAvatarText(fromUserLabel)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold break-words text-cyan-300">
                            Proyecto:{' '}
                            <span className="text-white">{projectLabel}</span>
                          </div>
                          <div className="text-xs break-words text-slate-400">
                            De:{' '}
                            <span className="text-white">{fromUserLabel}</span>
                          </div>
                          {inv.message && (
                            <div className="mt-1 text-xs break-words text-slate-300">
                              Mensaje: {inv.message}
                            </div>
                          )}
                          {getStatusBadge(inv.status)}
                        </div>
                      </div>
                      {/* Estado y acciones */}
                      <div className="flex flex-col items-end gap-2 sm:ml-4">
                        {inv.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-green-400 text-green-400 hover:bg-green-400/10"
                              disabled={actionLoading === inv.id}
                              onClick={() => handleAceptar(inv.id)}
                            >
                              {actionLoading === inv.id
                                ? 'Aceptando...'
                                : 'Aceptar'}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-400 text-red-400 hover:bg-red-400/10"
                              disabled={actionLoading === inv.id}
                              onClick={() => handleRechazar(inv.id)}
                            >
                              {actionLoading === inv.id
                                ? 'Rechazando...'
                                : 'Rechazar'}
                            </Button>
                          </div>
                        )}
                      </div>
                      {/* Botón eliminar individual */}
                      <button
                        type="button"
                        className="absolute top-0 right-0 flex h-8 w-8 items-center justify-center rounded-tr-lg bg-slate-800 text-xl text-cyan-400 transition-all hover:bg-cyan-900/80 hover:text-cyan-300"
                        style={{ zIndex: 10 }}
                        title="Eliminar invitación"
                        disabled={actionLoading === inv.id}
                        onClick={() => handleEliminarInvitacion(inv.id)}
                      >
                        ×
                      </button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
        {/* Scrollbar style igual que DetallesProyectos */}
        <style jsx global>{`
          .custom-scrollbar {
            scrollbar-width: thin !important;
            scrollbar-color: #0f3a6e #041c3c;
          }
          @media screen and (-webkit-min-device-pixel-ratio: 0) {
            .custom-scrollbar::-webkit-scrollbar {
              width: 8px;
              height: 8px;
            }
            .custom-scrollbar::-webkit-scrollbar-track {
              background: #041c3c;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb {
              background-color: #0f3a6e;
              border-radius: 10px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover {
              background-color: #0a2e4d;
            }
          }
        `}</style>
      </DialogContent>
    </Dialog>
  );
};

export default ModalInvitaciones;
