'use client';

import { useEffect, useRef, useState } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useUser } from '@clerk/nextjs';
import {
  ChevronRight,
  Compass,
  Folder,
  Globe,
  GraduationCap,
  LayoutTemplate,
  Plus,
  Search,
  ShoppingBag,
  Users,
  X,
} from 'lucide-react';

import ModalResumen from '~/components/projects/Modals/ModalResumen';
import {
  type ProjectAiSeed,
  ProjectModeChooser,
} from '~/components/projects/Modals/ProjectModeChooser';
import { openCoachChatForNewProject } from '~/lib/agents/agentChatBus';
import {
  consumePendingCreateEntry,
  consumePendingCreateIdea,
  subscribeToCreateEntry,
} from '~/lib/creation/createEntryBus';
import { ensureCanCreateProject } from '~/lib/projects/ensureCanCreateProject';
import { generateProjectFromIdea } from '~/lib/projects/generateProjectFromIdea';

import { ArtieIdeaComposer } from './ArtieIdeaComposer';
import { IdeaSuggestions } from './IdeaSuggestions';
import { ProjectHomeCard } from './ProjectHomeCard';

import type { ProjectSocialItem } from '../types';

type HomeTab = 'mine' | 'shared' | 'templates';

const PROJECT_TEMPLATES = [
  {
    id: 'home-products',
    title: 'Vender productos hechos en casa por redes sociales',
    icon: ShoppingBag,
  },
  {
    id: 'ai-websites',
    title: 'Crear sitios web con IA para emprendedores',
    icon: Globe,
  },
  {
    id: 'virtual-tutoring',
    title: 'Dar tutorías virtuales',
    icon: GraduationCap,
  },
] as const;

const TABS: { id: HomeTab; label: string; icon: typeof Folder }[] = [
  { id: 'mine', label: 'Mis Proyectos', icon: Folder },
  { id: 'shared', label: 'Compartidos', icon: Users },
  { id: 'templates', label: 'Plantillas de proyectos', icon: LayoutTemplate },
];

const SIGN_IN_HREF = '/sign-in?redirect_url=%2Fproyectos';

const normalize = (value: string) =>
  value.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

const matchesQuery = (query: string, ...fields: (string | undefined)[]) =>
  !query || fields.some((field) => normalize(field ?? '').includes(query));

interface ProjectsHomeViewProps {
  ownItems: ProjectSocialItem[];
  collaborationItems: ProjectSocialItem[];
}

/**
 * `/proyectos`: where a learner starts a project with Artie and finds the
 * ones they own or collaborate on. The community feed lives on `/explorar`.
 */
