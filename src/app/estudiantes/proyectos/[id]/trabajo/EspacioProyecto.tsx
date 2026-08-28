'use client';

import { useEffect, useState } from 'react';

import Link from 'next/link';

import { ArrowLeft } from 'lucide-react';

import ProjectDetailView from '~/components/estudiantes/projects/ProjectDetailView';

import type { Project } from '~/types/project';

/**
 * Espacio de trabajo de un proyecto, con ruta propia.
 *
 * Esta vista solo existía dentro de la página del curso, montada por
 * `ProjectsSection` sobre su estado local. Eso la hacía inalcanzable desde
 * fuera: "Entrar" solo podía dejarte en el curso. Aquí se carga el proyecto
 * por su id y se monta el mismo componente.
 */
export function EspacioProyecto({ projectId }: { projectId: number }) {
  const [project, setProject] = useState<Project | null>(null);
  const [estado, setEstado] = useState<'cargando' | 'listo' | 'error'>(
    'cargando'
  );

  useEffect(() => {
    let cancelado = false;

    const cargar = async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}?details=true`);
        if (!res.ok) {
          if (!cancelado) setEstado('error');
          return;
        }
        const data = (await res.json()) as Project;
        if (cancelado) return;
        setProject(data);
        setEstado('listo');
      } catch {
        if (!cancelado) setEstado('error');
      }
    };

    void cargar();
    return () => {
      cancelado = true;
    };
  }, [projectId]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <Link
        href={`/estudiantes/proyectos/${projectId}`}
        className="
          mb-6 inline-flex items-center gap-2 rounded-lg border
          border-border/50 bg-card/60 px-3 py-2 text-sm text-muted-foreground
          transition-colors
          hover:text-foreground
        "
      >
        <ArrowLeft className="size-4" />
        Volver al proyecto
      </Link>

      {estado === 'cargando' && (
        <p className="text-muted-foreground">Cargando proyecto…</p>
      )}

      {estado === 'error' && (
        <p className="text-muted-foreground">
          No se pudo cargar este proyecto. Puede que no tengas acceso a él.
        </p>
      )}

      {estado === 'listo' && project && <ProjectDetailView project={project} />}
    </div>
  );
}
