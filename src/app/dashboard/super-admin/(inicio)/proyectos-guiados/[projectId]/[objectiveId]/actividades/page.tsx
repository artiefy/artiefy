'use client';

import { useCallback, useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';

import { toast } from 'sonner';

import { Button } from '~/components/educators/ui/button';
import { Card } from '~/components/educators/ui/card';
import { ActivitiesList } from '~/components/super-admin/layout/ActivitiesListAdmin';
import { ModalFormGuidedActivity } from '~/components/super-admin/modals/ModalFormGuidedActivity';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '~/components/super-admin/ui/breadcrumb';

interface Objective {
  id: number;
  title: string;
}

interface GuidedProject {
  id: number;
  title: string;
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

export default function GuidedObjectiveActivitiesPage({
  params,
}: {
  params: Promise<{ projectId: string; objectiveId: string }>;
}) {
  const [projectId, setProjectId] = useState<string | null>(null);
  const [objectiveId, setObjectiveId] = useState<string | null>(null);

  const [project, setProject] = useState<GuidedProject | null>(null);
  const [objective, setObjective] = useState<Objective | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingActivityId, setEditingActivityId] = useState<number | null>(
    null
  );
  const [listKey, setListKey] = useState(0);

  const router = useRouter();

  useEffect(() => {
    void params.then((p) => {
      setProjectId(p.projectId);
      setObjectiveId(p.objectiveId);
    });
  }, [params]);

  const fetchContext = useCallback(async () => {
    if (!projectId || !objectiveId) return;
    try {
      const [projectRes, objectiveRes] = await Promise.all([
        fetch(`/api/guided-projects?id=${projectId}`),
        fetch(`/api/guided-projects/${projectId}/objectives?id=${objectiveId}`),
      ]);
      if (projectRes.ok) setProject((await projectRes.json()) as GuidedProject);
      if (objectiveRes.ok)
        setObjective((await objectiveRes.json()) as Objective);
    } catch (error) {
      console.error('Error:', error);
    }
  }, [projectId, objectiveId]);

  useEffect(() => {
    void fetchContext();
  }, [fetchContext]);

  const openCreateModal = () => {
    setEditingActivityId(null);
    setModalOpen(true);
  };

  const openEditModal = (activity: Activity) => {
    setEditingActivityId(activity.id);
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!projectId || !objectiveId) return;
    if (!confirm('¿Eliminar esta actividad?')) return;
    try {
      const response = await fetch(
        `/api/guided-projects/${projectId}/objectives/${objectiveId}/activities?id=${id}`,
        { method: 'DELETE' }
      );
      if (!response.ok) throw new Error('Error al eliminar');
      toast.success('Actividad eliminada');
      setListKey((k) => k + 1);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al eliminar actividad');
    }
  };

  if (!projectId || !objectiveId) {
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
            <BreadcrumbLink
              className="text-cyan-400 transition-colors duration-300 hover:text-cyan-300"
              href={`/dashboard/super-admin/proyectos-guiados/${projectId}/${objectiveId}`}
            >
              {objective?.title ?? 'Sesión'}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink className="text-white/60">
              Actividades
            </BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="relative z-10 mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-white md:text-3xl">
          Actividades de la sesión
        </h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() =>
              router.push(
                `/dashboard/super-admin/proyectos-guiados/${projectId}/${objectiveId}`
              )
            }
            className="border-white/20 text-white/70 hover:bg-white/10"
          >
            ← Volver a la sesión
          </Button>
          <Button
            onClick={openCreateModal}
            className="bg-cyan-500 text-white hover:bg-cyan-600"
          >
            + Nueva actividad
          </Button>
        </div>
      </div>

      <Card className="relative z-10 border-2 border-cyan-500/20 bg-slate-800/60 p-4 shadow-xl sm:p-6">
        <ActivitiesList
          key={listKey}
          projectId={parseInt(projectId)}
          objectiveId={parseInt(objectiveId)}
          onEdit={openEditModal}
          onDelete={handleDelete}
        />
      </Card>

      <ModalFormGuidedActivity
        open={modalOpen}
        onOpenChange={setModalOpen}
        projectId={projectId}
        objectiveId={objectiveId}
        activityId={editingActivityId}
        onSuccess={() => setListKey((k) => k + 1)}
      />
    </div>
  );
}
