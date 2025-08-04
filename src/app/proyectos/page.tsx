'use client';

import React, { useEffect, useState } from 'react';

import Image from 'next/image';

// Si usas Clerk:
import { useUser } from '@clerk/nextjs';
import {
  ArrowRight,
  //  Bookmark,
  Filter,
  Folder,
  //  Heart,
  ImageIcon,
  //  MessageCircle,
  MoreHorizontal,
  Search,
  //  Share2,
  TrendingUp,
  Users,
} from 'lucide-react';
import { FaFolderOpen } from 'react-icons/fa';
import * as RadixSelect from '@radix-ui/react-select';

import { Header } from '~/components/estudiantes/layout/Header';
import ModalIntegrantesProyectoInfo from '~/components/projects/Modals/ModalIntegrantesProyectoInfo';
import ModalProjectInfo from '~/components/projects/Modals/ModalProjectInfo';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '~/components/projects/ui/avatar';
import { Badge } from '~/components/projects/ui/badge';
import { Button } from '~/components/projects/ui/button';
import {
  Card,
  CardContent,
  //  CardFooter,
  CardHeader,
} from '~/components/projects/ui/card';
import { Input } from '~/components/projects/ui/input';
import { ScrollArea } from '~/components/projects/ui/scroll-area';
// Si usas NextAuth:
// import { useSession } from "next-auth/react";

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
  coverImageKey?: string; // <-- Agrega esta línea
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
      image: project.image,
      hasImage: !!project.image,
      hasCoverImageKey: !!project.coverImageKey,
    });

    const processedProject = {
      ...project,
      image: project.coverImageKey
        ? `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${project.coverImageKey}`
        : (project.image ?? undefined),
    };

    // Debug: Ver cómo queda después de procesar
    console.log('Proyecto después de procesar:', {
      id: processedProject.id,
      name: processedProject.name,
      finalImage: processedProject.image,
      awsUrl: process.env.NEXT_PUBLIC_AWS_S3_URL,
    });

    return processedProject;
  });
}

