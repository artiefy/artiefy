'use client';

import { useEffect, useState } from 'react';

import { toast } from 'sonner';

import { Button } from '~/components/educators/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '~/components/educators/ui/dialog';
import { Input } from '~/components/educators/ui/input';

interface Educator {
  id: string;
  name: string;
  email?: string;
}

interface ModalGuidedProjectFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function ModalGuidedProjectForm({
  open,
  onOpenChange,
  onSuccess,
}: ModalGuidedProjectFormProps) {
  const [loading, setLoading] = useState(false);
  const [educators, setEducators] = useState<Educator[]>([]);
  const [loadingEducators, setLoadingEducators] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    categoryId: 1,
    modalidadId: 1,
    nivelId: 1,
    instructor: '',
  });

  useEffect(() => {
    if (open && educators.length === 0) {
      const fetchEducators = async () => {
        try {
          const response = await fetch('/api/educators');
          if (!response.ok) throw new Error('Error al cargar educadores');
          const data = await response.json();
          setEducators(data);
        } catch (error) {
          console.error('Error loading educators:', error);
          toast.error('Error al cargar la lista de educadores');
        } finally {
          setLoadingEducators(false);
        }
      };
      fetchEducators();
    }
  }, [open, educators.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/guided-projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Error al guardar');
      toast.success('Proyecto creado correctamente');
      setFormData({
        title: '',
        description: '',
        categoryId: 1,
        modalidadId: 1,
        nivelId: 1,
        instructor: '',
      });
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al guardar el proyecto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevo Proyecto Guiado</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-white">
              Título del Proyecto *
            </label>
            <Input
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="Introduce el título"
              required
              className="border-gray-600 bg-gray-900 text-white placeholder-gray-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-white">
              Descripción *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Describe el proyecto"
              required
              rows={3}
              className="w-full rounded-md border border-gray-600 bg-gray-900 p-3 text-white placeholder-gray-500 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-white">
              Instructor *
            </label>
            {loadingEducators ? (
              <div className="text-sm text-gray-400">
                Cargando educadores...
              </div>
            ) : (
              <select
                value={formData.instructor}
                onChange={(e) =>
                  setFormData({ ...formData, instructor: e.target.value })
                }
                required
                className="w-full rounded-md border border-gray-600 bg-gray-900 p-3 text-white focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
              >
                <option value="">Selecciona un instructor</option>
                {educators.map((educator) => (
                  <option key={educator.id} value={educator.id}>
                    {educator.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-gray-600 text-white hover:bg-gray-700"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-primary text-black hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? 'Creando...' : 'Crear Proyecto'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
