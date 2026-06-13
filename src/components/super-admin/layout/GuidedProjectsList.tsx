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
    fetchProjects();
  }, [fetchProjects]);

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar este proyecto?')) return;

    try {
      const response = await fetch(`/api/guided-projects?id=${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Error al eliminar');
      toast.success('Proyecto eliminado');
      setProjects(projects.filter((p) => p.id !== id));
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

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="inline-block size-12 animate-spin rounded-full border-b-2 border-primary"></div>
          <p className="mt-4 text-gray-600">Cargando proyectos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="mb-2 text-4xl font-bold text-white">
            Proyectos Guiados
          </h1>
          <p className="text-gray-400">
            Gestiona y organiza todos tus proyectos
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)} className="gap-2">
          <Plus className="size-5" />
          Nuevo Proyecto
        </Button>
      </div>

      {projects.length === 0 ? (
        <div className="flex min-h-[300px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-600 bg-gray-900/50 p-8">
          <div className="text-center">
            <div className="mb-4 text-6xl">📋</div>
            <h3 className="mb-2 text-xl font-bold text-white">
              No hay proyectos guiados
            </h3>
            <p className="mb-6 text-gray-400">
              Comienza creando tu primer proyecto guiado
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
        <div className="grid grid-cols-1 gap-6 px-2 sm:grid-cols-2 lg:grid-cols-3 lg:px-0">
          {projects.map((project) => (
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
                    {project.description || 'Sin descripción'}
                  </p>
                </CardContent>

                <CardFooter className="flex flex-col items-start justify-between space-y-3 px-2 pb-3">
                  <div className="flex w-full justify-between text-xs">
                    <p className="font-bold text-gray-300">
                      Instructor:{' '}
                      <span className="text-primary">{project.instructor}</span>
                    </p>
                    <div className="flex items-center gap-1">
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

      <ModalGuidedProjectForm
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSuccess={fetchProjects}
      />
    </div>
  );
}
