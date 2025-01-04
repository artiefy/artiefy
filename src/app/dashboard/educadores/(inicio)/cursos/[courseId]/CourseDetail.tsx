"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { LoadingCourses } from "~/app/dashboard/educadores/(inicio)/cursos/page";
import ModalFormCourse from "~/components/modals/ModalFormCourse";
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
} from "~/components/ui/alert-dialog";
import { Button } from "~/components/ui/button";
import { Card, CardHeader, CardTitle } from "~/components/ui/card";
import { toast } from "~/hooks/use-toast";

interface Course {
  id: number;
  title: string;
  description: string;
  coverImageKey: string;
  categoryid: {
    id: number;
    name: string;
  };
  modalidadesid: {
    id: number;
    name: string;
  };
  instructor: string;
}

interface CourseDetailProps {
  courseId: string;
}

export default function CourseDetail({ courseId }: CourseDetailProps) {
  const [course, setCourse] = useState<Course | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] = useState(0);
  const [editModalidad, setEditModalidad] = useState(0);
  const [editRating, setEditRating] = useState(0);
  const [editCoverImageKey, setEditCoverImageKey] = useState("");

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const response = await fetch(`/api/courses/${courseId}`);
        const data = await response.json();
        setCourse(data);
        setEditTitle(data.title);
        setEditDescription(data.description);
        setEditCategory(data.categoryid.id);
        setEditModalidad(data.modalidadesid.id);
        setEditCoverImageKey(data.coverImageKey);
      } catch (error) {
        console.error("Error al cargar el curso:", error);
      }
    };
    fetchCourse();
  }, [courseId]);

  const handleUpdateCourse = async (
    title: string,
    description: string,
    file: File | null,
    categoryId: number,
    modalidadId: number,
    rating: number,
  ) => {
    try {
      let coverImageKey = course?.coverImageKey || "";

      if (file) {
        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contentType: file.type }),
        });

        if (!uploadResponse.ok) {
          throw new Error("Error al subir la imagen");
        }

        const { url, fields } = await uploadResponse.json();
        const formData = new FormData();
        Object.entries(fields).forEach(([key, value]) =>
          formData.append(key, value as string),
        );
        formData.append("file", file);

        const uploadResult = await fetch(url, {
          method: "POST",
          body: formData,
        });
        if (!uploadResult.ok) {
          throw new Error("Error al subir la imagen al servidor");
        }

        coverImageKey = fields.key;
      }

      const response = await fetch(`/api/courses/${courseId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          coverImageKey,
          categoryId,
          modalidadId,
          rating,
          instructor: course?.instructor,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al actualizar el curso");
      }

      const updatedCourse = await response.json();
      setCourse(updatedCourse);
      setIsModalOpen(false);

      toast({
        title: "Curso actualizado",
        description: "El curso se ha actualizado correctamente",
      });
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      });
    }
  };

  if (!course) return <LoadingCourses />;

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/courses?id=${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Error al eliminar el curso");
      window.location.href = "/dashboard/profesores/cursos";
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <div className="container mx-auto h-auto w-full rounded-lg bg-white p-6">
      <Card className="overflow-hidden bg-gray-300 px-4">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">
            Curso: {course.title}
          </CardTitle>
        </CardHeader>
        <div className="grid gap-6 md:grid-cols-2">
          {/* Columna izquierda - Imagen */}
          <div className="flex flex-col">
            <div className="relative aspect-video">
              <Image
                src={`${process.env.NEXT_PUBLIC_AWS_S3_URL}/${course.coverImageKey}`}
                alt={course.title}
                fill
                className="rounded-lg object-cover"
                priority
              />
            </div>
            <div className="px-3 py-6">
              <Button
                onClick={() => setIsModalOpen(true)}
                className="mx-4 border-yellow-500 bg-primary bg-yellow-500 text-white hover:text-yellow-500"
              >
                Editar curso
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button className="mx-4 border-red-600 bg-red-600 text-white hover:border-red-600 hover:bg-white hover:text-red-600">
                    Eliminar
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción no se puede deshacer. Se eliminará
                      permanentemente el curso
                      <span className="font-bold">{course.title}</span> y todos
                      los datos asociados a este.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDelete(course.id.toString())}
                      className="border-red-600 bg-red-600 text-white hover:border-red-700 hover:bg-transparent hover:text-red-700"
                    >
                      Eliminar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          {/* Columna derecha - Información */}
          <div className="pb-6">
            <h2 className="text-xl font-bold">Información del curso</h2>
            <br />
            <div className="grid grid-cols-2">
              <div className="flex flex-col">
                <h2 className="text-lg font-semibold">Curso:</h2>
                <h1 className="mb-4 text-2xl font-bold">{course.title}</h1>
              </div>
              <div className="flex flex-col">
                <h2 className="text-lg font-semibold">Categoría:</h2>
                <p className="text-gray-600">{course.categoryid.name}</p>
              </div>
            </div>
            <div className="mb-4">
              <h2 className="text-lg font-semibold">Descripción:</h2>
              <p className="text-gray-600">{course.description}</p>
            </div>
            <div className="grid grid-cols-2">
              <div className="flex flex-col">
                <h2 className="text-lg font-semibold">Educador:</h2>
                <p className="text-gray-600">{course.instructor}</p>
              </div>
              <div className="flex flex-col">
                <h2 className="text-lg font-semibold">Modalidad:</h2>
                <p className="text-gray-600">{course.modalidadesid.name}</p>
              </div>
            </div>
          </div>
        </div>
      </Card>
      <ModalFormCourse
        isOpen={isModalOpen}
        onCloseAction={() => setIsModalOpen(false)}
        onSubmitAction={handleUpdateCourse}
        editingCourseId={course.id}
        title={editTitle}
        description={editDescription}
        category={editCategory}
        modalidad={editModalidad}
        rating={editRating}
        coverImageKey={editCoverImageKey}
        uploading={false}
        setTitle={setEditTitle}
        setDescription={setEditDescription}
        setModalidad={setEditModalidad}
        setCategory={setEditCategory}
        setRating={setEditRating}
        setCoverImageKey={setEditCoverImageKey}
      />
    </div>
  );
}
