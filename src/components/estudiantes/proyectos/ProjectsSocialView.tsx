'use client';

import { useMemo, useState } from 'react';

import { Search, SlidersHorizontal } from 'lucide-react';

import ModalResumen from '~/components/projects/Modals/ModalResumen';

import { ProjectFeedCard } from './subcomponents/ProjectFeedCard';
import {
  ProjectsLeftRail,
  type SocialView,
} from './subcomponents/ProjectsLeftRail';
import { ProjectsRightRail } from './subcomponents/ProjectsRightRail';
import { ProjectWorkspaceCard } from './subcomponents/ProjectWorkspaceCard';

import type { ProjectSocialCollaborator, ProjectSocialItem } from './types';

interface ProjectsSocialViewProps {
  exploreItems: ProjectSocialItem[];
  myItems: ProjectSocialItem[];
  collaborationItems: ProjectSocialItem[];
  collaboratorItems: ProjectSocialCollaborator[];
}

const stageFilters: Array<ProjectSocialItem['stage']> = [
  'Idea',
  'MVP',
  'En progreso',
  'Lanzado',
];

const parseUpdatedBoolean = (value: unknown) =>
  typeof value === 'boolean' ? value : undefined;

const parseUpdatedString = (value: unknown) =>
  typeof value === 'string' ? value : undefined;

const parseUpdatedNumber = (value: unknown) =>
  typeof value === 'number' ? value : undefined;

const toCoverImageUrl = (coverImageKey?: string) => {
  if (!coverImageKey) return undefined;
  if (coverImageKey.startsWith('http')) {
    return `/api/image-proxy?url=${encodeURIComponent(coverImageKey)}`;
  }
  if (coverImageKey.startsWith('/')) return coverImageKey;
  if (!process.env.NEXT_PUBLIC_AWS_S3_URL) return undefined;
  const source = `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${coverImageKey}`;
  return `/api/image-proxy?url=${encodeURIComponent(source)}`;
};

const getPublishHref = (item: ProjectSocialItem) => {
  if (item.courseId) {
    return `/estudiantes/cursos/${item.courseId}?projectId=${item.id}&view=projects`;
  }
  return `/estudiantes/proyectos/${item.id}`;
};

