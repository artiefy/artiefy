import React from 'react';

import Image from 'next/image';

import { X } from 'lucide-react';

function formatDateForBackend(dateString: string): string {
	if (!dateString) return '';
  
	const [year, month, day] = dateString.split('-');
  
	// Para Clerk → YYYY-DD-MM
	return `${year}-${day}-${month}`;
  }
  

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  status: string;
  profileImage?: string;
  permissions?: string[];
  subscriptionEndDate?: string | null;
}

interface EditUserModalProps {
  isOpen: boolean;
  user: User;
  onClose: () => void;
  onSave: (user: User, permissions: string[]) => void;
}

const availablePermissions = [
  { id: 'create_course', label: 'Crear Cursos' },
  { id: 'edit_course', label: 'Editar Cursos' },
  { id: 'delete_course', label: 'Eliminar Cursos' },
  { id: 'manage_users', label: 'Gestionar Usuarios' },
  { id: 'view_reports', label: 'Ver Reportes' },
];

export default function EditUserModal({
  isOpen,
  user,
  onClose,
  onSave,
}: EditUserModalProps) {
  function parseSubscriptionEndDateForInput(
    dateStr: string | null | undefined
  ): string {
    if (!dateStr) return '';

    const [datePart] = dateStr.split(' ');
    const [year, day, month] = datePart.split('-');

    return `${year}-${month}-${day}`;
  }

  const [editedUser, setEditedUser] = React.useState({
    ...user,
    subscriptionEndDate: parseSubscriptionEndDateForInput(
      user.subscriptionEndDate
    ),
  });

  const [selectedPermissions, setSelectedPermissions] = React.useState<
    string[]
  >(user.permissions ?? []);

  if (!isOpen) return null;
  console.log('User data:', user);

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80"
      onClick={onClose}
    >
      <div
        className="relative mx-auto my-4 h-[90vh] w-full max-w-4xl overflow-hidden rounded-xl bg-[#01142B] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header fijo */}
        <div className="absolute top-0 right-0 left-0 z-10 border-b border-white/10 bg-[#01142B] p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-[#3AF4EF]">
              Editar Usuario
            </h2>
            <button
              onClick={onClose}
              className="rounded-lg bg-white/5 p-2 hover:bg-white/10"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        {/* Contenido scrolleable */}
        <div className="h-full overflow-y-auto px-6 pt-24 pb-24">
          <div className="grid gap-8 md:grid-cols-[250px_1fr]">
            {/* Sidebar - Profile Image & Quick Info */}
            <div className="space-y-6">
              <div className="relative mx-auto h-48 w-48 overflow-hidden rounded-xl border-2 border-[#3AF4EF] shadow-lg">
                {editedUser.profileImage ? (
                  <Image
                    src={editedUser.profileImage}
                    alt={`${editedUser.firstName} ${editedUser.lastName}`}
                    fill
                    className="object-cover transition duration-200 hover:scale-105"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#012A5C] to-[#01142B] text-4xl font-bold text-white">
                    {editedUser.firstName[0]}
                  </div>
                )}
              </div>

              {/* Quick Info Card */}
              <div className="rounded-lg bg-white/5 p-4">
                <div className="space-y-3 text-sm">
                  <p className="text-gray-400">ID del usuario</p>
                  <p className="font-mono">{editedUser.id}</p>
                  <p className="text-gray-400">Email</p>
                  <p>{editedUser.email}</p>
                </div>
              </div>
            </div>

            {/* Main Edit Form */}
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="rounded-lg bg-white/5 p-6">
                <h3 className="mb-4 text-lg font-semibold text-[#3AF4EF]">
                  Información Básica
                </h3>
                <div className="grid gap-4">
                  <div>
                    <label className="mb-2 block text-sm text-gray-400">
                      Nombre
                    </label>
                    <input
                      type="text"
                      value={editedUser.firstName}
                      onChange={(e) =>
                        setEditedUser({
                          ...editedUser,
                          firstName: e.target.value,
                        })
                      }
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white focus:border-[#3AF4EF] focus:ring-1 focus:ring-[#3AF4EF] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm text-gray-400">
                      Apellido
                    </label>
                    <input
                      type="text"
                      value={editedUser.lastName}
                      onChange={(e) =>
                        setEditedUser({
                          ...editedUser,
                          lastName: e.target.value,
                        })
                      }
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white focus:border-[#3AF4EF] focus:ring-1 focus:ring-[#3AF4EF] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Role & Status */}
              <div className="rounded-lg bg-white/5 p-6">
                <h3 className="mb-4 text-lg font-semibold text-[#3AF4EF]">
                  Rol y Estado
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm text-gray-400">
                      Rol
                    </label>
                    <select
                      value={editedUser.role}
                      onChange={(e) =>
                        setEditedUser({
                          ...editedUser,
                          role: e.target.value,
                        })
                      }
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white focus:border-[#3AF4EF] focus:ring-1 focus:ring-[#3AF4EF] focus:outline-none"
                    >
                      <option value="estudiante">Estudiante</option>
                      <option value="educador">Educador</option>
                      <option value="admin">Admin</option>
                      <option value="super-admin">Super Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm text-gray-400">
                      Estado
                    </label>
                    <select
                      value={editedUser.status}
                      onChange={(e) =>
                        setEditedUser({
                          ...editedUser,
                          status: e.target.value,
                        })
                      }
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white focus:border-[#3AF4EF] focus:ring-1 focus:ring-[#3AF4EF] focus:outline-none"
                    >
                      <option value="activo">Activo</option>
                      <option value="inactivo">Inactivo</option>
                      <option value="suspendido">Suspendido</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="rounded-lg bg-white/5 p-6">
                <h3 className="mb-4 text-lg font-semibold text-[#3AF4EF]">
                  Suscripción
                </h3>
                <div className="grid gap-4">
                  <div>
                    <label className="mb-2 block text-sm text-gray-400">
                      Fin de la Suscripción
                    </label>
                    <input
                      type="date"
                      value={
                        editedUser.subscriptionEndDate?.substring(0, 10) ?? ''
                      }
                      onChange={(e) =>
                        setEditedUser({
                          ...editedUser,
                          subscriptionEndDate: e.target.value,
                        })
                      }
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white focus:border-[#3AF4EF] focus:ring-1 focus:ring-[#3AF4EF] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Permissions */}
              <div className="rounded-lg bg-white/5 p-6">
                <h3 className="mb-4 text-lg font-semibold text-[#3AF4EF]">
                  Permisos
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {availablePermissions.map((permission) => (
                    <label
                      key={permission.id}
                      className="flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 p-3 hover:bg-white/5"
                    >
                      <input
                        type="checkbox"
                        checked={selectedPermissions.includes(permission.id)}
                        onChange={(e) => {
                          setSelectedPermissions(
                            e.target.checked
                              ? [...selectedPermissions, permission.id]
                              : selectedPermissions.filter(
                                  (p) => p !== permission.id
                                )
                          );
                        }}
                        className="rounded border-white/20 bg-white/5 text-[#3AF4EF]"
                      />
                      <span>{permission.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer fijo */}
        <div className="absolute right-0 bottom-0 left-0 border-t border-white/10 bg-[#01142B] p-6">
          <div className="flex justify-end gap-4">
            <button
              onClick={onClose}
              className="rounded-lg bg-white/5 px-4 py-2 hover:bg-white/10"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                const formattedUser = {
                  ...editedUser,
                  subscriptionEndDate: editedUser.subscriptionEndDate
                    ? formatDateForBackend(editedUser.subscriptionEndDate)
                    : null,
                };
                onSave(formattedUser, selectedPermissions);
              }}
              className="rounded-lg bg-[#3AF4EF] px-4 py-2 text-black hover:bg-[#3AF4EF]/90"
            >
              Guardar Cambios
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
