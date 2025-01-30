'use client';
import React, { useState, useEffect } from 'react';
import { UserButton } from '@clerk/nextjs';
import { getAdminUsers, setRoleWrapper, removeRole, deleteUser, updateUserInfo, createUser } from '~/server/queries/queries';
import SuperAdminLayout from './super-admin-layout';
import { Loader2, UserX, Plus, X, XCircle, Edit, Trash2, UserPlus, Check } from 'lucide-react';
import { ConfirmDialog } from './components/ConfirmDialog';
import { InfoDialog } from './components/InfoDialog';
import { useSearchParams } from 'next/navigation';

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
  const handleUserSelection = (userId: string) => {
    setSelectedUsers((prevSelected) =>
      prevSelected.includes(userId)
        ? prevSelected.filter((id) => id !== userId)
        : [...prevSelected, userId]
    );
  };
  const [showActions, setShowActions] = useState(false);

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

      setUsers([...users, { id: safeUser.id, ...newUser }]);
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

  const handleRemoveRole = (userId: string) => {
    setConfirmation({
      isOpen: true,
      title: "Eliminar Rol",
      message: "¿Estás seguro de que quieres eliminar el rol de este usuario?",
      onConfirm: async () => {
        try {
          setUpdatingUserId(userId);
          await removeRole(userId);

          setUsers(users.map(user => user.id === userId ? { ...user, role: "sin-role" } : user));
          showNotification("Rol eliminado correctamente.", "success");
        } catch (error) {
          showNotification("Error al eliminar el rol.", "error");
        } finally {
          setUpdatingUserId(null);
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
      <header className="bg-primary p-6 rounded-lg shadow-md text-white text-3xl font-bold flex justify-between items-center">
        <h1>Dashboard Admin</h1>
      </header>

      <div className="p-6">
        <p className="text-lg text-white mb-6">
          Aquí puedes gestionar los usuarios y sus roles.
        </p>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            <p>{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <span className="ml-2">Cargando usuarios...</span>
          </div>
        ) : (
          <>
            {/* Botón flotante con acciones */}
            <div className="fixed bottom-6 right-6 flex flex-col items-end space-y-2 z-50">
              {/* Botones de acciones, ocultos por defecto */}
              {showActions && (
                <div className="flex flex-col space-y-3 mb-3">
                  <button
                    onClick={() => handleMassUpdateStatus("activo")}
                    className="bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-4 rounded-full flex items-center shadow-lg transition transform hover:scale-105"
                  >
                    <Check className="w-5 h-5 mr-2" /> Activar
                  </button>
                  <button
                    onClick={() => handleMassUpdateStatus("inactivo")}
                    className="bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-4 rounded-full flex items-center shadow-lg transition transform hover:scale-105"
                  >
                    <XCircle className="w-5 h-5 mr-2" /> Desactivar
                  </button>
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="bg-secondary hover:bg-[#00A5C0] text-white font-semibold py-3 px-4 rounded-full flex items-center shadow-lg transition transform hover:scale-105"
                  >
                    <UserPlus className="w-5 h-5 mr-2" /> Crear
                  </button>
                </div>
              )}

              {/* Botón principal flotante (+) */}
              <button
                onClick={() => setShowActions(!showActions)}
                className="bg-primary hover:bg-secondary text-white font-bold p-5 rounded-full shadow-2xl flex items-center justify-center transition-transform duration-300 transform hover:scale-110"
              >
                <Plus className={`w-6 h-6 transition-transform duration-300 ${showActions ? "rotate-45" : ""}`} />
              </button>
            </div>

            {showCreateForm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9999]">
                <div className="bg-background p-6 rounded-lg shadow-2xl w-full max-w-md relative z-50">
                  {/* Header del formulario con botón de cierre */}
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-white">Crear Nuevo Usuario</h2>
                    <button onClick={() => setShowCreateForm(false)}>
                      <X className="w-6 h-6 text-gray-300 hover:text-white" />
                    </button>
                  </div>

                  {/* Formulario de creación */}
                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="Nombre"
                      className="w-full bg-gray-700 text-white border border-gray-600 rounded-md px-3 py-2"
                      value={newUser.firstName}
                      onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                    />
                    <input
                      type="text"
                      placeholder="Apellido"
                      className="w-full bg-gray-700 text-white border border-gray-600 rounded-md px-3 py-2"
                      value={newUser.lastName}
                      onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                    />
                    <input
                      type="email"
                      placeholder="Correo electrónico"
                      className="w-full bg-gray-700 text-white border border-gray-600 rounded-md px-3 py-2"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    />
                    <select
                      className="w-full bg-gray-700 text-white border border-gray-600 rounded-md px-3 py-2"
                      value={newUser.role}
                      onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                    >
                      <option value="admin">Admin</option>
                      <option value="profesor">Profesor</option>
                      <option value="estudiante">Estudiante</option>
                    </select>
                  </div>

                  {/* Botón para crear usuario */}
                  <button
                    onClick={handleCreateUser}
                    className="mt-4 w-full bg-primary hover:bg-secondary text-white font-bold py-2 px-4 rounded-md flex justify-center"
                    disabled={creatingUser}
                  >
                    {creatingUser ? <Loader2 className="w-5 h-5 animate-spin" /> : "Crear Usuario"}
                  </button>
                </div>
              </div>
            )}

            <div className="overflow-x-auto mt-6">
              <table className="w-full border-collapse rounded-lg shadow-lg bg-opacity-70 backdrop-blur-lg text-white bg-gradient-to-br from-background to-gray-800">
                <thead className="bg-gradient-to-r from-primary to-secondary text-white rounded-t-lg">
                  <tr>
                    <th className="px-4 py-3">
                      <input
                        type="checkbox"
                        onChange={(e) => setSelectedUsers(e.target.checked ? users.map(user => user.id) : [])}
                        checked={selectedUsers.length === users.length}
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold tracking-wider">Nombre</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold tracking-wider">Correo</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold tracking-wider">Rol</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold tracking-wider">Estado</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-800 hover:shadow-lg transition duration-300">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.id)}
                          onChange={() => handleUserSelection(user.id)}
                        />
                      </td>
                      <td className="px-4 py-3 text-gray-300 text-sm">
                        {editingUser === user.id ? (
                          <div className="flex space-x-2">
                            <input
                              type="text"
                              className="bg-gray-800 text-white border-none rounded-lg px-2 py-1 text-xs w-1/2"
                              value={editValues.firstName}
                              onChange={(e) => setEditValues({ ...editValues, firstName: e.target.value })}
                            />
                            <input
                              type="text"
                              className="bg-gray-800 text-white border-none rounded-lg px-2 py-1 text-xs w-1/2"
                              value={editValues.lastName}
                              onChange={(e) => setEditValues({ ...editValues, lastName: e.target.value })}
                            />
                          </div>
                        ) : (
                          `${user.firstName} ${user.lastName}`
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{user.email}</td>
                      <td className="px-4 py-3">
                        <select
                          className="bg-gray-900 text-gray-200 border-none rounded-md px-2 py-1 text-xs cursor-pointer hover:bg-gray-800 transition duration-300"
                          value={user.role || "sin-role"}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        >
                          <option value="sin-role">Sin Rol</option>
                          <option value="admin">Admin</option>
                          <option value="profesor">Profesor</option>
                          <option value="estudiante">Estudiante</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          className="bg-gray-900 text-gray-200 border-none rounded-md px-2 py-1 text-xs cursor-pointer hover:bg-gray-800 transition duration-300"
                          value={user.status}
                          onChange={(e) => handleStatusChange(user.id, e.target.value)}
                        >
                          <option value="activo">Activo</option>
                          <option value="inactivo">Inactivo</option>
                          <option value="suspendido">Suspendido</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 flex space-x-2">
                        {editingUser === user.id ? (
                          <button
                            onClick={() => handleSaveUser(user.id)}
                            className="px-2 py-1 text-xs font-medium rounded-md bg-green-500 hover:bg-green-600 transition duration-300 shadow-md flex items-center"
                          >
                            <Edit size={14} className="mr-1" /> Guardar
                          </button>
                        ) : (
                          <button
                            onClick={() => handleEditUser(user)}
                            className="px-2 py-1 text-xs font-medium rounded-md bg-blue-500 hover:bg-blue-600 transition duration-300 shadow-md flex items-center"
                          >
                            <Edit size={14} className="mr-1" /> Editar
                          </button>
                        )}
                        <button
                          onClick={() => handleRemoveRole(user.id)}
                          className="px-2 py-1 text-xs font-medium rounded-md bg-red-500 hover:bg-red-600 transition duration-300 shadow-md flex items-center"
                        >
                          <XCircle size={14} className="mr-1" /> Quitar
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="px-2 py-1 text-xs font-medium rounded-md bg-red-700 hover:bg-red-800 transition duration-300 shadow-md flex items-center"
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
        <div className={`fixed bottom-5 right-5 px-4 py-2 rounded-md shadow-lg text-white ${notification.type === "success" ? "bg-green-500" : "bg-red-500"}`}>
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
