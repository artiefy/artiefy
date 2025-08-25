'use client';

import React, { useEffect, useState } from 'react';

import Image from 'next/image';
import { useRouter } from 'next/navigation';

// Si usas Clerk:
import { useUser } from '@clerk/nextjs';
import * as RadixSelect from '@radix-ui/react-select';
import {
  ArrowRight,
  Filter,
  Folder,
  ImageOff,
  Maximize, // agrega este import
  Menu,
  MoreHorizontal,
  Search,
  TrendingUp,
  Users,
  VideoOff,
  X,
} from 'lucide-react';
import { FaFolderOpen } from 'react-icons/fa';

import { Header } from '~/components/estudiantes/layout/Header';
import _ModalIntegrantesProyectoInfo from '~/components/projects/Modals/ModalIntegrantesProyectoInfo';
import ModalProjectInfo from '~/components/projects/Modals/ModalProjectInfo';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '~/components/projects/ui/avatar';
import { Badge } from '~/components/projects/ui/badge';
import { Button } from '~/components/projects/ui/button';
import { Card, CardContent, CardHeader } from '~/components/projects/ui/card';
import { Input } from '~/components/projects/ui/input';

// Define el tipo para los proyectos públicos
interface PublicProject {
  id: number;
  name: string;
  planteamiento: string;
  justificacion: string;
  objetivo_general: string;
  type_project: string;
  isPublic: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
  user?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  category?: {
    id: string;
    name: string;
  };
  objetivosEsp: string[];
  actividades: unknown[];
  image?: string;
  video?: string;
  coverImageKey?: string; // <-- Agrega esta línea
  coverVideoKey?: string; // <-- Nuevo campo para video de portada
}

async function fetchPublicProjects(): Promise<PublicProject[]> {
  const res = await fetch('/api/projects');
  if (!res.ok) return [];
  const data: unknown = await res.json();

  // Debug: Ver qué datos vienen de la API
  console.log('Datos raw de la API:', data);

  if (!Array.isArray(data)) return [];

  return (data as PublicProject[]).map((project) => {
    // Debug: Ver cada proyecto antes de procesar
    console.log('Proyecto antes de procesar:', {
      id: project.id,
      name: project.name,
      coverImageKey: project.coverImageKey,
      coverVideoKey: project.coverVideoKey,
      image: project.image,
      video: project.video,
      hasImage: !!project.image,
      hasCoverImageKey: !!project.coverImageKey,
      hasCoverVideoKey: !!project.coverVideoKey,
    });

    const processedProject = {
      ...project,
      image: project.coverImageKey
        ? `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${project.coverImageKey}`
        : (project.image ?? undefined),
      video:
        project.coverVideoKey &&
        typeof project.coverVideoKey === 'string' &&
        project.coverVideoKey.length > 0
          ? `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${project.coverVideoKey}`
          : undefined,
    };

    // Debug: Ver cómo queda después de procesar
    console.log('Proyecto después de procesar:', {
      id: processedProject.id,
      name: processedProject.name,
      finalImage: processedProject.image,
      finalCoverVideoUrl: processedProject.video,
      awsUrl: process.env.NEXT_PUBLIC_AWS_S3_URL,
    });

    return processedProject;
  });
}

// Utilidad para SelectItem
function SelectItem({
  children,
  ...props
}: React.PropsWithChildren<{ value: string }>) {
  return (
    <RadixSelect.Item
      {...props}
      className="cursor-pointer rounded-xl px-3 py-2 text-slate-300 hover:bg-cyan-900 focus:bg-cyan-800"
    >
      <RadixSelect.ItemText>{children}</RadixSelect.ItemText>
    </RadixSelect.Item>
  );
}

