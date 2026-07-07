'use client';

import { useEffect, useState } from 'react';

import { Edit2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface ScheduleOption {
  id: number;
  name: string;
  description: string | null;
  startTime: string | null;
  endTime: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export default function ScheduleOptionsPage() {
  const [schedules, setSchedules] = useState<ScheduleOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startTime: '',
    endTime: '',
    isActive: true,
  });

  // Fetch schedules
  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/super-admin/schedule-options');
      const data = (await response.json()) as {
        success: boolean;
        data: ScheduleOption[];
      };

      if (data.success) {
        setSchedules(data.data);
      }
    } catch (error) {
      console.error('Error fetching schedules:', error);
      toast.error('Failed to fetch schedules');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const method = editingId ? 'PUT' : 'POST';
      const url = '/api/super-admin/schedule-options';

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
        fetchSchedules();
      } else {
        toast.error((data.error ?? 'An error occurred') as string);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Failed to save schedule');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this schedule?')) return;

    try {
      const response = await fetch('/api/super-admin/schedule-options', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      const data = (await response.json()) as {
        success: boolean;
        error?: string;
      };

      if (data.success) {
        toast.success('Schedule deleted successfully');
        fetchSchedules();
      } else {
        toast.error((data.error ?? 'An error occurred') as string);
      }
    } catch (error) {
      console.error('Error deleting schedule:', error);
      toast.error('Failed to delete schedule');
    }
  };

  const handleEdit = (schedule: ScheduleOption) => {
    setEditingId(schedule.id);
    setFormData({
      name: schedule.name,
      description: schedule.description ?? '',
      startTime: schedule.startTime ?? '',
      endTime: schedule.endTime ?? '',
      isActive: schedule.isActive,
    });
    setIsOpen(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      name: '',
      description: '',
      startTime: '',
      endTime: '',
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
    <div className="space-y-4 p-4 sm:p-6">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setIsOpen(true)}
          className="group/button relative inline-flex items-center justify-center gap-1 overflow-hidden rounded-md border border-white/20 bg-background px-2 py-1.5 text-xs text-primary transition-all hover:bg-primary/10 sm:gap-2 sm:px-4 sm:py-2 sm:text-sm"
        >
          <span className="relative z-10 font-medium">Crear Horario</span>
          <Plus className="relative z-10 size-4" />
          <span className="absolute inset-0 z-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 transition-all duration-500 group-hover/button:[transform:translateX(100%)] group-hover/button:opacity-100" />
        </button>
      </div>

      {schedules.length === 0 ? (
        <div className="flex items-center justify-center rounded-xl border border-[#1a2a35] bg-[#0a0f14] p-12 text-gray-400">
          No hay horarios registrados. Crea uno nuevo para comenzar.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto border-collapse overflow-hidden rounded-xl border border-[#1a2a35] bg-[#0a0f14]">
            <thead>
              <tr className="border-b border-[#00BDD8] bg-[#0d1a22]">
                <th className="p-3 text-left text-[10px] font-semibold tracking-[0.12em] text-[#00BDD8] uppercase sm:px-4">
                  Nombre
                </th>
                <th className="p-3 text-left text-[10px] font-semibold tracking-[0.12em] text-[#00BDD8] uppercase sm:px-4">
                  Hora Inicio
                </th>
                <th className="p-3 text-left text-[10px] font-semibold tracking-[0.12em] text-[#00BDD8] uppercase sm:px-4">
                  Hora Fin
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
              {schedules.map((schedule) => (
                <tr
                  key={schedule.id}
                  className="border-b border-[#111c24] transition-colors last:border-0 hover:bg-[#0d1e28]"
                >
                  <td className="p-3 sm:p-4">
                    <p className="text-xs font-medium text-[#e8f4f8] sm:text-sm">
                      {schedule.name}
                    </p>
                    {schedule.description && (
                      <p className="text-[11px] text-[#4a7080]">
                        {schedule.description}
                      </p>
                    )}
                  </td>
                  <td className="p-3 text-xs text-[#7ab8cc] sm:p-4 sm:text-sm">
                    {schedule.startTime ?? '-'}
                  </td>
                  <td className="p-3 text-xs text-[#7ab8cc] sm:p-4 sm:text-sm">
                    {schedule.endTime ?? '-'}
                  </td>
                  <td className="p-3 sm:p-4">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-[10px] font-semibold tracking-[0.08em] uppercase ${
                        schedule.isActive
                          ? 'border border-[#00e676]/20 bg-[#0a2a1a] text-[#00e676]'
                          : 'border border-[#ff5252]/20 bg-[#2a0a0a] text-[#ff5252]'
                      }`}
                    >
                      {schedule.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="p-3 sm:p-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleEdit(schedule)}
                        className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-white/5 hover:text-primary"
                        title="Editar"
                      >
                        <Edit2 className="size-3.5 sm:size-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(schedule.id)}
                        className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-white/5 hover:text-red-400"
                        title="Eliminar"
                      >
                        <Trash2 className="size-3.5 sm:size-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
            <h2 className="text-2xl font-bold text-[#3AF4EF]">
              {editingId ? 'Editar Horario' : 'Crear Nuevo Horario'}
            </h2>
            <p className="mt-1 text-sm text-gray-400">
              {editingId
                ? 'Actualiza los detalles del horario'
                : 'Crea una nueva opción de horario'}
            </p>
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-300">
                  Nombre
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Ej: Mañana (8:00 - 12:00)"
                  required
                  className="w-full rounded-md border border-gray-700 bg-gray-900/50 px-4 py-2 text-white placeholder:text-gray-400"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-300">
                  Descripción
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Descripción opcional"
                  className="w-full rounded-md border border-gray-700 bg-gray-900/50 px-4 py-2 text-white placeholder:text-gray-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-300">
                    Hora Inicio
                  </label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) =>
                      setFormData({ ...formData, startTime: e.target.value })
                    }
                    className="w-full rounded-md border border-gray-700 bg-gray-900/50 px-4 py-2 text-white placeholder:text-gray-400"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-300">
                    Hora Fin
                  </label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) =>
                      setFormData({ ...formData, endTime: e.target.value })
                    }
                    className="w-full rounded-md border border-gray-700 bg-gray-900/50 px-4 py-2 text-white placeholder:text-gray-400"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                  className="size-4 rounded border-gray-700 bg-gray-900/50 accent-cyan-400"
                />
                <label
                  htmlFor="isActive"
                  className="text-sm font-medium text-gray-300"
                >
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
                <span className="absolute inset-0 z-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 transition-all duration-500 group-hover/button:[transform:translateX(100%)] group-hover/button:opacity-100" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
