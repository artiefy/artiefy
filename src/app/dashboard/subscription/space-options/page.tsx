'use client';

import { useEffect, useState } from 'react';

import { Edit2, Plus, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';

interface SpaceOption {
  id: number;
  name: string;
  description: string | null;
  location: string | null;
  capacity: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export default function SpaceOptionsPage() {
  const [spaces, setSpaces] = useState<SpaceOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    capacity: '',
    isActive: true,
  });

  // Fetch spaces
  useEffect(() => {
    fetchSpaces();
  }, []);

  const fetchSpaces = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/super-admin/space-options');
      const data = (await response.json()) as {
        success: boolean;
        data: SpaceOption[];
      };

      if (data.success) {
        setSpaces(data.data);
      }
    } catch (error) {
      console.error('Error fetching spaces:', error);
      toast.error('Failed to fetch spaces');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const method = editingId ? 'PUT' : 'POST';
      const url = '/api/super-admin/space-options';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          editingId ? { id: editingId, ...formData } : formData
        ),
      });

      const data = (await response.json()) as {
        success: boolean;
        message?: string;
        error?: string;
      };

      if (data.success) {
        toast.success(
          (data.message ?? 'Operation completed successfully') as string
        );
        setIsOpen(false);
        resetForm();
        fetchSpaces();
      } else {
        toast.error((data.error ?? 'An error occurred') as string);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Failed to save space');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this space?')) return;

    try {
      const response = await fetch('/api/super-admin/space-options', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      const data = (await response.json()) as {
        success: boolean;
        error?: string;
      };

      if (data.success) {
        toast.success('Space deleted successfully');
        fetchSpaces();
      } else {
        toast.error((data.error ?? 'An error occurred') as string);
      }
    } catch (error) {
      console.error('Error deleting space:', error);
      toast.error('Failed to delete space');
    }
  };

  const handleEdit = (space: SpaceOption) => {
    setEditingId(space.id);
    setFormData({
      name: space.name,
      description: space.description ?? '',
      location: space.location ?? '',
      capacity: space.capacity?.toString() ?? '',
      isActive: space.isActive,
    });
    setIsOpen(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      name: '',
      description: '',
      location: '',
      capacity: '',
      isActive: true,
    });
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      resetForm();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-[#1a2a35] bg-[#0a0f14] p-12 text-gray-400">
        Cargando...
      </div>
    );
  }

  return (
    <div className="space-y-4 p-6">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setIsOpen(true)}
          className="group/button relative inline-flex items-center justify-center gap-1 overflow-hidden rounded-md border border-white/20 bg-background px-2 py-1.5 text-xs text-primary transition-all hover:bg-primary/10 sm:gap-2 sm:px-4 sm:py-2 sm:text-sm"
        >
          <span className="relative z-10 font-medium">Crear Espacio</span>
          <Plus className="relative z-10 size-3.5 sm:size-4" />
          <div className="absolute inset-0 z-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 transition-all duration-500 group-hover/button:[transform:translateX(100%)] group-hover/button:opacity-100" />
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full table-auto border-collapse overflow-hidden rounded-xl border border-[#1a2a35] bg-[#0a0f14]">
          <thead>
            <tr className="border-b border-[#00BDD8] bg-[#0d1a22]">
              <th className="p-3 text-left text-[10px] font-semibold tracking-[0.12em] text-[#00BDD8] uppercase sm:px-4">
                Nombre
              </th>
              <th className="p-3 text-left text-[10px] font-semibold tracking-[0.12em] text-[#00BDD8] uppercase sm:px-4">
                Ubicación
              </th>
              <th className="p-3 text-left text-[10px] font-semibold tracking-[0.12em] text-[#00BDD8] uppercase sm:px-4">
                Capacidad
              </th>
              <th className="p-3 text-left text-[10px] font-semibold tracking-[0.12em] text-[#00BDD8] uppercase sm:px-4">
                Estado
              </th>
              <th className="p-3 text-right text-[10px] font-semibold tracking-[0.12em] text-[#00BDD8] uppercase sm:px-4">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {spaces.map((space) => (
              <tr
                key={space.id}
                className="border-b border-[#111c24] transition-colors last:border-0 hover:bg-[#0d1e28]"
              >
                <td className="p-3 sm:p-4">
                  <p className="text-xs font-medium text-[#e8f4f8] sm:text-sm">
                    {space.name}
                  </p>
                  {space.description && (
                    <p className="text-[11px] text-[#4a7080]">
                      {space.description}
                    </p>
                  )}
                </td>
                <td className="p-3 text-xs text-[#7ab8cc] sm:p-4 sm:text-sm">
                  {space.location ?? '-'}
                </td>
                <td className="p-3 text-xs text-[#7ab8cc] sm:p-4 sm:text-sm">
                  {space.capacity ? `${space.capacity} personas` : '-'}
                </td>
                <td className="p-3 sm:p-4">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-[10px] font-semibold tracking-[0.08em] uppercase ${
                      space.isActive
                        ? 'border border-[#00e676]/20 bg-[#0a2a1a] text-[#00e676]'
                        : 'border border-[#ff5252]/20 bg-[#2a0a0a] text-[#ff5252]'
                    }`}
                  >
                    <span
                      className={`size-1.5 rounded-full ${
                        space.isActive ? 'bg-[#00e676]' : 'bg-[#ff5252]'
                      }`}
                    />
                    {space.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="p-3 text-right sm:p-4">
                  <button
                    onClick={() => handleEdit(space)}
                    className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-white/5 hover:text-primary"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(space.id)}
                    className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-white/5 hover:text-red-400"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {spaces.length === 0 && (
        <div className="flex items-center justify-center rounded-xl border border-[#1a2a35] bg-[#0a0f14] p-12 text-gray-400">
          No hay espacios registrados. Crea uno nuevo para comenzar.
        </div>
      )}

      {isOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50"
          onClick={() => handleOpenChange(false)}
        >
          <div
            className="relative m-4 w-full max-w-lg rounded-xl bg-[#01142B] p-4 text-white shadow-2xl md:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between border-b border-white/10 pb-4">
              <h2 className="text-2xl font-bold text-[#3AF4EF]">
                {editingId ? 'Editar Espacio' : 'Crear Nuevo Espacio'}
              </h2>
              <button
                onClick={() => handleOpenChange(false)}
                className="rounded-lg bg-white/5 p-2 hover:bg-white/10"
              >
                <X className="size-5" />
              </button>
            </div>
            <p className="mb-4 text-sm text-gray-400">
              {editingId
                ? 'Actualiza los detalles del espacio'
                : 'Crea una nueva opción de espacio'}
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Nombre</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Ej: Sede Centro"
                  required
                  className="w-full rounded-md border border-gray-700 bg-gray-900/50 px-4 py-2 text-white placeholder:text-gray-400"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Descripción</label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Descripción opcional"
                  className="w-full rounded-md border border-gray-700 bg-gray-900/50 px-4 py-2 text-white placeholder:text-gray-400"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Ubicación</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  placeholder="Ej: Calle 10 # 5-50, Bogotá"
                  className="w-full rounded-md border border-gray-700 bg-gray-900/50 px-4 py-2 text-white placeholder:text-gray-400"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Capacidad</label>
                <input
                  type="number"
                  value={formData.capacity}
                  onChange={(e) =>
                    setFormData({ ...formData, capacity: e.target.value })
                  }
                  placeholder="Cantidad de personas"
                  className="w-full rounded-md border border-gray-700 bg-gray-900/50 px-4 py-2 text-white placeholder:text-gray-400"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                  className="size-4"
                />
                <label htmlFor="isActive" className="text-sm font-medium">
                  Activo
                </label>
              </div>
              <button
                type="submit"
                className="group/button relative inline-flex w-full items-center justify-center gap-1 overflow-hidden rounded-md border border-white/20 bg-background px-2 py-1.5 text-xs text-primary transition-all hover:bg-primary/10 sm:gap-2 sm:px-4 sm:py-2 sm:text-sm"
              >
                <span className="relative z-10 font-medium">
                  {editingId ? 'Actualizar' : 'Crear'}
                </span>
                <div className="absolute inset-0 z-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 transition-all duration-500 group-hover/button:[transform:translateX(100%)] group-hover/button:opacity-100" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
