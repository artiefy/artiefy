'use client';

import { useEffect, useState } from 'react';

import Image from 'next/image';

import {
  Bookmark,
  Code,
  Cpu,
  Database,
  Filter,
  Heart,
  ImageIcon,
  MessageCircle,
  MoreHorizontal,
  Palette,
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
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());
  const trendingTopics = [
    { name: 'Machine Learning', posts: 234 },
    { name: 'Desarrollo Web', posts: 189 },
    { name: 'UX Design', posts: 156 },
    { name: 'IoT', posts: 98 },
    { name: 'Blockchain', posts: 76 },
  ];

  useEffect(() => {
    fetchPublicProjects().then((fetchedProjects) => {
      console.log('Proyectos cargados:', fetchedProjects);
      console.log(
        'NEXT_PUBLIC_AWS_S3_URL:',
        process.env.NEXT_PUBLIC_AWS_S3_URL
      );

      fetchedProjects.forEach((project) => {
        if (project.coverImageKey ?? project.image) {
          console.log(
            'Proyecto:',
            project.name,
            'coverImageKey:',
            project.coverImageKey,
            'image:',
            project.image,
            'URL final:',
            project.image ??
              `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${project.coverImageKey}`
          );
        }
      });

      setProjects(fetchedProjects);
    });
  }, []);

  const handleImageError = (projectId: number) => {
    setImageErrors((prev) => new Set(prev).add(projectId));
  };

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
                  <FaFolderOpen size={40} /> Mis Proyectos{' '}
                </a>
              </span>
            </aside>

            <div className="relative hidden md:block">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-slate-400" />
              <Input
                placeholder="Buscar proyectos, espacios..."
                className="w-80 border-slate-600 bg-slate-800/50 pl-10 text-slate-200 placeholder-slate-400"
              />
            </div>

            {/* Filters */}
            <Card className="border-slate-700 bg-slate-800/50">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-cyan-400" />
                  <h3 className="font-semibold text-slate-200">Filtros</h3>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-slate-300">
                    Categorías
                  </h4>
                  <div className="space-y-1">
                    {[
                      { name: 'Tecnología', icon: Code, count: 45 },
                      { name: 'Diseño', icon: Palette, count: 32 },
                      { name: 'Matemáticas', icon: Database, count: 28 },
                      { name: 'Machine Learning', icon: Cpu, count: 19 },
                    ].map((category) => (
                      <div
                        key={category.name}
                        className="flex items-center justify-between text-sm"
                      >
                        <div className="flex items-center space-x-2">
                          <category.icon className="h-3 w-3 text-slate-400" />
                          <span className="text-slate-300">
                            {category.name}
                          </span>
                        </div>
                        <span className="text-slate-500">{category.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Trending */}
            <Card className="border-slate-700 bg-slate-800/50">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-cyan-400" />
                  <h3 className="font-semibold text-slate-200">Tendencias</h3>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {trendingTopics.map((topic, _index) => (
                  <div
                    key={topic.name}
                    className="flex items-center justify-between text-sm"
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
                  </CardContent>
                </Card>

                {/* Project Posts */}
                {projects.map((project) => (
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
                        {[
                          project.type_project,
                          ...(project.objetivosEsp ?? []),
                        ].map((tag, idx) => (
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

                    <CardFooter className="pt-0">
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
                    </CardFooter>
                  </Card>
                ))}

                {/* Load More Indicator */}
                <div className="flex justify-center py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-cyan-400" />
                </div>
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>
    </div>
  );
}
