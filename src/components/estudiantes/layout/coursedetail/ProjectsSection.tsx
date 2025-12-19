'use client';
import { useEffect, useState } from 'react';

import {
  FaCalendarAlt,
  FaClock,
  FaExternalLinkAlt,
  FaFolderOpen,
  FaPlus,
} from 'react-icons/fa';
import { toast } from 'sonner';

import { cn } from '~/lib/utils';

interface Project {
  id: number;
  name: string;
  planteamiento: string;
  justificacion?: string;
  objetivo_general?: string;
  type_project: string;
  coverImageKey?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ProjectsSectionProps {
  courseId: number;
  isEnrolled: boolean;
  isSubscriptionActive: boolean;
  onProjectsChange?: () => void;
}

export function ProjectsSection({
  courseId,
  isEnrolled,
  isSubscriptionActive,
  onProjectsChange,
}: ProjectsSectionProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  // Cargar proyectos al montar el componente
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(
          `/api/estudiantes/projects?courseId=${courseId}`
        );

        if (!response.ok) {
          throw new Error('Error al cargar proyectos');
        }

        const data = await response.json();
        setProjects(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching projects:', error);
        toast.error('Error al cargar los proyectos');
      } finally {
        setIsLoading(false);
      }
    };

    void fetchProjects();
  }, [courseId]);

  const handleCreateProject = async () => {
    if (!isEnrolled) {
      toast.error('Debes estar inscrito en el curso para crear proyectos');
      return;
    }

    try {
      setIsCreating(true);
      const response = await fetch('/api/estudiantes/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseId,
          name: `Proyecto ${projects.length + 1}`,
          planteamiento: 'Define el planteamiento de tu proyecto aquí...',
          type_project: 'individual',
        }),
      });

      if (!response.ok) {
        throw new Error('Error al crear proyecto');
      }

      const data = await response.json();
      setProjects((prev) => [data.project, ...prev]);
      toast.success('Proyecto creado exitosamente');

      // Notificar al componente padre que los proyectos cambiaron
      onProjectsChange?.();
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('Error al crear el proyecto');
    } finally {
      setIsCreating(false);
    }
  };

  const handleEnterProject = (projectId: number) => {
    // TODO: Implementar navegación al proyecto
    console.log('Entrar al proyecto:', projectId);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Cargando proyectos...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con título e icono */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{ backgroundColor: 'rgba(34, 196, 211, 0.2)' }}
          >
            <FaFolderOpen className="h-5 w-5" style={{ color: '#22c4d3' }} />
          </div>
          <div>
            <h2 className="text-foreground text-xl font-semibold">
              Proyectos del Curso
            </h2>
            <p className="text-muted-foreground text-sm">
              Crea y gestiona tus proyectos prácticos
            </p>
          </div>
        </div>

        {/* Botón Crear Proyecto */}
        <button
          onClick={handleCreateProject}
          disabled={!isEnrolled || isCreating}
          style={{ backgroundColor: '#22c4d3', color: '#080c16' }}
          className="ring-offset-background focus-visible:ring-ring inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors hover:opacity-90 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"
        >
          <FaPlus className="h-4 w-4" />
          {isCreating ? 'Creando...' : 'Crear Proyecto'}
        </button>
      </div>

      {/* Lista de proyectos */}
      {projects.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {projects.map((project) => {
            return (
              <div
                key={project.id}
                onClick={() => handleEnterProject(project.id)}
                className="group border-border/50 bg-card/50 hover:border-border hover:bg-card/80 cursor-pointer rounded-xl border p-5 transition-all duration-200"
              >
                {/* Header con título y tipo */}
                <div className="mb-3 flex items-start justify-between">
                  <h3 className="text-foreground flex-1 pr-3 font-semibold transition-colors group-hover:text-[#22c4d3]">
                    {project.name}
                  </h3>
                  <div
                    className={cn(
                      'focus:ring-ring hover:bg-primary/80 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:ring-2 focus:ring-offset-2 focus:outline-none',
                      'border-blue-500/30 bg-blue-500/20 text-blue-400'
                    )}
                  >
                    <FaClock className="mr-1 h-3 w-3" />
                    {project.type_project}
                  </div>
                </div>

                {/* Descripción */}
                <p className="text-muted-foreground mb-4 line-clamp-2 text-sm">
                  {project.planteamiento}
                </p>

                {/* Footer con fecha y botón entrar */}
                <div className="border-border/50 text-muted-foreground flex items-center justify-between border-t pt-3 text-xs">
                  <div className="flex items-center gap-1.5">
                    <FaCalendarAlt className="h-3.5 w-3.5" />
                    <span>{formatDate(project.createdAt)}</span>
                  </div>

                  <div
                    className="flex items-center gap-1 transition-transform group-hover:translate-x-0.5"
                    style={{ color: '#22c4d3' }}
                  >
                    <span>Entrar</span>
                    <FaExternalLinkAlt className="h-3.5 w-3.5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Mensaje cuando no hay proyectos */
        <div
          className="border-border/50 flex flex-col items-center justify-center rounded-xl border border-dashed py-12"
          style={{ backgroundColor: 'rgba(6, 28, 55, 0.3)' }}
        >
          <div className="bg-muted/50 mb-4 flex h-16 w-16 items-center justify-center rounded-full">
            <FaFolderOpen className="h-8 w-8 text-black" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-slate-100">
            No hay proyectos creados
          </h3>
          <p className="mb-6 text-center text-sm text-slate-300">
            {isEnrolled
              ? 'Comienza creando tu primer proyecto práctico para este curso.'
              : 'Debes estar inscrito en el curso para crear proyectos.'}
          </p>
          {isEnrolled && (
            <button
              onClick={handleCreateProject}
              disabled={isCreating}
              style={{ backgroundColor: '#22c4d3', color: '#080c16' }}
              className="ring-offset-background focus-visible:ring-ring inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors hover:opacity-90 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
            >
              <FaPlus className="h-4 w-4" />
              {isCreating ? 'Creando...' : 'Crear Primer Proyecto'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
