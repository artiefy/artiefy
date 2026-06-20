'use client';

import { useCallback, useEffect, useState } from 'react';

import Image from 'next/image';
import { useRouter } from 'next/navigation';

import { toast } from 'sonner';

import { Badge } from '~/components/educators/ui/badge';
import { Button } from '~/components/educators/ui/button';
import { Card, CardHeader, CardTitle } from '~/components/educators/ui/card';
import { ActivitiesList } from '~/components/super-admin/layout/ActivitiesListAdmin';
import { ObjectivesList } from '~/components/super-admin/layout/ObjectivesListAdmin';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '~/components/super-admin/ui/breadcrumb';

interface GuidedProject {
  id: number;
  title: string;
  description: string | null;
  instructor: string;
  categoryName: string;
  modalidadName?: string;
  coverImageKey?: string | null;
  isActive?: boolean;
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

const predefinedColors = ['#1f2937', '#000000', '#FFFFFF'];

export default function GuidedProjectDetailPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const [projectId, setProjectId] = useState<string | null>(null);
  const [project, setProject] = useState<GuidedProject | null>(null);
  const [selectedColor, setSelectedColor] = useState<string>('#FFFFFF');
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
    void params.then((p) => setProjectId(p.projectId));
  }, [params]);

  const fetchProject = useCallback(async () => {
    if (!projectId) return;
    try {
      const response = await fetch(`/api/guided-projects?id=${projectId}`);
      if (!response.ok) throw new Error('Error al cargar');
      const data = (await response.json()) as GuidedProject;
      setProject(data);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar proyecto');
    }
  }, [projectId]);

  useEffect(() => {
    if (projectId) void fetchProject();
  }, [projectId, fetchProject]);

  useEffect(() => {
    if (!projectId) return;
    const savedColor = localStorage.getItem(
      `selectedColor_project_${projectId}`
    );
    if (savedColor) setSelectedColor(savedColor);
  }, [projectId]);

  const handlePredefinedColorChange = (color: string) => {
    setSelectedColor(color);
    if (projectId) {
      localStorage.setItem(`selectedColor_project_${projectId}`, color);
    }
  };

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

  const handleDeleteProject = async () => {
    if (!project) return;
    if (!confirm('¿Estás seguro de eliminar este proyecto guiado?')) return;
    try {
      const response = await fetch(`/api/guided-projects?id=${project.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Error al eliminar');
      toast.success('Proyecto eliminado');
      router.push('/dashboard/super-admin/proyectos-guiados');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al eliminar el proyecto');
    }
  };

  if (!projectId || !project) {
    return (
      <main className="flex h-screen flex-col items-center justify-center">
        <div className="size-32 rounded-full border-y-2 border-primary">
          <span className="sr-only" />
        </div>
        <span className="text-primary">Cargando...</span>
      </main>
    );
  }

  return (
    <div
      className="relative min-h-screen w-full overflow-hidden px-1 py-2 md:px-3 md:py-4"
      style={{ backgroundColor: 'rgb(25, 45, 80)' }}
    >
      {/* Overlay degradado */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-black/50 via-[#1a2d4a]/30 to-black/50" />

      {/* Glow decorativo */}
      <div className="pointer-events-none absolute inset-0 opacity-20">
        <div className="absolute -top-40 -right-40 size-80 rounded-full bg-green-500 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 size-80 rounded-full bg-purple-500 blur-3xl" />
      </div>

      {/* Breadcrumb */}
      <Breadcrumb className="relative z-10 mb-8">
        <BreadcrumbList className="flex flex-wrap gap-2">
          <BreadcrumbItem>
            <BreadcrumbLink
              className="text-cyan-400 transition-colors duration-300 hover:text-cyan-300"
              href="/dashboard/super-admin"
            >
              Inicio
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink
              className="text-cyan-400 transition-colors duration-300 hover:text-cyan-300"
              href="/dashboard/super-admin/proyectos-guiados"
            >
              Proyectos Guiados
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink className="text-white/60">Detalles</BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Card principal */}
      <div className="relative w-full">
        <Card
          className="
            zoom-in relative mt-3 h-auto overflow-hidden border-2
            border-cyan-500/30 bg-slate-800 p-4 shadow-2xl transition-all
            duration-500 ease-out
            hover:border-cyan-500/60 hover:shadow-cyan-500/30
            sm:p-8
          "
        >
          <CardHeader
            className="
              grid w-full grid-cols-1 gap-6 border-b border-cyan-500/20 p-0 pb-8
              md:grid-cols-2 md:gap-12
            "
          >
            <div className="space-y-3">
              <p className="text-sm font-semibold tracking-widest text-cyan-400 uppercase">
                Detalles del Proyecto
              </p>
              <CardTitle className="text-3xl font-bold text-white md:text-4xl lg:text-5xl">
                {project.title}
              </CardTitle>
            </div>
            <div className="flex flex-col justify-start gap-4">
              <p className="flex items-center gap-2 text-sm font-bold tracking-wider text-cyan-400 uppercase">
                Tema Visual
              </p>
              <div className="flex flex-wrap gap-3">
                {predefinedColors.map((color) => (
                  <button
                    key={color}
                    onClick={() => handlePredefinedColorChange(color)}
                    style={{ backgroundColor: color }}
                    className={`
                      size-12 rounded-xl border-2 transition-all duration-300
                      hover:scale-125 hover:shadow-lg hover:shadow-cyan-500/50
                      ${
                        selectedColor === color
                          ? 'scale-110 border-white shadow-lg ring-2 ring-cyan-400 ring-offset-2'
                          : 'border-white/20 hover:border-cyan-400'
                      }
                    `}
                    title={`Cambiar tema a ${color}`}
                  />
                ))}
              </div>
            </div>
          </CardHeader>

          <div className="mt-8 grid gap-8 md:grid-cols-2">
            {/* Columna izquierda - Información */}
            <div className="order-2 space-y-6 md:order-1">
              <h2 className="text-2xl font-bold text-white md:text-3xl">
                Información del Curso
              </h2>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-cyan-500/30 bg-white/5 p-4 backdrop-blur-sm transition-all duration-300 hover:border-cyan-500/60 hover:bg-white/10">
                  <p className="mb-2 text-xs font-semibold tracking-wide text-cyan-400 uppercase">
                    Categoría
                  </p>
                  <Badge className="border-cyan-500/50 bg-cyan-500/20 text-sm text-cyan-300">
                    {project.categoryName}
                  </Badge>
                </div>

                {project.modalidadName && (
                  <div className="rounded-xl border border-cyan-500/30 bg-white/5 p-4 backdrop-blur-sm transition-all duration-300 hover:border-cyan-500/60 hover:bg-white/10">
                    <p className="mb-2 text-xs font-semibold tracking-wide text-cyan-400 uppercase">
                      Modalidad
                    </p>
                    <Badge className="border-cyan-500/50 bg-cyan-500/20 text-sm text-cyan-300">
                      {project.modalidadName}
                    </Badge>
                  </div>
                )}

                <div className="rounded-xl border border-cyan-500/30 bg-white/5 p-4 backdrop-blur-sm transition-all duration-300 hover:border-cyan-500/60 hover:bg-white/10">
                  <p className="mb-2 text-xs font-semibold tracking-wide text-cyan-400 uppercase">
                    Estado
                  </p>
                  <Badge
                    className={`text-sm ${
                      project.isActive
                        ? 'border-green-500/50 bg-green-500/20 text-green-300'
                        : 'border-red-500/50 bg-red-500/20 text-red-300'
                    }`}
                  >
                    {project.isActive ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>
              </div>

              {/* Descripción */}
              <div className="rounded-xl border border-cyan-500/30 bg-white/5 p-5 backdrop-blur-sm transition-all duration-300 hover:border-cyan-500/60 hover:bg-white/10">
                <h3 className="mb-3 text-sm font-bold tracking-wide text-cyan-400 uppercase">
                  Descripción
                </h3>
                <p className="text-sm leading-relaxed text-white/80">
                  {project.description || 'Sin descripción'}
                </p>
              </div>

              {/* Instructor */}
              <div className="rounded-xl border-2 border-cyan-500/40 bg-cyan-500/10 p-6 backdrop-blur-sm transition-all duration-300 hover:border-cyan-500/70">
                <h2 className="mb-4 flex items-center gap-2 text-sm font-bold tracking-wider text-cyan-400 uppercase">
                  Instructor Asignado
                </h2>
                <div className="flex flex-wrap gap-2">
                  <div className="flex items-center gap-2 rounded-full border border-primary bg-primary/20 px-4 py-2 text-sm text-white">
                    <span className="font-semibold text-white">
                      {project.instructor}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Columna derecha - Imagen y acciones */}
            <div className="order-1 flex w-full flex-col space-y-6 md:order-2">
              <div className="card-premium group relative aspect-video w-full overflow-hidden">
                <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-40 transition-opacity duration-300 group-hover:opacity-20" />
                {project.coverImageKey ? (
                  <Image
                    src={`${process.env.NEXT_PUBLIC_AWS_S3_URL}/${project.coverImageKey}`}
                    alt={project.title}
                    width={400}
                    height={225}
                    className="size-full object-cover transition-transform duration-500 group-hover:scale-110"
                    priority
                    quality={85}
                  />
                ) : (
                  <div className="flex size-full items-center justify-center bg-gradient-to-br from-[#3AF4EF]/20 to-[#01142B]/20">
                    <span className="text-5xl">📚</span>
                  </div>
                )}
              </div>

              {/* Botones de acción */}
              <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-3 md:gap-3 lg:gap-4">
                <Button className="btn-primary w-full">Ver</Button>
                <Button
                  onClick={() =>
                    router.push(
                      `/dashboard/super-admin/proyectos-guiados/${project.id}/editar`
                    )
                  }
                  className="
                    w-full bg-yellow-500 px-3 py-2 text-xs font-semibold
                    text-white transition-all duration-300
                    hover:bg-yellow-600
                    md:px-4 md:py-3 md:text-sm
                  "
                >
                  ✏️ Editar
                </Button>
                <Button
                  onClick={handleDeleteProject}
                  className="
                    w-full bg-red-500 px-3 py-2 text-xs font-semibold
                    text-white transition-all duration-300
                    hover:bg-red-600
                    md:px-4 md:py-3 md:text-sm
                  "
                >
                  🗑️ Eliminar
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Sección de sesiones / actividades */}
      <div className="relative z-10 mt-16 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Columna sesiones */}
        <div className="lg:col-span-1">
          <Card className="zoom-in h-full border-2 border-cyan-500/30 bg-slate-800 p-4 shadow-xl transition-all duration-300 hover:border-cyan-500/60">
            <p className="mb-3 text-xs font-semibold tracking-widest text-cyan-400 uppercase">
              Sesiones
            </p>
            <ObjectivesList
              projectId={parseInt(projectId)}
              onEdit={(objective) => {
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
          </Card>
        </div>

        {/* Columna detalle */}
        <div className="space-y-6 lg:col-span-2">
          {selectedObjective ? (
            <>
              {/* Card sesión */}
              <Card className="zoom-in border-2 border-cyan-500/30 bg-slate-800 p-4 shadow-xl transition-all duration-300 hover:border-cyan-500/60 sm:p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-cyan-300 sm:text-xl">
                    {editingObjective
                      ? 'Editando sesión'
                      : 'Detalles de sesión'}
                  </h2>
                  {!editingObjective && (
                    <Button
                      size="sm"
                      onClick={() => setEditingObjective(selectedObjective)}
                      className="bg-yellow-500 text-white hover:bg-yellow-600"
                    >
                      ✏️ Editar
                    </Button>
                  )}
                </div>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold tracking-wide text-cyan-400 uppercase">
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
                      className="
                        w-full rounded-lg border border-cyan-500/30 bg-white/5
                        px-3 py-2 text-sm text-white transition-colors
                        focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30
                        focus:outline-none
                        disabled:cursor-default disabled:opacity-60
                      "
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold tracking-wide text-cyan-400 uppercase">
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
                      className="
                        w-full resize-none rounded-lg border
                        border-cyan-500/30 bg-white/5 px-3 py-2 text-sm
                        text-white transition-colors
                        focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30
                        focus:outline-none
                        disabled:cursor-default disabled:opacity-60
                      "
                    />
                  </div>
                  <div className="max-w-[160px] space-y-1.5">
                    <label className="text-xs font-semibold tracking-wide text-cyan-400 uppercase">
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
                      className="
                        w-full rounded-lg border border-cyan-500/30 bg-white/5
                        px-3 py-2 text-sm text-white transition-colors
                        focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30
                        focus:outline-none
                        disabled:cursor-default disabled:opacity-60
                      "
                    />
                  </div>
                  {editingObjective && (
                    <div className="flex gap-2 pt-1">
                      <Button
                        onClick={handleSaveObjective}
                        className="bg-cyan-500 text-white hover:bg-cyan-600"
                      >
                        Guardar
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setEditingObjective(null);
                          setObjectiveFormData({
                            title: '',
                            description: '',
                            duration: 60,
                          });
                        }}
                        className="border-white/20 text-white/70 hover:bg-white/10"
                      >
                        Cancelar
                      </Button>
                    </div>
                  )}
                </div>
              </Card>

              {/* Card actividades */}
              <Card className="zoom-in border-2 border-cyan-500/30 bg-slate-800 p-4 shadow-xl transition-all duration-300 hover:border-cyan-500/60 sm:p-6">
                <p className="mb-4 text-xs font-semibold tracking-widest text-cyan-400 uppercase">
                  Actividades
                </p>
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
                  <div className="mt-4 rounded-lg border border-cyan-500/30 bg-white/5 p-4">
                    <p className="mb-3 text-xs font-semibold tracking-wide text-cyan-400 uppercase">
                      Editar actividad
                    </p>
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold tracking-wide text-cyan-400 uppercase">
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
                          className="
                            w-full rounded-lg border border-cyan-500/30
                            bg-white/5 px-3 py-2 text-sm text-white
                            transition-colors
                            focus:border-cyan-500 focus:ring-2
                            focus:ring-cyan-500/30 focus:outline-none
                          "
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold tracking-wide text-cyan-400 uppercase">
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
                          className="
                            w-full resize-none rounded-lg border
                            border-cyan-500/30 bg-white/5 px-3 py-2 text-sm
                            text-white transition-colors
                            focus:border-cyan-500 focus:ring-2
                            focus:ring-cyan-500/30 focus:outline-none
                          "
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold tracking-wide text-cyan-400 uppercase">
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
                            className="
                              w-full rounded-lg border border-cyan-500/30
                              bg-white/5 px-3 py-2 text-sm text-white
                              transition-colors
                              focus:border-cyan-500 focus:ring-2
                              focus:ring-cyan-500/30 focus:outline-none
                            "
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold tracking-wide text-cyan-400 uppercase">
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
                            className="
                              w-full rounded-lg border border-cyan-500/30
                              bg-white/5 px-3 py-2 text-sm text-white
                              transition-colors
                              focus:border-cyan-500 focus:ring-2
                              focus:ring-cyan-500/30 focus:outline-none
                            "
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold tracking-wide text-cyan-400 uppercase">
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
                            className="
                              w-full rounded-lg border border-cyan-500/30
                              bg-white/5 px-3 py-2 text-sm text-white
                              transition-colors
                              focus:border-cyan-500 focus:ring-2
                              focus:ring-cyan-500/30 focus:outline-none
                            "
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold tracking-wide text-cyan-400 uppercase">
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
                            className="
                              w-full rounded-lg border border-cyan-500/30
                              bg-white/5 px-3 py-2 text-sm text-white
                              transition-colors
                              focus:border-cyan-500 focus:ring-2
                              focus:ring-cyan-500/30 focus:outline-none
                            "
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 pt-1">
                        <Button
                          onClick={handleSaveActivity}
                          className="bg-cyan-500 text-white hover:bg-cyan-600"
                        >
                          Guardar
                        </Button>
                        <Button
                          variant="outline"
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
                          className="border-white/20 text-white/70 hover:bg-white/10"
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-cyan-500/30 bg-slate-800/50 p-16 text-center">
              <span className="text-4xl">📋</span>
              <p className="text-sm text-white/50">
                Selecciona una sesión para ver sus detalles
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