export function ProjectsSocialView({
  exploreItems,
  myItems,
  collaborationItems,
  collaboratorItems,
}: ProjectsSocialViewProps) {
  const [query, setQuery] = useState('');
  const [activeStage, setActiveStage] = useState<string>('all');
  const [needsCollaboratorsFilter, setNeedsCollaboratorsFilter] =
    useState(false);
  const [activeView, setActiveView] = useState<SocialView>('explorar');

  const [localExploreItems, setLocalExploreItems] = useState(exploreItems);
  const [localMyItems, setLocalMyItems] = useState(myItems);
  const [localCollaborationItems, setLocalCollaborationItems] =
    useState(collaborationItems);

  const [editingProject, setEditingProject] =
    useState<ProjectSocialItem | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const activeItems = useMemo(() => {
    if (activeView === 'mis') return localMyItems;
    if (activeView === 'colabs') return localCollaborationItems;
    return localExploreItems;
  }, [activeView, localCollaborationItems, localExploreItems, localMyItems]);

  const filteredItems = useMemo(() => {
    return activeItems.filter((item) => {
      const normalizedQuery = query.toLowerCase().trim();
      const matchesQuery =
        normalizedQuery.length === 0 ||
        item.title.toLowerCase().includes(normalizedQuery) ||
        item.description.toLowerCase().includes(normalizedQuery) ||
        item.author.name.toLowerCase().includes(normalizedQuery) ||
        item.category.name.toLowerCase().includes(normalizedQuery);

      const matchesStage = activeStage === 'all' || item.stage === activeStage;
      const matchesCollaborators = needsCollaboratorsFilter
        ? item.needsCollaborators
        : true;

      return matchesQuery && matchesStage && matchesCollaborators;
    });
  }, [activeItems, activeStage, needsCollaboratorsFilter, query]);

  const collaboratorsCount = localCollaborationItems.length;

  const currentSectionTitle =
    activeView === 'mis'
      ? `Mis proyectos (${filteredItems.length})`
      : activeView === 'colabs'
        ? `Mis colaboraciones (${filteredItems.length})`
        : '';

  const handleEditProject = (item: ProjectSocialItem) => {
    setEditingProject(item);
    setIsEditModalOpen(true);
  };

  const updateInCollection = (
    collection: ProjectSocialItem[],
    projectId: number,
    updated: Record<string, unknown>
  ) =>
    collection.map((item) => {
      if (item.id !== projectId) return item;

      const updatedTitle = parseUpdatedString(updated.name);
      const updatedDescription = parseUpdatedString(updated.description);
      const updatedPlanteamiento = parseUpdatedString(updated.planteamiento);
      const updatedJustificacion = parseUpdatedString(updated.justificacion);
      const updatedObjective = parseUpdatedString(updated.objetivo_general);
      const updatedIsPublic = parseUpdatedBoolean(updated.isPublic);
      const updatedNeedsCollaborators = parseUpdatedBoolean(
        updated.needsCollaborators
      );
      const updatedCategoryId = parseUpdatedNumber(updated.categoryId);
      const updatedTypeProject = parseUpdatedString(updated.type_project);
      const updatedFechaInicio = parseUpdatedString(updated.fechaInicio);
      const updatedFechaFin = parseUpdatedString(updated.fechaFin);
      const updatedRequirements = parseUpdatedString(updated.requirements);
      const updatedCoverImageKey = parseUpdatedString(updated.coverImageKey);

      return {
        ...item,
        title: updatedTitle ?? item.title,
        description:
          updatedDescription ??
          updatedPlanteamiento ??
          updatedJustificacion ??
          item.description,
        planteamiento: updatedPlanteamiento ?? item.planteamiento,
        justificacion: updatedJustificacion ?? item.justificacion,
        objetivoGeneral: updatedObjective ?? item.objetivoGeneral,
        isPublic: updatedIsPublic ?? item.isPublic,
        needsCollaborators:
          updatedNeedsCollaborators ?? item.needsCollaborators,
        categoryId: updatedCategoryId ?? item.categoryId,
        typeProject: updatedTypeProject ?? item.typeProject,
        fechaInicio: updatedFechaInicio ?? item.fechaInicio,
        fechaFin: updatedFechaFin ?? item.fechaFin,
        requirements: updatedRequirements ?? item.requirements,
        coverImageKey: updatedCoverImageKey ?? item.coverImageKey,
        coverImageUrl:
          updatedCoverImageKey != null
            ? toCoverImageUrl(updatedCoverImageKey)
            : item.coverImageUrl,
      };
    });

  const handleProjectUpdate = (updatedProject: Record<string, unknown>) => {
    if (!editingProject) return;

    setLocalExploreItems((prev) =>
      updateInCollection(prev, editingProject.id, updatedProject)
    );
    setLocalMyItems((prev) =>
      updateInCollection(prev, editingProject.id, updatedProject)
    );
    setLocalCollaborationItems((prev) =>
      updateInCollection(prev, editingProject.id, updatedProject)
    );
  };

  return (
    <div
      className={`
      relative min-h-screen overflow-hidden bg-background pb-24
      lg:pb-0
    `}
    >
      <div className="pointer-events-none fixed inset-0">
        <div
          className={`
          absolute top-0 left-1/4 size-96 rounded-full bg-primary/5 blur-[120px]
        `}
        />
        <div
          className={`
          absolute right-1/4 bottom-1/4 size-80 rounded-full bg-cyan-500/5
          blur-[100px]
        `}
        />
        <div
          className={`
          absolute top-1/2 left-1/2 size-[600px] -translate-1/2 rounded-full
          bg-primary/5 blur-[150px]
        `}
        />
      </div>

      <main
        className={`
        relative px-4 pt-10 pb-12
        sm:px-6
      `}
      >
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 text-center">
            <h1
              className={`
              text-3xl font-bold
              sm:text-4xl
            `}
            >
              <span className="text-foreground">Descubre </span>
              <span
                className={`
                animate-[shimmerGradient_3s_linear_infinite] bg-gradient-to-r
                from-primary via-cyan-400 to-primary bg-[length:200%_100%]
                bg-clip-text text-transparent
              `}
              >
                Proyectos
              </span>
              <span className="ml-2 text-2xl">✨</span>
            </h1>
            <p className="mt-2 text-muted-foreground">
              Explora, colabora e impulsa ideas innovadoras de la comunidad
              Artiefy
            </p>
          </div>

          <div className="flex gap-6">
            <ProjectsLeftRail
              total={localMyItems.length}
              collaborators={collaboratorsCount}
              activeView={activeView}
              onChangeView={setActiveView}
            />

            <div className="min-w-0 flex-1">
              <div className="mb-6 space-y-4">
                <div className="relative">
                  <Search
                    className={`
                    absolute top-1/2 left-4 size-5 -translate-y-1/2
                    text-muted-foreground
                  `}
                  />
                  <input
                    type="text"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Busca proyectos, categorías o personas..."
                    className={`
                      w-full rounded-xl bg-[#1A2333] py-3 pr-4 pl-12 text-sm
                      text-foreground
                      placeholder:text-muted-foreground
                      focus:ring-2 focus:ring-primary/50 focus:outline-none
                    `}
                  />
                </div>

                <div
                  className={`
                  hidden flex-wrap items-center gap-2
                  lg:flex
                `}
                >
                  <button
                    type="button"
                    onClick={() => setActiveStage('all')}
                    className={`
                      rounded-lg px-3 py-1.5 text-xs font-medium
                      transition-colors
                      ${
                        activeStage === 'all'
                          ? 'bg-primary text-primary-foreground'
                          : `
                          bg-[#1A2333] text-muted-foreground
                          hover:text-foreground
                        `
                      }
                    `}
                  >
                    Todos
                  </button>
                  {stageFilters.map((stage) => (
                    <button
                      key={stage}
                      type="button"
                      onClick={() => setActiveStage(stage)}
                      className={`
                        rounded-lg px-3 py-1.5 text-xs font-medium
                        transition-colors
                        ${
                          activeStage === stage
                            ? 'bg-primary text-primary-foreground'
                            : `
                            bg-[#1A2333] text-muted-foreground
                            hover:text-foreground
                          `
                        }
                      `}
                    >
                      {stage}
                    </button>
                  ))}
                  <div className="mx-1 h-4 w-px bg-border" />
                  <button
                    type="button"
                    onClick={() =>
                      setNeedsCollaboratorsFilter((current) => !current)
                    }
                    className={`
                      rounded-lg px-3 py-1.5 text-xs font-medium
                      transition-colors
                      ${
                        needsCollaboratorsFilter
                          ? 'bg-primary text-primary-foreground'
                          : `
                          bg-[#1A2333] text-muted-foreground
                          hover:text-foreground
                        `
                      }
                    `}
                  >
                    🤝 Colaboradores
                  </button>
                </div>

                <div className="lg:hidden">
                  <button
                    type="button"
                    className={`
                      flex items-center gap-2 rounded-xl bg-[#1A2333] px-4 py-2
                      text-sm text-muted-foreground transition-colors
                      hover:text-foreground
                    `}
                  >
                    <SlidersHorizontal className="size-4" />
                    Filtros
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {activeView !== 'explorar' ? (
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-foreground">
                      {currentSectionTitle}
                    </h2>
                  </div>
                ) : null}

                {filteredItems.length > 0 ? (
                  filteredItems.map((item) =>
                    activeView === 'explorar' ? (
                      <ProjectFeedCard key={item.id} item={item} />
                    ) : (
                      <ProjectWorkspaceCard
                        key={item.id}
                        item={item}
                        onEdit={handleEditProject}
                        publishHref={getPublishHref(item)}
                      />
                    )
                  )
                ) : (
                  <div
                    className={`
                    rounded-2xl border border-border/50 bg-card/50 p-8
                    text-center
                  `}
                  >
                    <p className="text-sm text-muted-foreground">
                      No encontramos proyectos con esos filtros.
                    </p>
                  </div>
                )}

                {activeView === 'explorar' && filteredItems.length > 0 ? (
                  <button
                    type="button"
                    className={`
                      group relative w-full overflow-hidden rounded-xl py-3.5
                      font-semibold transition-all duration-300
                      hover:scale-[1.01]
                      hover:shadow-[0_0_30px_hsl(185_72%_48%/0.28)]
                    `}
                  >
                    <span
                      className={`
                      absolute inset-0 bg-gradient-to-r from-[#1A2333]
                      via-primary/20 to-[#1A2333]
                    `}
                    />
                    <span className="relative text-foreground">
                      Cargar más proyectos <span>⚡</span>
                    </span>
                  </button>
                ) : null}
              </div>
            </div>

            <ProjectsRightRail
              trending={localExploreItems}
              collaborators={collaboratorItems}
            />
          </div>
        </div>
      </main>

      <nav
        className={`
        fixed right-0 bottom-0 left-0 z-50
        lg:hidden
      `}
      >
        <div
          className={`
          absolute inset-0 border-t border-border/50 bg-background/80
          backdrop-blur-xl
        `}
        />
        <div className="relative flex items-center justify-around p-2">
          <button
            type="button"
            onClick={() => setActiveView('explorar')}
            className={`
              relative flex flex-col items-center gap-1 rounded-xl px-4 py-2
              ${
                activeView === 'explorar'
                  ? 'text-[#080c16]'
                  : 'text-muted-foreground'
              }
            `}
          >
            <span
              className={`
                rounded-xl p-2
                ${
                  activeView === 'explorar'
                    ? 'bg-primary/20 shadow-[0_0_15px_hsl(185_72%_48%/0.3)]'
                    : ''
                }
              `}
            >
              🔥
            </span>
            <span className="text-xs font-medium">Explorar</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveView('mis')}
            className={`
              flex flex-col items-center gap-1 rounded-xl px-4 py-2
              ${activeView === 'mis' ? 'text-primary' : 'text-muted-foreground'}
            `}
          >
            <span className="rounded-xl p-2">📁</span>
            <span className="text-xs font-medium">Proyectos</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveView('mis')}
            className="relative -mt-6 flex flex-col items-center gap-1"
          >
            <span
              className={`
              rounded-2xl bg-gradient-to-r from-primary to-cyan-500 p-3
              shadow-[0_0_25px_hsl(185_72%_48%/0.5)]
            `}
            >
              ➕
            </span>
            <span className="text-xs font-medium text-[#080c16]">Crear</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveView('colabs')}
            className={`
              flex flex-col items-center gap-1 rounded-xl px-4 py-2
              ${
                activeView === 'colabs'
                  ? 'text-primary'
                  : 'text-muted-foreground'
              }
            `}
          >
            <span className="rounded-xl p-2">👥</span>
            <span className="text-xs font-medium">Colabs</span>
          </button>
        </div>
      </nav>

      <ModalResumen
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingProject(null);
        }}
        titulo={editingProject?.title ?? ''}
        description={editingProject?.description ?? ''}
        planteamiento={
          editingProject?.planteamiento ?? editingProject?.description ?? ''
        }
        justificacion={editingProject?.justificacion ?? ''}
        objetivoGen={editingProject?.objetivoGeneral ?? ''}
        objetivosEsp={[]}
        categoriaId={editingProject?.categoryId}
        tipoProyecto={editingProject?.typeProject ?? ''}
        projectId={editingProject?.id}
        coverImageKey={editingProject?.coverImageKey ?? undefined}
        coverVideoKey={editingProject?.coverVideoKey ?? undefined}
        courseId={editingProject?.courseId ?? undefined}
        onProjectCreated={() => {
          window.location.reload();
        }}
        setObjetivosEsp={() => {}}
        setActividades={() => {}}
        onUpdateProject={handleProjectUpdate}
        fechaInicio={editingProject?.fechaInicio ?? ''}
        fechaFin={editingProject?.fechaFin ?? ''}
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

      <style jsx global>{`
        @keyframes shimmerGradient {
          0% {
            background-position: 100% 0;
          }
          100% {
            background-position: -100% 0;
          }
        }
      `}</style>
    </div>
  );
}
