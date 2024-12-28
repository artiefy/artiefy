"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { AspectRatio } from "~/components/ui/aspect-ratio";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Header } from "~/components/layout/Header";
import Footer from "~/components/layout/Footer";

interface Course {
  id: string;
  title: string;
  coverImageKey: string;
  category: string;
  description: string;
  instructor: string;
  rating?: number;
}

export default function CourseDetails() {
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const { id } = useParams(); // Obtener el ID de los parámetros de la URL

  useEffect(() => {
    // Verificar si el ID está presente
    if (!id) {
      console.error("No se ha proporcionado un ID válido.");
      setLoading(false);
      return;
    }

    const fetchCourse = async () => {
      try {
        // Realizar la petición para obtener los detalles del curso
        const response = await fetch(`/api/courses/${Array.isArray(id) ? id[0] : id}`);
        console.log("Status de la respuesta:", response.status); // Agregar registro para depurar
        if (!response.ok) throw new Error("Curso no encontrado"); // Manejo de errores si la respuesta no es exitosa
        const data = (await response.json()) as Course;
        setCourse(data); // Guardar los datos del curso
      } catch (error) {
        console.error("Error al obtener los detalles del curso:", error);
      } finally {
        setLoading(false); // Finalizar el estado de carga
      }
    };

    void fetchCourse();
  }, [id]); // Ejecutar cuando el ID cambie

  if (loading) {
    return <div className="text-center">Cargando curso...</div>; // Mensaje mientras se carga el curso
  }

  if (!course) {
    return <div className="text-center">Curso no encontrado.</div>; // Mensaje si no se encuentra el curso
  }

  return (
    <div>
      <Header />
      <main className="container mx-auto px-40 md:px-48">
        <div className="my-12">
          <AspectRatio ratio={16 / 9}>
            <Image
              src={`${process.env.NEXT_PUBLIC_AWS_S3_URL}/${course.coverImageKey}`}
              alt={course.title}
              fill
              className="object-cover"
            />
          </AspectRatio>
          <div className="mt-8 flex flex-col space-y-4">
            <h1 className="text-4xl font-bold text-primary">{course.title}</h1>
            <div className="flex items-center space-x-4">
              <Badge
                variant="outline"
                className="border-primary bg-background text-primary"
              >
                {course.category}
              </Badge>
              <span className="text-sm font-bold text-gray-600">
                Categoría
              </span>
            </div>
            <p className="text-lg text-gray-700">{course.description}</p>
            <p className="text-lg font-bold text-gray-800">
              Instructor: <span className="italic underline">{course.instructor}</span>
            </p>
            <div className="flex items-center">
              <span className="text-lg font-bold text-yellow-500">
                {(course.rating ?? 0).toFixed(1)}
              </span>
              <span className="ml-2 text-gray-600">/ 5.0</span>
            </div>
            <Button className="mt-4 w-full bg-primary text-white hover:bg-primary-dark">
              Inscribirse en el curso
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
