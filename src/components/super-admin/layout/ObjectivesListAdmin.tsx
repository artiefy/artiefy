'use client';

import { useCallback, useEffect, useState } from 'react';

import {
  DragDropContext,
  Draggable,
  Droppable,
  type DropResult,
} from '@hello-pangea/dnd';
import {
  CheckCircle2,
  Circle,
  Edit2,
  GripVertical,
  Plus,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '~/components/educators/ui/badge';
import { Button } from '~/components/educators/ui/button';

interface Objective {
  id: number;
  title: string;
  description: string | null;
  duration: number;
  orderIndex: number;
  isEnabled: boolean;
}

interface ObjectivesListProps {
  projectId: number;
  onEdit: (objective: Objective) => void;
  onDelete: (id: number) => void;
}

export function ObjectivesList({
  projectId,
  onEdit,
  onDelete,
}: ObjectivesListProps) {
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchObjectives = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/guided-projects/${projectId}/objectives`
      );
      if (!response.ok) throw new Error('Error al cargar');
      const data = (await response.json()) as Objective[];
      setObjectives(data);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar objetivos');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void fetchObjectives();
  }, [projectId, fetchObjectives]);

  const handleDragEnd = async (result: DropResult) => {
    const { source, destination } = result;

    if (!destination) return;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    )
      return;

    const newObjectives = Array.from(objectives);
    const [movedObjective] = newObjectives.splice(source.index, 1);
    newObjectives.splice(destination.index, 0, movedObjective);

    setObjectives(newObjectives);

    try {
      for (let i = 0; i < newObjectives.length; i++) {
        await fetch(
          `/api/guided-projects/${projectId}/objectives?id=${newObjectives[i].id}`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderIndex: i }),
          }
        );
      }
      toast.success('Orden actualizado');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al actualizar orden');
      void fetchObjectives();
    }
  };

  const handleToggleEnabled = async (id: number, isEnabled: boolean) => {
    try {
      const response = await fetch(
        `/api/guided-projects/${projectId}/objectives/${id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isEnabled: !isEnabled }),
        }
      );
      if (!response.ok) throw new Error('Error');
      await fetchObjectives();
      toast.success(
        !isEnabled ? 'Objetivo habilitado' : 'Objetivo deshabilitado'
      );
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al actualizar');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-6 text-sm text-gray-400">
        <div className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        Cargando...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-white">Sesiones</h3>
        <Button
          size="sm"
          onClick={() =>
            onEdit({
              id: 0,
              title: '',
              description: '',
              duration: 60,
              orderIndex: objectives.length,
              isEnabled: true,
            })
          }
          className="gap-1 bg-primary text-background hover:bg-primary/90"
        >
          <Plus className="size-4" />
          Agregar
        </Button>
      </div>

      {objectives.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-600 bg-gray-900/50 p-8 text-center">
          <span className="text-3xl">📋</span>
          <p className="text-sm text-gray-400">No hay sesiones creadas</p>
        </div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="objectives">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-2"
              >
                {objectives.map((objective, index) => (
                  <Draggable
                    key={objective.id}
                    draggableId={`objective-${objective.id}`}
                    index={index}
                  >
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`
                          flex items-center gap-3 rounded-lg border
                          border-gray-700 bg-gray-900/60 p-3 text-white
                          transition-colors
                          hover:border-primary/50
                          ${
                            snapshot.isDragging
                              ? 'border-primary shadow-lg ring-2 ring-primary/40'
                              : ''
                          }
                        `}
                      >
                        <div
                          {...provided.dragHandleProps}
                          className="text-gray-500 hover:text-gray-300"
                        >
                          <GripVertical className="size-5" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate font-medium text-white">
                              {objective.title}
                            </p>
                            {!objective.isEnabled && (
                              <Badge
                                variant="outline"
                                className="border-gray-600 bg-background text-[10px] text-gray-400"
                              >
                                Deshabilitada
                              </Badge>
                            )}
                          </div>
                          {objective.description && (
                            <p className="truncate text-sm text-gray-400">
                              {objective.description}
                            </p>
                          )}
                          <p className="text-xs text-gray-500">
                            Duración: {objective.duration} min
                          </p>
                        </div>

                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="px-2 hover:bg-gray-700"
                            onClick={() =>
                              handleToggleEnabled(
                                objective.id,
                                objective.isEnabled
                              )
                            }
                            title={
                              objective.isEnabled ? 'Deshabilitar' : 'Habilitar'
                            }
                          >
                            {objective.isEnabled ? (
                              <CheckCircle2 className="size-4 text-green-400" />
                            ) : (
                              <Circle className="size-4 text-gray-500" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="px-2 text-primary hover:bg-gray-700"
                            onClick={() => onEdit(objective)}
                            title="Editar"
                          >
                            <Edit2 className="size-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="px-2 hover:bg-gray-700"
                            onClick={() => onDelete(objective.id)}
                            title="Eliminar"
                          >
                            <Trash2 className="size-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}
    </div>
  );
}
