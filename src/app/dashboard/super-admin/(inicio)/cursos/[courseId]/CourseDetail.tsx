'use client';

import { useCallback, useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '~/components/educators/ui/breadcrumb';
import { Button } from '~/components/educators/ui/button';
import { Card, CardHeader, CardTitle } from '~/components/educators/ui/card';
import { Label } from '~/components/educators/ui/label';
import { toast } from '~/hooks/use-toast';
import LessonsListEducator from './../../../components/layout/LessonsListEducator';
import ModalFormCourse from './../../../components/modals/ModalFormCourse';

interface Course {
  id: number;
  title: string;
  description: string;
  categoryid: string;
  dificultadid: string;
  modalidadesid: string;
  instructor: string;
  coverImageKey: string;
  createdAt: string;
  requerimientos: string;
}

const CourseDetail = () => {
  const { user } = useUser();
  const router = useRouter();
  const params = useParams();
  const courseIdUrl = params?.courseId as string | undefined;
  const [course, setCourse] = useState<Course | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string>('#000000');
  const predefinedColors = ['#000000', '#FFFFFF', '#1f2937'];

  // 🔍 Validar courseId antes de convertirlo
  const courseIdNumber = courseIdUrl && !isNaN(Number(courseIdUrl)) ? Number(courseIdUrl) : null;

  console.log('🔍 courseId obtenido:', courseIdNumber);
  useEffect(() => {
	async function fetchCourse() {
	  try {
		setLoading(true);
    const response = await fetch(`/api/courses/${courseIdNumber}`);
		if (!response.ok) throw new Error('Curso no encontrado');
    const data = (await response.json()) as Course;
		setCourse(data);
	  } catch (error) {
		console.error('Error cargando el curso:', error);
		setError('No se pudo cargar el curso.');
	  } finally {
		setLoading(false);
	  }
	}
  void fetchCourse();
  }, [courseIdNumber]);
  
  
  

  const fetchCourse = useCallback(async () => {
    if (!user || !courseIdNumber) return;

    try {
      setLoading(true);
      setError(null);

      console.log('🚀 Solicitando datos del curso...');
      const response = await fetch(`/api/super-admin/courses/${courseIdNumber}`);

      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string };
        console.error('❌ Error en la API:', errorData);
        throw new Error(errorData.error ?? `Error HTTP: ${response.status}`);
      }

      const data = (await response.json()) as Course;
      console.log('✅ Curso obtenido:', data);
      setCourse(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      console.error('❌ Error al cargar el curso:', errorMessage);
      setError(`Error al cargar el curso: ${errorMessage}`);
      toast({ title: 'Error', description: `No se pudo cargar el curso: ${errorMessage}`, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [user, courseIdNumber]);

  useEffect(() => {
    void fetchCourse();
  }, [fetchCourse]);

  useEffect(() => {
    const savedColor = localStorage.getItem(`selectedColor_${courseIdNumber}`);
    if (savedColor) setSelectedColor(savedColor);
  }, [courseIdNumber]);

  if (loading) return <div className="text-center text-lg">🔄 Cargando curso...</div>;
  if (error) return <div className="text-center text-red-500">{error}</div>;
  if (!course) return <div className="text-center text-gray-500">❌ No se encontró el curso.</div>;

  return (
    <div className="container h-auto w-full rounded-lg bg-background p-6">
      {/* 🔗 Navegación Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard/super-admin" className="hover:text-gray-300">Inicio</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard/super-admin/cursos" className="hover:text-gray-300">Lista de cursos</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink className="hover:text-gray-300">Detalles del curso</BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* 📌 Card de Información del Curso */}
      <Card className="relative z-20 mt-3 overflow-hidden border-none bg-black p-4 text-white">
        <CardHeader className="grid w-full grid-cols-2">
          <CardTitle className="text-2xl font-bold">Curso: {course.title}</CardTitle>
          <div className="ml-9 flex flex-col">
            <Label className="text-white">Seleccione un color:</Label>
            <div className="mt-2 flex space-x-2">
              {predefinedColors.map((color) => (
                <Button key={color} style={{ backgroundColor: color }} className="size-8" onClick={() => setSelectedColor(color)} />
              ))}
            </div>
          </div>
        </CardHeader>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="relative aspect-video w-full">
            <Image
              src={`${process.env.NEXT_PUBLIC_AWS_S3_URL}/${course.coverImageKey}`}
              alt={course.title}
              width={300}
              height={100}
              className="mx-auto rounded-lg object-contain"
              priority
              quality={75}
            />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Información del curso</h2>
            <p className="text-lg">{course.description}</p>
            <p className="text-lg">Instructor: {course.instructor}</p>
            <p className="text-lg">Categoría: {course.categoryid}</p>
            <p className="text-lg">Dificultad: {course.dificultadid}</p>
            <p className="text-lg">Modalidad: {course.modalidadesid}</p>
            <p className="text-lg">Requerimientos: {course.requerimientos}</p>
          </div>
        </div>
      </Card>

      {/* 📚 Lista de Lecciones */}
      {courseIdNumber && <LessonsListEducator courseId={courseIdNumber} selectedColor={selectedColor} />}
    </div>
  );
};

export default CourseDetail;
