'use client';

import { useCallback, useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';

import { toast } from 'sonner';

import { Button } from '~/components/educators/ui/button';
import { ActivitiesList } from '~/components/super-admin/layout/ActivitiesListAdmin';
import { ObjectivesList } from '~/components/super-admin/layout/ObjectivesListAdmin';

interface GuidedProject {
  id: number;
  title: string;
  description: string | null;
  instructor: string;
  categoryName: string;
}

interface Objective {
  id: number;
  title: string;
  description: string | null;
  duration: number;
  orderIndex: number;
  isEnabled: boolean;
}

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

export default function GuidedProjectDetailPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const [projectId, setProjectId] = useState<string | null>(null);
  const [project, setProject] = useState<GuidedProject | null>(null);
  const [selectedObjective, setSelectedObjective] = useState<Objective | null>(
    null
  );
  const [editingObjective, setEditingObjective] = useState<Objective | null>(
    null
  );
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [objectiveFormData, setObjectiveFormData] = useState({
    title: '',
    description: '',
    duration: 60,
  });

  const [activityFormData, setActivityFormData] = useState({
    name: '',
    description: '',
    typeId: 1,
    weekNumber: 1,
    startDate: '',
    endDate: '',
    porcentaje: 0,
    fechaMaximaEntrega: '',
  });
  const router = useRouter();

  useEffect(() => {
    params.then((p) => setProjectId(p.projectId));
  }, [params]);

  const fetchProject = useCallback(async () => {
    if (!projectId) return;
    try {
      const response = await fetch(`/api/guided-projects?id=${projectId}`);
      if (!response.ok) throw new Error('Error al cargar');
      const data = await response.json();
      setProject(data);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar proyecto');
    }
  }, [projectId]);

  useEffect(() => {
    if (projectId) fetchProject();
  }, [projectId, fetchProject]);

  const handleSaveObjective = async () => {
    if (!projectId) return;
    if (!objectiveFormData.title) {
      toast.error('El título es requerido');
      return;
    }
    try {
      const isEditing = editingObjective !== null && editingObjective.id !== 0;
      const url = isEditing
        ? `/api/guided-projects/${projectId}/objectives?id=${editingObjective!.id}`
        : `/api/guided-projects/${projectId}/objectives`;
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(objectiveFormData),
      });
      if (!response.ok) throw new Error('Error al guardar');
      toast.success(
        isEditing ? 'Sesión actualizada' : 'Sesión creada correctamente'
      );
      setEditingObjective(null);
      setObjectiveFormData({ title: '', description: '', duration: 60 });
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al guardar sesión');
    }
  };

  const handleDeleteObjective = async (id: number) => {
    if (!projectId) return;
    if (!confirm('¿Eliminar esta sesión?')) return;
    try {
      const response = await fetch(
        `/api/guided-projects/${projectId}/objectives?id=${id}`,
        { method: 'DELETE' }
      );
      if (!response.ok) throw new Error('Error al eliminar');
      toast.success('Sesión eliminada');
      setSelectedObjective(null);
      setEditingObjective(null);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al eliminar sesión');
    }
  };

  const handleSaveActivity = async () => {
    if (!projectId || !selectedObjective) return;
    if (!activityFormData.name) {
      toast.error('El nombre es requerido');
      return;
    }
    try {
      const isEditing = editingActivity !== null && editingActivity.id !== 0;
      const url = isEditing
        ? `/api/guided-projects/${projectId}/objectives/${selectedObjective.id}/activities?id=${editingActivity!.id}`
        : `/api/guided-projects/${projectId}/objectives/${selectedObjective.id}/activities`;
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(activityFormData),
      });
      if (!response.ok) throw new Error('Error al guardar');
      toast.success(
        isEditing ? 'Actividad actualizada' : 'Actividad creada correctamente'
      );
      setEditingActivity(null);
      setActivityFormData({
        name: '',
        description: '',
        typeId: 1,
        weekNumber: 1,
        startDate: '',
        endDate: '',
        porcentaje: 0,
        fechaMaximaEntrega: '',
      });
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al guardar actividad');
    }
  };

  const handleDeleteActivity = async (id: number) => {
    if (!projectId || !selectedObjective) return;
    if (!confirm('¿Eliminar esta actividad?')) return;
    try {
      const response = await fetch(
        `/api/guided-projects/${projectId}/objectives/${selectedObjective.id}/activities?id=${id}`,
        { method: 'DELETE' }
      );
      if (!response.ok) throw new Error('Error al eliminar');
      toast.success('Actividad eliminada');
      setEditingActivity(null);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al eliminar actividad');
    }
  };

  if (!projectId || !project) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <p className="animate-pulse text-sm text-muted-foreground">
          Cargando...
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      {/* Botón volver */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => router.push('/dashboard/super-admin/proyectos-guiados')}
        className="gap-2 text-muted-foreground"
      >
        ← Volver
      </Button>

      {/* Header del proyecto */}
      <div className="rounded-xl border border-border/50 bg-card p-6">
        <h1 className="mb-1 text-2xl font-medium">{project.title}</h1>
        {project.description && (
          <p className="mb-4 text-sm text-muted-foreground">
            {project.description}
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-md bg-[#EEEDFE] px-2.5 py-1 text-xs font-medium text-[#3C3489]">
            <svg
              className="size-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            {project.instructor}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-md bg-[#E1F5EE] px-2.5 py-1 text-xs font-medium text-[#085041]">
            <svg
              className="size-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
              />
            </svg>
            {project.categoryName}
          </span>
        </div>
      </div>

      {/* Layout principal */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Columna sesiones */}
        <div className="lg:col-span-1">
          <div className="rounded-xl border border-border/50 bg-card p-4">
            <p className="mb-3 text-[11px] font-medium tracking-widest text-muted-foreground uppercase">
              Sesiones
            </p>
            <ObjectivesList
              projectId={parseInt(projectId)}
              onEdit={(objective) => {
                console.log('objective recibido:', objective); // verificar que id != 0
                setSelectedObjective(objective);
                setEditingObjective(objective);
                setObjectiveFormData({
                  title: objective.title,
                  description: objective.description ?? '',
                  duration: objective.duration,
                });
              }}
              onDelete={handleDeleteObjective}
            />
          </div>
        </div>

        {/* Columna detalle */}
        <div className="space-y-4 lg:col-span-2">
          {selectedObjective ? (
            <>
              {/* Card sesión */}
              <div className="rounded-xl border border-border/50 bg-card p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-base font-medium">
                    {editingObjective
                      ? 'Editando sesión'
                      : 'Detalles de sesión'}
                  </h2>
                  {!editingObjective && (
                    <button
                      onClick={() => setEditingObjective(selectedObjective)}
                      className="inline-flex items-center gap-1.5 rounded-md bg-[#EEEDFE] px-3 py-1.5 text-xs font-medium text-[#534AB7] transition-colors hover:bg-[#CECBF6]"
                    >
                      <svg
                        className="size-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                      Editar
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      Título
                    </label>
                    <input
                      type="text"
                      value={objectiveFormData.title}
                      onChange={(e) =>
                        setObjectiveFormData({
                          ...objectiveFormData,
                          title: e.target.value,
                        })
                      }
                      disabled={!editingObjective}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground
                        transition-colors focus:border-[#7F77DD] focus:ring-2
                        focus:ring-[#7F77DD]/30 focus:outline-none disabled:cursor-default disabled:bg-muted
                        disabled:text-muted-foreground"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      Descripción
                    </label>
                    <textarea
                      value={objectiveFormData.description}
                      onChange={(e) =>
                        setObjectiveFormData({
                          ...objectiveFormData,
                          description: e.target.value,
                        })
                      }
                      disabled={!editingObjective}
                      rows={3}
                      className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm
                        text-foreground transition-colors focus:border-[#7F77DD]
                        focus:ring-2 focus:ring-[#7F77DD]/30 focus:outline-none disabled:cursor-default
                        disabled:bg-muted disabled:text-muted-foreground"
                    />
                  </div>

                  <div className="max-w-[160px] space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      Duración (min)
                    </label>
                    <input
                      type="number"
                      value={objectiveFormData.duration}
                      onChange={(e) =>
                        setObjectiveFormData({
                          ...objectiveFormData,
                          duration: parseInt(e.target.value),
                        })
                      }
                      disabled={!editingObjective}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground
                        transition-colors focus:border-[#7F77DD] focus:ring-2
                        focus:ring-[#7F77DD]/30 focus:outline-none disabled:cursor-default disabled:bg-muted
                        disabled:text-muted-foreground"
                    />
                  </div>

                  {editingObjective && (
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={handleSaveObjective}
                        className="rounded-md bg-[#534AB7] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#3C3489]"
                      >
                        Guardar
                      </button>
                      <button
                        onClick={() => {
                          setEditingObjective(null);
                          setObjectiveFormData({
                            title: '',
                            description: '',
                            duration: 60,
                          });
                        }}
                        className="rounded-md border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
                      >
                        Cancelar
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Card actividades */}
              <div className="rounded-xl border border-border/50 bg-card p-6">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-[11px] font-medium tracking-widest text-muted-foreground uppercase">
                    Actividades
                  </p>
                </div>

                <ActivitiesList
                  projectId={parseInt(projectId)}
                  objectiveId={selectedObjective.id}
                  onEdit={(activity) => {
                    setEditingActivity(activity);
                    setActivityFormData({
                      name: activity.name,
                      description: activity.description ?? '',
                      typeId: 1,
                      weekNumber: activity.weekNumber ?? 1,
                      startDate: activity.startDate
                        ? new Date(activity.startDate)
                            .toISOString()
                            .split('T')[0]
                        : '',
                      endDate: activity.endDate
                        ? new Date(activity.endDate).toISOString().split('T')[0]
                        : '',
                      porcentaje: activity.porcentaje ?? 0,
                      fechaMaximaEntrega: activity.fechaMaximaEntrega
                        ? new Date(activity.fechaMaximaEntrega)
                            .toISOString()
                            .split('T')[0]
                        : '',
                    });
                  }}
                  onDelete={handleDeleteActivity}
                />

                {editingActivity && (
                  <div className="mt-4 rounded-lg border border-border bg-muted/40 p-4">
                    <p className="mb-3 text-xs font-medium text-foreground">
                      Editar actividad
                    </p>
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground">
                          Nombre
                        </label>
                        <input
                          type="text"
                          value={activityFormData.name}
                          onChange={(e) =>
                            setActivityFormData({
                              ...activityFormData,
                              name: e.target.value,
                            })
                          }
                          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-white
            transition-colors focus:border-[#7F77DD] focus:ring-2 focus:ring-[#7F77DD]/30 focus:outline-none dark:text-white"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground">
                          Descripción
                        </label>
                        <textarea
                          value={activityFormData.description}
                          onChange={(e) =>
                            setActivityFormData({
                              ...activityFormData,
                              description: e.target.value,
                            })
                          }
                          rows={2}
                          className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm
            text-white transition-colors focus:border-[#7F77DD] focus:ring-2 focus:ring-[#7F77DD]/30 focus:outline-none dark:text-white"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-muted-foreground">
                            Semana
                          </label>
                          <input
                            type="number"
                            value={activityFormData.weekNumber}
                            onChange={(e) =>
                              setActivityFormData({
                                ...activityFormData,
                                weekNumber: parseInt(e.target.value),
                              })
                            }
                            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-white
              transition-colors focus:border-[#7F77DD] focus:ring-2 focus:ring-[#7F77DD]/30 focus:outline-none dark:text-white"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-muted-foreground">
                            Porcentaje
                          </label>
                          <input
                            type="number"
                            value={activityFormData.porcentaje}
                            onChange={(e) =>
                              setActivityFormData({
                                ...activityFormData,
                                porcentaje: parseInt(e.target.value),
                              })
                            }
                            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-white
              transition-colors focus:border-[#7F77DD] focus:ring-2 focus:ring-[#7F77DD]/30 focus:outline-none dark:text-white"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-muted-foreground">
                            Fecha inicio
                          </label>
                          <input
                            type="date"
                            value={activityFormData.startDate}
                            onChange={(e) =>
                              setActivityFormData({
                                ...activityFormData,
                                startDate: e.target.value,
                              })
                            }
                            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-white
              transition-colors focus:border-[#7F77DD] focus:ring-2 focus:ring-[#7F77DD]/30 focus:outline-none dark:text-white"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-muted-foreground">
                            Fecha fin
                          </label>
                          <input
                            type="date"
                            value={activityFormData.endDate}
                            onChange={(e) =>
                              setActivityFormData({
                                ...activityFormData,
                                endDate: e.target.value,
                              })
                            }
                            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-white
              transition-colors focus:border-[#7F77DD] focus:ring-2 focus:ring-[#7F77DD]/30 focus:outline-none dark:text-white"
                          />
                        </div>
                      </div>

                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={handleSaveActivity}
                          className="rounded-md bg-[#534AB7] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#3C3489]"
                        >
                          Guardar
                        </button>
                        <button
                          onClick={() => {
                            setEditingActivity(null);
                            setActivityFormData({
                              name: '',
                              description: '',
                              typeId: 1,
                              weekNumber: 1,
                              startDate: '',
                              endDate: '',
                              porcentaje: 0,
                              fechaMaximaEntrega: '',
                            });
                          }}
                          className="rounded-md border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border p-16 text-center">
              <svg
                className="size-8 text-[#AFA9EC]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              <p className="text-sm text-muted-foreground">
                Selecciona una sesión para ver sus detalles
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
