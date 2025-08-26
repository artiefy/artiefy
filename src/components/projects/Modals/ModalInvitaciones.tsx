import React, { useEffect, useState } from 'react';

import { Button } from '~/components/projects/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '~/components/projects/ui/dialog';

interface InvitacionApi {
  id: number;
  projectName: string;
  fromUser: string;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected';
}

interface Invitacion extends InvitacionApi {
  projectId?: number | string;
}

interface ProjectApi {
  id: number | string;
  name: string;
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
          // Obtener los nombres de los proyectos
          const ids = invitacionesTyped
            .map((inv) => inv.projectName)
            .filter((id) => typeof id === 'string' && id.length > 0);
          const uniqueProjectIds = Array.from(new Set(ids));
          const namesMap: Record<string, string> = {};
          await Promise.all(
            uniqueProjectIds.map(async (id) => {
              try {
                const res = await fetch(
                  `/api/projects/${encodeURIComponent(id)}`
                );
                if (res.ok) {
                  const project: ProjectApi = await res.json();
                  if (
                    project &&
                    typeof project === 'object' &&
                    typeof project.name === 'string'
                  ) {
                    namesMap[String(id)] = project.name;
                  }
                }
              } catch {
                namesMap[String(id)] = String(id);
              }
            })
          );
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

          setInvitaciones(
            invitacionesTyped.map((inv) => ({
              ...inv,
              projectId: inv.projectName,
            }))
          );
        } else {
          setInvitaciones([]);
        }
      })
      .catch(() => setInvitaciones([]))
      .finally(() => setLoading(false));
  }, [isOpen, userId]);

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
        setInvitaciones((prev) =>
          prev.map((inv) =>
            inv.id === id ? { ...inv, status: 'accepted' } : inv
          )
        );
        // Registrar como tomado el proyecto
        const invitacion = invitaciones.find((inv) => inv.id === id);
        if (invitacion && userId && invitacion.projectId) {
          await fetch('/api/projects/taken', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId,
              projectId: invitacion.projectId,
            }),
          });
        }
      }
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Invitaciones a Proyectos</DialogTitle>
        </DialogHeader>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm text-slate-400">
            {invitaciones.length > 0 && 'Tus invitaciones'}
          </span>
          {invitaciones.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleEliminarTodas}
              disabled={deleteAllLoading}
              className="ml-auto"
            >
              {deleteAllLoading ? 'Eliminando...' : 'Eliminar todas'}
            </Button>
          )}
        </div>
        {loading ? (
          <div className="py-6 text-center text-slate-400">
            Cargando invitaciones...
          </div>
        ) : invitaciones.length === 0 ? (
          <div className="py-6 text-center text-slate-400">
            No tienes invitaciones pendientes.
          </div>
        ) : (
          <ul className="space-y-4 py-2">
            {Array.isArray(invitaciones) &&
              invitaciones.map((inv) => (
                <li key={inv.id} className="relative rounded bg-slate-800 p-3">
                  {/* Botón X estilo barra derecha */}
                  <button
                    type="button"
                    className="absolute top-0 right-0 flex h-full w-12 items-center justify-center rounded-r bg-slate-800 text-2xl text-cyan-400 transition-all hover:bg-cyan-900/80 hover:text-cyan-300"
                    style={{ zIndex: 10 }}
                    title="Eliminar invitación"
                    disabled={actionLoading === inv.id}
                    onClick={() => handleEliminarInvitacion(inv.id)}
                  >
                    x
                  </button>
                  <div className="font-semibold text-cyan-300">
                    Proyecto:{' '}
                    {inv.projectId &&
                    typeof inv.projectId === 'string' &&
                    projectNames[inv.projectId]
                      ? projectNames[inv.projectId]
                      : (inv.projectName ?? 'Proyecto')}
                  </div>
                  <div className="text-xs text-slate-400">
                    De:{' '}
                    {inv.fromUser &&
                    typeof inv.fromUser === 'string' &&
                    userNames[inv.fromUser]
                      ? userNames[inv.fromUser]
                      : inv.fromUser}
                  </div>
                  {inv.message && (
                    <div className="text-xs text-slate-300">
                      Mensaje: {inv.message}
                    </div>
                  )}
                  <div className="mt-2 flex items-center gap-2">
                    <span
                      className={
                        inv.status === 'pending'
                          ? 'text-yellow-400'
                          : inv.status === 'accepted'
                            ? 'text-green-400'
                            : 'text-red-400'
                      }
                    >
                      {inv.status === 'pending'
                        ? 'Pendiente'
                        : inv.status === 'accepted'
                          ? 'Aceptada'
                          : 'Rechazada'}
                    </span>
                    {inv.status === 'pending' && (
                      <>
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
                      </>
                    )}
                  </div>
                </li>
              ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ModalInvitaciones;
