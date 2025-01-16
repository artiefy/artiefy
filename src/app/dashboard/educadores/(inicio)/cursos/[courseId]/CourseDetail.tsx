'use client';

import { useCallback, useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { Upload } from 'lucide-react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { LoadingCourses } from '~/app/dashboard/educadores/(inicio)/cursos/page';
import LessonsListEducator from '~/components/educators/layout/LessonsListEducator'; // Importar el componente
import ModalFormCourse from '~/components/educators/modals/ModalFormCourse';
import ModalFormLessons from '~/components/educators/modals/ModalFormLessons';
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
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '~/components/educators/ui/breadcrumb';
import { Button } from '~/components/educators/ui/button';
import { Card, CardHeader, CardTitle } from '~/components/educators/ui/card';
import { toast } from '~/hooks/use-toast';

interface Course {
  id: number;
  title: string;
  description: string;
  categoryid: string;
  dificultadid: string;
  modalidadesid: string;
  instructor: string;
  coverImageKey: string;
  creatorId: string;
  createdAt: string;
  updatedAt: string;
}
interface CourseDetailProps {
  courseId: number;
}

const CourseDetail: React.FC<CourseDetailProps> = ({ courseId }) => {
  const { user } = useUser();
  const router = useRouter();
  const { courseIdUrl } = useParams();
  const [course, setCourse] = useState<Course | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalOpenLessons, setIsModalOpenLessons] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState(0);
  const [editModalidad, setEditModalidad] = useState(0);
  const [editDificultad, setEditDificultad] = useState(0);
  const [editCoverImageKey, setEditCoverImageKey] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Verifica que courseId no sea un array ni undefined, y lo convierte a número
  const courseIdString = Array.isArray(courseIdUrl)
    ? courseIdUrl[0]
    : courseIdUrl;
  const courseIdNumber = courseIdString ? parseInt(courseIdString) : null;

  const fetchCourse = useCallback(async () => {
    if (!user) return;
    if (courseIdNumber !== null) {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(
          `/api/educadores/courses/${courseIdNumber}`
        );

        if (response.ok) {
          const data = (await response.json()) as Course;
          console.log(data);
          setCourse(data);
        } else {
          const errorData = (await response.json()) as { error?: string };
          const errorMessage = errorData.error ?? response.statusText;
          setError(`Error al cargar el curso: ${errorMessage}`);
          toast({
            title: 'Error',
            description: `No se pudo cargar el curso: ${errorMessage}`,
            variant: 'destructive',
          });
        }
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : 'Error desconocido';
        setError(`Error al cargar el curso: ${errorMessage}`);
        toast({
          title: 'Error',
          description: `No se pudo cargar el curso: ${errorMessage}`,
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    }
  }, [user, courseId]);

  useEffect(() => {
    fetchCourse().catch((error) =>
      console.error('Error fetching course:', error)
    );
  }, [fetchCourse]);

  const handleUpdateCourse = async (
    id: string,
    title: string,
    description: string,
    file: File | null,
    categoryid: number,
    modalidadesid: number,
    dificultadid: number
  ) => {
    try {
      let coverImageKey = course?.coverImageKey ?? '';

      if (file) {
        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contentType: file.type }),
        });

        if (!uploadResponse.ok) {
          throw new Error('Error al subir la imagen');
        }

        const uploadData = (await uploadResponse.json()) as {
          url: string;
          fields: Record<string, string>;
        };

        const { url, fields } = uploadData;
        const formData = new FormData();
        Object.entries(fields).forEach(([key, value]) =>
          formData.append(key, value)
        );
        formData.append('file', file);

        const uploadResult = await fetch(url, {
          method: 'POST',
          body: formData,
        });
        if (!uploadResult.ok) {
          throw new Error('Error al subir la imagen al servidor');
        }

        coverImageKey = fields.key ?? '';
      }

      const response = await fetch(
        `/api/educadores/courses/${courseIdNumber}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            description,
            coverImageKey,
            categoryid,
            modalidadesid,
            dificultadid,
            instructor: course?.instructor,
          }),
        }
      );

      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string };
        throw new Error(errorData.error ?? 'Error al actualizar el curso');
      }

      const updatedCourse = (await response.json()) as Course;
      setCourse(updatedCourse);
      setIsModalOpen(false);
      toast({
        title: 'Curso actualizado',
        description: 'El curso se ha actualizado con éxito.',
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Error desconocido',
        variant: 'destructive',
      });
    }
  };

  if (loading) return <div>Cargando curso...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!course) return <div>No se encontró el curso.</div>;

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/educadores/courses?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Error al eliminar el curso');
      router.push('/dashboard/educadores/cursos');
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div className="container mx-auto h-auto w-full rounded-lg bg-background p-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink
              className="hover:text-gray-300"
              href="/dashboard/educadores/cursos"
            >
              Cursos
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink className="hover:text-gray-300">
              Detalles curso {course.title}
            </BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <Card className="mt-3 overflow-hidden bg-gray-300 px-4">
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
                className="mx-4 border-yellow-500 bg-yellow-500 text-white hover:bg-white hover:text-yellow-500"
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
                      <span className="font-bold"> {course.title}</span> y todos
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
            <h2 className="text-2xl font-bold">Información del curso</h2>
            <br />
            <div className="grid grid-cols-2">
              <div className="flex flex-col">
                <h2 className="text-lg font-semibold">Curso:</h2>
                <h1 className="mb-4 text-2xl font-bold">{course.title}</h1>
              </div>
              <div className="flex flex-col">
                <h2 className="text-lg font-semibold">Categoría:</h2>
                <p className="text-gray-600">{course.categoryid}</p>
              </div>
            </div>
            <div className="mb-4">
              <h2 className="text-lg font-semibold">Descripción:</h2>
              <p className="text-justify text-gray-600">{course.description}</p>
            </div>
            <div className="grid grid-cols-3">
              <div className="flex flex-col">
                <h2 className="text-lg font-semibold">Educador:</h2>
                <p className="text-gray-600">{course.instructor}</p>
              </div>
              <div className="flex flex-col">
                <h2 className="text-lg font-semibold">Dificultad:</h2>
                <p className="text-gray-600">{course.dificultadid}</p>
              </div>
              <div className="flex flex-col">
                <h2 className="text-lg font-semibold">Modalidad:</h2>
                <p className="text-gray-600">{course.modalidadesid}</p>
              </div>
            </div>
          </div>
        </div>
        <div>
          <Button
            className="cursor-pointer bg-white"
            onClick={() => {
              setIsModalOpenLessons(true);
            }}
          >
            <Upload />
            Crear clase
          </Button>
        </div>
      </Card>
      {loading ? (
        <LoadingCourses />
      ) : courseIdNumber !== null ? ( // Cambiado de "lessons" a "lessons.length > 0"
        <>
          <LessonsListEducator courseId={courseIdNumber} />
        </>
      ) : (
        <></>
      )}
      <ModalFormCourse
        isOpen={isModalOpen}
        onSubmitAction={(
          id: string,
          title: string,
          description: string,
          file: File | null,
          categoryid: number,
          modalidadesid: number,
          dificultadid: number
        ) =>
          handleUpdateCourse(
            id,
            title,
            description,
            file,
            categoryid,
            modalidadesid,
            dificultadid
          )
        }
        editingCourseId={course.id}
        title={editTitle}
        description={editDescription}
        categoryid={editCategory}
        modalidadesid={editModalidad}
        dificultadid={editDificultad}
        coverImageKey={editCoverImageKey}
        uploading={false}
        setTitle={setEditTitle}
        setDescription={setEditDescription}
        setModalidadesid={setEditModalidad}
        setCategoryid={setEditCategory}
        setDificultadid={setEditDificultad}
        setCoverImageKey={setEditCoverImageKey}
        onCloseAction={() => setIsModalOpen(false)}
      />
      {courseIdNumber !== null && (
        <ModalFormLessons
          isOpen={isModalOpenLessons}
          onCloseAction={() => setIsModalOpenLessons(false)}
          courseId={courseIdNumber}
          uploading={false}
        />
      )}
    </div>
  );
};

export default CourseDetail;