export function ProjectsHomeView({
  ownItems,
  collaborationItems,
}: ProjectsHomeViewProps) {
  const router = useRouter();
  const { user, isLoaded, isSignedIn } = useUser();
  const firstName = user?.firstName?.trim();

  // The composer's text lives here so the examples below it can fill it.
  const [idea, setIdea] = useState('');
  const composerRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<HomeTab>('mine');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // "Nuevo proyecto" and "Usar plantilla" open the mode chooser; its
  // "Modo avanzado" opens the full wizard.
  const [isModeChooserOpen, setIsModeChooserOpen] = useState(false);
  const [chooserSeed, setChooserSeed] = useState({ key: 0, idea: '' });
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const openModeChooser = (idea = '') => {
    if (isLoaded && !isSignedIn) {
      router.push(SIGN_IN_HREF);
      return;
    }
    void ensureCanCreateProject().then((allowed) => {
      if (!allowed) return;
      setChooserSeed((prev) => ({ key: prev.key + 1, idea }));
      setIsModeChooserOpen(true);
    });
  };

  // The header search's "Modo avanzado" and the mobile "+ Proyecto" land
  // here through the creation bus; posts are handled on `/explorar`.
  useEffect(() => {
    const open = () => {
      const idea = consumePendingCreateIdea();
      void ensureCanCreateProject().then((allowed) => {
        if (!allowed) return;
        setChooserSeed((prev) => ({ key: prev.key + 1, idea }));
        setIsModeChooserOpen(true);
      });
    };

    if (consumePendingCreateEntry(['project']) === 'project') open();
    return subscribeToCreateEntry(open, ['project']);
  }, []);

  // Runs outside this component: it keeps going if the learner navigates
  // away, and the Coach opens on the project once it is saved.
  const generateProject = (seed: ProjectAiSeed) => {
    void generateProjectFromIdea({ seed, onCreated: () => router.refresh() });
  };

  const handleComposerSubmit = (seed: ProjectAiSeed) => {
    if (isLoaded && !isSignedIn) {
      router.push(SIGN_IN_HREF);
      return;
    }
    generateProject(seed);
  };

  const toggleSearch = () => {
    if (isSearchOpen) {
      setIsSearchOpen(false);
      setSearchQuery('');
      return;
    }
    setIsSearchOpen(true);
    requestAnimationFrame(() => searchInputRef.current?.focus());
  };

  const query = normalize(searchQuery.trim());
  const visibleProjects = (
    activeTab === 'shared' ? collaborationItems : ownItems
  ).filter((item) => matchesQuery(query, item.title, item.description));
  const visibleTemplates = PROJECT_TEMPLATES.filter((template) =>
    matchesQuery(query, template.title)
  );

  const sectionTitle =
    activeTab === 'templates'
      ? `Plantillas de proyectos (${visibleTemplates.length})`
      : activeTab === 'shared'
        ? `Mis colaboraciones (${visibleProjects.length})`
        : `Mis proyectos (${visibleProjects.length})`;

  const emptyMessage = query
    ? `No encontramos resultados para "${searchQuery.trim()}".`
    : activeTab === 'shared'
      ? 'Todavía no colaboras en ningún proyecto.'
      : 'Aún no tienes proyectos. Cuéntale tu idea a Artie para crear el primero.';

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div aria-hidden="true" className="pointer-events-none fixed inset-0">
        <div className="absolute top-0 left-1/4 size-96 rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute right-1/4 bottom-1/4 size-80 rounded-full bg-purple-500/5 blur-[100px]" />
      </div>

      <main className="relative pt-32 pb-12 sm:pt-36">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="mb-6 text-2xl font-bold text-foreground sm:text-3xl">
              ¿Tienes una idea o problema que resolver
              {firstName ? (
                <>
                  , <span className="text-primary">{firstName}</span>
                </>
              ) : null}
              ?
            </h1>
            <div ref={composerRef}>
              <ArtieIdeaComposer
                idea={idea}
                onIdeaChange={setIdea}
                onSubmit={handleComposerSubmit}
              />
            </div>
            <IdeaSuggestions
              label="Hazlo con IA:"
              onPick={(example) => {
                setIdea(example);
                composerRef.current
                  ?.querySelector<HTMLInputElement>('input:not([type="file"])')
                  ?.focus();
              }}
              className="mt-3"
            />
            <p className="mt-2 text-[11px] text-muted-foreground/80">
              Artie es una IA y puede cometer errores.
            </p>
          </div>

          <div className="mt-20 mb-8">
            <nav
              aria-label="Vistas de proyectos"
              className="flex flex-wrap items-center gap-1.5"
            >
              <div
                className={`
                  flex items-center gap-2 overflow-hidden rounded-full px-4 py-2
                  whitespace-nowrap ring-1 transition-[width,background-color,box-shadow]
                  duration-300 ease-out
                  ring-inset
                  ${
                    isSearchOpen
                      ? 'w-[240px] bg-white/[0.08] ring-primary/40'
                      : 'w-[100px] bg-white/[0.04] ring-white/10 hover:ring-white/20'
                  }
                `}
              >
                <Search
                  className={`
                    size-4 shrink-0 transition-colors
                    ${isSearchOpen ? 'text-primary' : 'text-muted-foreground'}
                  `}
                />
                {isSearchOpen ? (
                  <>
                    <input
                      ref={searchInputRef}
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Escape') toggleSearch();
                      }}
                      placeholder="Buscar proyectos"
                      aria-label="Buscar proyectos"
                      className="
                        min-w-0 flex-1 bg-transparent text-xs text-foreground
                        placeholder:text-muted-foreground
                        focus:outline-none
                      "
                    />
                    <button
                      type="button"
                      onClick={toggleSearch}
                      aria-label="Cerrar búsqueda"
                      className="
                        shrink-0 text-muted-foreground transition-colors
                        hover:text-foreground
                      "
                    >
                      <X className="size-3.5" />
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    aria-expanded={false}
                    onClick={toggleSearch}
                    className="
                      min-w-0 flex-1 text-left text-xs font-medium
                      text-muted-foreground transition-colors
                      hover:text-foreground
                    "
                  >
                    Buscar
                  </button>
                )}
              </div>

              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    aria-current={isActive ? 'page' : undefined}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      inline-flex items-center gap-2 rounded-full px-4 py-2
                      text-xs font-medium ring-1 transition-colors duration-200
                      ring-inset
                      ${
                        isActive
                          ? 'bg-primary text-slate-950 shadow-[0_0_20px_hsl(185_72%_48%/0.35)] ring-primary/60'
                          : 'bg-white/[0.04] text-muted-foreground ring-white/10 hover:bg-white/[0.08] hover:text-foreground'
                      }
                    `}
                  >
                    <Icon className="size-4 shrink-0" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold text-foreground">
                {sectionTitle}
              </h2>
              {activeTab === 'mine' ? (
                <button
                  type="button"
                  onClick={() => openModeChooser()}
                  className="
                    flex shrink-0 items-center gap-2 rounded-xl bg-primary px-3.5
                    py-2 text-xs font-medium text-slate-950
                    shadow-[0_0_20px_hsl(185_72%_48%/0.25)] transition-colors
                    hover:bg-primary/90
                  "
                >
                  <Plus className="size-4" />
                  Nuevo proyecto
                </button>
              ) : null}
            </div>

            {activeTab === 'templates' ? (
              visibleTemplates.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {visibleTemplates.map((template) => {
                    const Icon = template.icon;
                    return (
                      <button
                        key={template.id}
                        type="button"
                        onClick={() => openModeChooser(template.title)}
                        className="
                          group rounded-2xl border border-white/10
                          bg-surface-deep p-4 text-left transition-colors
                          hover:border-neon/40
                          focus-visible:border-neon/40
                          focus-visible:outline-none
                        "
                      >
                        <div
                          className="
                            mb-3 flex size-9 items-center justify-center
                            rounded-xl bg-primary/10 ring-1 ring-primary/25
                            ring-inset
                          "
                        >
                          <Icon className="size-4 text-primary" />
                        </div>
                        <h3 className="text-sm leading-snug font-semibold text-foreground">
                          {template.title}
                        </h3>
                        <p className="mt-2 text-[11px] text-muted-foreground">
                          Estructura lista para empezar
                        </p>
                        <span
                          className="
                            mt-3 inline-flex items-center gap-1 text-[11px]
                            font-medium text-primary opacity-0
                            transition-opacity duration-200
                            group-hover:opacity-100
                            group-focus-visible:opacity-100
                          "
                        >
                          Usar plantilla
                          <ChevronRight className="size-3" />
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <EmptyState message={emptyMessage} />
              )
            ) : visibleProjects.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {visibleProjects.map((item) => (
                  <ProjectHomeCard key={item.id} item={item} />
                ))}
              </div>
            ) : (
              <EmptyState message={emptyMessage} />
            )}
          </div>

          <div className="mt-10 text-center">
            <Link
              href="/explorar"
              className="
                inline-flex items-center gap-2 text-sm text-muted-foreground
                transition-colors
                hover:text-primary
              "
            >
              <Compass className="size-4" />
              Explorar proyectos de la comunidad
            </Link>
          </div>
        </div>
      </main>

      <ProjectModeChooser
        key={chooserSeed.key}
        initialIdea={chooserSeed.idea}
        isOpen={isModeChooserOpen}
        onOpenChange={setIsModeChooserOpen}
        onContinue={(seed) => {
          setIsModeChooserOpen(false);
          generateProject(seed);
        }}
        onAdvanced={() => {
          setIsModeChooserOpen(false);
          setIsCreateModalOpen(true);
        }}
      />

      <ModalResumen
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        titulo=""
        description=""
        planteamiento=""
        justificacion=""
        objetivoGen=""
        objetivosEsp={[]}
        categoriaId={undefined}
        tipoProyecto=""
        projectId={undefined}
        coverImageKey={undefined}
        coverVideoKey={undefined}
        courseId={undefined}
        onProjectCreated={(createdId, createdTitle) => {
          // Same as the community feed: meet the learner in the Coach right
          // after the project exists, with a soft refresh so the chat stays.
          if (createdId) {
            openCoachChatForNewProject({ id: createdId, title: createdTitle });
          }
          router.refresh();
        }}
        setObjetivosEsp={() => {}}
        setActividades={() => {}}
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
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-surface-deep/60 p-8 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
