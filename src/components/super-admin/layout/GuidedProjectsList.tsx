'use client';

import { useCallback, useEffect, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import { format, isValid } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, Eye, EyeOff, Pencil, Plus, Trash2 } from 'lucide-react';
import { FaProjectDiagram } from 'react-icons/fa';
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
import { normalizeSearch } from '~/lib/utils';

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
  visibility: boolean;
  createdAt: string;
}

interface GuidedProjectsListProps {
  creatorId?: string;
}

export function GuidedProjectsList({ creatorId }: GuidedProjectsListProps) {
  const [projects, setProjects] = useState<GuidedProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<number | null>(null);
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

  const handleToggleVisibility = async (id: number, visibility: boolean) => {
    try {
      const response = await fetch(`/api/guided-projects?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visibility: !visibility }),
      });
      if (!response.ok) throw new Error('Error al actualizar');
      await fetchProjects();
      toast.success('Visibilidad actualizada');
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
      normalizeSearch(project.title).includes(normalizeSearch(searchQuery)) &&
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
            onClick={() => {
              setEditingProjectId(null);
              setModalOpen(true);
            }}
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
              onClick={() => {
                setEditingProjectId(null);
                setModalOpen(true);
              }}
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
              <Card className="zoom-in relative flex h-full flex-col justify-between gap-0 overflow-hidden rounded-2xl border border-[#1d283a] bg-[#061c37] p-0 py-0 text-white transition-transform duration-300 ease-in-out hover:scale-[1.02]">
                <CardHeader className="p-0">
                  <AspectRatio ratio={16 / 9}>
                    <div className="relative size-full bg-[#04101f]">
                      {project.coverImageKey ? (
                        <Image
                          src={`${process.env.NEXT_PUBLIC_AWS_S3_URL}/${project.coverImageKey}`}
                          alt={project.title}
                          fill
                          className="object-cover transition-transform duration-300 hover:scale-105"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          quality={75}
                        />
                      ) : (
                        <div className="flex size-full items-center justify-center bg-gradient-to-br from-[#22C4D3]/20 to-[#061c37]">
                          <span className="text-4xl">📚</span>
                        </div>
                      )}
                      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#061c37] to-transparent" />
                      <div className="absolute top-3 right-3 inline-flex items-center gap-1.5 rounded-full border border-[#22C4D3]/40 bg-[#061c37]/70 px-2.5 py-1 text-xs font-medium text-[#22C4D3] backdrop-blur-sm">
                        <FaProjectDiagram className="size-3" />
                        Proyecto Guiado
                      </div>
                    </div>
                  </AspectRatio>
                </CardHeader>
                <CardContent className="flex grow flex-col justify-between gap-3 px-4 pt-4">
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full border border-[#22C4D3]/30 bg-[#22C4D3]/10 px-2.5 py-1 text-xs font-medium text-[#22C4D3]">
                      {project.categoryName}
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-[#94A3B8]">
                      {project.modalidadName}
                    </span>
                  </div>
                  <CardTitle className="text-base sm:text-lg">
                    <div className="line-clamp-2 font-bold text-white">
                      {project.title}
                    </div>
                  </CardTitle>
                  <p className="text-xs text-[#94A3B8]">
                    Por{' '}
                    <span className="font-semibold text-[#22C4D3]">
                      {project.instructorName ?? 'Sin asignar'}
                    </span>
                  </p>
                  <p className="line-clamp-2 text-sm text-[#94A3B8]">
                    {project.description ?? 'Sin descripción'}
                  </p>
                  {isValid(new Date(project.createdAt)) && (
                    <div className="flex items-center gap-1.5 text-xs text-[#94A3B8]">
                      <Calendar className="size-3.5" />
                      {format(new Date(project.createdAt), "d 'de' MMM", {
                        locale: es,
                      })}
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex flex-col items-start justify-between gap-3 px-4 pt-3 pb-4">
                  <div className="flex w-full items-center justify-between text-xs">
                    {project.visibility ? (
                      <Badge className="border-green-500/50 bg-green-500/20 text-green-400">
                        Activo
                      </Badge>
                    ) : (
                      <Badge className="border-red-500/50 bg-red-500/20 text-red-400">
                        Inactivo
                      </Badge>
                    )}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="border border-[#1d283a] bg-[#0d2a4d] px-3 text-[#94A3B8] hover:bg-[#0d2a4d]/70 hover:text-white"
                        onClick={() =>
                          handleToggleVisibility(project.id, project.visibility)
                        }
                        title={project.visibility ? 'Ocultar' : 'Mostrar'}
                      >
                        {project.visibility ? (
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
                  </div>
                  <div className="flex w-full gap-2">
                    <Button
                      onClick={() => {
                        setEditingProjectId(project.id);
                        setModalOpen(true);
                      }}
                      className="flex w-full flex-1 items-center justify-center gap-1.5 border border-[#22C4D3]/40 bg-[#22C4D3]/10 p-2 text-[#22C4D3] hover:bg-[#22C4D3]/20"
                    >
                      <Pencil className="size-4" />
                      <p className="text-sm font-bold">Editar</p>
                    </Button>
                    <Link
                      href={`/dashboard/super-admin/proyectos-guiados/${project.id}`}
                      className="flex-1"
                    >
                      <Button className="flex w-full items-center justify-center gap-1.5 border border-[#1d283a] bg-[#0d2a4d] p-2 text-white hover:bg-[#0d2a4d]/70">
                        <Eye className="size-4" />
                        <p className="text-sm font-bold">Ver</p>
                      </Button>
                    </Link>
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
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) setEditingProjectId(null);
        }}
        projectId={editingProjectId}
        onSuccess={fetchProjects}
      />
    </div>
  );
}
