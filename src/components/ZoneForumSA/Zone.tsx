'use client';
import { useEffect, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import { useUser } from '@clerk/nextjs';
import { Calendar, MessageSquare, Trash2, User } from 'lucide-react';
import { toast } from 'sonner';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '~/components/educators/ui/alert-dialog';


interface ForumsModels {
  id: number;
  title: string;
  description: string;
  coverImageKey: string;
  documentKey: string;
  createdAt?: string;
  course: {
    id: number;
    title: string;
    descripcion: string;
    coverImageKey: string;
  };
  instructor: {
    id: string;
    name: string;
  };
  user: {
    id: string;
    name: string;
  };
}

export const Zone = () => {
  const { user } = useUser();
  const [forums, setForums] = useState<ForumsModels[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchForums = async () => {
      if (!user) return;
      try {
        const res = await fetch(`/api/forums?userId=${user.id}`);
        if (!res.ok) throw new Error('Error al obtener los foros');
        const data = (await res.json()) as ForumsModels[];
        // Ordenar por fecha de creación (más reciente primero)
        const sortedData = data.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        });
        setForums(sortedData);
      } catch (err) {
        setError('No se pudieron cargar los foros');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    void fetchForums();
  }, [user]);

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/forums?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.success('Foro eliminado correctamente');
      window.location.reload();
    } catch {
      toast.error('No se pudo eliminar el foro');
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  if (error) return <p className="text-red-500">{error}</p>;
  if (!forums.length) {
    return (
      <div className="mt-10 flex flex-col items-center justify-center gap-4 rounded-2xl border border-gray-800 bg-gray-900/50 py-16">
        <MessageSquare className="h-16 w-16 text-gray-600" />
        <p className="text-xl text-gray-400">No hay foros disponibles.</p>
        <p className="text-sm text-gray-500">
          Crea uno nuevo para comenzar las discusiones
        </p>
      </div>
    );
  }

  // Formatear fecha
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Sin fecha';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {forums.map((forum) => (
        <div
          key={forum.id}
          className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-gray-800 bg-gradient-to-b from-gray-900 to-gray-950 shadow-xl transition-all duration-300 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10"
        >
          {/* Imagen de portada con overlay */}
          <div className="relative h-44 flex-shrink-0 overflow-hidden">
            <Image
              src={
                forum.course.coverImageKey
                  ? `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${forum.course.coverImageKey}`
                  : '/login-fondo.webp'
              }
              alt={forum.title}
              className="object-cover transition-transform duration-500 group-hover:scale-110"
              fill
            />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/60 to-transparent" />

            {/* Badge del curso */}
            <div className="absolute top-3 left-3">
              <span className="rounded-full bg-primary/20 px-3 py-1 text-xs font-medium text-primary backdrop-blur-sm">
                {forum.course.title}
              </span>
            </div>

            {/* Título sobre la imagen */}
            <div className="absolute bottom-3 left-4 right-4">
              <h2 className="text-lg font-bold text-white line-clamp-2">
                {forum.title}
              </h2>
            </div>
          </div>

          {/* Contenido */}
          <div className="flex flex-1 flex-col p-4">
            {/* Descripción - altura fija */}
            <p className="mb-4 h-10 line-clamp-2 text-sm text-gray-400">
              {forum.description}
            </p>

            {/* Meta info */}
            <div className="mb-4 flex flex-wrap items-center gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" />
                <span
                  className="truncate max-w-[100px]"
                  title={forum.instructor?.name ?? 'Sin nombre'}
                >
                  {forum.instructor?.name ?? 'Sin nombre'}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                <span>{formatDate(forum.createdAt)}</span>
              </div>
            </div>

            {/* Spacer para empujar acciones al fondo */}
            <div className="flex-1" />

            {/* Acciones */}
            <div className="mt-auto flex items-center justify-between gap-2">
              <Link
                href={`/dashboard/super-admin/foro/${forum.id}`}
                className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-center text-sm font-semibold text-black transition-all hover:opacity-90"
              >
                Ver foro
              </Link>

              {forum.user.id === user?.id && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button className="rounded-xl border border-red-500/30 bg-red-500/10 p-2.5 text-red-400 transition-all hover:bg-red-500/20">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="border-gray-800 bg-gray-900">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-white">
                        ¿Estás seguro?
                      </AlertDialogTitle>
                      <AlertDialogDescription className="text-gray-400">
                        Esto eliminará el foro{' '}
                        <strong className="text-white">{forum.title}</strong> y
                        todo su contenido asociado.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="border-gray-700 bg-gray-800 text-white hover:bg-gray-700">
                        Cancelar
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(forum.id)}
                        className="bg-red-600 text-white hover:bg-red-700"
                      >
                        Eliminar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
