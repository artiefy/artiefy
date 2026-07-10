'use client';

import { useCallback, useEffect, useState } from 'react';

import Link from 'next/link';

import {
  DragDropContext,
  Draggable,
  Droppable,
  DropResult,
} from '@hello-pangea/dnd';
import { Edit2, Eye, GripVertical, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '~/components/educators/ui/button';

interface Activity {
  id: number;
  name: string;
  description: string | null;
  typeName: string;
  weekNumber: number | null;
  startDate: Date | null;
  endDate: Date | null;
  porcentaje: number | null;
  fechaMaximaEntrega: Date | null;
}

interface ActivitiesListProps {
  projectId: number;
  objectiveId: number;
  onEdit: (activity: Activity) => void;
  onDelete: (id: number) => void;
}

export function ActivitiesList({
  projectId,
  objectiveId,
  onEdit,
  onDelete,
}: ActivitiesListProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActivities = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/guided-projects/${projectId}/objectives/${objectiveId}/activities`
      );
      if (!response.ok) throw new Error('Error al cargar');
      const data = (await response.json()) as Activity[];
      setActivities(data);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar actividades');
    } finally {
      setLoading(false);
    }
  }, [projectId, objectiveId]);

  useEffect(() => {
    fetchActivities();
  }, [objectiveId, fetchActivities]);

  const handleDragEnd = async (result: DropResult) => {
    const { source, destination } = result;

    if (!destination) return;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    )
      return;

    const newActivities = Array.from(activities);
    const [movedActivity] = newActivities.splice(source.index, 1);
    newActivities.splice(destination.index, 0, movedActivity);

    setActivities(newActivities);
    toast.success('Orden actualizado');
  };

  if (loading) return <div className="py-4 text-center">Cargando...</div>;

  return (
    <div className="mt-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold">Actividades</h3>
        <Button
          size="sm"
          onClick={() =>
            onEdit({
              id: 0,
              name: '',
              description: '',
              typeName: '',
              weekNumber: 1,
              startDate: null,
              endDate: null,
              porcentaje: 0,
              fechaMaximaEntrega: null,
            })
          }
        >
          <Plus className="mr-2 size-4" />
          Agregar Actividad
        </Button>
      </div>

      {activities.length === 0 ? (
        <div className="py-6 text-center text-sm text-gray-500">
          No hay actividades en esta sesión
        </div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="activities">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-2"
              >
                {activities.map((activity, index) => (
                  <Draggable
                    key={activity.id}
                    draggableId={`activity-${activity.id}`}
                    index={index}
                  >
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`flex items-center gap-3 rounded-lg border bg-gray-50 p-3 text-sm ${
                          snapshot.isDragging
                            ? 'shadow-lg ring-2 ring-blue-500'
                            : ''
                        }`}
                      >
                        <div {...provided.dragHandleProps}>
                          <GripVertical className="size-4 text-gray-400" />
                        </div>

                        <div className="flex-1">
                          <p className="font-medium">{activity.name}</p>
                          {activity.description && (
                            <p className="text-xs text-black">
                              {activity.description}
                            </p>
                          )}
                          <div className="mt-1 space-y-0.5 text-xs text-gray-500">
                            {activity.weekNumber && (
                              <p>Semana: {activity.weekNumber}</p>
                            )}
                            {activity.startDate && (
                              <p>
                                Inicio:{' '}
                                {new Date(
                                  activity.startDate
                                ).toLocaleDateString('es-ES')}
                              </p>
                            )}
                            {activity.endDate && (
                              <p>
                                Fin:{' '}
                                {new Date(activity.endDate).toLocaleDateString(
                                  'es-ES'
                                )}
                              </p>
                            )}
                            {activity.porcentaje && (
                              <p>Porcentaje: {activity.porcentaje}%</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Link
                            href={`/dashboard/super-admin/proyectos-guiados/${projectId}/${objectiveId}/actividades/${activity.id}`}
                          >
                            <Button
                              size="sm"
                              variant="ghost"
                              title="Ver detalle"
                            >
                              <Eye className="size-4" />
                            </Button>
                          </Link>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onEdit(activity)}
                          >
                            <Edit2 className="size-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onDelete(activity.id)}
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
