'use client';

import { useEffect, useState } from 'react';

import { Edit2, Plus, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';

interface CertificationType {
  id: number;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export default function CertificationTypesPage() {
  const [certifications, setCertifications] = useState<CertificationType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true,
  });

  // Fetch certification types
  useEffect(() => {
    fetchCertifications();
  }, []);

  const fetchCertifications = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/super-admin/certification-types');
      if (!response.ok) {
        const err = (await response.json()) as { error?: string };
        throw new Error(err.error ?? `HTTP ${response.status}`);
      }
      const data = (await response.json()) as CertificationType[];
      setCertifications(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching certification types:', error);
      toast.error('Error al cargar los tipos de certificación');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const method = editingId ? 'PUT' : 'POST';
      const url = '/api/super-admin/certification-types';

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
          (data.message ?? 'Operación completada exitosamente') as string
        );
        setIsOpen(false);
        resetForm();
        fetchCertifications();
      } else {
        toast.error((data.error ?? 'Ocurrió un error') as string);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Error al guardar el tipo de certificación');
    }
  };

  const handleDelete = async (id: number) => {
    if (
      !confirm(
        '¿Estás seguro de que deseas eliminar este tipo de certificación?'
      )
    )
      return;

    try {
      const response = await fetch('/api/super-admin/certification-types', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      const data = (await response.json()) as {
        success: boolean;
        error?: string;
      };

      if (data.success) {
        toast.success('Tipo de certificación eliminado exitosamente');
        fetchCertifications();
      } else {
        toast.error((data.error ?? 'Ocurrió un error') as string);
      }
    } catch (error) {
      console.error('Error deleting certification type:', error);
      toast.error('Error al eliminar el tipo de certificación');
    }
  };

  const handleEdit = (certification: CertificationType) => {
    setEditingId(certification.id);
    setFormData({
      name: certification.name,
      description: certification.description ?? '',
      isActive: certification.isActive,
    });
    setIsOpen(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      name: '',
      description: '',
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
          <span className="relative z-10 font-medium">
            Crear Tipo de Certificación
          </span>
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
                Descripción
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
            {certifications.map((cert) => (
              <tr
                key={cert.id}
                className="border-b border-[#111c24] transition-colors last:border-0 hover:bg-[#0d1e28]"
              >
                <td className="p-3 sm:p-4">
                  <p className="font-medium text-[#e8f4f8]">{cert.name}</p>
                </td>
                <td className="p-3 sm:p-4">
                  {cert.description ? (
                    <p className="text-sm text-gray-400">{cert.description}</p>
                  ) : (
                    <p className="text-sm text-gray-600">-</p>
                  )}
                </td>
                <td className="p-3 sm:p-4">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-[10px] font-semibold tracking-[0.08em] uppercase ${
                      cert.isActive
                        ? 'border border-[#00e676]/20 bg-[#0a2a1a] text-[#00e676]'
                        : 'border border-[#ff5252]/20 bg-[#2a0a0a] text-[#ff5252]'
                    }`}
                  >
                    {cert.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="p-3 text-right sm:p-4">
                  <div className="flex justify-end gap-1">
                    <button
                      onClick={() => handleEdit(cert)}
                      className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-white/5 hover:text-primary"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(cert.id)}
                      className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-white/5 hover:text-red-400"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {certifications.length === 0 && (
        <div className="flex items-center justify-center rounded-xl border border-[#1a2a35] bg-[#0a0f14] p-12 text-gray-400">
          No hay tipos de certificación registrados. Crea uno nuevo para
          comenzar.
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
                {editingId
                  ? 'Editar Tipo de Certificación'
                  : 'Crear Nuevo Tipo de Certificación'}
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
                ? 'Actualiza los detalles del tipo de certificación'
                : 'Crea una nueva opción de tipo de certificación'}
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
                  placeholder="Ej: Certificado de Finalización"
                  required
                  className="mt-1 w-full rounded-md border border-gray-700 bg-gray-900/50 px-4 py-2 text-white placeholder:text-gray-400"
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
                  className="mt-1 w-full rounded-md border border-gray-700 bg-gray-900/50 px-4 py-2 text-white placeholder:text-gray-400"
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
                  className="size-4 accent-cyan-400"
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
