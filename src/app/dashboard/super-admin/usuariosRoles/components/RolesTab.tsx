"use client";

import { useEffect, useState } from "react";

import { toast } from "sonner";

interface Permiso {
  id: number;
  name: string;
}

interface RolSecundario {
  id: number;
  name: string;
  permisos: number[];
}

interface RolSecundarioResponse {
  id: number;
  name: string;
  permisos: number[];
}

interface PermisoResponse {
  id: number;
  name: string;
}

export default function RolesTab() {
  const [roles, setRoles] = useState<RolSecundario[]>([]);
  const [permisos, setPermisos] = useState<Permiso[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RolSecundario | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    permisos: [] as number[],
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [rolesRes, permisosRes] = await Promise.all([
          fetch("/api/super-admin/roles-secundarios/list"),
          fetch("/api/super-admin/permisos/list"),
        ]);

        if (!rolesRes.ok || !permisosRes.ok) throw new Error();

        const rolesData = (await rolesRes.json()) as RolSecundarioResponse[];
        const permisosData = (await permisosRes.json()) as PermisoResponse[];

        setRoles(
          rolesData.map((r) => ({
            ...r,
            permisos: Array.isArray(r.permisos) ? r.permisos : [],
          })),
        );
        setPermisos(permisosData);
      } catch {
        toast.error("Error al cargar roles o permisos");
      } finally {
        setLoading(false);
      }
    };

    void fetchData(); // evitar no-floating-promise
  }, []);

  const openCreateModal = () => {
    setEditingRole(null);
    setFormData({ name: "", permisos: [] });
    setIsModalOpen(true);
  };

  const openEditModal = (role: RolSecundario) => {
    setEditingRole(role);
    setFormData({ name: role.name, permisos: role.permisos });
    setIsModalOpen(true);
  };

  const togglePermiso = (permisoId: number) => {
    setFormData((prev) => ({
      ...prev,
      permisos: prev.permisos.includes(permisoId)
        ? prev.permisos.filter((id) => id !== permisoId)
        : [...prev.permisos, permisoId],
    }));
  };

  const handleSave = async () => {
    const endpoint = editingRole
      ? "/api/super-admin/roles-secundarios/update"
      : "/api/super-admin/roles-secundarios/create";

    const method = editingRole ? "PUT" : "POST";
    const body = editingRole ? { id: editingRole.id, ...formData } : formData;

    try {
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      const saved = (await res.json()) as RolSecundarioResponse;

      if (editingRole) {
        const refreshed = await fetch(
          "/api/super-admin/roles-secundarios/list",
        );
        if (refreshed.ok) {
          const refreshedData =
            (await refreshed.json()) as RolSecundarioResponse[];
          setRoles(
            refreshedData.map((r) => ({
              ...r,
              permisos: Array.isArray(r.permisos) ? r.permisos : [],
            })),
          );
        }
        toast.success("Rol actualizado");
      } else {
        setRoles((prev) => [...prev, saved]);
        toast.success("Rol creado");
      }
      setIsModalOpen(false);
    } catch {
      toast.error("Error al guardar rol");
    }
  };

  const handleDelete = async (id: number) => {
    const confirm = window.confirm(
      "¿Estás seguro de que quieres eliminar este rol?",
    );
    if (!confirm) return;

    try {
      const res = await fetch("/api/super-admin/roles-secundarios/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error();
      setRoles((prev) => prev.filter((r) => r.id !== id));
      toast.success("Rol eliminado");
    } catch {
      toast.error("Error al eliminar rol");
    }
  };

  return (
    <div className="rounded-lg border border-white/10 bg-gray-800/60 p-4 text-white shadow-md">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-bold">Roles Secundarios</h2>
        <button
          onClick={openCreateModal}
          className="w-full rounded bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700 sm:w-auto"
        >
          + Nuevo Rol
        </button>
      </div>

      {loading ? (
        <div className="text-center">Cargando...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full table-auto text-sm">
            <thead className="bg-gray-900 text-left text-gray-400">
              <tr>
                <th className="px-4 py-2">Nombre</th>
                <th className="px-4 py-2">Permisos</th>
                <th className="px-4 py-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {roles.map((role) => (
                <tr
                  key={role.id}
                  className="border-t border-white/10 hover:bg-gray-700/30"
                >
                  <td className="px-4 py-2">{role.name}</td>
                  <td className="px-4 py-2 text-sm text-gray-300">
                    {permisos
                      .filter((p) => role.permisos.includes(p.id))
                      .map((p) => p.name)
                      .join(", ") || "—"}
                  </td>
                  <td className="flex flex-col gap-2 px-4 py-2 sm:flex-row">
                    <button
                      onClick={() => openEditModal(role)}
                      className="rounded bg-yellow-600 px-3 py-1 text-white transition hover:bg-yellow-700"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(role.id)}
                      className="rounded bg-red-600 px-3 py-1 text-white transition hover:bg-red-700"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-lg bg-gray-900 p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between border-b border-gray-700 pb-2">
              <h2 className="text-lg font-semibold">
                {editingRole ? "Editar Rol" : "Crear Nuevo Rol"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-xl text-red-400 hover:text-red-600"
              >
                ×
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <input
                type="text"
                placeholder="Nombre del rol"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="rounded border border-gray-600 bg-gray-800 px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />

              <div className="flex max-h-48 flex-wrap gap-3 overflow-y-auto rounded border border-gray-700 bg-gray-800 p-1">
                {permisos.map((permiso) => (
                  <label
                    key={permiso.id}
                    className="flex items-center gap-2 text-sm text-gray-200"
                  >
                    <input
                      type="checkbox"
                      checked={formData.permisos.includes(permiso.id)}
                      onChange={() => togglePermiso(permiso.id)}
                      className="accent-blue-500"
                    />
                    {permiso.name}
                  </label>
                ))}
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleSave}
                  className="rounded bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
                >
                  {editingRole ? "Actualizar Rol" : "Crear Rol"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
