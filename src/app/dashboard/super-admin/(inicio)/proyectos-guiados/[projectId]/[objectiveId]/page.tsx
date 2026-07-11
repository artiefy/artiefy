'use client';

import { useCallback, useEffect, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { toast } from 'sonner';

import { Badge } from '~/components/educators/ui/badge';
import { Button } from '~/components/educators/ui/button';
import { Card } from '~/components/educators/ui/card';
import { ModalFormGuidedObjective } from '~/components/super-admin/modals/ModalFormGuidedObjective';
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
}

interface Objective {
  id: number;
  title: string;
  description: string | null;
  duration: number;
  orderIndex: number;
  isEnabled: boolean;
  guidedProjectId: number;
  coverImageKey: string | null;
  coverVideoKey: string | null;
}

interface Activity {
  id: number;
  name: string;
  description: string | null;
  typeName: string | null;
  weekNumber: number | null;
  startDate: string | null;
  endDate: string | null;
  porcentaje: number | null;
  fechaMaximaEntrega: string | null;
  revisada: boolean | null;
}

export default function GuidedObjectiveDetailPage({
  params,
}: {
  params: Promise<{ projectId: string; objectiveId: string }>;
}) {
  const [projectId, setProjectId] = useState<string | null>(null);
  const [objectiveId, setObjectiveId] = useState<string | null>(null);

  const [project, setProject] = useState<GuidedProject | null>(null);
  const [objective, setObjective] = useState<Objective | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const router = useRouter();

  useEffect(() => {
    void params.then((p) => {
      setProjectId(p.projectId);
      setObjectiveId(p.objectiveId);
    });
  }, [params]);

  const fetchProject = useCallback(async () => {
    if (!projectId) return;
    try {
      const response = await fetch(`/api/guided-projects?id=${projectId}`);
      if (!response.ok) throw new Error('Error al cargar proyecto');
      const data = (await response.json()) as GuidedProject;
      setProject(data);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar el proyecto');
    }
  }, [projectId]);

  const fetchObjective = useCallback(async () => {
    if (!projectId || !objectiveId) return;
    setLoading(true);
    try {
      const response = await fetch(
        `/api/guided-projects/${projectId}/objectives?id=${objectiveId}`
      );
      if (!response.ok) throw new Error('Error al cargar sesión');
      const data = (await response.json()) as Objective;
      setObjective(data);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar la sesión');
    } finally {
      setLoading(false);
    }
  }, [projectId, objectiveId]);

  const fetchActivities = useCallback(async () => {
    if (!projectId || !objectiveId) return;
    setLoadingActivities(true);
    try {
      const response = await fetch(
        `/api/guided-projects/${projectId}/objectives/${objectiveId}/activities`
      );
      if (!response.ok) throw new Error('Error al cargar actividades');
      const data = (await response.json()) as Activity[];
      setActivities(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar actividades');
      setActivities([]);
    } finally {
      setLoadingActivities(false);
    }
  }, [projectId, objectiveId]);

  useEffect(() => {
    if (projectId && objectiveId) {
      void fetchProject();
      void fetchObjective();
      void fetchActivities();
    }
  }, [projectId, objectiveId, fetchProject, fetchObjective, fetchActivities]);

  const handleToggleEnabled = async () => {
    if (!projectId || !objectiveId || !objective) return;
    try {
      const response = await fetch(
        `/api/guided-projects/${projectId}/objectives?id=${objectiveId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isEnabled: !objective.isEnabled }),
        }
      );
      if (!response.ok) throw new Error('Error al actualizar');
      toast.success(
        objective.isEnabled ? 'Sesión deshabilitada' : 'Sesión habilitada'
      );
      await fetchObjective();
    } catch (error) {
      console.error('Error:', error);
      toast.error('No se pudo actualizar el estado de la sesión');
    }
  };

  const handleDelete = async () => {
    if (!projectId || !objectiveId) return;
    if (!confirm('¿Eliminar esta sesión? Se eliminarán sus actividades.'))
      return;
    try {
      const response = await fetch(
        `/api/guided-projects/${projectId}/objectives?id=${objectiveId}`,
        { method: 'DELETE' }
      );
      if (!response.ok) throw new Error('Error al eliminar');
      toast.success('Sesión eliminada');
      router.push(`/dashboard/super-admin/proyectos-guiados/${projectId}`);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al eliminar la sesión');
    }
  };

  if (loading || !objective) {
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
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-black/50 via-[#1a2d4a]/30 to-black/50" />
      <div className="pointer-events-none absolute inset-0 opacity-20">
        <div className="absolute -top-40 -right-40 size-80 rounded-full bg-green-500 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 size-80 rounded-full bg-purple-500 blur-3xl" />
      </div>

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
            <BreadcrumbLink
              className="text-cyan-400 transition-colors duration-300 hover:text-cyan-300"
              href={`/dashboard/super-admin/proyectos-guiados/${projectId}`}
            >
              {project?.title ?? 'Proyecto'}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink className="text-white/60">
              {objective.title || 'Sesión'}
            </BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Card className="zoom-in relative z-10 mb-10 border-2 border-cyan-500/30 bg-slate-800 p-4 shadow-2xl transition-all duration-500 hover:border-cyan-500/60 hover:shadow-cyan-500/30 sm:p-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold tracking-widest text-cyan-400 uppercase">
              Detalle de sesión
            </p>
            <h1 className="mt-1 text-2xl font-bold text-white md:text-3xl">
              {objective.title || 'Sesión sin título'}
            </h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge
              className={`text-sm ${
                objective.isEnabled
                  ? 'border-green-500/50 bg-green-500/20 text-green-300'
                  : 'border-gray-500/50 bg-gray-500/20 text-gray-300'
              }`}
            >
              {objective.isEnabled ? 'Habilitada' : 'Deshabilitada'}
            </Badge>
            <Button
              size="sm"
              variant="outline"
              onClick={handleToggleEnabled}
              className="border-white/20 text-white/70 hover:bg-white/10"
            >
              {objective.isEnabled ? 'Deshabilitar' : 'Habilitar'}
            </Button>
            <Button
              size="sm"
              onClick={() => setEditModalOpen(true)}
              className="bg-yellow-500 text-white hover:bg-yellow-600"
            >
              ✏️ Editar
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleDelete}
              className="bg-red-500 text-white hover:bg-red-600"
            >
              🗑️ Eliminar
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <p className="text-sm leading-relaxed text-white/80">
              {objective.description || 'Sin descripción'}
            </p>
            <Badge className="border-cyan-500/50 bg-cyan-500/20 text-xs text-cyan-300">
              ⏱ {objective.duration} min
            </Badge>
          </div>

          <div className="space-y-4">
            {objective.coverImageKey && objective.coverImageKey !== 'none' && (
              <div className="aspect-video w-full overflow-hidden rounded-xl border border-cyan-500/30">
                <Image
                  src={`${process.env.NEXT_PUBLIC_AWS_S3_URL}/${objective.coverImageKey}`}
                  alt={objective.title}
                  width={480}
                  height={270}
                  className="size-full object-cover"
                  quality={85}
                />
              </div>
            )}
            {objective.coverVideoKey && objective.coverVideoKey !== 'none' && (
              <div className="aspect-video w-full overflow-hidden rounded-xl border border-cyan-500/30">
                <video
                  controls
                  className="size-full object-cover"
                  aria-label={`Video de ${objective.title}`}
                >
                  <source
                    src={`${process.env.NEXT_PUBLIC_AWS_S3_URL}/${objective.coverVideoKey}`}
                    type="video/mp4"
                  />
                  Tu navegador no soporta la reproducción de videos.
                </video>
              </div>
            )}
          </div>
        </div>
      </Card>

      <div className="relative z-10 mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold text-white">
          Actividades{' '}
          <span className="ml-2 inline-block rounded-full bg-cyan-500 px-2 py-0.5 text-xs font-bold text-slate-950">
            {activities.length}
          </span>
        </h2>
        <Link
          href={`/dashboard/super-admin/proyectos-guiados/${projectId}/${objectiveId}/actividades`}
        >
          <Button className="bg-cyan-500 text-white hover:bg-cyan-600">
            + Nueva actividad
          </Button>
        </Link>
      </div>

      {loadingActivities ? (
        <div className="relative z-10 flex items-center gap-3 text-white/60">
          <div className="size-5 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
          Cargando actividades...
        </div>
      ) : activities.length === 0 ? (
        <div className="relative z-10 flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-cyan-500/30 bg-slate-800/50 p-16 text-center">
          <span className="text-4xl">🗂️</span>
          <p className="text-sm text-white/50">
            No hay actividades en esta sesión todavía
          </p>
        </div>
      ) : (
        <div className="relative z-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {activities.map((activity) => (
            <Link
              key={activity.id}
              href={`/dashboard/super-admin/proyectos-guiados/${projectId}/${objectiveId}/actividades/${activity.id}`}
              className="
                group relative overflow-hidden rounded-2xl border-2
                border-cyan-500/20 bg-gradient-to-br from-slate-800/90
                via-slate-900/80 to-cyan-950/30 p-5 shadow-lg
                transition-all duration-300
                hover:scale-[1.02] hover:border-cyan-400
                hover:shadow-2xl hover:shadow-cyan-500/20
              "
            >
              <div className="mb-3 flex items-start justify-between gap-2">
                <h3 className="line-clamp-2 text-base font-bold text-white">
                  {activity.name}
                </h3>
                {activity.revisada && (
                  <Badge className="shrink-0 border-green-500/50 bg-green-500/20 text-[10px] text-green-300">
                    Revisada
                  </Badge>
                )}
              </div>
              {activity.description && (
                <p className="mb-4 line-clamp-2 text-xs text-white/60">
                  {activity.description}
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                {activity.typeName && (
                  <Badge className="border-cyan-500/50 bg-cyan-500/20 text-[11px] text-cyan-300">
                    {activity.typeName}
                  </Badge>
                )}
                {activity.weekNumber && (
                  <Badge className="border-white/20 bg-white/5 text-[11px] text-white/70">
                    Semana {activity.weekNumber}
                  </Badge>
                )}
                {activity.porcentaje != null && (
                  <Badge className="border-purple-500/40 bg-purple-500/10 text-[11px] text-purple-300">
                    {activity.porcentaje}%
                  </Badge>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {projectId && objectiveId && (
        <ModalFormGuidedObjective
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          projectId={projectId}
          objectiveId={parseInt(objectiveId)}
          onSuccess={fetchObjective}
        />
      )}
    </div>
  );
}
