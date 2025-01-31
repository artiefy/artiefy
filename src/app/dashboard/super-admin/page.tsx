'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { UserButton } from '@clerk/nextjs';
import { Loader2, UserX, Plus, X, XCircle, Edit, Trash2, UserPlus, Check } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { getAdminUsers, setRoleWrapper, removeRole, deleteUser, updateUserInfo, createUser } from '~/server/queries/queries';
import { ConfirmDialog } from './components/ConfirmDialog';
import { InfoDialog } from './components/InfoDialog';
import SuperAdminLayout from './super-admin-layout';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  status: string;
  selected?: boolean;
}

type ConfirmationState = {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
} | null;

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<ConfirmationState>(null);
  const [notification, setNotification] = useState<{ message: string, type: "success" | "error" } | null>(null);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ firstName: string; lastName: string }>({
    firstName: "",
    lastName: "",
  });
  const [infoDialogOpen, setInfoDialogOpen] = useState(false);
  const [infoDialogTitle, setInfoDialogTitle] = useState("");
  const [infoDialogMessage, setInfoDialogMessage] = useState("");

  const searchParams = useSearchParams();
  const query = searchParams.get('search') || "";
  const [newUser, setNewUser] = useState({
    firstName: "",
    lastName: "",
    email: "",
    role: "estudiante",
  });
  const [creatingUser, setCreatingUser] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const handleUserSelection = useCallback((userId: string) => {
    setSelectedUsers((prevSelected) =>
      prevSelected.includes(userId)
        ? prevSelected.filter((id) => id !== userId)
        : [...prevSelected, userId]
    );
  }, []);

  const [roleFilter, setRoleFilter] = useState<string>(""); // Filtro por rol
  const [statusFilter, setStatusFilter] = useState<string>(""); // Filtro por estado
  const filteredUsers = users.filter(user =>
    (roleFilter ? user.role === roleFilter : true) &&
    (statusFilter ? user.status === statusFilter : true)
  );

  useEffect(() => {
    async function fetchUsers() {
      try {
        const res = await fetch(`/api/users?search=${encodeURIComponent(query)}`);
        if (!res.ok) throw new Error("Error al cargar usuarios");
        const data = await res.json();
        setUsers(data);
      } catch (err) {
        setError("Error al cargar los usuarios.");
        console.error("Error fetching users:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, [query]);

  const showNotification = (message: string, type: "success" | "error") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleCreateUser = async () => {
    if (!newUser.firstName.trim() || !newUser.lastName.trim() || !newUser.email.trim()) {
      showNotification("Todos los campos son obligatorios.", "error");
      return;
    }
  
    try {
      setCreatingUser(true);
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          email: newUser.email,
          role: newUser.role,
        }),
      });
  
      if (!res.ok) {
        throw new Error("No se pudo crear el usuario");
      }
  
      const data = await res.json();
      const { user: safeUser, generatedPassword } = data;
      
      const username = safeUser.username;
  
      // ✅ Asegurar que 'status' está presente en el nuevo usuario
      setUsers([...users, { 
        id: safeUser.id, 
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        role: newUser.role,
        status: "activo" // 🔥 Se agrega un valor predeterminado para 'status'
      }]);
  
      setInfoDialogTitle("Usuario Creado");
      setInfoDialogMessage(
        `Se ha creado el usuario "${username}" con la contraseña: ${generatedPassword}`
      );
      setInfoDialogOpen(true);
      setNewUser({ firstName: "", lastName: "", email: "", role: "estudiante" });
  
    } catch (error) {
      showNotification("Error al crear el usuario.", "error");
    } finally {
      setCreatingUser(false);
    }
  };
  

  const handleMassUpdateStatus = async (newStatus: string) => {
    if (selectedUsers.length === 0) {
      showNotification("No has seleccionado usuarios.", "error");
      return;
    }

    try {
      await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "updateMultipleStatus", userIds: selectedUsers, status: newStatus }),
      });

      setUsers(users.map(user =>
        selectedUsers.includes(user.id) ? { ...user, status: newStatus } : user
      ));
      setSelectedUsers([]);
      showNotification(`Usuarios actualizados a ${newStatus}.`, "success");
    } catch (error) {
      showNotification("Error al actualizar usuarios.", "error");
    }
  };

  const handleRoleChange = (userId: string, newRole: string) => {
    setConfirmation({
      isOpen: true,
      title: "Actualizar Rol",
      message: `¿Estás seguro de que quieres cambiar el rol de este usuario a ${newRole}?`,
      onConfirm: async () => {
        try {
          setUpdatingUserId(userId);
          await setRoleWrapper({ id: userId, role: newRole });

          setUsers(users.map(user => user.id === userId ? { ...user, role: newRole } : user));
          showNotification("Rol actualizado con éxito.", "success");
        } catch (error) {
          showNotification("Error al actualizar el rol.", "error");
        } finally {
          setUpdatingUserId(null);
          setConfirmation(null);
        }
      },
    });
  };

  const handleStatusChange = (userId: string, newStatus: string) => {
    setConfirmation({
      isOpen: true,
      title: "Actualizar Estado",
      message: `¿Estás seguro de que quieres cambiar el estado del usuario a "${newStatus}"?`,
      onConfirm: async () => {
        try {
          setUpdatingUserId(userId);
          await fetch("/api/users", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "updateStatus", id: userId, status: newStatus }),
          });

          setUsers(users.map(user => user.id === userId ? { ...user, status: newStatus } : user));
          showNotification("Estado actualizado con éxito.", "success");
        } catch (error) {
          showNotification("Error al actualizar el estado.", "error");
        } finally {
          setUpdatingUserId(null);
          setConfirmation(null);
        }
      },
    });
  };

  const handleMassRemoveRole = async () => {
    if (selectedUsers.length === 0) {
      showNotification("No has seleccionado usuarios.", "error");
      return;
    }

    setConfirmation({
      isOpen: true,
      title: "Eliminar Roles",
      message: "¿Estás seguro de que quieres eliminar el rol de los usuarios seleccionados?",
      onConfirm: async () => {
        try {
          await fetch("/api/users", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "removeRole", userIds: selectedUsers }),
          });

          // Actualizar los usuarios en el estado local
          setUsers(users.map(user =>
            selectedUsers.includes(user.id) ? { ...user, role: "sin-role" } : user
          ));

          setSelectedUsers([]); // Limpiar selección
          showNotification("Roles eliminados con éxito.", "success");
        } catch (error) {
          showNotification("Error al eliminar roles.", "error");
        } finally {
          setConfirmation(null);
        }
      },
    });
  };

  const handleDeleteUser = (userId: string) => {
    setConfirmation({
      isOpen: true,
      title: "Eliminar Usuario",
      message: "¿Estás seguro de que quieres eliminar este usuario? Esta acción no se puede deshacer.",
      onConfirm: async () => {
        try {
          setUpdatingUserId(userId);
          await deleteUser(userId);

          setUsers(users.filter(user => user.id !== userId));
          showNotification("Usuario eliminado correctamente.", "success");
        } catch (error) {
          showNotification("Error al eliminar el usuario.", "error");
        } finally {
          setUpdatingUserId(null);
          setConfirmation(null);
        }
      },
    });
  };

  const handleSaveUser = async (userId: string) => {
    try {
      setUpdatingUserId(userId);
      await updateUserInfo(userId, editValues.firstName, editValues.lastName);
      setUsers(users.map(user =>
        user.id === userId ? { ...user, firstName: editValues.firstName, lastName: editValues.lastName } : user
      ));
      setEditingUser(null);

      showNotification("Usuario actualizado con éxito.", "success");
    } catch (error) {
      showNotification("Error al actualizar usuario.", "error");
    } finally {
      setUpdatingUserId(null);
      setEditingUser(null);
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user.id);
    setEditValues({ firstName: user.firstName, lastName: user.lastName });
  };

  return (
    <SuperAdminLayout>
      <header className=" flex items-center justify-between rounded-lg bg-[#00BDD8]  p-6 text-3xl font-bold text-[#01142B] shadow-md">
        <h1>Dashboard Admin</h1>
      </header>

      <div className="p-6">
        <p className="mb-6 text-lg text-white">
          Aquí puedes gestionar los usuarios y sus roles.
        </p>

        {error && (
          <div className="mb-6 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700">
            <p>{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="size-6 animate-spin text-primary" />
            <span className="ml-2">Cargando usuarios...</span>
          </div>
        ) : (
          <>
            {showCreateForm && (
              <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50 p-4">
                <div className="relative z-50 w-full max-w-md rounded-lg bg-background p-6 shadow-2xl">
                  {/* Header del formulario con botón de cierre */}
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-white">Crear Nuevo Usuario</h2>
                    <button onClick={() => setShowCreateForm(false)}>
                      <X className="size-6 text-gray-300 hover:text-white" />
                    </button>
                  </div>

                  {/* Formulario de creación */}
                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="Nombre"
                      className="w-full rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-white"
                      value={newUser.firstName}
                      onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                    />
                    <input
                      type="text"
                      placeholder="Apellido"
                      className="w-full rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-white"
                      value={newUser.lastName}
                      onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                    />
                    <input
                      type="email"
                      placeholder="Correo electrónico"
                      className="w-full rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-white"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    />
                    <select
                      className="w-full rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-white"
                      value={newUser.role}
                      onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                    >
                      <option value="admin">Admin</option>
                      <option value="educador">Educador</option>
                      <option value="estudiante">Estudiante</option>
                    </select>
                  </div>

                  {/* Botón para crear usuario */}
                  <button
                    onClick={handleCreateUser}
                    className="mt-4 flex w-full justify-center rounded-md bg-primary px-4 py-2 font-bold text-white hover:bg-secondary"
                    disabled={creatingUser}
                  >
                    {creatingUser ? <Loader2 className="size-5 animate-spin" /> : "Crear Usuario"}
                  </button>

                </div>
              </div>
            )}
            {/* Contenedor de botones arriba de la tabla */}
            <div className="mb-4 flex items-center justify-between">
              {/* Contenedor de botones arriba de la tabla */}
              <div className="mb-4 flex space-x-2">
                <button
                  onClick={() => handleMassUpdateStatus("activo")}
                  className={`flex items-center rounded-md px-4 py-2 font-semibold text-white shadow-md transition hover:scale-105${
                    selectedUsers.length === 0 ? "cursor-not-allowed bg-gray-500" : "bg-green-500 hover:bg-green-600"
                  }`}
                  disabled={selectedUsers.length === 0}
                >
                  <Check className="mr-2 size-5" /> Activar
                </button>

                <button
                  onClick={() => handleMassUpdateStatus("inactivo")}
                  className={`flex items-center rounded-md px-4 py-2 font-semibold text-white shadow-md transition hover:scale-105${
                    selectedUsers.length === 0 ? "cursor-not-allowed bg-gray-500" : "bg-red-500 hover:bg-red-600"
                  }`}
                  disabled={selectedUsers.length === 0}
                >
                  <XCircle className="mr-2 size-5" /> Desactivar
                </button>

                <button
                  onClick={handleMassRemoveRole}
                  className={`flex items-center rounded-md px-4 py-2 font-semibold text-white shadow-md transition hover:scale-105${
                    selectedUsers.length === 0 ? "cursor-not-allowed bg-gray-500" : "bg-yellow-500 hover:bg-yellow-600"
                  }`}
                  disabled={selectedUsers.length === 0}
                >
                  <XCircle className="mr-2 size-5" /> Quitar Rol
                </button>

                <button
                  onClick={() => setShowCreateForm(true)}
                  className="flex items-center rounded-md bg-secondary px-4 py-2 font-semibold text-white shadow-md transition hover:scale-105 hover:bg-[#00A5C0]"
                >
                  <UserPlus className="mr-2 size-5" /> Crear Usuario
                </button>
              </div>

            </div>


            <div className="mt-6 overflow-x-auto">
              <table className="w-full border-collapse rounded-lg bg-opacity-70 bg-gradient-to-br from-background to-gray-800 text-white  shadow-lg backdrop-blur-lg">
                <thead className="  rounded-t-lg bg-[#00BDD8]  from-primary to-secondary text-[#01142B]">
                  <tr>
                    <th className="px-4 py-3">
                      <input
                        type="checkbox"
                        onChange={(e) => setSelectedUsers(e.target.checked ? filteredUsers.map(user => user.id) : [])}
                        checked={selectedUsers.length === filteredUsers.length}
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold tracking-wider">Nombre</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold tracking-wider">Correo</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold tracking-wider"><select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="rounded-md bg-transparent px-3 py-2 text-sm text-[#01142B]"
                      >
                        <option value="">Roles</option>
                        <option value="admin">Admin</option>
                        <option value="educador">Educador</option>
                        <option value="estudiante">Estudiante</option>
                        <option value="sin-role">Sin Rol</option>
                      </select></th>
                    <th className="px-4 py-3 text-left text-xs font-semibold tracking-wider"> <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="rounded-md bg-transparent px-3 py-2 text-sm text-[#01142B]"
                      >
                        <option value="">Estados</option>
                        <option value="activo">Activo</option>
                        <option value="inactivo">Inactivo</option>
                        <option value="suspendido">Suspendido</option>
                      </select></th>
                    <th className="px-4 py-3 text-left text-xs font-semibold tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="transition duration-300 hover:bg-gray-800 hover:shadow-lg">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.id)} // ✅ Está marcado si el usuario está en `selectedUsers`
                          onChange={() => handleUserSelection(user.id)} // ✅ Maneja la selección/deselección del usuario
                        />
                      </td>

                      <td className="px-4 py-3 text-sm text-gray-300">
                        {editingUser === user.id ? (
                          <div className="flex space-x-2">
                            <input
                              type="text"
                              className="w-1/2 rounded-lg border-none bg-gray-800 px-2 py-1 text-xs text-white"
                              value={editValues.firstName}
                              onChange={(e) => setEditValues({ ...editValues, firstName: e.target.value })}
                            />
                            <input
                              type="text"
                              className="w-1/2 rounded-lg border-none bg-gray-800 px-2 py-1 text-xs text-white"
                              value={editValues.lastName}
                              onChange={(e) => setEditValues({ ...editValues, lastName: e.target.value })}
                            />
                          </div>
                        ) : (
                          `${user.firstName} ${user.lastName}`
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">{user.email}</td>
                      <td className="px-4 py-3">
                        <select
                          className="cursor-pointer rounded-md border-none bg-gray-900 px-2 py-1 text-xs text-gray-200 transition duration-300 hover:bg-gray-800"
                          value={user.role || "sin-role"}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        >
                          <option value="sin-role">Sin Rol</option>
                          <option value="admin">Admin</option>
                          <option value="educador">Educador</option>
                          <option value="estudiante">Estudiante</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          className="cursor-pointer rounded-md border-none bg-gray-900 px-2 py-1 text-xs text-gray-200 transition duration-300 hover:bg-gray-800"
                          value={user.status}
                          onChange={(e) => handleStatusChange(user.id, e.target.value)}
                        >
                          <option value="activo">Activo</option>
                          <option value="inactivo">Inactivo</option>
                          <option value="suspendido">Suspendido</option>
                        </select>
                      </td>
                      <td className="flex space-x-2 px-4 py-3">
                        {editingUser === user.id ? (
                          <button
                            onClick={() => handleSaveUser(user.id)}
                            className="flex items-center rounded-md bg-green-500 px-2 py-1 text-xs font-medium shadow-md transition duration-300 hover:bg-green-600"
                          >
                            <Edit size={14} className="mr-1" /> Guardar
                          </button>
                        ) : (
                          <button
                            onClick={() => handleEditUser(user)}
                            className="flex items-center rounded-md bg-blue-500 px-2 py-1 text-xs font-medium shadow-md transition duration-300 hover:bg-blue-600"
                          >
                            <Edit size={14} className="mr-1" /> Editar
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="flex items-center rounded-md bg-red-700 px-2 py-1 text-xs font-medium shadow-md transition duration-300 hover:bg-red-800"
                        >
                          <Trash2 size={14} className="mr-1" /> Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </>
        )}
      </div>
      {notification && (
        <div className={`fixed bottom-5 right-5 rounded-md px-4 py-2 text-white shadow-lg ${notification.type === "success" ? "bg-green-500" : "bg-red-500"}`}>
          {notification.message}
        </div>
      )}
      <ConfirmDialog
        isOpen={confirmation?.isOpen ?? false}
        title={confirmation?.title ?? ''}
        message={confirmation?.message ?? ''}
        onConfirm={confirmation?.onConfirm ?? (() => {})}
        onCancel={() => setConfirmation(null)}
      />
      <InfoDialog
        isOpen={infoDialogOpen}
        title={infoDialogTitle}
        message={infoDialogMessage}
        onClose={() => setInfoDialogOpen(false)}
      />
    </SuperAdminLayout>
  );
}
