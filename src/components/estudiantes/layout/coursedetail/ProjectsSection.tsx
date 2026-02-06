'use client';
import { useEffect, useState } from 'react';

import { Clock } from 'lucide-react';
import {
  FaArrowLeft,
  FaCalendarAlt,
  FaExternalLinkAlt,
  FaFolderOpen,
  FaPlus,
} from 'react-icons/fa';
import { toast } from 'sonner';

import ProjectDetailView from '~/components/estudiantes/projects/ProjectDetailView';
import ModalResumen from '~/components/projects/Modals/ModalResumen';

import type { Project } from '~/types/project';

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
  const [_isCreating, _setIsCreating] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [modalProject, setModalProject] = useState<Project | null>(null);
  const [modalStep, setModalStep] = useState<number | undefined>(undefined);

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
    setModalProject(null);
    setModalStep(1);
    setShowModal(true);
  };

  const handleEnterProject = async (project: Project) => {
    // Mostrar el detalle del proyecto in-place
    setSelectedProject(project);

    try {
      const response = await fetch(`/api/projects/${project.id}?details=true`);
      if (!response.ok) return;
      const data = (await response.json()) as Project;
      setSelectedProject(data);
    } catch (error) {
      console.error('Error al cargar detalle del proyecto:', error);
    }
  };

  const handleBackToList = () => {
    setSelectedProject(null);
  };

  const handleEditSection = (step: number) => {
    if (!selectedProject) return;
    setModalProject(selectedProject);
    setModalStep(step);
    setShowModal(true);
  };

  const applyProjectUpdate = (updated: Record<string, unknown>) => {
    const description =
      typeof updated.description === 'string' ? updated.description : undefined;
    const planteamiento =
      typeof updated.planteamiento === 'string'
        ? updated.planteamiento
        : undefined;
    const justificacion =
      typeof updated.justificacion === 'string'
        ? updated.justificacion
        : undefined;
    const objetivoGeneral =
      typeof updated.objetivo_general === 'string'
        ? updated.objetivo_general
        : undefined;
    const name = typeof updated.name === 'string' ? updated.name : undefined;
    const requirements =
      typeof updated.requirements === 'string'
        ? updated.requirements
        : undefined;
    const typeProject =
      typeof updated.type_project === 'string'
        ? updated.type_project
        : undefined;
    const categoryId =
      typeof updated.categoryId === 'number' ? updated.categoryId : undefined;
    const fechaInicio =
      typeof updated.fechaInicio === 'string' ? updated.fechaInicio : undefined;
    const fechaFin =
      typeof updated.fechaFin === 'string' ? updated.fechaFin : undefined;

    setSelectedProject((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        ...(name !== undefined ? { name } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(planteamiento !== undefined ? { planteamiento } : {}),
        ...(justificacion !== undefined ? { justificacion } : {}),
        ...(objetivoGeneral !== undefined
          ? { objetivo_general: objetivoGeneral }
          : {}),
        ...(requirements !== undefined ? { requirements } : {}),
        ...(typeProject !== undefined ? { type_project: typeProject } : {}),
        ...(categoryId !== undefined ? { categoryId } : {}),
        ...(fechaInicio !== undefined ? { fecha_inicio: fechaInicio } : {}),
        ...(fechaFin !== undefined ? { fecha_fin: fechaFin } : {}),
      };
    });

    setProjects((prev) =>
      prev.map((project) => {
        if (!selectedProject || project.id !== selectedProject.id) {
          return project;
        }
        return {
          ...project,
          ...(name !== undefined ? { name } : {}),
          ...(description !== undefined ? { description } : {}),
          ...(planteamiento !== undefined ? { planteamiento } : {}),
          ...(justificacion !== undefined ? { justificacion } : {}),
          ...(objetivoGeneral !== undefined
            ? { objetivo_general: objetivoGeneral }
            : {}),
          ...(requirements !== undefined ? { requirements } : {}),
          ...(typeProject !== undefined ? { type_project: typeProject } : {}),
          ...(categoryId !== undefined ? { categoryId } : {}),
          ...(fechaInicio !== undefined ? { fecha_inicio: fechaInicio } : {}),
          ...(fechaFin !== undefined ? { fecha_fin: fechaFin } : {}),
        };
      })
    );
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

  // Si hay un proyecto seleccionado, mostrar su detalle
  if (selectedProject) {
    return (
      <>
        <div className="space-y-6">
          {/* Botón volver */}
          <button
            onClick={handleBackToList}
            className="-ml-2 inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium whitespace-nowrap text-muted-foreground ring-offset-background transition-colors hover:bg-accent hover:text-black focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
          >
            <FaArrowLeft className="mr-2 h-4 w-4" />
            Volver a proyectos
          </button>

          {/* Detalle del proyecto */}
          <ProjectDetailView
            project={selectedProject}
            onEditSection={handleEditSection}
          />
        </div>

        {/* Modal siempre disponible en detalle del proyecto */}
        <ModalResumen
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setModalStep(undefined);
            setModalProject(null);
          }}
          initialStep={modalStep}
          titulo={modalProject?.name ?? ''}
          planteamiento={modalProject?.planteamiento ?? ''}
          justificacion={modalProject?.justificacion ?? ''}
          objetivoGen={modalProject?.objetivo_general ?? ''}
          objetivosEsp={[]}
          categoriaId={modalProject?.categoryId}
          courseId={courseId}
          onProjectCreated={() => {
            // Recargar la lista de proyectos
            void fetch(`/api/estudiantes/projects?courseId=${courseId}`)
              .then((res) => res.json())
              .then((data) => {
                setProjects(Array.isArray(data) ? data : []);
                if (onProjectsChange) {
                  onProjectsChange();
                }
              })
              .catch((error) => {
                console.error('Error al recargar proyectos:', error);
              });
          }}
          setObjetivosEsp={() => {}}
          setActividades={() => {}}
          projectId={modalProject?.id}
          coverImageKey={undefined}
          coverVideoKey={undefined}
          tipoProyecto={modalProject?.type_project ?? ''}
          onUpdateProject={applyProjectUpdate}
          fechaInicio=""
          fechaFin=""
          actividades={[]}
          responsablesPorActividad={{}}
          horasPorActividad={{}}
          setHorasPorActividad={() => {}}
          horasPorDiaProyecto={6}
          setHorasPorDiaProyecto={() => {}}
          tiempoEstimadoProyecto={0}
          setTiempoEstimadoProyecto={() => {}}
          onAnterior={() => {}}
          setPlanteamiento={() => {}}
          setJustificacion={() => {}}
          setObjetivoGen={() => {}}
          setObjetivosEspProp={() => {}}
        />
      </>
    );
  }

  // Vista de lista de proyectos
  return (
    <>
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
              <h2 className="text-xl font-semibold text-foreground">
                Proyectos del Curso
              </h2>
              <p className="text-sm text-muted-foreground">
                Crea y gestiona tus proyectos prácticos
              </p>
            </div>
          </div>

          {/* Botón Crear Proyecto */}
          <button
            onClick={handleCreateProject}
            disabled={!isEnrolled || _isCreating}
            style={{ backgroundColor: '#22c4d3', color: '#080c16' }}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium whitespace-nowrap ring-offset-background transition-colors hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"
          >
            <FaPlus className="h-4 w-4" />
            {_isCreating ? 'Creando...' : 'Crear Proyecto'}
          </button>
        </div>

        {/* Lista de proyectos */}
        {projects.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {projects.map((project) => {
              // Calcula el estado del proyecto de forma más rigurosa
              const hasName = !!(project.name && project.name.trim());
              const hasDescription = !!(
                (project.description ?? '').trim() ||
                (project.planteamiento ?? '').trim()
              );
              const hasPlanteamiento = !!(
                project.planteamiento && project.planteamiento.trim()
              );
              const hasJustificacion = !!(
                project.justificacion && project.justificacion.trim()
              );
              const hasObjetivoGeneral = !!(
                project.objetivo_general && project.objetivo_general.trim()
              );
              const hasStartDate = !!project.fecha_inicio;
              const hasEndDate = !!project.fecha_fin;
              const hasRequisitos = (() => {
                if (!project.requirements) return false;
                try {
                  const parsed = JSON.parse(project.requirements) as unknown;
                  return (
                    Array.isArray(parsed) &&
                    parsed.some((item) => item?.trim?.())
                  );
                } catch {
                  return false;
                }
              })();
              const hasObjetivosEspecificos =
                Array.isArray(project.objetivos_especificos) &&
                project.objetivos_especificos.length > 0;
              const hasCronograma = (() => {
                const objectives = project.objetivos_especificos ?? [];
                const objectiveActivities = objectives.flatMap(
                  (obj) => obj.actividades ?? []
                );
                const activities = project.activities ?? [];
                return [...objectiveActivities, ...activities].some(
                  (activity) => activity.startDate && activity.endDate
                );
              })();

              const completedSections = [
                hasName && hasDescription,
                hasPlanteamiento && hasJustificacion,
                hasObjetivoGeneral,
                hasRequisitos,
                hasStartDate && hasEndDate,
                hasObjetivosEspecificos,
                hasCronograma,
              ].filter(Boolean).length;
              const fallbackProgress = Math.round(
                (completedSections / 7) * 100
              );
              const progressPercentage =
                typeof project.progressPercentage === 'number'
                  ? project.progressPercentage
                  : fallbackProgress;

              // Completado solo si TODOS los campos están llenos
              const isProjectComplete =
                hasName &&
                hasPlanteamiento &&
                hasJustificacion &&
                hasObjetivoGeneral &&
                hasStartDate &&
                hasEndDate;

              return (
                <div
                  key={project.id}
                  onClick={() => handleEnterProject(project)}
                  className="group cursor-pointer rounded-xl border border-border/50 bg-card/50 p-5 transition-all duration-200 hover:border-border hover:bg-card/80"
                >
                  {/* Header con título y estado */}
                  <div className="mb-3 flex items-start justify-between">
                    <h3 className="flex-1 pr-3 font-semibold text-foreground transition-colors group-hover:text-[#22c4d3]">
                      {project.name}
                    </h3>
                    {/* Badge de estado: Completado o En progreso */}
                    {isProjectComplete ? (
                      <div className="inline-flex items-center rounded-full border border-green-500/30 bg-green-500/20 px-2.5 py-0.5 text-xs font-semibold text-green-400 transition-colors hover:bg-primary/80 focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-none">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="mr-1 h-3 w-3"
                        >
                          <circle cx="12" cy="12" r="10"></circle>
                          <path d="m9 12 2 2 4-4"></path>
                        </svg>
                        Completado
                      </div>
                    ) : (
                      <div className="inline-flex items-center rounded-full border border-blue-500/30 bg-blue-500/20 px-2.5 py-0.5 text-xs font-semibold text-blue-400 transition-colors focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-none">
                        <Clock className="mr-1 h-3 w-3" />
                        En progreso
                      </div>
                    )}
                  </div>

                  {/* Descripción */}
                  <p className="mb-4 line-clamp-2 text-sm text-muted-foreground">
                    {project.description || project.planteamiento}
                  </p>

                  {/* Barra de progreso */}
                  <div className="mb-4 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Progreso</span>
                      <span
                        className="font-medium"
                        style={{ color: '#22c4d3' }}
                      >
                        {progressPercentage}%
                      </span>
                    </div>
                    <div
                      role="progressbar"
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={progressPercentage}
                      className="relative h-1.5 w-full overflow-hidden rounded-full bg-[#1A2333]"
                    >
                      <div
                        className="h-full flex-1 transition-all"
                        style={{
                          width: `${progressPercentage}%`,
                          backgroundColor: '#22c4d3',
                        }}
                      />
                    </div>
                  </div>

                  {/* Footer con fecha y botón entrar */}
                  <div className="flex items-center justify-between border-t border-border/50 pt-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <FaCalendarAlt className="h-3.5 w-3.5" />
                      <span>{formatDate(project.createdAt)}</span>
                    </div>

                    <div
                      className="flex items-center gap-1 transition-colors group-hover:text-black"
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
            className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/50 py-12"
            style={{ backgroundColor: 'rgba(6, 28, 55, 0.3)' }}
          >
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted/50">
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
                disabled={_isCreating}
                style={{ backgroundColor: '#22c4d3', color: '#080c16' }}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium whitespace-nowrap ring-offset-background transition-colors hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
              >
                <FaPlus className="h-4 w-4" />
                {_isCreating ? 'Creando...' : 'Crear Primer Proyecto'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modal para crear/editar proyectos desde la lista */}
      <ModalResumen
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setModalStep(undefined);
          setModalProject(null);
        }}
        initialStep={modalStep}
        titulo={modalProject?.name ?? ''}
        planteamiento={modalProject?.planteamiento ?? ''}
        justificacion={modalProject?.justificacion ?? ''}
        objetivoGen={modalProject?.objetivo_general ?? ''}
        objetivosEsp={[]}
        categoriaId={modalProject?.categoryId}
        courseId={courseId}
        onProjectCreated={() => {
          // Recargar la lista de proyectos
          void fetch(`/api/estudiantes/projects?courseId=${courseId}`)
            .then((res) => res.json())
            .then((data) => {
              setProjects(Array.isArray(data) ? data : []);
              if (onProjectsChange) {
                onProjectsChange();
              }
            })
            .catch((error) => {
              console.error('Error al recargar proyectos:', error);
            });
        }}
        setObjetivosEsp={() => {}}
        setActividades={() => {}}
        projectId={modalProject?.id}
        coverImageKey={undefined}
        coverVideoKey={undefined}
        tipoProyecto={modalProject?.type_project ?? ''}
        onUpdateProject={applyProjectUpdate}
        fechaInicio=""
        fechaFin=""
        actividades={[]}
        responsablesPorActividad={{}}
        horasPorActividad={{}}
        setHorasPorActividad={() => {}}
        horasPorDiaProyecto={6}
        setHorasPorDiaProyecto={() => {}}
        tiempoEstimadoProyecto={0}
        setTiempoEstimadoProyecto={() => {}}
        onAnterior={() => {}}
        setPlanteamiento={() => {}}
        setJustificacion={() => {}}
        setObjetivoGen={() => {}}
        setObjetivosEspProp={() => {}}
      />
    </>
  );
}
