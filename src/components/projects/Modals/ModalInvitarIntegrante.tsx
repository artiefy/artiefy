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
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<
    Record<string, string>
  >({});
  const { user } = useUser(); // Ajusta según tu sistema de auth

  const fetchUsers = () => {
    setLoading(true);
    fetch('/api/users')
      .then((res) => res.json())
      .then((data) => {
        console.log('API /api/users response:', data); // <-- LOG: muestra la respuesta completa
        setUsers(Array.isArray(data) ? data : []);
      })
      .finally(() => setLoading(false));
  };

  // Nueva función para obtener invitaciones pendientes del proyecto
  const fetchPendingInvitations = async () => {
    try {
      const res = await fetch(
        `/api/projects/invitaciones?projectId=${proyectoId}`
      );
      if (res.ok) {
        const data: {
          invitations: { invitedUserId: string; status: string }[];
        } = await res.json();
        const pending: Record<string, string> = {};
        data.invitations.forEach((inv) => {
          if (inv.status === 'pending') {
            pending[inv.invitedUserId] = inv.status;
          }
        });
        setPendingInvitations(pending);
      }
    } catch (_err) {
      // Opcional: manejar error
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
      setSearch('');
      fetchPendingInvitations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, proyectoId]);

  useEffect(() => {
    if (!search) {
      setFilteredUsers(users);
    } else {
      const s = search.toLowerCase();
      setFilteredUsers(
        users.filter(
          (u) =>
            u.firstName?.toLowerCase().includes(s) ??
            u.lastName?.toLowerCase().includes(s) ??
            u.name?.toLowerCase().includes(s) ??
            u.email?.toLowerCase().includes(s)
        )
      );
    }
    // LOG: muestra los usuarios filtrados y originales
    console.log('Usuarios originales:', users);
    console.log('Usuarios filtrados:', filteredUsers);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users, search]);

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
      alert('No se pudo identificar al usuario actual');
      return;
    }
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
      console.log('Iniciando fetch a /api/projects/invitaciones...');
      const fetchStart = performance.now();
      const res = await fetch('/api/projects/invitaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const fetchEnd = performance.now();
      console.log(`Tiempo de fetch: ${(fetchEnd - fetchStart).toFixed(2)}ms`);
      if (res.ok) {
        const data = await res.json();
        console.log('Respuesta JSON exitosa:', data);
        alert('Invitación enviada correctamente');
        // Opcional: actualiza el estado local si lo deseas
      } else {
        const data: { error?: string } = await res.json();
        console.error('Error al invitar. Respuesta completa:', data);
        alert(
          'Error al invitar: ' +
            (typeof data.error === 'string'
              ? data.error
              : JSON.stringify(data) || 'Error desconocido')
        );
      }
    } catch (_err) {
      console.error('Error de red al invitar:', _err);
      alert('Error de red al invitar');
    }
    const end = performance.now();
    console.log(`Tiempo total handleInvite: ${(end - start).toFixed(2)}ms`);
  };

  const handleClear = () => setSearch('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="relative mx-auto max-h-[95vh] min-h-[60vh] w-full max-w-4xl overflow-y-auto rounded-xl bg-gradient-to-br from-slate-900 via-blue-900 to-teal-800 p-0 shadow-2xl">
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
                  onClick={fetchUsers}
                  aria-label="Recargar lista"
                  title="Recargar lista"
                  disabled={loading}
                >
                  <RefreshCw
                    className={`h-6 w-6 ${loading ? 'animate-spin' : ''}`}
                  />
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
        <div className="p-6">
          {loading ? (
            <div className="py-12 text-center">
              <Loader2 className="mx-auto mb-4 h-16 w-16 animate-spin text-teal-400" />
              <p className="text-lg text-gray-400">Cargando usuarios...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
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
                    <CardContent className="p-6">
                      <div className="flex h-full min-h-[260px] flex-col items-center space-y-4 text-center">
                        {/* Avatar con iniciales */}
                        <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-full border-2 border-teal-400/50 bg-gradient-to-br from-teal-400 to-cyan-300 text-lg font-semibold text-slate-900">
                          {avatarText}
                        </div>
                        <div className="w-full min-w-0 space-y-2">
                          <h3 className="text-lg font-semibold break-words text-white transition-colors group-hover:text-teal-300">
                            {displayName}
                          </h3>
                          <p className="text-sm break-words text-gray-300">
                            {user.email}
                          </p>
                        </div>
                        <div className="flex-grow" />
                        <Button
                          variant="outline"
                          className="mt-auto w-full border-teal-400/40 bg-white/10 text-teal-300 hover:bg-teal-500/20 hover:text-teal-200"
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
                <div className="col-span-3 py-12 text-center text-gray-400">
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
