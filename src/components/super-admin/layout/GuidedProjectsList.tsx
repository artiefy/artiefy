'use client';

import { useCallback, useEffect, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import { ArrowRightIcon } from '@heroicons/react/24/solid';
import { Eye, EyeOff, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { AspectRatio } from '~/components/educators/ui/aspect-ratio';
import { Badge } from '~/components/educators/ui/badge';
import { Button } from '~/components/educators/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '~/components/educators/ui/card';

import { ModalGuidedProjectForm } from '../modals/ModalGuidedProjectForm';

interface GuidedProject {
  id: number;
  title: string;
  description: string | null;
  coverImageKey: string | null;
  categoryName: string;
  modalidadName: string;
  instructor: string;
  instructorName: string;
  isActive: boolean;
  createdAt: string;
}

interface GuidedProjectsListProps {
  creatorId?: string;
}

export function GuidedProjectsList({ creatorId }: GuidedProjectsListProps) {
  const [projects, setProjects] = useState<GuidedProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const projectsPerPage = 6;

  const fetchProjects = useCallback(async () => {
    try {
      const url = creatorId
        ? `/api/guided-projects?creatorId=${creatorId}`
        : '/api/guided-projects';
      const response = await fetch(url);
      if (!response.ok) throw new Error('Error al cargar');
      const data = (await response.json()) as GuidedProject[];
      setProjects(data);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar proyectos');
    } finally {
      setLoading(false);
    }
  }, [creatorId]);

  useEffect(() => {
    void fetchProjects();
  }, [fetchProjects]);

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar este proyecto?')) return;
    try {
      const response = await fetch(`/api/guided-projects?id=${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Error al eliminar');
      toast.success('Proyecto eliminado');
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al eliminar');
    }
  };

  const handleToggleActive = async (id: number, isActive: boolean) => {
    try {
      const response = await fetch(`/api/guided-projects?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      });
      if (!response.ok) throw new Error('Error al actualizar');
      await fetchProjects();
      toast.success('Estado actualizado');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al actualizar');
    }
  };

  // ✅ Categorías únicas para el filtro
  const categories = Array.from(
    new Set(projects.map((p) => p.categoryName).filter(Boolean))
  );

  // ✅ Filtrar por búsqueda y categoría
  const filteredProjects = projects.filter(
    (project) =>
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      (categoryFilter ? project.categoryName === categoryFilter : true)
  );

  const totalProjects = projects.length;
  const totalActive = projects.filter((p) => p.isActive).length;

  const totalPages = Math.max(
    1,
    Math.ceil(filteredProjects.length / projectsPerPage)
  );
  const indexOfLast = currentPage * projectsPerPage;
  const indexOfFirst = indexOfLast - projectsPerPage;
  const displayedProjects = filteredProjects.slice(indexOfFirst, indexOfLast);

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="inline-block size-12 animate-spin rounded-full border-b-2 border-primary"></div>
          <p className="mt-4 text-gray-400">Cargando proyectos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      {/* Header con efecto degradado */}
      <header className="group relative overflow-hidden rounded-lg p-[1px]">
        <div className="absolute -inset-0.5 animate-gradient bg-gradient-to-r from-[#3AF4EF] via-[#00BDD8] to-[#01142B] opacity-75 blur transition duration-500" />
        <div className="relative flex flex-col items-start justify-between rounded-lg bg-gray-800 p-4 text-white shadow-lg transition-all duration-300 group-hover:bg-gray-800/95 sm:flex-row sm:items-center sm:p-6">
          <h1 className="flex items-center gap-3 text-xl font-extrabold tracking-tight text-primary sm:text-2xl lg:text-3xl">
            Proyectos Guiados
          </h1>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="my-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg bg-gray-800/50 p-4 shadow-lg backdrop-blur-sm sm:p-6">
          <h2 className="text-base font-semibold text-gray-400 sm:text-lg">
            Total de Proyectos
          </h2>
          <p className="mt-2 text-2xl font-bold text-white sm:text-3xl">
            {totalProjects}
          </p>
        </div>
        <div className="rounded-lg bg-gray-800/50 p-4 shadow-lg backdrop-blur-sm sm:p-6">
          <h2 className="text-base font-semibold text-gray-400 sm:text-lg">
            Proyectos Activos
          </h2>
          <p className="mt-2 text-2xl font-bold text-white sm:text-3xl">
            {totalActive}
          </p>
        </div>
        <div className="rounded-lg bg-gray-800/50 p-4 shadow-lg backdrop-blur-sm sm:p-6">
          <h2 className="text-base font-semibold text-gray-400 sm:text-lg">
            Filtrar por Categoría
          </h2>
          <select
            className="mt-2 w-full rounded-md border border-gray-700 bg-gray-900/50 px-3 py-1.5 text-white sm:px-4 sm:py-2"
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="">Todas</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Search and Add Button */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="col-span-1 rounded-lg bg-gray-800/50 p-4 shadow-lg backdrop-blur-sm lg:col-span-3">
          <input
            type="text"
            placeholder="Buscar proyectos..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full rounded-md border border-gray-700 bg-gray-900/50 px-4 py-2 text-white placeholder:text-gray-400"
          />
        </div>
        <div className="col-span-1">
          <button
            onClick={() => setModalOpen(true)}
            className="group/button relative inline-flex size-full items-center justify-center gap-1 overflow-hidden rounded-md border border-white/20 bg-background px-2 py-1.5 text-xs text-primary transition-all hover:bg-primary/10 sm:gap-2 sm:px-4 sm:py-2 sm:text-sm"
          >
            <span className="relative z-10 font-medium">Nuevo Proyecto</span>
            <Plus className="relative z-10 size-3.5 sm:size-4" />
            <div className="absolute inset-0 z-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 transition-all duration-500 group-hover/button:[transform:translateX(100%)] group-hover/button:opacity-100" />
          </button>
        </div>
      </div>

      {/* Project Grid */}
      {filteredProjects.length === 0 ? (
        <div className="flex min-h-[300px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-600 bg-gray-900/50 p-8">
          <div className="text-center">
            <div className="mb-4 text-6xl">📋</div>
            <h3 className="mb-2 text-xl font-bold text-white">
              No hay proyectos guiados
            </h3>
            <p className="mb-6 text-gray-400">
              {searchQuery || categoryFilter
                ? 'No se encontraron proyectos con ese filtro'
                : 'Comienza creando tu primer proyecto guiado'}
            </p>
            <Button
              size="lg"
              onClick={() => setModalOpen(true)}
              className="gap-2"
            >
              <Plus className="size-5" />
              Crear Proyecto
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 px-8 sm:grid-cols-2 lg:grid-cols-3 lg:px-5">
          {displayedProjects.map((project) => (
            <div key={project.id} className="group relative">
              <div className="absolute -inset-0.5 animate-gradient rounded-xl bg-gradient-to-r from-[#3AF4EF] via-[#00BDD8] to-[#01142B] opacity-0 blur transition duration-500 group-hover:opacity-100" />
              <Card className="zoom-in relative flex h-full flex-col justify-between overflow-hidden border-0 bg-gray-800 px-2 pt-2 text-white transition-transform duration-300 ease-in-out hover:scale-[1.02]">
                <CardHeader className="p-0">
                  <AspectRatio ratio={16 / 9}>
                    <div className="relative size-full bg-gray-900">
                      {project.coverImageKey ? (
                        <Image
                          src={`${process.env.NEXT_PUBLIC_AWS_S3_URL}/${project.coverImageKey}`}
                          alt={project.title}
                          fill
                          className="object-cover px-2 pt-2 transition-transform duration-300 hover:scale-105"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          quality={75}
                        />
                      ) : (
                        <div className="flex size-full items-center justify-center bg-gradient-to-br from-[#3AF4EF]/20 to-[#01142B]/20">
                          <span className="text-4xl">📚</span>
                        </div>
                      )}
                    </div>
                  </AspectRatio>
                </CardHeader>
                <CardContent className="flex grow flex-col justify-between space-y-2 px-2">
                  <CardTitle className="rounded-lg text-lg">
                    <div className="truncate font-bold text-primary">
                      {project.title}
                    </div>
                  </CardTitle>
                  <div className="flex flex-wrap gap-2">
                    <Badge
                      variant="outline"
                      className="border-primary bg-background text-xs text-primary hover:bg-black/70"
                    >
                      {project.categoryName}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="border-secondary bg-background text-xs text-secondary hover:bg-black/70"
                    >
                      {project.modalidadName}
                    </Badge>
                  </div>
                  <p className="line-clamp-2 text-sm text-gray-300">
                    {project.description ?? 'Sin descripción'}
                  </p>
                </CardContent>
                <CardFooter className="flex flex-col items-start justify-between space-y-3 px-2 pb-3">
                  <div className="flex w-full items-center justify-between text-xs">
                    <p className="font-bold text-gray-300">
                      Instructor:{' '}
                      <span className="text-primary">
                        {project.instructorName ?? 'Sin asignar'}
                      </span>
                    </p>
                    {project.isActive ? (
                      <Badge className="border-green-500/50 bg-green-500/20 text-green-400">
                        Activo
                      </Badge>
                    ) : (
                      <Badge className="border-red-500/50 bg-red-500/20 text-red-400">
                        Inactivo
                      </Badge>
                    )}
                  </div>
                  <div className="flex w-full gap-2">
                    <Link
                      href={`/dashboard/super-admin/proyectos-guiados/${project.id}`}
                      className="flex-1"
                    >
                      <Button className="group/button relative inline-flex w-full items-center justify-center overflow-hidden rounded-md border border-white/20 bg-background p-2 text-primary active:scale-95">
                        <p className="text-sm font-bold">Editar</p>
                        <ArrowRightIcon className="ml-1 size-4 animate-bounce-right" />
                        <div className="absolute inset-0 flex w-full [transform:skew(-13deg)_translateX(-100%)] justify-center group-hover/button:[transform:skew(-13deg)_translateX(100%)] group-hover/button:duration-1000">
                          <div className="relative h-full w-10 bg-white/30" />
                        </div>
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="outline"
                      className="px-3"
                      onClick={() =>
                        handleToggleActive(project.id, project.isActive)
                      }
                      title={project.isActive ? 'Desactivar' : 'Activar'}
                    >
                      {project.isActive ? (
                        <Eye className="size-4" />
                      ) : (
                        <EyeOff className="size-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="px-3"
                      onClick={() => handleDelete(project.id)}
                      title="Eliminar"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {filteredProjects.length > 0 && (
        <div className="mt-6 flex justify-center gap-4">
          <button
            onClick={handlePrevPage}
            disabled={currentPage === 1}
            className="rounded-md bg-gray-800 px-4 py-2 text-white disabled:opacity-50"
          >
            Anterior
          </button>
          <span className="flex items-center text-white">
            Página {currentPage} de {totalPages}
          </span>
          <button
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className="rounded-md bg-gray-800 px-4 py-2 text-white disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
      )}

      <ModalGuidedProjectForm
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSuccess={fetchProjects}
      />
    </div>
  );
}
