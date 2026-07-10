'use client';

import { useEffect, useState } from 'react';

import { toast } from 'sonner';

import TypeActDropdown from '~/components/educators/layout/TypesActDropdown';
import { Button } from '~/components/educators/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '~/components/educators/ui/dialog';
import { Input } from '~/components/educators/ui/input';

interface ModalFormGuidedActivityProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string | number;
  objectiveId: string | number;
  activityId?: number | null; // si viene → modo editar
  onSuccess?: () => void;
}

const EMPTY_DATA = {
  name: '',
  description: '',
  typeId: 0,
  weekNumber: 1,
  startDate: '',
  endDate: '',
  porcentaje: 0,
  fechaMaximaEntrega: '',
};

export function ModalFormGuidedActivity({
  open,
  onOpenChange,
  projectId,
  objectiveId,
  activityId,
  onSuccess,
}: ModalFormGuidedActivityProps) {
  const isEditing = !!activityId;

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [formData, setFormData] = useState(EMPTY_DATA);

  useEffect(() => {
    if (!open) return;

    if (!activityId) {
      setFormData(EMPTY_DATA);
      return;
    }

    const fetchActivity = async () => {
      setLoadingData(true);
      try {
        const res = await fetch(
          `/api/guided-projects/${projectId}/objectives/${objectiveId}/activities?id=${activityId}`
        );
        if (!res.ok) throw new Error();
        const data = await res.json();
        setFormData({
          name: data.name ?? '',
          description: data.description ?? '',
          typeId: data.typeId ?? 0,
          weekNumber: data.weekNumber ?? 1,
          startDate: data.startDate
            ? new Date(data.startDate).toISOString().split('T')[0]
            : '',
          endDate: data.endDate
            ? new Date(data.endDate).toISOString().split('T')[0]
            : '',
          porcentaje: data.porcentaje ?? 0,
          fechaMaximaEntrega: data.fechaMaximaEntrega
            ? new Date(data.fechaMaximaEntrega).toISOString().split('T')[0]
            : '',
        });
      } catch {
        toast.error('Error al cargar la actividad');
      } finally {
        setLoadingData(false);
      }
    };

    void fetchActivity();
  }, [open, activityId, projectId, objectiveId]);

  const handleSubmit = async () => {
    if (!formData.name) {
      toast.error('El nombre es requerido');
      return;
    }
    if (!formData.typeId) {
      toast.error('Selecciona un tipo de actividad');
      return;
    }
    setLoading(true);
    try {
      const url = isEditing
        ? `/api/guided-projects/${projectId}/objectives/${objectiveId}/activities?id=${activityId}`
        : `/api/guided-projects/${projectId}/objectives/${objectiveId}/activities`;
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error();

      toast.success(
        isEditing ? 'Actividad actualizada' : 'Actividad creada correctamente'
      );
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al guardar la actividad');
    } finally {
      setLoading(false);
    }
  };

  const labelClass = 'text-sm font-medium text-white';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-full max-w-2xl overflow-y-auto border border-cyan-500/30 bg-slate-900">
        <DialogHeader>
          <DialogTitle className="text-white">
            {isEditing ? 'Editar actividad' : 'Nueva actividad'}
          </DialogTitle>
        </DialogHeader>

        {loadingData ? (
          <div className="flex justify-center py-12">
            <div className="size-10 animate-spin rounded-full border-b-2 border-cyan-500" />
          </div>
        ) : (
          <div className="space-y-5 py-2">
            <div className="space-y-2">
              <label className={labelClass}>Nombre *</label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Nombre de la actividad"
                className="border-cyan-500/30 bg-slate-800 text-white placeholder-gray-500"
              />
            </div>

            <div className="space-y-2">
              <label className={labelClass}>Descripción</label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Describe la actividad"
                rows={2}
                className="w-full rounded-md border border-cyan-500/30 bg-slate-800 p-3 text-white placeholder-gray-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none"
              />
            </div>

            <TypeActDropdown
              typeActi={formData.typeId}
              setTypeActividad={(typeId) =>
                setFormData((prev) => ({ ...prev, typeId }))
              }
              selectedColor="#0f172a"
            />

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className={labelClass}>Semana</label>
                <Input
                  type="number"
                  value={formData.weekNumber}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      weekNumber: parseInt(e.target.value) || 0,
                    }))
                  }
                  className="border-cyan-500/30 bg-slate-800 text-white"
                />
              </div>
              <div className="space-y-2">
                <label className={labelClass}>Porcentaje</label>
                <Input
                  type="number"
                  value={formData.porcentaje}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      porcentaje: parseInt(e.target.value) || 0,
                    }))
                  }
                  className="border-cyan-500/30 bg-slate-800 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className={labelClass}>Fecha inicio</label>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      startDate: e.target.value,
                    }))
                  }
                  className="border-cyan-500/30 bg-slate-800 text-white"
                />
              </div>
              <div className="space-y-2">
                <label className={labelClass}>Fecha fin</label>
                <Input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      endDate: e.target.value,
                    }))
                  }
                  className="border-cyan-500/30 bg-slate-800 text-white"
                />
              </div>
            </div>

            <div className="max-w-[220px] space-y-2">
              <label className={labelClass}>Fecha máxima de entrega</label>
              <Input
                type="date"
                value={formData.fechaMaximaEntrega}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    fechaMaximaEntrega: e.target.value,
                  }))
                }
                className="border-cyan-500/30 bg-slate-800 text-white"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="border-white/20 text-white hover:bg-white/10"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="bg-cyan-500 text-white hover:bg-cyan-600 disabled:opacity-50"
              >
                {loading
                  ? isEditing
                    ? 'Guardando...'
                    : 'Creando...'
                  : isEditing
                    ? 'Guardar cambios'
                    : 'Crear actividad'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
