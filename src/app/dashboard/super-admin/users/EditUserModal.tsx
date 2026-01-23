import React from 'react';

import Image from 'next/image';

import { X } from 'lucide-react';

function formatDateForBackend(dateString: string): string {
  if (!dateString) return '';
  return dateString; // El input[type="date"] ya da formato 'YYYY-MM-DD'
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
  planType?: 'none' | 'Pro' | 'Premium' | 'Enterprise';
  profesion?: string;
  descripcion?: string;
  profileImageKey?: string;
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
    const [datePart] = dateStr.split(' '); // por si viene con hora
    return datePart; // asumir que ya viene en formato 'YYYY-MM-DD'
  }

  const [editedUser, setEditedUser] = React.useState({
    ...user,
    subscriptionEndDate: parseSubscriptionEndDateForInput(
      user.subscriptionEndDate
    ),
    planType: user.planType ?? 'none',
    profesion: user.profesion ?? '',
    descripcion: user.descripcion ?? '',
    profileImageKey: user.profileImageKey ?? '',
  });

  const [selectedPermissions, setSelectedPermissions] = React.useState<
    string[]
  >(user.permissions ?? []);
  const [uploadingImage, setUploadingImage] = React.useState(false);
  const [selectedImageFile, setSelectedImageFile] = React.useState<File | null>(
    null
  );
  console.log('sosa planes:', selectedImageFile);

  React.useEffect(() => {
    setEditedUser({
      ...user,
      subscriptionEndDate: parseSubscriptionEndDateForInput(
        user.subscriptionEndDate
      ),
      planType: user.planType ?? 'none',
      profesion: user.profesion ?? '',
      descripcion: user.descripcion ?? '',
      profileImageKey: user.profileImageKey ?? '',
    });

    setSelectedPermissions(user.permissions ?? []);
  }, [user]);

  if (!isOpen) return null;
  console.log('User data:', user);

  const handleImageUpload = async (file: File) => {
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'profile-images');

      const response = await fetch('/api/super-admin/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Error al subir la imagen');
      }

      const data = (await response.json()) as { key: string };
      setEditedUser({
        ...editedUser,
        profileImageKey: data.key,
      });
      setSelectedImageFile(null);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Error al subir la imagen');
    } finally {
      setUploadingImage(false);
    }
  };

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
                {/* Priorizar profileImageKey de la BD si existe y el usuario es educador */}
                {editedUser.role === 'educador' &&
                editedUser.profileImageKey ? (
                  <Image
                    src={`${process.env.NEXT_PUBLIC_AWS_S3_URL}/${editedUser.profileImageKey}`}
                    alt={`${editedUser.firstName} ${editedUser.lastName}`}
                    fill
                    className="object-cover transition duration-200 hover:scale-105"
                    unoptimized
                  />
                ) : editedUser.profileImage ? (
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
                      className="w-full rounded-lg border border-white/10 bg-background px-4 py-2 text-white focus:border-[#3AF4EF] focus:ring-1 focus:ring-[#3AF4EF] focus:outline-none"
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
                      className="w-full rounded-lg border border-white/10 bg-background px-4 py-2 text-white focus:border-[#3AF4EF] focus:ring-1 focus:ring-[#3AF4EF] focus:outline-none"
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
                      className="w-full rounded-lg border border-white/10 bg-background px-4 py-2 text-white focus:border-[#3AF4EF] focus:ring-1 focus:ring-[#3AF4EF] focus:outline-none"
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
                      className="w-full rounded-lg border border-white/10 bg-background px-4 py-2 text-white focus:border-[#3AF4EF] focus:ring-1 focus:ring-[#3AF4EF] focus:outline-none"
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
                <div className="grid gap-4 md:grid-cols-2">
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
                      className="w-full rounded-lg border border-white/10 bg-background px-4 py-2 text-white focus:border-[#3AF4EF] focus:ring-1 focus:ring-[#3AF4EF] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm text-gray-400">
                      Tipo de Plan
                    </label>
                    <select
                      value={editedUser.planType}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (
                          ['none', 'Pro', 'Premium', 'Enterprise'].includes(
                            value
                          )
                        ) {
                          setEditedUser({
                            ...editedUser,
                            planType: value as
                              | 'none'
                              | 'Pro'
                              | 'Premium'
                              | 'Enterprise',
                          });
                        }
                      }}
                      className="w-full rounded-lg border border-white/10 bg-background px-4 py-2 text-white focus:border-[#3AF4EF] focus:ring-1 focus:ring-[#3AF4EF] focus:outline-none"
                    >
                      <option value="none">Ninguno</option>
                      <option value="Pro">Pro</option>
                      <option value="Premium">Premium</option>
                      <option value="Enterprise">Enterprise</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Campos específicos para Educadores */}
              {editedUser.role === 'educador' && (
                <div className="rounded-lg bg-white/5 p-6">
                  <h3 className="mb-4 text-lg font-semibold text-[#3AF4EF]">
                    Información del Educador
                  </h3>
                  <div className="grid gap-4">
                    <div>
                      <label className="mb-2 block text-sm text-gray-400">
                        Profesión
                      </label>
                      <input
                        type="text"
                        value={editedUser.profesion}
                        onChange={(e) =>
                          setEditedUser({
                            ...editedUser,
                            profesion: e.target.value,
                          })
                        }
                        placeholder="Ej: Ingeniero de Software, Profesor de Matemáticas"
                        className="w-full rounded-lg border border-white/10 bg-background px-4 py-2 text-white focus:border-[#3AF4EF] focus:ring-1 focus:ring-[#3AF4EF] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm text-gray-400">
                        Descripción / Biografía
                      </label>
                      <textarea
                        value={editedUser.descripcion}
                        onChange={(e) =>
                          setEditedUser({
                            ...editedUser,
                            descripcion: e.target.value,
                          })
                        }
                        placeholder="Describe la experiencia y especialización del educador..."
                        rows={4}
                        className="w-full rounded-lg border border-white/10 bg-background px-4 py-2 text-white focus:border-[#3AF4EF] focus:ring-1 focus:ring-[#3AF4EF] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm text-gray-400">
                        Clave de Imagen de Perfil (S3)
                      </label>

                      {/* Preview de la imagen */}
                      {editedUser.profileImageKey && (
                        <div className="mb-3 overflow-hidden rounded-lg border border-[#3AF4EF]/30">
                          <Image
                            src={`${process.env.NEXT_PUBLIC_AWS_S3_URL}/${editedUser.profileImageKey}`}
                            alt="Preview"
                            width={200}
                            height={200}
                            className="h-48 w-full object-cover"
                            unoptimized
                          />
                        </div>
                      )}

                      {/* Botón para subir nueva imagen */}
                      <div className="mb-3">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setSelectedImageFile(file);
                              void handleImageUpload(file);
                            }
                          }}
                          className="hidden"
                          id="profile-image-upload"
                        />
                        <label
                          htmlFor="profile-image-upload"
                          className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[#3AF4EF]/50 bg-[#3AF4EF]/10 px-4 py-2 text-sm font-semibold text-[#3AF4EF] transition-all hover:bg-[#3AF4EF]/20"
                        >
                          {uploadingImage ? (
                            <>
                              <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#3AF4EF] border-t-transparent" />
                              Subiendo...
                            </>
                          ) : (
                            <>
                              <svg
                                className="h-4 w-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                              </svg>
                              Subir Nueva Imagen
                            </>
                          )}
                        </label>
                      </div>

                      <input
                        type="text"
                        value={editedUser.profileImageKey}
                        onChange={(e) =>
                          setEditedUser({
                            ...editedUser,
                            profileImageKey: e.target.value,
                          })
                        }
                        placeholder="uploads/profile-image-123.jpg"
                        className="w-full rounded-lg border border-white/10 bg-background px-4 py-2 text-white focus:border-[#3AF4EF] focus:ring-1 focus:ring-[#3AF4EF] focus:outline-none"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Ruta del archivo en S3 (sin incluir el dominio base)
                      </p>
                    </div>
                  </div>
                </div>
              )}

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
                  planType: editedUser.planType ?? 'none', // ✅ AÑADIDO AQUÍ
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
