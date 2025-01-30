'use client';

import { useCallback, useEffect, useState } from 'react';

import { useUser } from '@clerk/nextjs';
import { FiPlus } from 'react-icons/fi';

import CourseListTeacher from '~/components/educators/layout/CourseListTeacher';
import { SkeletonCard } from '~/components/educators/layout/SkeletonCard';
import ModalFormCourse from '~/components/educators/modals/ModalFormCourse';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '~/components/educators/ui/breadcrumb';
import { Button } from '~/components/educators/ui/button';
import { toast } from '~/hooks/use-toast';

export interface CourseModel {
  id: number;
  title: string;
  description: string;
  categoryid: string;
  modalidadesid: string;
  createdAt: string;
  instructor: string;
  coverImageKey: string;
  creatorId: string;
  dificultadid: string; // Add this line
  requerimientos: string;
}

export function LoadingCourses() {
  return (
    <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 9 }).map((_, index) => (
        <SkeletonCard key={index} />
      ))}
    </div>
  );
}

export default function Page() {
  const { user } = useUser();
  const [courses, setCourses] = useState<CourseModel[]>([]);
  const [editingCourse, setEditingCourse] = useState<CourseModel | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCourses = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/educadores/courses?userId=${user.id}`);
      if (response.ok) {
        const data = (await response.json()) as CourseModel[];
        setCourses(
          data.map((course) => ({
            ...course,
            dificultadid: course.dificultadid ?? '', // Map it properly
            categoryid: course.categoryid, // Map categoryid properly
            modalidadesid: course.modalidadesid, // Map modalidadesid properly
          })) as CourseModel[]
        );
      } else {
        const errorData = (await response.json()) as { error?: string };
        const errorMessage = errorData.error ?? response.statusText;
        setError(`Error al cargar los cursos: ${errorMessage}`);
        toast({
          title: 'Error',
          description: `No se pudieron cargar los cursos: ${errorMessage}`,
          variant: 'destructive',
        });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
      setError(`Error al cargar los cursos: ${errorMessage}`);
      toast({
        title: 'Error',
        description: `No se pudieron cargar los cursos: ${errorMessage}`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCourses().catch((error) =>
      console.error('Error fetching courses:', error)
    );
  }, [user, fetchCourses]);

  const handleCreateOrEditCourse = async (
    id: string,
    title: string,
    description: string,
    file: File | null,
    categoryid: number,
    modalidadesid: number,
    dificultadid: number,
    requerimientos: string
  ) => {
    if (!user) return;
    let coverImageKey = '';
    try {
      setUploading(true);
      if (file) {
        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contentType: file.type, fileSize: file.size }),
        });

        if (!uploadResponse.ok) {
          throw new Error(
            `Error: al iniciar la carga: ${uploadResponse.statusText}`
          );
        }

        const { url, fields } = (await uploadResponse.json()) as {
          url: string;
          fields: Record<string, string>;
        };

        const formData = new FormData();
        Object.entries(fields).forEach(([key, value]) => {
          if (typeof value === 'string') {
            formData.append(key, value);
          }
        });
        formData.append('file', file);

        await fetch(url, {
          method: 'POST',
          body: formData,
        });
        if (!uploadResponse.ok) {
          throw new Error(
            `Error: al iniciar la carga: ${uploadResponse.statusText}`
          );
        }
        coverImageKey = fields.key ?? '';
      }
      setUploading(false);
    } catch (e) {
      throw new Error(`Error to upload the file type ${(e as Error).message}`);
    }
    const response = await fetch('/api/educadores/courses', {
      method: editingCourse ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: editingCourse?.id,
        title,
        description,
        coverImageKey,
        categoryid,
        modalidadesid,
        instructor: user.fullName,
        userId: user.id,
        dificultadid,
        requerimientos,
      }),
    });

    if (response.ok) {
      toast({
        title: editingCourse ? 'Curso actualizado' : 'Curso creado',
        description: editingCourse
          ? 'El curso se actualizó con éxito'
          : 'El curso se creó con éxito',
      });
      fetchCourses().catch((error) =>
        console.error('Error fetching courses:', error)
      );
      setEditingCourse(null);
      setIsModalOpen(false);
    } else {
      const errorData = (await response.json()) as { error?: string };
      toast({
        title: 'Error',
        description:
          errorData.error ?? 'Ocurrió un error al procesar la solicitud',
        variant: 'destructive',
      });
    }
  };

  const handleCreateCourse = () => {
    setEditingCourse(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <main className="h-auto">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink
                className="hover:text-gray-300"
                href="../educadores"
              >
                Inicio
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink className="hover:text-gray-300" href="/">
                Lista de cursos
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
          </BreadcrumbList>
        </Breadcrumb>
        <div className="container mx-auto px-2">
          <div className="mt-2 flex justify-between">
            <h1 className="text-3xl font-bold">Panel de cursos</h1>
            <Button
              onClick={handleCreateCourse}
              className="bg-primary text-background transition-transform hover:text-primary active:scale-95"
            >
              <FiPlus className="mr-2" />
              Crear Curso
            </Button>
          </div>
          {loading ? (
            <LoadingCourses />
          ) : error ? (
            <div className="mt-10 flex flex-col items-center justify-center py-10 text-center">
              <p className="text-xl text-red-600">{error}</p>
            </div>
          ) : courses.length === 0 ? (
            <div className="mt-10 flex flex-col items-center justify-center py-10 text-center">
              <h2 className="mb-4 text-2xl font-bold">
                Lista de cursos creados
              </h2>
              <p className="text-xl text-gray-600">
                No hay cursos creados todavía
              </p>
              <p className="my-2 text-gray-500">
                Comienza creando tu primer curso haciendo clic en el botón
                "Crear Curso"
              </p>
              <span>&#128071;&#128071;&#128071;</span>
              <Button
                onClick={handleCreateCourse}
                className="mt-5 bg-primary text-background transition-transform hover:text-primary active:scale-95"
              >
                <FiPlus className="mr-2" />
                Crear Curso
              </Button>
            </div>
          ) : (
            <>
              <h2 className="mb-4 mt-5 text-2xl font-bold">
                Lista de cursos creados
              </h2>
              <CourseListTeacher courses={courses} />
            </>
          )}
          {isModalOpen && (
            <ModalFormCourse
              onSubmitAction={handleCreateOrEditCourse}
              uploading={uploading}
              editingCourseId={editingCourse ? editingCourse.id : null}
              title={editingCourse?.title ?? ''}
              setTitle={(title: string) =>
                setEditingCourse((prev) => (prev ? { ...prev, title } : null))
              }
              description={editingCourse?.description ?? ''}
              setDescription={(description: string) =>
                setEditingCourse((prev) =>
                  prev ? { ...prev, description } : null
                )
              }
              requerimientos={editingCourse?.requerimientos ?? ''}
              setRequerimientos={(requerimientos: string) =>
                setEditingCourse((prev) =>
                  prev ? { ...prev, requerimientos } : null
                )
              }
              categoryid={editingCourse ? Number(editingCourse.categoryid) : 0}
              setCategoryid={(categoryid: number) =>
                setEditingCourse((prev) =>
                  prev ? { ...prev, categoryid: String(categoryid) } : null
                )
              }
              modalidadesid={Number(editingCourse?.modalidadesid) ?? 0}
              setModalidadesid={(modalidadesid: number) =>
                setEditingCourse((prev) =>
                  prev
                    ? { ...prev, modalidadesid: String(modalidadesid) }
                    : null
                )
              }
              dificultadid={Number(editingCourse?.dificultadid) ?? 0}
              setDificultadid={(dificultadid: number) =>
                setEditingCourse((prev) =>
                  prev ? { ...prev, dificultadid: String(dificultadid) } : null
                )
              }
              coverImageKey={editingCourse?.coverImageKey ?? ''}
              setCoverImageKey={(coverImageKey: string) =>
                setEditingCourse((prev) =>
                  prev ? { ...prev, coverImageKey } : null
                )
              }
              isOpen={isModalOpen}
              onCloseAction={handleCloseModal}
            />
          )}
        </div>
      </main>
    </>
  );
}
