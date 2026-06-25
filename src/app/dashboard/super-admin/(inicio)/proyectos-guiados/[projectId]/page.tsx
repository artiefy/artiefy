'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import Image from 'next/image';
import { useRouter } from 'next/navigation';

import { toast } from 'sonner';

import { Badge } from '~/components/educators/ui/badge';
import { Button } from '~/components/educators/ui/button';
import { Card, CardHeader, CardTitle } from '~/components/educators/ui/card';
import { ActivitiesList } from '~/components/super-admin/layout/ActivitiesListAdmin';
import { ModalGuidedProjectForm } from '~/components/super-admin/modals/ModalGuidedProjectForm';
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
  instructorName: string;
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

  // Único tab principal por ahora (mismo patrón visual que CourseDetail)
  const [activeTab, setActiveTab] = useState<string>('sesiones');
  const tabsRef = useRef<HTMLDivElement>(null);

  // --- Sesiones (objectives) ---
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [loadingObjectives, setLoadingObjectives] = useState(false);

  // Vista actual dentro del tab "Sesiones": lista de tarjetas o detalle de una sesión
  const [selectedObjective, setSelectedObjective] = useState<Objective | null>(
    null
  );
  // Sub-tab interno del detalle de sesión: 'info' | 'actividades'
  const [sessionDetailTab, setSessionDetailTab] = useState<
    'info' | 'actividades'
  >('info');

  const [editingObjective, setEditingObjective] = useState<Objective | null>(
    null
  );
  const [editModalOpen, setEditModalOpen] = useState(false);
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

  const fetchObjectives = useCallback(async () => {
    if (!projectId) return;
    setLoadingObjectives(true);
    try {
      const response = await fetch(
        `/api/guided-projects/${projectId}/objectives`
      );
      if (!response.ok) throw new Error('Error al cargar sesiones');
      const data = (await response.json()) as Objective[];
      setObjectives(
        Array.isArray(data)
          ? [...data].sort((a, b) => a.orderIndex - b.orderIndex)
          : []
      );
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar sesiones');
      setObjectives([]);
    } finally {
      setLoadingObjectives(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (projectId) {
      void fetchProject();
      void fetchObjectives();
    }
  }, [projectId, fetchProject, fetchObjectives]);

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

  // Abre el detalle de una sesión (tarjeta) en modo lectura
  const handleOpenObjective = (objective: Objective) => {
    setSelectedObjective(objective);
    setSessionDetailTab('info');
    setEditingObjective(null);
    setObjectiveFormData({
      title: objective.title,
      description: objective.description ?? '',
      duration: objective.duration,
    });
  };

  const handleBackToSessions = () => {
    setSelectedObjective(null);
    setEditingObjective(null);
    setEditingActivity(null);
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
      const wasCreating = !isEditing;
      await fetchObjectives();
      if (wasCreating) {
        // Tras crear, volvemos a la lista de tarjetas
        setSelectedObjective(null);
        setObjectiveFormData({ title: '', description: '', duration: 60 });
      } else if (selectedObjective) {
        // Refrescar datos mostrados del objective seleccionado
        setSelectedObjective({
          ...selectedObjective,
          title: objectiveFormData.title,
          description: objectiveFormData.description,
          duration: objectiveFormData.duration,
        });
      }
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
      await fetchObjectives();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al eliminar sesión');
    }
  };

  const handleCreateNewSession = () => {
    const draft: Objective = {
      id: 0,
      title: '',
      description: '',
      duration: 60,
      orderIndex: objectives.length,
      isEnabled: true,
    };
    setSelectedObjective(draft);
    setEditingObjective(draft);
    setSessionDetailTab('info');
    setObjectiveFormData({ title: '', description: '', duration: 60 });
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
                      {project.instructorName ?? 'Sin asignar'}
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
                  onClick={() => setEditModalOpen(true)}
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

      {/* ============================ */}
      {/* TAB MENU: Sesiones (mismo patrón visual que CourseDetail) */}
      {/* ============================ */}
      <div
        className="
          relative z-10 -mx-1 mt-16 space-y-8 px-1
          md:-mx-3 md:px-3
        "
      >
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
          {/* Tabs Navigation */}
          <div
            className="
              relative -mx-1 mb-8 px-1
              md:-mx-3 md:px-3
            "
          >
            {/* Flecha izquierda */}
            <button
              onClick={() => {
                tabsRef.current?.scrollBy({ left: -200, behavior: 'smooth' });
              }}
              className="
                absolute top-1/2 left-0 z-10 -translate-y-1/2
                animate-[pulse-arrow_2s_ease-in-out_infinite]
                bg-gradient-to-r from-slate-900/90 to-transparent py-4 pr-3
                pl-1 text-cyan-400
              "
              aria-label="Desplazar tabs a la izquierda"
            >
              <span
                className="
                  inline-block animate-[bounce-left_2s_ease-in-out_infinite]
                  text-lg font-bold
                "
              >
                ‹
              </span>
            </button>

            {/* Flecha derecha */}
            <button
              onClick={() => {
                tabsRef.current?.scrollBy({ left: 200, behavior: 'smooth' });
              }}
              className="
                absolute top-1/2 right-0 z-10 -translate-y-1/2
                animate-[pulse-arrow_2s_ease-in-out_infinite]
                bg-gradient-to-l from-slate-900/90 to-transparent py-4 pr-1
                pl-3 text-cyan-400
              "
              aria-label="Desplazar tabs a la derecha"
            >
              <span
                className="
                  inline-block animate-[bounce-right_2s_ease-in-out_infinite]
                  text-lg font-bold
                "
              >
                ›
              </span>
            </button>

            <div
              ref={tabsRef}
              className="
                flex scrollbar-none gap-2 overflow-x-auto scroll-smooth px-8
                py-2
                md:gap-3
                lg:gap-4
              "
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
              }}
            >
              <button
                onClick={() => setActiveTab('sesiones')}
                className={`
                  rounded-full px-4 py-2 font-semibold whitespace-nowrap
                  transition-all duration-300
                  ${
                    activeTab === 'sesiones'
                      ? `
                        bg-cyan-500/15 text-cyan-300
                        shadow-[0_0_12px_rgba(34,211,238,0.25)] ring-1
                        ring-cyan-400/40
                      `
                      : `
                        text-white/80
                        hover:bg-white/5 hover:text-white
                      `
                  }
                `}
              >
                Sesiones{' '}
                <span
                  className="
                    ml-2 inline-block rounded-full bg-cyan-500 px-2 py-0.5
                    text-xs font-bold text-slate-950
                  "
                >
                  {objectives.length}
                </span>
              </button>
            </div>
          </div>

          {/* TAB CONTENT */}
          <div
            className="
              -mx-1 space-y-6 px-1
              md:-mx-3 md:px-3
            "
          >
            {activeTab === 'sesiones' && (
              <div className="animate-in fade-in duration-500">
                {!selectedObjective ? (
                  // -------- Vista: grid de tarjetas de sesiones --------
                  <>
                    <div className="mb-6 flex items-center justify-between">
                      <h2 className="text-2xl font-bold text-white">
                        Sesiones del proyecto
                      </h2>
                      <Button
                        onClick={handleCreateNewSession}
                        className="bg-cyan-500 text-white hover:bg-cyan-600"
                      >
                        + Nueva sesión
                      </Button>
                    </div>

                    {loadingObjectives ? (
                      <div className="flex items-center gap-3 text-white/60">
                        <div className="size-5 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
                        Cargando sesiones...
                      </div>
                    ) : objectives.length === 0 ? (
                      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-cyan-500/30 bg-slate-800/50 p-16 text-center">
                        <span className="text-4xl">📋</span>
                        <p className="text-sm text-white/50">
                          No hay sesiones creadas todavía
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {objectives.map((objective) => (
                          <button
                            key={objective.id}
                            onClick={() => handleOpenObjective(objective)}
                            className="
                        group relative overflow-hidden rounded-2xl border-2
                        border-cyan-500/30 bg-gradient-to-br from-slate-800
                        via-cyan-900/20 to-cyan-950/30 p-6 text-left shadow-xl
                        transition-all duration-300
                        hover:scale-[1.02] hover:border-cyan-400
                        hover:shadow-2xl hover:shadow-cyan-500/20
                      "
                          >
                            <div className="mb-3 flex items-center gap-3">
                              <span
                                className="
                            flex size-9 flex-shrink-0 items-center
                            justify-center rounded-full bg-cyan-500/30 text-sm
                            font-bold text-cyan-300
                          "
                              >
                                {objective.orderIndex + 1}
                              </span>
                              <h3 className="line-clamp-1 text-lg font-bold text-cyan-300">
                                {objective.title || 'Sin título'}
                              </h3>
                            </div>
                            <p className="mb-4 line-clamp-2 text-sm text-white/70">
                              {objective.description || 'Sin descripción'}
                            </p>
                            <div className="flex items-center justify-between">
                              <Badge className="border-cyan-500/50 bg-cyan-500/20 text-xs text-cyan-300">
                                ⏱ {objective.duration} min
                              </Badge>
                              {!objective.isEnabled && (
                                <Badge className="border-gray-500/50 bg-gray-500/20 text-xs text-gray-300">
                                  Deshabilitada
                                </Badge>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  // -------- Vista: detalle de sesión seleccionada (con sub-tabs) --------
                  <>
                    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                      <Button
                        variant="outline"
                        onClick={handleBackToSessions}
                        className="border-white/20 text-white/70 hover:bg-white/10"
                      >
                        ← Volver a sesiones
                      </Button>

                      {selectedObjective.id !== 0 && (
                        <Button
                          variant="destructive"
                          onClick={() =>
                            handleDeleteObjective(selectedObjective.id)
                          }
                          className="bg-red-500 text-white hover:bg-red-600"
                        >
                          🗑️ Eliminar sesión
                        </Button>
                      )}
                    </div>

                    {/* Card tipo "ver clase" con info principal de la sesión */}
                    <Card
                      className="
                  zoom-in mb-8 border-2 border-cyan-500/30 bg-slate-800 p-4
                  shadow-2xl transition-all duration-500
                  hover:border-cyan-500/60 hover:shadow-cyan-500/30
                  sm:p-8
                "
                    >
                      <div className="mb-6 flex items-center justify-between gap-3">
                        <h2 className="text-2xl font-bold text-white md:text-3xl">
                          {selectedObjective.id === 0
                            ? 'Nueva sesión'
                            : selectedObjective.title || 'Sesión sin título'}
                        </h2>
                      </div>

                      {/* Sub-tabs internos de la sesión */}
                      <div className="mb-6 flex gap-2 border-b border-cyan-500/20 pb-4">
                        <button
                          onClick={() => setSessionDetailTab('info')}
                          className={`
                      rounded-full px-4 py-2 text-sm font-semibold
                      whitespace-nowrap transition-all duration-300
                      ${
                        sessionDetailTab === 'info'
                          ? `
                            bg-cyan-500/15 text-cyan-300
                            shadow-[0_0_12px_rgba(34,211,238,0.25)] ring-1
                            ring-cyan-400/40
                          `
                          : 'text-white/80 hover:bg-white/5 hover:text-white'
                      }
                    `}
                        >
                          Información
                        </button>
                        <button
                          onClick={() => setSessionDetailTab('actividades')}
                          disabled={selectedObjective.id === 0}
                          className={`
                      rounded-full px-4 py-2 text-sm font-semibold
                      whitespace-nowrap transition-all duration-300
                      disabled:cursor-not-allowed disabled:opacity-40
                      ${
                        sessionDetailTab === 'actividades'
                          ? `
                            bg-cyan-500/15 text-cyan-300
                            shadow-[0_0_12px_rgba(34,211,238,0.25)] ring-1
                            ring-cyan-400/40
                          `
                          : 'text-white/80 hover:bg-white/5 hover:text-white'
                      }
                    `}
                          title={
                            selectedObjective.id === 0
                              ? 'Guarda la sesión primero para agregar actividades'
                              : undefined
                          }
                        >
                          Actividades
                        </button>
                      </div>

                      {/* Sub-tab: Información */}
                      {sessionDetailTab === 'info' && (
                        <div className="animate-in fade-in duration-300">
                          <div className="mb-4 flex items-center justify-between">
                            <p className="text-xs font-semibold tracking-widest text-cyan-400 uppercase">
                              {editingObjective
                                ? 'Editando sesión'
                                : 'Detalles de sesión'}
                            </p>
                            {!editingObjective && (
                              <Button
                                size="sm"
                                onClick={() =>
                                  setEditingObjective(selectedObjective)
                                }
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
                            w-full rounded-lg border border-cyan-500/30
                            bg-white/5 px-3 py-2 text-sm text-white
                            transition-colors
                            focus:border-cyan-500 focus:ring-2
                            focus:ring-cyan-500/30 focus:outline-none
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
                            focus:border-cyan-500 focus:ring-2
                            focus:ring-cyan-500/30 focus:outline-none
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
                            w-full rounded-lg border border-cyan-500/30
                            bg-white/5 px-3 py-2 text-sm text-white
                            transition-colors
                            focus:border-cyan-500 focus:ring-2
                            focus:ring-cyan-500/30 focus:outline-none
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
                                    if (selectedObjective.id === 0) {
                                      // Era una sesión nueva sin guardar: volvemos a la lista
                                      handleBackToSessions();
                                      return;
                                    }
                                    setEditingObjective(null);
                                    setObjectiveFormData({
                                      title: selectedObjective.title,
                                      description:
                                        selectedObjective.description ?? '',
                                      duration: selectedObjective.duration,
                                    });
                                  }}
                                  className="border-white/20 text-white/70 hover:bg-white/10"
                                >
                                  Cancelar
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Sub-tab: Actividades */}
                      {sessionDetailTab === 'actividades' &&
                        selectedObjective.id !== 0 && (
                          <div className="animate-in fade-in duration-300">
                            <p className="mb-4 text-xs font-semibold tracking-widest text-cyan-400 uppercase">
                              Actividades de esta sesión
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
                                    ? new Date(activity.endDate)
                                        .toISOString()
                                        .split('T')[0]
                                    : '',
                                  porcentaje: activity.porcentaje ?? 0,
                                  fechaMaximaEntrega:
                                    activity.fechaMaximaEntrega
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
                                  {editingActivity.id === 0
                                    ? 'Nueva actividad'
                                    : 'Editar actividad'}
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
                                  border-cyan-500/30 bg-white/5 px-3 py-2
                                  text-sm text-white transition-colors
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
                                            weekNumber: parseInt(
                                              e.target.value
                                            ),
                                          })
                                        }
                                        className="
                                    w-full rounded-lg border
                                    border-cyan-500/30 bg-white/5 px-3 py-2
                                    text-sm text-white transition-colors
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
                                            porcentaje: parseInt(
                                              e.target.value
                                            ),
                                          })
                                        }
                                        className="
                                    w-full rounded-lg border
                                    border-cyan-500/30 bg-white/5 px-3 py-2
                                    text-sm text-white transition-colors
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
                                    w-full rounded-lg border
                                    border-cyan-500/30 bg-white/5 px-3 py-2
                                    text-sm text-white transition-colors
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
                                    w-full rounded-lg border
                                    border-cyan-500/30 bg-white/5 px-3 py-2
                                    text-sm text-white transition-colors
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
                            {!editingActivity && (
                              <Button
                                onClick={() => {
                                  setEditingActivity({
                                    id: 0,
                                    name: '',
                                    description: '',
                                    typeName: '',
                                    weekNumber: 1,
                                    startDate: null,
                                    endDate: null,
                                    porcentaje: 0,
                                    fechaMaximaEntrega: null,
                                  });
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
                                className="mt-4 bg-cyan-500 text-white hover:bg-cyan-600"
                              >
                                + Nueva actividad
                              </Button>
                            )}
                          </div>
                        )}
                    </Card>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <ModalGuidedProjectForm
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        projectId={project.id}
        onSuccess={fetchProject}
      />
    </div>
  );
}
