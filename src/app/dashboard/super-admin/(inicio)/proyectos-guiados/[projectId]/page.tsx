'use client';

import { useCallback, useEffect, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { toast } from 'sonner';

import { Badge } from '~/components/educators/ui/badge';
import { Button } from '~/components/educators/ui/button';
import { Card, CardHeader, CardTitle } from '~/components/educators/ui/card';
import { ModalFormGuidedObjective } from '~/components/super-admin/modals/ModalFormGuidedObjective';
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
  coverVideoKey?: string | null;
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

const predefinedColors = ['#1f2937', '#000000', '#FFFFFF'];

export default function GuidedProjectDetailPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const [projectId, setProjectId] = useState<string | null>(null);
  const [project, setProject] = useState<GuidedProject | null>(null);
  const [selectedColor, setSelectedColor] = useState<string>('#FFFFFF');
  const [editModalOpen, setEditModalOpen] = useState(false);

  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [loadingObjectives, setLoadingObjectives] = useState(false);

  const [newSessionModalOpen, setNewSessionModalOpen] = useState(false);

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

              {project.coverVideoKey && project.coverVideoKey !== 'none' && (
                <div className="aspect-video w-full overflow-hidden rounded-xl border border-cyan-500/30">
                  <video
                    controls
                    className="size-full object-cover"
                    aria-label={`Video de ${project.title}`}
                  >
                    <source
                      src={`${process.env.NEXT_PUBLIC_AWS_S3_URL}/${project.coverVideoKey}`}
                      type="video/mp4"
                    />
                    Tu navegador no soporta la reproducción de videos.
                  </video>
                </div>
              )}

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
      {/* SESIONES DEL PROYECTO */}
      {/* ============================ */}
      <div
        className="
          relative z-10 -mx-1 mt-16 space-y-8 px-1
          md:-mx-3 md:px-3
        "
      >
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl font-bold text-white">
              Sesiones del proyecto{' '}
              <span className="ml-2 inline-block rounded-full bg-cyan-500 px-2 py-0.5 text-xs font-bold text-slate-950">
                {objectives.length}
              </span>
            </h2>
            <Button
              onClick={() => setNewSessionModalOpen(true)}
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
                <Link
                  key={objective.id}
                  href={`/dashboard/super-admin/proyectos-guiados/${projectId}/${objective.id}`}
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
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-cyan-500/30 text-sm font-bold text-cyan-300">
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
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <ModalGuidedProjectForm
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        projectId={project.id}
        onSuccess={fetchProject}
      />

      <ModalFormGuidedObjective
        open={newSessionModalOpen}
        onOpenChange={setNewSessionModalOpen}
        projectId={project.id}
        orderIndex={objectives.length}
        onSuccess={fetchObjectives}
      />
    </div>
  );
}