export default function Component() {
  const [projects, setProjects] = useState<PublicProject[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<PublicProject[]>([]);
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());
  const [videoErrors, setVideoErrors] = useState<Set<number>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedTrending, setSelectedTrending] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<PublicProject | null>(
    null
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Estado para controlar el ciclo imagen/video por proyecto
  const [showImageMap, setShowImageMap] = useState<Record<number, boolean>>({});
  const videoRefs = React.useRef<Record<number, HTMLVideoElement | null>>({});
  const imageRefs = React.useRef<Record<number, HTMLImageElement | null>>({});

  // Función para iniciar el ciclo imagen/video para un proyecto
  const _startImageVideoCycle = (projectId: number) => {
    setShowImageMap((prev) => ({ ...prev, [projectId]: true }));
  };

  // Efecto para manejar el ciclo imagen/video por proyecto
  useEffect(() => {
    const timers: Record<number, NodeJS.Timeout> = {};

    filteredProjects.forEach((project) => {
      if (project.image && project.video) {
        // Si no hay estado para este proyecto, inicialízalo
        if (typeof showImageMap[project.id] === 'undefined') {
          setShowImageMap((prev) => ({ ...prev, [project.id]: true }));
        } else if (showImageMap[project.id]) {
          // Si está mostrando imagen, programa cambio a video en 20s
          timers[project.id] = setTimeout(() => {
            setShowImageMap((prev) => ({ ...prev, [project.id]: false }));
          }, 10000);
        }
      }
    });

    return () => {
      Object.values(timers).forEach(clearTimeout);
    };
  }, [filteredProjects, showImageMap]);

  // Handler cuando termina el video: volver a imagen y reiniciar video
  const handleVideoEnded = (projectId: number) => {
    setShowImageMap((prev) => ({ ...prev, [projectId]: true }));
    // Reiniciar video para la próxima vez
    const ref = videoRefs.current[projectId];
    if (ref) ref.currentTime = 0;
  };

  // Clerk:
  const { user } = useUser();
  const userId = user?.id;
  // NextAuth:
  // const { data: session } = useSession();
  // const userId = session?.user?.id;
  const router = useRouter();

  // Función para cargar proyectos
  const loadProjects = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const fetchedProjects = await fetchPublicProjects();
      console.log('Proyectos cargados:', fetchedProjects);
      setProjects(fetchedProjects);
    } catch (error) {
      console.error('Error cargando proyectos:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Filtrar proyectos
  React.useEffect(() => {
    let filtered = projects;

    // Filtrar por término de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(
        (project) =>
          project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          project.planteamiento
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          project.justificacion
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          project.user?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrar por categoría
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(
        (project) => project.category?.name === selectedCategory
      );
    }

    // Filtrar por tipo de proyecto
    if (selectedType !== 'all') {
      filtered = filtered.filter(
        (project) => project.type_project === selectedType
      );
    }

    // Filtrar por tendencia
    if (selectedTrending !== 'all') {
      filtered = filtered.filter(
        (project) => project.type_project === selectedTrending
      );
    }

    setFilteredProjects(filtered);
  }, [projects, searchTerm, selectedCategory, selectedType, selectedTrending]);

  const trendingTopics = React.useMemo(() => {
    const tagCount = new Map<string, number>();

    projects.forEach((project) => {
      // Solo contar tipos de proyecto
      if (project.type_project) {
        tagCount.set(
          project.type_project,
          (tagCount.get(project.type_project) ?? 0) + 1
        );
      }
    });

    return Array.from(tagCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, posts]) => ({ name, posts }));
  }, [projects]);

  // Obtener tendencias (tipos de proyecto más frecuentes) según los filtros aplicados,
  // pero si solo hay el filtro de tendencia activo, mostrar todas las tendencias globales
  const filteredTrendingTopics = React.useMemo(() => {
    // Si solo hay tendencia activa (los demás filtros están en 'all'), usar trendingTopics global
    const onlyTrendingActive =
      selectedTrending !== 'all' &&
      selectedCategory === 'all' &&
      selectedType === 'all' &&
      searchTerm === '';
    if (onlyTrendingActive) {
      return trendingTopics;
    }
    // Si hay más de un filtro activo, usar los tipos de los proyectos filtrados
    const tagCount = new Map<string, number>();
    filteredProjects.forEach((project) => {
      if (project.type_project) {
        tagCount.set(
          project.type_project,
          (tagCount.get(project.type_project) ?? 0) + 1
        );
      }
    });
    return Array.from(tagCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, posts]) => ({ name, posts }));
  }, [
    filteredProjects,
    trendingTopics,
    selectedTrending,
    selectedCategory,
    selectedType,
    searchTerm,
  ]);

  // Obtener categorías únicas de los proyectos filtrados,
  // pero si solo hay categoría activa, mostrar todas las categorías globales
  const filteredCategories = React.useMemo(() => {
    const onlyCategoryActive =
      selectedCategory !== 'all' &&
      selectedTrending === 'all' &&
      selectedType === 'all' &&
      searchTerm === '';
    if (onlyCategoryActive) {
      // Todas las categorías globales
      const uniqueCategories = new Set<string>();
      projects.forEach((project) => {
        if (project.category?.name) {
          uniqueCategories.add(project.category.name);
        }
      });
      return Array.from(uniqueCategories).map((name) => ({
        name,
        count: projects.filter((p) => p.category?.name === name).length,
      }));
    }
    // Si hay más de un filtro activo, usar los proyectos filtrados
    const uniqueCategories = new Set<string>();
    filteredProjects.forEach((project) => {
      if (project.category?.name) {
        uniqueCategories.add(project.category.name);
      }
    });
    return Array.from(uniqueCategories).map((name) => ({
      name,
      count: filteredProjects.filter((p) => p.category?.name === name).length,
    }));
  }, [
    filteredProjects,
    projects,
    selectedCategory,
    selectedTrending,
    selectedType,
    searchTerm,
  ]);

  // Obtener tipos de proyecto únicos de los proyectos filtrados,
  // pero si solo hay tipo activo, mostrar todos los tipos globales
  const filteredProjectTypes = React.useMemo(() => {
    const onlyTypeActive =
      selectedType !== 'all' &&
      selectedTrending === 'all' &&
      selectedCategory === 'all' &&
      searchTerm === '';
    if (onlyTypeActive) {
      // Todos los tipos globales
      const uniqueTypes = new Set<string>();
      projects.forEach((project) => {
        if (project.type_project) {
          uniqueTypes.add(project.type_project);
        }
      });
      return Array.from(uniqueTypes).map((type) => ({
        name: type,
        count: projects.filter((p) => p.type_project === type).length,
      }));
    }
    // Si hay más de un filtro activo, usar los proyectos filtrados
    const uniqueTypes = new Set<string>();
    filteredProjects.forEach((project) => {
      if (project.type_project) {
        uniqueTypes.add(project.type_project);
      }
    });
    return Array.from(uniqueTypes).map((type) => ({
      name: type,
      count: filteredProjects.filter((p) => p.type_project === type).length,
    }));
  }, [
    filteredProjects,
    projects,
    selectedType,
    selectedTrending,
    selectedCategory,
    searchTerm,
  ]);

  // Cargar proyectos inicialmente
  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // Polling para actualizar proyectos cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      loadProjects();
    }, 30000); // 30 segundos

    return () => clearInterval(interval);
  }, [loadProjects]);

  // Escuchar eventos de visibilidad para recargar cuando la página sea visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadProjects();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () =>
      document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [loadProjects]);

  // Escuchar eventos de focus para recargar cuando la ventana obtenga focus
  useEffect(() => {
    const handleFocus = () => {
      loadProjects();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [loadProjects]);

  const handleImageError = (projectId: number) => {
    setImageErrors((prev) => new Set(prev).add(projectId));
  };

  const handleVideoError = (projectId: number) => {
    setVideoErrors((prev) => new Set(prev).add(projectId));
  };

  // Función para limpiar solo filtros
  const clearFilters = () => {
    setSelectedCategory('all');
    setSelectedType('all');
  };

  // Función para limpiar búsqueda
  const clearSearch = () => {
    setSearchTerm('');
  };

  // Verificar si hay filtros activos
  const hasActiveFilters = selectedCategory !== 'all' || selectedType !== 'all';

  // Close sidebar when clicking outside on mobile
  const closeSidebar = () => setSidebarOpen(false);

  // Función para poner el video en pantalla completa
  const handleFullscreen = (projectId: number, isImage: boolean) => {
    if (isImage) {
      const img = imageRefs.current[projectId];
      if (img) {
        if (typeof img.requestFullscreen === 'function') {
          img.requestFullscreen();
        } else if (
          typeof (
            img as HTMLImageElement & { webkitRequestFullscreen?: () => void }
          ).webkitRequestFullscreen === 'function'
        ) {
          (
            img as HTMLImageElement & { webkitRequestFullscreen: () => void }
          ).webkitRequestFullscreen();
        } else if (
          typeof (
            img as HTMLImageElement & { msRequestFullscreen?: () => void }
          ).msRequestFullscreen === 'function'
        ) {
          (
            img as HTMLImageElement & { msRequestFullscreen: () => void }
          ).msRequestFullscreen();
        }
      }
    } else {
      const video = videoRefs.current[projectId];
      if (video) {
        if (typeof video.requestFullscreen === 'function') {
          video.requestFullscreen();
        } else if (
          typeof (
            video as HTMLVideoElement & { webkitRequestFullscreen?: () => void }
          ).webkitRequestFullscreen === 'function'
        ) {
          (
            video as HTMLVideoElement & { webkitRequestFullscreen: () => void }
          ).webkitRequestFullscreen();
        } else if (
          typeof (
            video as HTMLVideoElement & { msRequestFullscreen?: () => void }
          ).msRequestFullscreen === 'function'
        ) {
          (
            video as HTMLVideoElement & { msRequestFullscreen: () => void }
          ).msRequestFullscreen();
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#01142B] bg-gradient-to-br from-slate-900">
      <div className="sticky top-0 z-50 bg-[#041C3C] shadow-md">
        <Header />
      </div>

      {/* Mobile Header with Search and Menu */}
      <div className="sticky top-[64px] z-40 border-b border-slate-700 bg-[#041C3C] p-4 md:hidden">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(true)}
            className="text-cyan-400 hover:bg-cyan-400/10"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="relative flex-1">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-slate-400" />
            <Input
              placeholder="Buscar proyectos..."
              className="w-full border-slate-600 bg-slate-800/50 pr-10 pl-10 text-slate-200 placeholder-slate-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSearch}
                className="absolute top-1/2 right-1 h-8 w-8 -translate-y-1/2 transform p-0 text-slate-400 hover:bg-cyan-300 hover:text-black"
              >
                ✕
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto min-h-[calc(100vh-64px)] w-full max-w-full px-2 py-4 sm:px-4 sm:py-6">
        <div className="relative flex h-full flex-col items-stretch gap-4 md:flex-row md:gap-6">
          {/* Mobile Sidebar Overlay */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 z-50 bg-black/50 md:hidden"
              onClick={closeSidebar}
            />
          )}

          {/* Sidebar / Hamburger Menu */}
          <div
            className={`fixed top-0 left-0 z-50 h-full w-[80vw] bg-[#041C3C] shadow-lg transition-transform duration-300 ease-in-out md:static md:top-[104px] md:z-auto md:w-auto md:max-w-93 md:bg-transparent md:shadow-none ${
              sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            } md:translate-x-0`}
          >
            <div className="flex h-full flex-col p-4 md:p-0">
              {/* Mobile close button */}
              <div className="mb-4 flex justify-end md:hidden">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={closeSidebar}
                  className="text-slate-400"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto sm:space-y-6">
                {/* My Projects Button */}
                <div className="relative">
                  <button
                    className="group bg-size-100 bg-pos-0 hover:bg-pos-100 relative w-full rounded-3xl bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 p-[3px] transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/30"
                    onClick={() => {
                      if (userId) {
                        router.push('/proyectos/MisProyectos');
                      } else {
                        router.push('/sign-in');
                      }
                      closeSidebar();
                    }}
                  >
                    <div className="flex items-center justify-center space-x-2 rounded-3xl bg-slate-900 px-6 py-4 transition-all duration-300 group-hover:bg-slate-800 md:space-x-4 md:px-12 md:py-6">
                      {userId && (
                        <div className="relative">
                          <Folder className="h-6 w-6 text-cyan-400 transition-all duration-300 group-hover:opacity-0 md:h-8 md:w-8" />
                          <FaFolderOpen className="absolute top-0 left-0 h-6 w-6 text-cyan-400 opacity-0 transition-all duration-300 group-hover:opacity-100 md:h-8 md:w-8" />
                          <div className="absolute -top-2 -right-2 h-3 w-3 rounded-full bg-gradient-to-r from-cyan-400 to-blue-400 opacity-0 transition-opacity duration-300 group-hover:animate-pulse group-hover:opacity-100" />
                        </div>
                      )}
                      <span className="text-lg font-bold tracking-wide text-white md:text-2xl">
                        {userId ? 'Mis Proyectos' : 'Iniciar Sesión'}
                      </span>
                      <ArrowRight className="h-5 w-5 text-cyan-400 transition-all duration-300 group-hover:translate-x-2 md:h-6 md:w-6" />
                    </div>
                  </button>
                </div>

                {/* Desktop Search */}
                <div className="relative hidden md:block">
                  <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-slate-400" />
                  <Input
                    placeholder="Buscar proyectos, usuarios..."
                    className="w-full border-slate-600 bg-slate-800/50 pr-10 pl-10 text-slate-200 placeholder-slate-400"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearSearch}
                      className="absolute top-1/2 right-1 h-8 w-8 -translate-y-1/2 transform p-0 text-slate-400 hover:bg-cyan-300 hover:text-black"
                    >
                      ✕
                    </Button>
                  )}
                </div>

                {/* Active Filters */}
                {(searchTerm !== '' ||
                  selectedCategory !== 'all' ||
                  selectedType !== 'all' ||
                  selectedTrending !== 'all') && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-300">
                        Filtros activos:
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSearchTerm('');
                          setSelectedCategory('all');
                          setSelectedType('all');
                          setSelectedTrending('all');
                        }}
                        className="text-xs text-slate-400 hover:bg-cyan-300 hover:text-black"
                      >
                        Limpiar todo
                      </Button>
                    </div>
                    <div className="flex w-full flex-col gap-2">
                      {searchTerm && (
                        <Badge
                          variant="outline"
                          className="flex max-w-full min-w-0 cursor-pointer items-stretch overflow-hidden border-cyan-400/50 p-0 break-words whitespace-normal text-cyan-300"
                        >
                          <span className="min-w-0 flex-grow px-2 py-2 break-words whitespace-normal">{`Búsqueda: "${searchTerm}"`}</span>
                          <Button
                            variant="ghost"
                            onClick={clearSearch}
                            className="flex h-auto min-h-full w-7 flex-shrink-0 items-center justify-center rounded-none p-0 text-slate-400 hover:bg-cyan-400/20 hover:text-teal-100"
                            style={{ alignSelf: 'stretch' }}
                          >
                            ✕
                          </Button>
                        </Badge>
                      )}

                      {selectedCategory !== 'all' && (
                        <Badge
                          variant="outline"
                          className="flex max-w-full min-w-0 cursor-pointer items-stretch overflow-hidden border-teal-400/50 p-0 text-teal-300"
                        >
                          <span className="min-w-0 flex-grow truncate px-2 py-2 break-words">{`Categoría: "${selectedCategory}"`}</span>
                          <Button
                            variant="ghost"
                            className="flex h-auto min-h-full w-7 flex-shrink-0 items-center justify-center rounded-none p-0 text-slate-400 hover:bg-teal-400/20 hover:text-teal-100"
                            style={{ alignSelf: 'stretch' }}
                            onClick={() => setSelectedCategory('all')}
                          >
                            ✕
                          </Button>
                        </Badge>
                      )}

                      {selectedType !== 'all' && (
                        <Badge
                          variant="outline"
                          className="flex max-w-full min-w-0 cursor-pointer items-stretch overflow-hidden border-purple-400/50 p-0 text-purple-300"
                        >
                          <span className="min-w-0 flex-grow truncate px-2 py-2 break-words">{`Tipo: "${selectedType}"`}</span>
                          <Button
                            variant="ghost"
                            className="flex h-auto min-h-full w-7 flex-shrink-0 items-center justify-center rounded-none p-0 text-slate-400 hover:bg-purple-400/20 hover:text-teal-100"
                            style={{ alignSelf: 'stretch' }}
                            onClick={() => setSelectedType('all')}
                          >
                            ✕
                          </Button>
                        </Badge>
                      )}

                      {selectedTrending !== 'all' && (
                        <Badge
                          variant="outline"
                          className="flex max-w-full min-w-0 cursor-pointer items-stretch overflow-hidden border-orange-400/50 p-0 text-orange-300"
                        >
                          <span className="min-w-0 flex-grow truncate px-2 py-2 break-words">{`Tendencia: "${selectedTrending}"`}</span>
                          <Button
                            variant="ghost"
                            className="flex h-auto min-h-full w-7 flex-shrink-0 items-center justify-center rounded-none p-0 text-slate-400 hover:bg-orange-400/20 hover:text-teal-100"
                            style={{ alignSelf: 'stretch' }}
                            onClick={() => setSelectedTrending('all')}
                          >
                            ✕
                          </Button>
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Filters Card */}
                <Card className="w-full max-w-full overflow-hidden border-slate-700 bg-slate-800/50">
                  <CardHeader className="pb-3">
                    <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 items-center space-x-2">
                        <Filter className="h-4 w-4 flex-shrink-0 text-cyan-400" />
                        <h3 className="max-w-[70vw] truncate font-semibold text-slate-200 sm:max-w-xs">
                          Filtros
                        </h3>
                      </div>
                      <div className="flex flex-row flex-wrap items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={clearFilters}
                          className="border-cyan-400 text-slate-400 hover:bg-cyan-300 hover:text-slate-200"
                          title="Limpiar filtros"
                          disabled={!hasActiveFilters}
                        >
                          🗑️
                        </Button>
                        <Button
                          variant="outline"
                          onClick={loadProjects}
                          disabled={isLoading}
                          className="border-cyan-400 text-cyan-400 hover:bg-cyan-300 hover:text-black"
                          title="Recargar proyectos"
                        >
                          {isLoading ? '⟳' : '↻'}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div>
                        <h4 className="mb-2 text-sm font-medium text-slate-300">
                          Categorías
                        </h4>
                        <RadixSelect.Root
                          value={selectedCategory}
                          onValueChange={setSelectedCategory}
                        >
                          <RadixSelect.Trigger className="flex w-full items-center justify-between rounded-xl bg-slate-700 p-2 text-slate-300">
                            <RadixSelect.Value />
                            <RadixSelect.Icon>
                              <svg
                                width="16"
                                height="16"
                                fill="none"
                                viewBox="0 0 16 16"
                              >
                                <path
                                  d="M4 6l4 4 4-4"
                                  stroke="#94a3b8"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </RadixSelect.Icon>
                          </RadixSelect.Trigger>
                          <RadixSelect.Content className="mt-2 rounded-xl bg-slate-700 shadow-lg">
                            <RadixSelect.Viewport className="p-1">
                              <SelectItem value="all">
                                Todas las categorías (
                                {filteredCategories.length})
                              </SelectItem>
                              {filteredCategories.map((category) => (
                                <SelectItem
                                  key={category.name}
                                  value={category.name}
                                >
                                  {category.name} ({category.count})
                                </SelectItem>
                              ))}
                            </RadixSelect.Viewport>
                          </RadixSelect.Content>
                        </RadixSelect.Root>
                      </div>

                      <div>
                        <h4 className="mb-2 text-sm font-medium text-slate-300">
                          Tipo de Proyecto
                        </h4>
                        <RadixSelect.Root
                          value={selectedType}
                          onValueChange={setSelectedType}
                        >
                          <RadixSelect.Trigger className="flex w-full items-center justify-between rounded-xl bg-slate-700 p-2 text-slate-300">
                            <RadixSelect.Value />
                            <RadixSelect.Icon>
                              <svg
                                width="16"
                                height="16"
                                fill="none"
                                viewBox="0 0 16 16"
                              >
                                <path
                                  d="M4 6l4 4 4-4"
                                  stroke="#94a3b8"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </RadixSelect.Icon>
                          </RadixSelect.Trigger>
                          <RadixSelect.Content className="mt-2 rounded-xl bg-slate-700 shadow-lg">
                            <RadixSelect.Viewport className="p-1">
                              <SelectItem value="all">
                                Todos los tipos ({filteredProjectTypes.length})
                              </SelectItem>
                              {filteredProjectTypes.map((type) => (
                                <SelectItem key={type.name} value={type.name}>
                                  {type.name} ({type.count})
                                </SelectItem>
                              ))}
                            </RadixSelect.Viewport>
                          </RadixSelect.Content>
                        </RadixSelect.Root>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Trending Card */}
                <Card className="w-full max-w-full overflow-hidden border-slate-700 bg-slate-800/50">
                  <CardHeader className="pb-3">
                    <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 items-center space-x-2">
                        <TrendingUp className="h-4 w-4 flex-shrink-0 text-cyan-400" />
                        <h3 className="max-w-[70vw] truncate font-semibold text-slate-200 sm:max-w-xs">
                          Tendencias
                        </h3>
                      </div>
                      <div className="flex flex-row flex-wrap items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedTrending('all')}
                          className="border-cyan-400 text-slate-400 hover:bg-cyan-300 hover:text-slate-200"
                          title="Limpiar filtro de tendencias"
                          disabled={selectedTrending === 'all'}
                        >
                          🗑️
                        </Button>
                        <Button
                          variant="outline"
                          onClick={loadProjects}
                          disabled={isLoading}
                          className="border-cyan-400 text-cyan-400 hover:bg-cyan-300 hover:text-black"
                          title="Recargar proyectos"
                        >
                          {isLoading ? '⟳' : '↻'}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <RadixSelect.Root
                      value={selectedTrending}
                      onValueChange={setSelectedTrending}
                    >
                      <RadixSelect.Trigger className="flex w-full items-center justify-between rounded-xl bg-slate-700 p-2 text-slate-300">
                        <RadixSelect.Value />
                        <RadixSelect.Icon>
                          <svg
                            width="16"
                            height="16"
                            fill="none"
                            viewBox="0 0 16 16"
                          >
                            <path
                              d="M4 6l4 4 4-4"
                              stroke="#94a3b8"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </RadixSelect.Icon>
                      </RadixSelect.Trigger>
                      <RadixSelect.Content className="mt-2 rounded-xl bg-slate-700 shadow-lg">
                        <RadixSelect.Viewport className="p-1">
                          <SelectItem value="all">
                            Todas las tendencias (
                            {filteredTrendingTopics.length})
                          </SelectItem>
                          {filteredTrendingTopics.map((topic) => (
                            <SelectItem key={topic.name} value={topic.name}>
                              #{topic.name} ({topic.posts} posts)
                            </SelectItem>
                          ))}
                        </RadixSelect.Viewport>
                      </RadixSelect.Content>
                    </RadixSelect.Root>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* Main Feed */}
          <div className="w-full min-w-0 flex-1">
            <div className="h-[calc(100vh-120px)] md:h-[calc(100vh-80px)]">
              <div
                className="custom-scrollbar h-full overflow-x-auto overflow-y-auto md:overflow-x-hidden"
                style={{
                  height: '100%',
                }}
              >
                <div className="h-full space-y-4 md:space-y-6">
                  {/* Welcome Message */}
                  <Card className="border-cyan-500/20 bg-gradient-to-r from-cyan-500/10 to-emerald-500/10">
                    <CardContent className="p-4 md:p-6">
                      <div className="flex flex-col space-y-3 md:flex-row md:items-center md:justify-between md:space-y-0">
                        <div className="flex items-center space-x-3">
                          <Users className="h-5 w-5 text-cyan-400 md:h-6 md:w-6" />
                          <div>
                            <h2 className="text-lg font-bold text-slate-200 md:text-xl">
                              ¡Bienvenido a Proyectos!
                            </h2>
                            <p className="text-sm text-slate-400 md:text-base">
                              Comparte tus proyectos, colabora y aprende con la
                              comunidad
                            </p>
                          </div>
                        </div>
                        <div className="text-left text-sm text-slate-400 md:text-right">
                          <p>
                            {filteredProjects.length} de {projects.length}{' '}
                            proyectos publicados
                          </p>
                          {isLoading && (
                            <p className="text-cyan-400">Actualizando...</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Project Posts */}
                  {filteredProjects.length > 0 ? (
                    filteredProjects.map((project) => (
                      <Card
                        key={project.id}
                        className="border-slate-700 bg-slate-800/50 transition-colors hover:bg-slate-800/70"
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <Avatar className="h-8 w-8 md:h-10 md:w-10">
                                <AvatarImage
                                  src={project.user?.avatar}
                                  alt={project.user?.name ?? 'Usuario'}
                                />
                                <AvatarFallback className="bg-slate-600 text-slate-200">
                                  {(project.user?.name ?? 'AN')
                                    .split(' ')
                                    .map((n) => n[0])
                                    .join('')
                                    .toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0 flex-1">
                                <h3 className="truncate font-semibold text-slate-200">
                                  {project.user?.name ?? 'Anónimo'}
                                </h3>
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-400 md:text-sm">
                                  <span>
                                    {project.createdAt
                                      ? new Date(
                                          project.createdAt
                                        ).toLocaleDateString('es-ES', {
                                          day: '2-digit',
                                          month: 'short',
                                        })
                                      : ''}
                                  </span>
                                  <span className="hidden md:inline">•</span>
                                  <Badge
                                    variant="secondary"
                                    className="border-cyan-500/30 bg-cyan-500/20 text-cyan-400"
                                  >
                                    {project.category?.name ?? 'Sin categoría'}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-slate-400 hover:text-slate-200"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardHeader>

                        <CardContent className="space-y-4">
                          <div>
                            <h2 className="mb-2 text-base font-bold text-slate-200 md:text-lg">
                              {project.name}
                            </h2>
                            <p className="line-clamp-3 text-sm leading-relaxed text-slate-300 md:line-clamp-none">
                              {project.planteamiento ?? 'Sin descripción'}
                            </p>
                          </div>

                          <div className="media-container relative overflow-hidden rounded-lg">
                            {/* Elimina el mensaje amarillo, solo muestra imagen si no hay video */}
                            {project.image && project.video ? (
                              showImageMap[project.id] !== false ? (
                                <Image
                                  ref={(el) => {
                                    imageRefs.current[project.id] = el;
                                  }}
                                  src={project.image}
                                  alt={project.name}
                                  width={500}
                                  height={300}
                                  className="media-fit"
                                  unoptimized
                                  onError={() => handleImageError(project.id)}
                                  onLoad={() => {
                                    if (
                                      typeof showImageMap[project.id] ===
                                      'undefined'
                                    ) {
                                      setShowImageMap((prev) => ({
                                        ...prev,
                                        [project.id]: true,
                                      }));
                                    }
                                  }}
                                />
                              ) : (
                                <video
                                  ref={(el) => {
                                    videoRefs.current[project.id] = el;
                                  }}
                                  autoPlay
                                  controls
                                  muted
                                  className="media-fit"
                                  poster={project.image}
                                  onEnded={() => handleVideoEnded(project.id)}
                                  onError={() => handleVideoError(project.id)}
                                >
                                  <source
                                    src={project.video}
                                    type="video/mp4"
                                  />
                                  Tu navegador no soporta la reproducción de
                                  video.
                                </video>
                              )
                            ) : project.video &&
                              !videoErrors.has(project.id) ? (
                              <video
                                controls
                                className="media-fit"
                                poster={project.image ?? ''}
                                onError={() => handleVideoError(project.id)}
                                ref={(el) => {
                                  videoRefs.current[project.id] = el;
                                }}
                              >
                                <source
                                  src={project.video ?? ''}
                                  type="video/mp4"
                                />
                                Tu navegador no soporta la reproducción de
                                video.
                              </video>
                            ) : project.image &&
                              !imageErrors.has(project.id) ? (
                              <Image
                                ref={(el) => {
                                  imageRefs.current[project.id] = el;
                                }}
                                src={project.image}
                                alt={project.name}
                                width={500}
                                height={300}
                                className="media-fit"
                                unoptimized
                                onError={() => handleImageError(project.id)}
                                onLoad={() => {
                                  if (
                                    typeof showImageMap[project.id] ===
                                    'undefined'
                                  ) {
                                    setShowImageMap((prev) => ({
                                      ...prev,
                                      [project.id]: true,
                                    }));
                                  }
                                }}
                              />
                            ) : (
                              <div className="flex h-48 w-full items-center justify-center bg-slate-700 md:h-64">
                                <div
                                  className="flex w-full flex-col items-center justify-center"
                                  style={{
                                    minHeight: 250,
                                    height: 250,
                                    maxHeight: 300,
                                  }}
                                >
                                  <ImageOff
                                    className="text-slate-500"
                                    size={50}
                                  />
                                  <span className="mt-2 text-base text-slate-500">
                                    Sin imagen
                                  </span>
                                  <VideoOff
                                    className="text-slate-500"
                                    size={50}
                                  />
                                  <span className="mt-2 text-base text-slate-500">
                                    Sin video
                                  </span>
                                </div>
                              </div>
                            )}
                            {/* Botón pantalla completa: solo mostrar si NO se está reproduciendo video */}
                            {showImageMap[project.id] !== false && (
                              <div className="absolute top-3 right-3">
                                <Button
                                  variant="secondary"
                                  size="icon"
                                  className="h-8 w-8 border-0 bg-black/50 text-white hover:bg-black/70 md:h-10 md:w-10"
                                  onClick={() => {
                                    // Si hay video y está en modo imagen, fullscreen imagen; si no, fullscreen video
                                    const isImage = Boolean(
                                      (project.image &&
                                        project.video &&
                                        showImageMap[project.id] !== false) ??
                                        (project.image && !project.video)
                                    );
                                    handleFullscreen(project.id, isImage);
                                  }}
                                  title="Ver en pantalla completa"
                                >
                                  <Maximize className="h-4 w-4 md:h-5 md:w-5" />
                                </Button>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {[project.type_project].map((tag, idx) => (
                              <Badge
                                key={tag + idx}
                                variant="outline"
                                className="border-slate-600 text-slate-300 hover:bg-slate-700"
                              >
                                #{tag}
                              </Badge>
                            ))}
                          </div>

                          <div className="flex flex-col space-y-3 md:flex-row md:items-center md:justify-between md:space-y-0">
                            <Button
                              className="w-full bg-gradient-to-r from-teal-500 to-teal-600 font-semibold text-white hover:from-teal-600 hover:to-teal-700"
                              onClick={() => {
                                setSelectedProject(project);
                                setModalOpen(true);
                                closeSidebar(); // Close sidebar on mobile when opening modal
                              }}
                            >
                              Ver más
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <Card className="border-slate-700 bg-slate-800/50">
                      <CardContent className="p-6 text-center">
                        <div className="text-slate-400">
                          <Search className="mx-auto mb-4 h-8 w-8 md:h-12 md:w-12" />
                          <h3 className="mb-2 text-base font-semibold md:text-lg">
                            No se encontraron proyectos
                          </h3>
                          <p className="text-sm md:text-base">
                            Intenta ajustar los filtros o el término de búsqueda
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Load More Indicator */}
                  {isLoading && (
                    <div className="flex justify-center py-8">
                      <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-cyan-400 md:h-8 md:w-8" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de información del proyecto */}
      <ModalProjectInfo
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          closeSidebar();
        }}
        project={selectedProject}
        userId={userId}
      />

      {/* Scrollbar color personalizado */}
      <style jsx global>{`
        html,
        body {
          scrollbar-width: none !important; /* Firefox */
          -ms-overflow-style: none !important; /* IE 10+ */
        }
        html::-webkit-scrollbar,
        body::-webkit-scrollbar {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
          background: transparent !important;
        }
        /* Oculta el scroll en el área principal */
        .custom-scrollbar {
          scrollbar-width: none !important; /* Firefox */
          -ms-overflow-style: none !important; /* IE 10+ */
        }
        .custom-scrollbar::-webkit-scrollbar {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
          background: transparent !important;
        }

        /* Line clamp utility for text truncation */
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        @media (min-width: 768px) {
          .md\\:line-clamp-none {
            display: block;
            -webkit-line-clamp: unset;
            -webkit-box-orient: unset;
            overflow: visible;
          }
        }

        .media-container {
          position: relative;
          width: 100%;
          height: 12rem; /* igual a h-48 */
        }
        @media (min-width: 768px) {
          .media-container {
            height: 16rem; /* igual a md:h-64 */
          }
        }
        .media-fit {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
          display: block;
          border-radius: 0.5rem;
          background: #1e293b;
        }
      `}</style>
    </div>
  );
}
