"use client";

import { useUser } from "@clerk/nextjs";
import { useCallback, useEffect, useState } from "react";
import { FiPlus } from "react-icons/fi";
import CourseListTeacher from "~/components/layout/CourseListTeacher";
import { SkeletonCard } from "~/components/layout/SkeletonCard";
import ModalFormCourse from "~/components/modals/ModalFormCourse";
import { Button } from "~/components/ui/button";
import { toast } from "~/hooks/use-toast";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "~/components/ui/breadcrumb";

export interface CourseModel {
  id: number;
  title: string;
  description: string;
  categoryid: {
    id: number;
    name: string;
    description: string;
  };
  modalidadesid: {
    id: number;
    name: string;
  };
  instructor: string;
  coverImageKey: string;
  creatorId: string;
}

export function LoadingCourses() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 mt-10">
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
      const response = await fetch(`/api/educadores?userId=${user.id}`);
      if (response.ok) {
        const data = (await response.json()) as CourseModel[];
        setCourses(
          data.map((course) => ({
            ...course,
            coverImageKey: course.coverImageKey ?? "",
          })) as CourseModel[],
        );
      } else {
        const errorData = await response.json();
        const errorMessage = errorData.error || response.statusText;
        setError(`Error al cargar los cursos: ${errorMessage}`);
        toast({
          title: "Error",
          description: `No se pudieron cargar los cursos: ${errorMessage}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Error desconocido";
      setError(`Error al cargar los cursos: ${errorMessage}`);
      toast({
        title: "Error",
        description: `No se pudieron cargar los cursos: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCourses().catch((error) =>
      console.error("Error fetching courses:", error),
    );
  }, [user, fetchCourses]);

  const handleCreateOrEditCourse = async (
    title: string,
    description: string,
    file: File | null,
    categoryId: number,
    modalidadId: number,
  ) => {
    if (!user) return;

    let coverImageKey = "";
    if (file) {
      setUploading(true);
      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentType: file.type }),
      });

      type UploadResponse = { url: string; fields: Record<string, string> };
      const { url, fields } = (await uploadResponse.json()) as UploadResponse;

      const formData = new FormData();
      Object.entries(fields).forEach(([key, value]) =>
        formData.append(key, value),
      );
      formData.append("file", file);

      await fetch(url, { method: "POST", body: formData });
      coverImageKey = fields.key ?? "";
      setUploading(false);
    }

    const response = await fetch("/api/educadores", {
      method: editingCourse ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editingCourse?.id,
        title,
        description,
        coverImageKey,
        categoryid: categoryId,
        modalidadesid: modalidadId,
        instructor: user.fullName,
        userId: user.id,
      }),
    });

    if (response.ok) {
      toast({
        title: editingCourse ? "Curso actualizado" : "Curso creado",
        description: editingCourse
          ? "El curso se actualizó con éxito"
          : "El curso se creó con éxito",
      });
      fetchCourses().catch((error) =>
        console.error("Error fetching courses:", error),
      );
      setEditingCourse(null);
      setIsModalOpen(false);
    } else {
      const errorData = (await response.json()) as { error?: string };
      toast({
        title: "Error",
        description:
          errorData.error ?? "Ocurrió un error al procesar la solicitud",
        variant: "destructive",
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
            <BreadcrumbLink className="hover:text-gray-300" href="/dashboard/educadores">
              Inicio
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
        </BreadcrumbList>
      </Breadcrumb>
        <div className="container mx-auto px-2">
          <div className="mt-2 flex justify-between">
            <h1 className="text-3xl font-bold">Panel de control de cursos</h1>
            <Button
              onClick={handleCreateCourse}
              className="transform bg-primary text-background transition-transform hover:text-primary active:scale-95"
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
              <p className="mt-2 text-gray-500">
                Comienza creando tu primer curso haciendo clic en el botón
                "Crear Curso"
              </p>
            </div>
          ) : (
            <>
              <h2 className="mb-4 mt-10 text-2xl font-bold">
                Lista de cursos creados
              </h2>
              <CourseListTeacher
                courses={courses as CourseModel[]}
              />
            </>
          )}
          {isModalOpen && (
            <ModalFormCourse
              onSubmitAction={handleCreateOrEditCourse}
              uploading={uploading}
              editingCourseId={editingCourse ? editingCourse.id : null}
              title={editingCourse?.title ?? ""}
              setTitle={(title: string) =>
                setEditingCourse((prev) => (prev ? { ...prev, title } : null))
              }
              description={editingCourse?.description ?? ""}
              setDescription={(description: string) =>
                setEditingCourse((prev) =>
                  prev ? { ...prev, description } : null,
                )
              }
              category={editingCourse?.categoryid.id ?? 0}
              setCategory={(categoryId: number) =>
                setEditingCourse((prev) =>
                  prev
                    ? {
                        ...prev,
                        categoryid: { ...prev.categoryid, id: categoryId },
                      }
                    : null,
                )
              }
              modalidad={editingCourse?.modalidadesid.id ?? 0}
              setModalidad={(modalidadId: number) =>
                setEditingCourse((prev) =>
                  prev
                    ? {
                        ...prev,
                        modalidadesid: {
                          ...prev.modalidadesid,
                          id: modalidadId,
                        },
                      }
                    : null,
                )
              }
              coverImageKey={editingCourse?.coverImageKey ?? ""}
              setCoverImageKey={(coverImageKey: string) =>
                setEditingCourse((prev) =>
                  prev ? { ...prev, coverImageKey } : null,
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
