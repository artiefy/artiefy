"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import {
  FaCalendar,
  FaChevronDown,
  FaChevronUp,
  FaClock,
  FaStar,
  FaUserGraduate,
  FaHome,
} from "react-icons/fa";
import Footer from "~/components/layout/Footer";
import { Header } from "~/components/layout/Header";
import { Button } from "~/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "~/components/ui/breadcrumb";
import { Skeleton } from "~/components/ui/skeleton";

export interface Course {
  id: number;
  title: string;
  coverImageKey: string | null;
  category: {
    id: number;
    name: string;
  };
  description: string | null;
  instructor: string;
  rating: number | null;
  createdAt: string | number | Date;
  updatedAt: string | number | Date;
  totalStudents: number;
  modalidad: {
    name: string;
  };
  lessons: {
    id: number;
    title: string;
    duration: number;
    description: string | null;
  }[];
}

export default function CourseDetails({ course }: { course: Course }) {
  const [expandedLesson, setExpandedLesson] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading delay
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000); // Adjust the delay as needed

    return () => clearTimeout(timer);
  }, []);

  const toggleLesson = (lessonId: number) => {
    setExpandedLesson(expandedLesson === lessonId ? null : lessonId);
  };

  const formatDate = (dateString: string | number | Date) => {
    return new Date(dateString).toISOString().split("T")[0];
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-7xl pb-4 md:pb-6 lg:pb-8">
        <Breadcrumb className="pb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">
                <FaHome className="inline-block mr-1" /> Home
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/estudiantes/">
                <FaUserGraduate className="inline-block mr-1" /> Cursos
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{course.title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {loading ? (
          <Skeleton className="h-[500px] w-full rounded-lg" />
        ) : (
          <div className="overflow-hidden rounded-xl bg-white shadow-lg">
            {/* Course Header */}
            <div className="relative h-72 overflow-hidden">
              <Image
                src={
                  course.coverImageKey
                    ? `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${course.coverImageKey}`.trimEnd()
                    : "https://placehold.co/600x400/EEE/31343C?font=montserrat&text=Curso-Artiefy"
                }
                alt={course.title}
                fill
                className="object-cover"
                placeholder="blur"
                blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDABQODxIPDRQSEBIXFRQYHjIhHhwcHj0sLiQySUBMS0dARkVQWnNiUFVtVkVGZIhlbXd7gYKBTmCNl4x9lnN+gXz/2wBDARUXFx4aHjshITt8U0ZTfHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHz/wAARCAFzAooDASIAAhEBAxEB/8QAGgABAQEBAQEBAAAAAAAAAAAAAAIBAwYFBP/EABkQAQEBAQEBAAAAAAAAAAAAAAABEQISIf/EABcBAQEBAQAAAAAAAAAAAAAAAAABAgP/xAAaEQEBAQEBAQEAAAAAAAAAAAAAEQECEiEx/9oADAMBAAIRAxEAPwD1ICNAAAADWANAAAAABowBoMBrAAABgAMBgDGsBjK1gMqa2soMrK2poMqaqpoMqa2poMqaqpoJqa2poJqaqpqCaiqqaCamqqKCamqqaCamqqaCamqqaDKlVSDAYAAA1jQGsaDWxjQVGxkbBGxSY0FRrI2A1rGqNawBrWNAABoxoPTDAVoADWANGANGNAawBowBowBowBowABgNYMBrBgDBgDBgDKVlBlZW1NBlZW1NBlTW1NBlTW1NBlTW1NQZUVVTQTU1tTQTU1VRQZU1tTQTU1VTQTWVtTQZWFYAwEAYA0Y0GtS1RTYloKioiKgimpaCo1Kga1jQa1gooY0GjAGgA9MMBWjAGjAGjAFCWg0YA0YaDRmmg0ZpoNGaaDWM00GsNYDWDAGDAGDAGUrKBU1tTQKmtqaDKmtqagypramgypramgypramgmpqqigypramgmpramgypramgyprbU1AqW2ptAGMBowBrU63Qa1LQU1LYqLjYmNgKbExoLaloKaloKaloNanW6DWp1uqjRmgPS6azTUaaazTVG63U6aCtNTpqCtNTrdUbprNNBWmp00FaanTQVpqdNBums00G6anTQbprNZoN01ms0G6zWazQbrNZrNBustZay0C1lpam0CstLU2gWptLU2oFqbS1NoFqbS1NoFqbS1NoMtTa21FoFqLW2ptBlqbW2otAtRa21NqBU0tTaBWFqbQbrNZpqDdNTpoKE63QU3Ua3VRet1EqpQVKrUStlBet1EqpVFSt1Ot0F63Ua3RFa1Ot0FCdboKE63QaazTQel01OmjStNTpoK01OmgrTU6aCtbqNboK01OmgrTU6aCtNTpoK01OmgrTU6aCtZqdNBWs1ms0FazU6aDdZrNZoN1ms1miNtZazWWg21NrLWWittTaWptAtTaWstAtTaWptAtTaWptBlqbW2otAtTaWptAtRa21FqBam0tTaDLU2lqbQLWWstTag21Npam1Bump1mlFaanTSitbqNNKi9bqNboOkrdc9VKouVsqJWyqOmtlRrZRFyt1ErdBet1Ot1RWt1Gt0F6anTQXpqdNBWmp00HpdNRpo0vTUaaC9NRpoL01Gt0FaanTQXpqNNBemo00F6ajTQXpqNNBWmp00RWmo00FaanWaCtZrNZoK1mp1mgrWazU6CtZanWWg21lrLU2g21lrLU2g21Npam0C1lrLU2g21NrLU2gWptLU2oFqbS1FoFqbS1NoFqbWWptQLU2lqLUG2ptZam1KNtZam1NrO6qtZqdZqUXrNRppdR001z1ulHTWyuetnS0ddbK5ytlaqOsrZXOVsq0dJVSucrZVHSVsrnKqUF63Ua3VF63UaaDppqNboL01Gt0Faa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"
                priority
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
                <h1 className="text-3xl font-bold text-white">{course.title}</h1>
              </div>
            </div>

            {/* Course Info */}
            <div className="p-6">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                  <div>
                    <h3 className="text-lg font-semibold text-background">
                      {course.instructor}
                    </h3>
                    <p className="text-gray-600">Instructor</p>
                  </div>
                </div>
                <div className="flex items-center space-x-6">
                  <div className="flex items-center">
                    <FaUserGraduate className="mr-2 text-blue-600" />
                    <span className="text-background">
                      {course.totalStudents} Estudiantes
                    </span>
                  </div>
                  <div className="flex items-center">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <FaStar
                        key={index}
                        className={`h-5 w-5 ${index < Math.floor(course.rating ?? 0) ? "text-yellow-400" : "text-gray-300"}`}
                      />
                    ))}
                    <span className="ml-2 text-lg font-semibold text-yellow-400">
                      {course.rating?.toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="prose mb-8 max-w-none">
                <p className="leading-relaxed text-gray-700">
                  {course.description ?? "No hay descripción disponible."}
                </p>
              </div>

              <div className="mb-8 flex flex-wrap gap-4 text-sm text-gray-600">
                <div className="flex items-center">
                  <FaCalendar className="mr-2" />
                  <span>Creado: {formatDate(course.createdAt)}</span>
                </div>
                <div className="flex items-center">
                  <FaClock className="mr-2" />
                  <span>
                    Última actualización: {formatDate(course.updatedAt)}
                  </span>
                </div>
              </div>

              {/* Lessons */}
              <div className="mt-8 p-4">
                <h2 className="mb-6 text-2xl font-bold text-background">
                  Contenido del curso
                </h2>
                <div className="space-y-4">
                  {course.lessons.map((lesson) => (
                    <div
                      key={lesson.id}
                      className="overflow-hidden rounded-lg border bg-gray-50 transition-colors hover:bg-gray-100"
                    >
                      <button
                        className="flex w-full items-center justify-between px-6 py-4"
                        onClick={() => toggleLesson(lesson.id)}
                      >
                        <div className="flex items-center">
                          <span className="font-medium text-background">
                            {lesson.title}
                          </span>
                          <span className="ml-4 text-sm text-gray-500">
                            {lesson.duration} mins
                          </span>
                        </div>
                        {expandedLesson === lesson.id ? (
                          <FaChevronUp className="text-gray-400" />
                        ) : (
                          <FaChevronDown className="text-gray-400" />
                        )}
                      </button>
                      {expandedLesson === lesson.id && (
                        <div className="border-t bg-white px-6 py-4">
                          <p className="text-gray-700">
                            {lesson.description ??
                              "No hay descripción disponible para esta lección."}
                          </p>
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