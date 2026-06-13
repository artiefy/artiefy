'use client';

import { useCallback, useEffect, useState } from 'react';

import {
  DragDropContext,
  Draggable,
  Droppable,
  DropResult,
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
    fetchObjectives();
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
      fetchObjectives();
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

  if (loading) return <div className="py-4 text-center">Cargando...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold">Sesiones/Objetivos</h3>
        <Button
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
        >
          <Plus className="mr-2 size-4" />
          Agregar Sesión
        </Button>
      </div>

      {objectives.length === 0 ? (
        <div className="py-8 text-center text-gray-500">
          No hay sesiones creadas
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
                        className={`flex items-center gap-3 rounded-lg border bg-white p-3 ${
                          snapshot.isDragging
                            ? 'shadow-lg ring-2 ring-blue-500'
                            : ''
                        }`}
                      >
                        <div {...provided.dragHandleProps}>
                          <GripVertical className="size-5 text-gray-400" />
                        </div>

                        <div className="flex-1">
                          <p className="font-medium">{objective.title}</p>
                          {objective.description && (
                            <p className="text-sm text-gray-600">
                              {objective.description}
                            </p>
                          )}
                          <p className="text-xs text-gray-500">
                            Duración: {objective.duration} min
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              handleToggleEnabled(
                                objective.id,
                                objective.isEnabled
                              )
                            }
                          >
                            {objective.isEnabled ? (
                              <CheckCircle2 className="size-4 text-green-600" />
                            ) : (
                              <Circle className="size-4 text-gray-400" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onEdit(objective)}
                          >
                            <Edit2 className="size-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onDelete(objective.id)}
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
