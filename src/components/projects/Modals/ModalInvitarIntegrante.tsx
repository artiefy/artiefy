import React, { useEffect, useState } from 'react';

import { useUser } from '@clerk/nextjs'; // O tu método de autenticación
import { Loader2, RefreshCw, UserPlus, X } from 'lucide-react';

import { Button } from '~/components/projects/ui/button';
import { Card, CardContent } from '~/components/projects/ui/card';
import { Input } from '~/components/projects/ui/input'; // Asegúrate de tener este componente

// Extiende la interfaz User para incluir firstName y lastName
interface User {
  id: string;
  name?: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

interface ModalInvitarIntegranteProps {
  isOpen: boolean;
  onClose: () => void;
  proyectoId: number | string;
  projectMembers: string[]; // IDs de usuarios ya en el proyecto
}

const ModalInvitarIntegrante: React.FC<ModalInvitarIntegranteProps> = ({
  isOpen,
  onClose,
  proyectoId,
  projectMembers,
}) => {
  const [_users, _setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<
    Record<string, string>
  >({});
  const [inviteProgress, setInviteProgress] = useState(0);
  const [inviteStatusText, setInviteStatusText] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [inviteAlready, setInviteAlready] = useState(false);
  const { user } = useUser(); // Ajusta según tu sistema de auth

  // fetchUsers no se utiliza - el componente busca por email usando filteredUsers
  // const fetchUsers = () => {
  //   setLoading(true);
  //   fetch('/api/users')
  //     .then((res) => res.json())
  //     .then((data) => {
  //       console.log('API /api/users response:', data);
  //     })
  //     .finally(() => setLoading(false));
  // };

  // Nueva función para obtener invitaciones pendientes del proyecto
  const fetchPendingInvitations = async () => {
    try {
      const res = await fetch(
        `/api/projects/invitaciones?projectId=${proyectoId}`
      );
      if (res.ok) {
        const data: unknown = await res.json();
        const invitations = Array.isArray(data)
          ? data
          : ((data as { invitations?: unknown })?.invitations ?? []);
        const pending: Record<string, string> = {};
        if (Array.isArray(invitations)) {
          invitations.forEach((inv) => {
            const invitedId =
              typeof (inv as { invitedUserId?: unknown }).invitedUserId ===
              'string'
                ? String((inv as { invitedUserId?: string }).invitedUserId)
                : '';
            const status =
              typeof (inv as { status?: unknown }).status === 'string'
                ? String((inv as { status?: string }).status)
                : '';
            if (invitedId && status === 'pending') {
              pending[invitedId] = status;
            }
          });
        }
        setPendingInvitations(pending);
      }
    } catch (_err) {
      // Opcional: manejar error
    }
  };

  useEffect(() => {
    if (isOpen) {
      // Do not fetch all users on open. Only show the search box.
      setFilteredUsers([]);
      setSearch('');
      fetchPendingInvitations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, proyectoId]);

  // Search by email (debounced). Only query backend when input looks like an email.
  useEffect(() => {
    if (!search || search.trim() === '') {
      setFilteredUsers([]);
      return;
    }

    const maybeEmail = search.trim();
    // Simple email pattern check
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;
    if (!emailPattern.test(maybeEmail)) {
      // If not a valid email yet, don't search and clear results
      setFilteredUsers([]);
      return;
    }

    let mounted = true;
    const id = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `/api/users?email=${encodeURIComponent(maybeEmail)}`
        );
        if (!mounted) return;
        if (!res.ok) {
          setFilteredUsers([]);
          return;
        }
        const data = await res.json();
        // Expecting either a single user or an array
        const found = Array.isArray(data) ? data : data ? [data] : [];
        // Filter to only exact email matches
        const exactMatches = (Array.isArray(found) ? found : []).filter(
          (u: User) => u.email.toLowerCase() === maybeEmail.toLowerCase()
        );
        setFilteredUsers(exactMatches);
      } catch (e) {
        setFilteredUsers([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }, 350);

    return () => {
      mounted = false;
      clearTimeout(id);
    };
  }, [search]);

  // Usa el tipo User en vez de any y accede de forma segura a las propiedades
  const getDisplayName = (user: User): string => {
    if (typeof user.firstName === 'string' && user.firstName.trim() !== '') {
      if (typeof user.lastName === 'string' && user.lastName.trim() !== '') {
        return `${user.firstName.trim()} ${user.lastName.trim()}`;
      }
      return user.firstName.trim();
    }
    if (typeof user.lastName === 'string' && user.lastName.trim() !== '') {
      return user.lastName.trim();
    }
    if (typeof user.name === 'string' && user.name.trim() !== '') {
      return user.name.trim();
    }
    return user.email;
  };

  if (!isOpen) return null;

  const handleInvite = async (userId: string) => {
    if (!user?.id) {
      setInviteError('No se pudo identificar al usuario actual');
      setIsInviting(true);
      setInviteProgress(100);
      setInviteStatusText('Error: No se pudo identificar al usuario actual');
      setTimeout(() => {
        setIsInviting(false);
        setInviteProgress(0);
        setInviteStatusText('');
        setInviteError('');
      }, 1200);
      return;
    }
    setIsInviting(true);
    setInviteProgress(10);
    setInviteStatusText('Enviando invitación...');
    setInviteError('');
    setInviteAlready(false);
    const payload = {
      invitedUserId: userId,
      projectId: proyectoId,
      invitedByUserId: user.id,
      // invitationMessage: 'Te invito a mi proyecto', // Opcional
    };
    console.log('User actual:', user);
    console.log('Proyecto actual:', proyectoId);
    console.log('Payload a enviar:', payload);

    const start = performance.now();
    try {
      setTimeout(() => setInviteProgress(30), 100);
      const fetchStart = performance.now();
      const res = await fetch('/api/projects/invitaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      setInviteProgress(70);
      const fetchEnd = performance.now();
      console.log(`Tiempo de fetch: ${(fetchEnd - fetchStart).toFixed(2)}ms`);
      if (res.ok) {
        const _data = await res.json();
        setInviteProgress(100);
        setInviteStatusText('Invitación enviada correctamente.');
        setTimeout(() => {
          setIsInviting(false);
          setInviteProgress(0);
          setInviteStatusText('');
          fetchPendingInvitations();
        }, 1200);
      } else {
        const { error } = await res.json();
        let msg = '';
        let already = false;
        if (typeof error === 'string') {
          if (
            error.toLowerCase().includes('ya existe') ||
            error.toLowerCase().includes('ya invitado') ||
            error.toLowerCase().includes('already invited')
          ) {
            msg = 'Este usuario ya fue invitado o ya está en el proyecto.';
            already = true;
          } else {
            msg = error;
          }
        } else {
          msg = 'Error desconocido';
        }
        setInviteProgress(100);
        setInviteStatusText(msg);
        setInviteError(msg);
        setInviteAlready(already);
        setTimeout(() => {
          setIsInviting(false);
          setInviteProgress(0);
          setInviteStatusText('');
          setInviteError('');
          setInviteAlready(false);
          fetchPendingInvitations();
        }, 1800);
      }
    } catch (_err) {
      setInviteProgress(100);
      setInviteStatusText('Error de red al invitar');
      setInviteError('Error de red al invitar');
      setTimeout(() => {
        setIsInviting(false);
        setInviteProgress(0);
        setInviteStatusText('');
        setInviteError('');
      }, 1800);
    }
    const end = performance.now();
    console.log(`Tiempo total handleInvite: ${(end - start).toFixed(2)}ms`);
  };

  const handleClear = () => setSearch('');

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60">
      {/* Barra de progreso de invitación */}
      {isInviting && (
        <div className="fixed inset-0 z-[210] flex items-center justify-center bg-black/60">
          <div className="flex w-full max-w-md flex-col items-center rounded-lg bg-[#0F2940] p-6 shadow-lg">
            <div className="mb-4 w-full">
              <div className="h-6 w-full rounded-full bg-gray-200">
                <div
                  className={`h-6 rounded-full transition-all duration-300 ${
                    inviteError
                      ? 'bg-red-500'
                      : inviteAlready
                        ? 'bg-yellow-400'
                        : 'bg-teal-500'
                  }`}
                  style={{ width: `${inviteProgress}%` }}
                />
              </div>
              <div
                className={`mt-2 text-center font-semibold ${
                  inviteError
                    ? 'text-red-400'
                    : inviteAlready
                      ? 'text-yellow-500'
                      : 'text-gray-500'
                }`}
              >
                {inviteStatusText
                  ? inviteStatusText
                  : inviteProgress < 100
                    ? `Enviando... (${inviteProgress}%)`
                    : inviteError
                      ? inviteError
                      : inviteAlready
                        ? 'Ya invitado'
                        : '¡Completado!'}
              </div>
            </div>
            <div className="text-sm text-gray-300">
              Por favor, espera a que termine el proceso.
            </div>
          </div>
        </div>
      )}
      <div className="relative mx-auto max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-gradient-to-br from-slate-900 via-blue-900 to-teal-800 p-0 shadow-2xl">
        {/* Header sticky y barra de búsqueda sticky, ocupando todo el ancho */}
        <div className="sticky top-0 z-10 w-full bg-gradient-to-br from-slate-900 to-blue-900 p-2 backdrop-blur-md">
          <div className="px-6 pt-6">
            {/* Header del Modal */}
            <div className="flex items-center justify-between">
              <div className="flex min-w-0 flex-1 items-center gap-4 pr-4">
                <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-teal-400 to-cyan-300">
                  <UserPlus className="h-8 w-8 text-slate-900" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="mb-2 text-2xl font-bold break-words text-white md:text-3xl">
                    Invitar Integrante al Proyecto
                  </h2>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm text-teal-300">
                      Selecciona un usuario para invitar
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/10"
                  onClick={() => {}}
                  aria-label="Recargar lista"
                  title="Búsqueda automática por email"
                  disabled={true}
                >
                  <RefreshCw className="h-6 w-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="flex-shrink-0 text-white hover:bg-white/10"
                  onClick={onClose}
                  aria-label="Cerrar"
                >
                  <X className="h-6 w-6" />
                </Button>
              </div>
            </div>
            {/* Barra de búsqueda */}
            <div className="mt-6 mb-2 flex items-center gap-2">
              <Input
                type="text"
                placeholder="Buscar usuario por nombre o email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 bg-white/10 text-white placeholder:text-gray-400"
              />
              {search && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white"
                  onClick={handleClear}
                  title="Limpiar búsqueda"
                >
                  <X className="h-5 w-5" />
                </Button>
              )}
            </div>
          </div>
        </div>
        {/* Contenido scrollable */}
        <div className="p-4">
          {loading ? (
            <div className="py-12 text-center">
              <Loader2 className="mx-auto mb-4 h-16 w-16 animate-spin text-teal-400" />
              <p className="text-lg text-gray-400">Cargando usuarios...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredUsers.map((user) => {
                const displayName = getDisplayName(user);
                // LOG: muestra cada usuario y el displayName calculado
                console.log(
                  'Render usuario:',
                  user,
                  'DisplayName:',
                  displayName
                );
                // Avatar: iniciales del nombre real si existen, si no, inicial del email
                let avatarText = '';
                if (
                  typeof user.firstName === 'string' &&
                  user.firstName.trim() !== ''
                ) {
                  avatarText += user.firstName?.trim()[0]?.toUpperCase() ?? '';
                }
                if (
                  typeof user.lastName === 'string' &&
                  user.lastName.trim() !== ''
                ) {
                  avatarText += user.lastName?.trim()[0]?.toUpperCase() ?? '';
                }
                if (avatarText === '') {
                  if (
                    typeof user.name === 'string' &&
                    user.name.trim() !== ''
                  ) {
                    avatarText = user.name
                      .trim()
                      .split(' ')
                      .map((n: string) => n[0]?.toUpperCase() || '')
                      .join('')
                      .slice(0, 2);
                  } else {
                    avatarText = (user.email?.[0] || '').toUpperCase();
                  }
                }

                const yaEnProyecto = projectMembers.includes(user.id);
                const invitacionPendiente = !!pendingInvitations[user.id];

                return (
                  <Card
                    key={user.id}
                    className="group border-white/20 bg-white/10 backdrop-blur-sm transition-all duration-300 hover:bg-white/15"
                  >
                    <CardContent className="p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border-2 border-teal-400/50 bg-gradient-to-br from-teal-400 to-cyan-300 text-sm font-semibold text-slate-900">
                            {avatarText}
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-sm font-semibold break-words text-white transition-colors group-hover:text-teal-300">
                              {displayName}
                            </h3>
                            <p className="text-xs break-words text-gray-300">
                              {user.email}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          className="border-teal-400/40 bg-white/10 text-teal-300 hover:bg-teal-500/20 hover:text-teal-200"
                          onClick={() => handleInvite(user.id)}
                          disabled={yaEnProyecto || invitacionPendiente}
                        >
                          {yaEnProyecto
                            ? 'Ya está en el proyecto'
                            : invitacionPendiente
                              ? 'Invitado'
                              : 'Invitar'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              {filteredUsers.length === 0 && (
                <div className="py-12 text-center text-gray-400">
                  No hay usuarios disponibles para invitar.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModalInvitarIntegrante;
