'use client';

import { useEffect, useState } from 'react';

import { useUser } from '@clerk/nextjs';
import { toast } from 'sonner';

import { Button } from '~/components/educators/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '~/components/educators/ui/dialog';
import { Input } from '~/components/educators/ui/input';

interface ModalFormForumProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  guidedProjectId: number;
  forumId?: number | null; // si viene → modo editar
  onSuccess?: () => void;
}

export function ModalFormForum({
  open,
  onOpenChange,
  guidedProjectId,
  forumId,
  onSuccess,
}: ModalFormForumProps) {
  const { user } = useUser();
  const isEditing = !!forumId;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loadingData, setLoadingData] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;

    if (!forumId) {
      setTitle('');
      setDescription('');
      return;
    }

    const fetchForum = async () => {
      setLoadingData(true);
      try {
        const res = await fetch(`/api/forums/${forumId}`);
        if (!res.ok) throw new Error();
        const data = (await res.json()) as {
          title: string;
          description: string;
        };
        setTitle(data.title ?? '');
        setDescription(data.description ?? '');
      } catch {
        toast.error('Error al cargar el foro');
      } finally {
        setLoadingData(false);
      }
    };

    void fetchForum();
  }, [open, forumId]);

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error('El título es obligatorio');
      return;
    }
    if (!description.trim()) {
      toast.error('La descripción es obligatoria');
      return;
    }
    if (!user) return;

    setSaving(true);
    try {
      if (isEditing) {
        const res = await fetch('/api/forums', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ forumId, title, description }),
        });
        if (!res.ok) throw new Error();
        toast.success('Foro actualizado');
      } else {
        const formData = new FormData();
        formData.append('guidedProjectId', String(guidedProjectId));
        formData.append('title', title);
        formData.append('description', description);
        formData.append('userId', user.id);

        const res = await fetch('/api/forums', {
          method: 'POST',
          body: formData,
        });
        if (!res.ok) {
          const errorBody = (await res.json().catch(() => null)) as {
            message?: string;
          } | null;
          throw new Error(errorBody?.message ?? 'Error al crear el foro');
        }
        toast.success('Foro creado correctamente');
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error:', error);
      toast.error(
        error instanceof Error ? error.message : 'Error al guardar el foro'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-lg border border-cyan-500/30 bg-slate-900">
        <DialogHeader>
          <DialogTitle className="text-white">
            {isEditing ? 'Editar foro' : 'Nuevo foro'}
          </DialogTitle>
        </DialogHeader>

        {loadingData ? (
          <div className="flex justify-center py-12">
            <div className="size-10 animate-spin rounded-full border-b-2 border-cyan-500" />
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Título *</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej. Dudas de la sesión 1"
                className="border-cyan-500/30 bg-slate-800 text-white placeholder-gray-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white">
                Descripción *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Breve descripción del foro"
                rows={3}
                className="w-full rounded-md border border-cyan-500/30 bg-slate-800 p-3 text-white placeholder-gray-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none"
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
                disabled={saving}
                className="bg-cyan-500 text-white hover:bg-cyan-600 disabled:opacity-50"
              >
                {saving
                  ? isEditing
                    ? 'Guardando...'
                    : 'Creando...'
                  : isEditing
                    ? 'Guardar cambios'
                    : 'Crear foro'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
