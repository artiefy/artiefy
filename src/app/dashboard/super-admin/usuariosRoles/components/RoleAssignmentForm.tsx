'use client';

import { useEffect, useState } from 'react';

interface Role {
  id: number;
  name: string;
  permisos: {
    id: number;
    name: string;
    description: string;
  }[];
}

interface Props {
  user: {
    id: string;
    name: string;
    role_secundario?: string;
  };
  onClose: () => void;
  onSave: (user: { id: string; role_secundario: string }) => void;
}

export default function RoleAssignmentForm({ user, onClose, onSave }: Props) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const res = await fetch('/api/super-admin/roles-secundarios/list');
        if (!res.ok) throw new Error('Error al cargar roles');
        const data = (await res.json()) as Role[];
        setRoles(data);
      } catch (error) {
        console.error('Error cargando roles:', error);
      }
    };
    void fetchRoles();
  }, []);

  const handleSubmit = async () => {
    if (!selectedRoleId) return;
    setLoading(true);

    try {
      const res = await fetch(
        '/api/super-admin/roles-secundarios/assign-role-secundario',
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            roleSecundarioId: selectedRoleId,
          }),
        }
      );

      if (!res.ok) throw new Error('Error al guardar');
      const data = (await res.json()) as { role_secundario: string };
      onSave({ id: user.id, role_secundario: data.role_secundario });
    } catch (error) {
      console.error('Error asignando rol secundario:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedRole = roles.find((r) => r.id === selectedRoleId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-lg rounded-lg bg-gray-900 p-6 text-white shadow-lg">
        <h2 className="mb-4 text-xl font-semibold">
          Asignar Rol Secundario a{' '}
          <span className="text-primary">{user.name}</span>
        </h2>

        <select
          className="mb-4 w-full rounded-md border border-white/10 bg-gray-800 px-4 py-2"
          value={selectedRoleId ?? ''}
          onChange={(e) => setSelectedRoleId(Number(e.target.value))}
        >
          <option value="" disabled>
            Selecciona un rol...
          </option>
          {roles.map((role) => (
            <option key={role.id} value={role.id}>
              {role.name}
            </option>
          ))}
        </select>

        {selectedRole && (
          <div className="mb-4 rounded bg-gray-800 p-3 text-sm">
            <h4 className="mb-2 font-semibold">Permisos:</h4>
            <ul className="list-disc space-y-1 pl-5">
              {selectedRole.permisos.map((p) => (
                <li key={p.id}>
                  <span className="text-primary">{p.name}</span>:{' '}
                  {p.description}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-md border border-white/20 px-4 py-2 text-sm text-white hover:bg-white/10"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedRoleId || loading}
            className="bg-primary text-background hover:bg-primary/90 rounded-md px-4 py-2 text-sm font-medium transition disabled:opacity-50"
          >
            {loading ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}
