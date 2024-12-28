"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { FaStar, FaChevronDown, FaChevronUp, FaClock, FaCalendar, FaUserGraduate } from "react-icons/fa";
import { Button } from "~/components/ui/button";
import { Header } from "~/components/layout/Header";
import Footer from "~/components/layout/Footer";
import { Skeleton } from "~/components/ui/skeleton";

interface Course {
  id: string;
  title: string;
  coverImageKey: string;
  category: string;
  description: string;
  instructor: string;
  rating?: number;
  createdAt: string;
  updatedAt: string;
  totalStudents: number;
  lessons: {
    id: number;
    title: string;
    duration: number; // Duración de la lección en horas
    description: string;
  }[];
}

export default function CourseDetails() {
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedLesson, setExpandedLesson] = useState<number | null>(null);
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

  const toggleLesson = (lessonId: number) => {
    setExpandedLesson(expandedLesson === lessonId ? null : lessonId);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toISOString().split("T")[0];
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-7xl mx-auto pb-4 md:pb-6 lg:pb-8">
        {loading ? (
          <Skeleton className="h-[500px] w-full rounded-lg" />
        ) : (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            {/* Course Header */}
            <div className="relative h-72 overflow-hidden">
              <Image
                src={`${process.env.NEXT_PUBLIC_AWS_S3_URL}/${course?.coverImageKey}`}
                alt={course?.title ?? "Course image"}
                fill
                className="object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
                <h1 className="text-white text-3xl font-bold">{course?.title}</h1>
              </div>
            </div>

            {/* Course Info */}
            <div className="p-6">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div className="flex items-center space-x-4">
                  <div>
                    <h3 className="text-lg font-semibold text-background">{course?.instructor}</h3>
                    <p className="text-gray-600">Instructor</p>
                  </div>
                </div>
                <div className="flex items-center space-x-6">
                  <div className="flex items-center">
                    <FaUserGraduate className="text-blue-600 mr-2" />
                    <span className="text-background">{course?.totalStudents} Estudiantes</span>
                  </div>
                  <div className="flex items-center">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <FaStar
                        key={index}
                        className={`w-5 h-5 ${index < Math.floor(course?.rating ?? 0) ? "text-yellow-400" : "text-gray-300"}`}
                      />
                    ))}
                    <span className="ml-2 text-lg font-semibold text-yellow-400">{course?.rating?.toFixed(1)}</span>
                  </div>
                </div>
              </div>

              <div className="prose max-w-none mb-8">
                <p className="text-gray-700 leading-relaxed">{course?.description}</p>
              </div>

              <div className="flex flex-wrap gap-4 mb-8 text-sm text-gray-600">
                <div className="flex items-center">
                  <FaCalendar className="mr-2" />
                  <span>Creado: {course?.createdAt ? formatDate(course.createdAt) : "Fecha no disponible"}</span>
                </div>
                <div className="flex items-center">
                  <FaClock className="mr-2" />
                  <span>Última actualización: {course?.updatedAt ? formatDate(course.updatedAt) : "Fecha no disponible"}</span>
                </div>
              </div>

              {/* Lessons */}
              <div className="mt-8 p-4">
                <h2 className="text-2xl text-background font-bold mb-6">Contenido del curso</h2>
                <div className="space-y-4">
                  {course?.lessons?.map((lesson) => (
                    <div
                      key={lesson.id}
                      className="border rounded-lg overflow-hidden bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <button
                        className="w-full px-6 py-4 flex items-center justify-between"
                        onClick={() => toggleLesson(lesson.id)}
                      >
                        <div className="flex items-center">
                          <span className="font-medium text-background">{lesson.title}</span>
                          <span className="ml-4 text-sm text-gray-500">{lesson.duration} hrs</span>
                        </div>
                        {expandedLesson === lesson.id ? (
                          <FaChevronUp className="text-gray-400" />
                        ) : (
                          <FaChevronDown className="text-gray-400" />
                        )}
                      </button>
                      {expandedLesson === lesson.id && (
                        <div className="px-6 py-4 bg-white border-t">
                          <p className="text-gray-700">{lesson.description}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <Button className="w-full transform justify-center border-background bg-[#00BDD8] text-lg font-semibold text-white transition-colors hover:bg-background active:scale-95">
              Inscribirse
              </Button>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
