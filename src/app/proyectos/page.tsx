'use client';

import React, { useEffect, useState } from 'react';

import Image from 'next/image';

import {
  Bookmark,
  Filter,
  Heart,
  ImageIcon,
  MessageCircle,
  MoreHorizontal,
  Search,
  Share2,
  TrendingUp,
  Users,
} from 'lucide-react';
import { FaFolderOpen } from 'react-icons/fa';

import { Header } from '~/components/estudiantes/layout/Header';
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
  CardFooter,
  CardHeader,
} from '~/components/projects/ui/card';
import { Input } from '~/components/projects/ui/input';
import { ScrollArea } from '~/components/projects/ui/scroll-area';

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

export default function Component() {
  const [projects, setProjects] = useState<PublicProject[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<PublicProject[]>([]);
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedTrending, setSelectedTrending] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);

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

  // Obtener categorías únicas de los proyectos
  const categories = React.useMemo(() => {
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
  }, [projects]);

  // Obtener tipos de proyecto únicos
  const projectTypes = React.useMemo(() => {
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
  }, [projects]);

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
    setSelectedTrending('all');
  };

  // Función para limpiar búsqueda
  const clearSearch = () => {
    setSearchTerm('');
  };

  // Verificar si hay filtros activos
  const hasActiveFilters =
    selectedCategory !== 'all' ||
    selectedType !== 'all' ||
    selectedTrending !== 'all';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-emerald-900">
      <div className="sticky top-0 z-50 bg-[#041C3C] shadow-md">
        <Header />
      </div>
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          {/* Sidebar */}
          <div className="space-y-6 lg:col-span-1">
            <aside className="sticky top-[80px] flex h-fit flex-col items-center justify-start text-sm font-semibold text-cyan-300 hover:scale-110">
              <span className="mt-2">
                <a href="/proyectos/MisProyectos">
                  <div className="mb-2 flex items-center justify-center">
                    <FaFolderOpen size={40} />
                  </div>
                  Mis Proyectos{' '}
                </a>
              </span>
            </aside>

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
                    <div className="space-y-1">
                      <div
                        className={`flex cursor-pointer items-center justify-between rounded p-1 text-sm hover:bg-slate-700/50 ${
                          selectedCategory === 'all' ? 'bg-slate-700' : ''
                        }`}
                        onClick={() => setSelectedCategory('all')}
                      >
                        <span className="text-slate-300">
                          Todas las categorías
                        </span>
                        <span className="text-slate-500">
                          {projects.length}
                        </span>
                      </div>
                      {categories.map((category) => (
                        <div
                          key={category.name}
                          className={`flex cursor-pointer items-center justify-between rounded p-1 text-sm hover:bg-slate-700/50 ${
                            selectedCategory === category.name
                              ? 'bg-slate-700'
                              : ''
                          }`}
                          onClick={() => setSelectedCategory(category.name)}
                        >
                          <span className="text-slate-300">
                            {category.name}
                          </span>
                          <span className="text-slate-500">
                            {category.count}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="mb-2 text-sm font-medium text-slate-300">
                      Tipo de Proyecto
                    </h4>
                    <div className="space-y-1">
                      <div
                        className={`flex cursor-pointer items-center justify-between rounded p-1 text-sm hover:bg-slate-700/50 ${
                          selectedType === 'all' ? 'bg-slate-700' : ''
                        }`}
                        onClick={() => setSelectedType('all')}
                      >
                        <span className="text-slate-300">Todos los tipos</span>
                        <span className="text-slate-500">
                          {projects.length}
                        </span>
                      </div>
                      {projectTypes.map((type) => (
                        <div
                          key={type.name}
                          className={`flex cursor-pointer items-center justify-between rounded p-1 text-sm hover:bg-slate-700/50 ${
                            selectedType === type.name ? 'bg-slate-700' : ''
                          }`}
                          onClick={() => setSelectedType(type.name)}
                        >
                          <span className="text-slate-300">{type.name}</span>
                          <span className="text-slate-500">{type.count}</span>
                        </div>
                      ))}
                    </div>
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
                <div
                  className={`flex cursor-pointer items-center justify-between rounded p-1 text-sm hover:bg-slate-700/50 ${
                    selectedTrending === 'all' ? 'bg-slate-700' : ''
                  }`}
                  onClick={() => setSelectedTrending('all')}
                >
                  <span className="text-slate-300">Todas las tendencias</span>
                  <span className="text-slate-500">{projects.length}</span>
                </div>
                {trendingTopics.map((topic) => (
                  <div
                    key={topic.name}
                    className={`flex cursor-pointer items-center justify-between rounded p-1 text-sm hover:bg-slate-700/50 ${
                      selectedTrending === topic.name ? 'bg-slate-700' : ''
                    }`}
                    onClick={() => setSelectedTrending(topic.name)}
                  >
                    <span className="text-slate-300">#{topic.name}</span>
                    <span className="text-slate-500">{topic.posts} posts</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Main Feed */}
          <div className="lg:col-span-3">
            <ScrollArea className="h-[calc(100vh-120px)]">
              <div className="space-y-6">
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
                          proyectos
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
            </ScrollArea>
          </div>
        </div>
      </div>
    </div>
  );
}