// Utilidad para SelectItem
function SelectItem({ children, ...props }: any) {
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
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedTrending, setSelectedTrending] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<PublicProject | null>(
    null
  );
  const [integrantesModalOpen, setIntegrantesModalOpen] = useState<
    number | null
  >(null);
  const [inscritosMap, setInscritosMap] = useState<Record<number, number>>({});
  // Clerk:
  const { user } = useUser();
  const userId = user?.id;
  // NextAuth:
  // const { data: session } = useSession();
  // const userId = session?.user?.id;

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

  // Obtener categorías únicas de los proyectos filtrados
  const categories = React.useMemo(() => {
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
  }, [filteredProjects]);

  // Obtener tipos de proyecto únicos de los proyectos filtrados
  const projectTypes = React.useMemo(() => {
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
  }, [filteredProjects]);

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

  // Cargar la cantidad de inscritos para todos los proyectos al cargar la lista
  useEffect(() => {
    const fetchAllInscritos = async () => {
      const newMap: Record<number, number> = {};
      await Promise.all(
        projects.map(async (project) => {
          try {
            const res = await fetch(
              `/api/projects/taken/count?projectId=${project.id}`
            );
            if (res.ok) {
              const data: { count: number } = await res.json();
              newMap[project.id] = data.count ?? 0;
            } else {
              newMap[project.id] = 0;
            }
          } catch {
            newMap[project.id] = 0;
          }
        })
      );
      setInscritosMap(newMap);
    };
    if (projects.length > 0) fetchAllInscritos();
  }, [projects]);

  return (
    <div className="min-h-screen bg-[#01142B] bg-gradient-to-br from-slate-900">
      <div className="sticky top-0 z-50 bg-[#041C3C] shadow-md">
        <Header />
      </div>
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          {/* Sidebar */}
          <div className="space-y-6 lg:col-span-1">
            <div className="relative hidden md:block">
              <a href={userId ? '/proyectos/MisProyectos' : '/sign-in'}>
                <button className="group bg-size-100 bg-pos-0 hover:bg-pos-100 relative rounded-3xl bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 p-[3px] transition-all duration-500 hover:scale-110 hover:shadow-2xl hover:shadow-cyan-500/30">
                  <div className="flex items-center justify-center space-x-4 rounded-3xl bg-slate-900 px-12 py-6 transition-all duration-300 group-hover:bg-slate-800">
                    {userId && (
                      <div className="relative">
                        <Folder className="h-8 w-8 text-cyan-400 transition-all duration-300 group-hover:opacity-0" />
                        <FaFolderOpen className="absolute top-0 left-0 h-8 w-8 text-cyan-400 opacity-0 transition-all duration-300 group-hover:opacity-100" />
                        <div className="absolute -top-2 -right-2 h-3 w-3 rounded-full bg-gradient-to-r from-cyan-400 to-blue-400 opacity-0 transition-opacity duration-300 group-hover:animate-pulse group-hover:opacity-100"></div>
                      </div>
                    )}
                    <span className="text-2xl font-bold tracking-wide text-white">
                      {userId ? 'Mis Proyectos' : 'Iniciar Sesión'}
                    </span>
                    <ArrowRight className="h-6 w-6 text-cyan-400 transition-all duration-300 group-hover:translate-x-2" />
                  </div>
                </button>
              </a>
            </div>

            <div className="relative hidden md:block">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-slate-400" />
              <Input
                placeholder="Buscar proyectos, usuarios..."
                className="w-80 border-slate-600 bg-slate-800/50 pr-10 pl-10 text-slate-200 placeholder-slate-400"
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

            {/* Indicadores de filtros activos */}
            {(searchTerm !== '' ||
              selectedCategory !== 'all' ||
              selectedType !== 'all' ||
              selectedTrending !== 'all') && (
              <div className="space-y-2">
                <span className="text-sm font-medium text-slate-300">
                  Filtros activos:
                </span>
                <div className="flex flex-wrap gap-2">
                  {searchTerm && (
                    <Badge
                      variant="outline"
                      className="cursor-pointer border-cyan-400/50 text-cyan-300 hover:bg-cyan-400/20"
                      onClick={clearSearch}
                    >
                      Búsqueda: &quot;{searchTerm}&quot; ✕
                    </Badge>
                  )}

                  {selectedCategory !== 'all' && (
                    <Badge
                      variant="outline"
                      className="cursor-pointer border-teal-400/50 text-teal-300 hover:bg-teal-400/20"
                      onClick={() => setSelectedCategory('all')}
                    >
                      Categoría: {selectedCategory} ✕
                    </Badge>
                  )}

                  {selectedType !== 'all' && (
                    <Badge
                      variant="outline"
                      className="cursor-pointer border-purple-400/50 text-purple-300 hover:bg-purple-400/20"
                      onClick={() => setSelectedType('all')}
                    >
                      Tipo: {selectedType} ✕
                    </Badge>
                  )}

                  {selectedTrending !== 'all' && (
                    <Badge
                      variant="outline"
                      className="cursor-pointer border-orange-400/50 text-orange-300 hover:bg-orange-400/20"
                      onClick={() => setSelectedTrending('all')}
                    >
                      Tendencia: {selectedTrending} ✕
                    </Badge>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedCategory('all');
                      setSelectedType('all');
                      setSelectedTrending('all');
                    }}
                    className="text-xs text-gray-500 hover:text-gray-300"
                  >
                    Limpiar todo
                  </Button>
                </div>
              </div>
            )}

            {/* Filters */}
            <Card className="border-slate-700 bg-slate-800/50">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Filter className="h-4 w-4 text-cyan-400" />
                    <h3 className="font-semibold text-slate-200">Filtros</h3>
                  </div>
                  <div className="flex items-center space-x-1">
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
                            Todas las categorías ({categories.length})
                          </SelectItem>
                          {categories.map((category) => (
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
                            Todos los tipos ({projectTypes.length})
                          </SelectItem>
                          {projectTypes.map((type) => (
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

            {/* Trending */}
            <Card className="border-slate-700 bg-slate-800/50">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4 text-cyan-400" />
                    <h3 className="font-semibold text-slate-200">Tendencias</h3>
                  </div>
                  <div className="flex items-center space-x-1">
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
                        Todas las tendencias ({trendingTopics.length})
                      </SelectItem>
                      {trendingTopics.map((topic) => (
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

          {/* Main Feed */}
          <div className="h-[calc(110vh-100px)] lg:col-span-3">
            <div
              className="custom-scrollbar h-full overflow-x-hidden overflow-y-auto"
              style={{
                height: '100%',
              }}
            >
              <div className="h-full space-y-6">
                {/* Welcome Message */}
                <Card className="border-cyan-500/20 bg-gradient-to-r from-cyan-500/10 to-emerald-500/10">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Users className="h-6 w-6 text-cyan-400" />
                        <div>
                          <h2 className="text-xl font-bold text-slate-200">
                            ¡Bienvenido a Proyectos!
                          </h2>
                          <p className="text-slate-400">
                            Comparte tus proyectos, colabora y aprende con la
                            comunidad
                          </p>
                        </div>
                      </div>
                      <div className="text-right text-sm text-slate-400">
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
                            <Avatar className="h-10 w-10">
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
                            <div>
                              <h3 className="font-semibold text-slate-200">
                                {project.user?.name ?? 'Anónimo'}
                              </h3>
                              <div className="flex items-center space-x-2 text-sm text-slate-400">
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
                                <span>•</span>
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
                          <h2 className="mb-2 text-lg font-bold text-slate-200">
                            {project.name}
                          </h2>
                          <p className="text-sm leading-relaxed text-slate-300">
                            {project.planteamiento ??
                              project.justificacion ??
                              'Sin descripción'}
                          </p>
                        </div>

                        <div className="relative overflow-hidden rounded-lg">
                          {project.image && !imageErrors.has(project.id) ? (
                            <Image
                              src={project.image}
                              alt={project.name}
                              width={500}
                              height={300}
                              className="h-64 w-full object-cover"
                              unoptimized
                              onError={() => {
                                console.error(
                                  'Error cargando imagen del proyecto:',
                                  project.name,
                                  'ID:',
                                  project.id,
                                  'URL que falló:',
                                  project.image
                                );
                                handleImageError(project.id);
                              }}
                              onLoad={() => {
                                console.log(
                                  'Imagen cargada exitosamente para el proyecto:',
                                  project.name,
                                  'URL:',
                                  project.image
                                );
                              }}
                            />
                          ) : (
                            <div className="flex h-64 w-full items-center justify-center bg-slate-700">
                              <div className="text-center text-slate-400">
                                <ImageIcon className="mx-auto mb-2 h-12 w-12" />
                                <p className="text-sm">
                                  {imageErrors.has(project.id)
                                    ? 'Error al cargar imagen'
                                    : 'Sin imagen'}
                                </p>
                              </div>
                            </div>
                          )}
                          <div className="absolute top-3 right-3">
                            <Button
                              variant="secondary"
                              size="icon"
                              className="border-0 bg-black/50 text-white hover:bg-black/70"
                            >
                              <ImageIcon className="h-4 w-4" />
                            </Button>
                          </div>
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
                        <div className="flex items-center text-slate-400">
                          <button
                            type="button"
                            onClick={() => setIntegrantesModalOpen(project.id)}
                            className="flex items-center gap-1 rounded bg-[#1F3246] px-2 py-1 text-xs text-purple-300 hover:scale-105"
                          >
                            {inscritosMap[project.id] ?? 0}{' '}
                            <Users className="inline h-4 w-4 text-purple-300" />{' '}
                            Integrantes
                          </button>
                          {integrantesModalOpen === project.id && (
                            <ModalIntegrantesProyectoInfo
                              isOpen={true}
                              onClose={() => setIntegrantesModalOpen(null)}
                              proyecto={{
                                ...project,
                                titulo: project.name ?? '',
                                rama: '', // Ajusta si tienes el dato real
                                especialidades: '', // Ajusta si tienes el dato real
                                participacion: '', // Ajusta si tienes el dato real
                              }}
                              integrantes={[]}
                            />
                          )}
                        </div>
                        {/* Botón para abrir el modal */}
                        <div className="pt-2">
                          <Button
                            className="w-full bg-gradient-to-r from-teal-500 to-teal-600 font-semibold text-white hover:from-teal-600 hover:to-teal-700"
                            onClick={() => {
                              setSelectedProject(project);
                              setModalOpen(true);
                            }}
                          >
                            Ver más
                          </Button>
                        </div>
                      </CardContent>

                      {/* <CardFooter className="pt-0">
                        <div className="flex w-full items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-slate-400 hover:bg-red-400/10 hover:text-red-400"
                            >
                              <Heart className="mr-1 h-4 w-4" />
                              {Math.floor(Math.random() * 100)}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-slate-400 hover:bg-cyan-400/10 hover:text-cyan-400"
                            >
                              <MessageCircle className="mr-1 h-4 w-4" />
                              {Math.floor(Math.random() * 20)}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-slate-400 hover:bg-emerald-400/10 hover:text-emerald-400"
                            >
                              <Share2 className="mr-1 h-4 w-4" />
                              {Math.floor(Math.random() * 10)}
                            </Button>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-slate-400 hover:bg-yellow-400/10 hover:text-yellow-400"
                          >
                            <Bookmark className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardFooter> */}
                    </Card>
                  ))
                ) : (
                  <Card className="border-slate-700 bg-slate-800/50">
                    <CardContent className="p-6 text-center">
                      <div className="text-slate-400">
                        <Search className="mx-auto mb-4 h-12 w-12" />
                        <h3 className="mb-2 text-lg font-semibold">
                          No se encontraron proyectos
                        </h3>
                        <p>
                          Intenta ajustar los filtros o el término de búsqueda
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Load More Indicator */}
                {isLoading && (
                  <div className="flex justify-center py-8">
                    <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-cyan-400" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Modal de información del proyecto */}
      <ModalProjectInfo
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        project={selectedProject}
        userId={userId}
      />

      {/* Scrollbar color personalizado */}
      <style jsx global>{`
        /* Oculta el scroll global del html/body */
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
      `}</style>
    </div>
  );
}
