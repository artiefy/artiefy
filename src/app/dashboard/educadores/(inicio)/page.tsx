'use client';
import { useCallback, useEffect, useState } from 'react';

import { useUser } from '@clerk/nextjs';
import { GraduationCap } from 'lucide-react';
import {
  FaBook,
  FaChalkboardTeacher,
  FaClock,
  FaGraduationCap,
} from 'react-icons/fa';
import { toast } from 'sonner';

import CourseListDetails from '~/components/educators/layout/CourseListDetails';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '~/components/educators/ui/breadcrumb';

// Define the CourseModel interface
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
  nivelid: string;
  totalParametros: number; // Add this line
}

// Define the StatsModel interface
export interface StatsModel {
  totalCourses: number;
  totalLessons: number;
  totalEnrollments: number;
  totalDuration: number;
  averageEnrollments: number;
}

export default function Home() {
  const { user } = useUser(); // Get the user from Clerk
  const [courses, setCourses] = useState<CourseModel[]>([]); // Initialize courses state
  const [loading, setLoading] = useState(false); // Initialize loading state
  const [error, setError] = useState<string | null>(null); // Initialize error state
  const [stats, setStats] = useState<StatsModel>({
    totalCourses: 0,
    totalLessons: 0,
    totalEnrollments: 0,
    totalDuration: 0,
    averageEnrollments: 0,
  }); // Initialize stats state "datos del dashboard"

  // Fetch stats
  const fetchStats = useCallback(async () => {
    if (!user) return;
    try {
      // Fetch the stats from the API of dashboard by user Id
      const response = await fetch(
        `/api/educadores/dashboard?userId=${user.id}`
      );
      if (response.ok) {
        const data = (await response.json()) as StatsModel;
        setStats(data);
      } else {
        const errorData = (await response.json()) as { error?: string };
        const errorMessage = errorData.error ?? response.statusText;
        toast('Error', {
          description: `No se pudieron cargar las estadísticas: ${errorMessage}`,
        });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
      toast('Error', {
        description: `No se pudieron cargar las estadísticas: ${errorMessage}`,
      });
    }
  }, [user]);

  console.log('stats', stats);

  // Fetch courses
  useEffect(() => {
    if (user) {
      fetchStats().catch((error) =>
        console.error('Error fetching stats:', error)
      );
    }
  }, [user, fetchStats]);

  // Fetch courses
  const fetchCourses = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        `/api/educadores/courses/coursesByEducator?userId=${encodeURIComponent(user.id)}&fullName=${encodeURIComponent(user.fullName ?? '')}`
      );
      console.log('API Response:', response);
      if (response.ok) {
        const data = (await response.json()) as CourseModel[];
        console.log('Courses data:', data);
        setCourses(
          data.map((course) => ({
            ...course,
            nivelid: course.nivelid ?? '', // Map it properly
            categoryid: course.categoryid, // Map categoryid properly
            modalidadesid: course.modalidadesid, // Map modalidadesid properly
          })) as CourseModel[]
        );
      } else {
        const errorData = (await response.json()) as { error?: string };
        const errorMessage = errorData.error ?? response.statusText;
        setError(`Error al cargar los cursos: ${errorMessage}`);
        toast('Error', {
          description: `No se pudieron cargar los cursos: ${errorMessage}`,
        });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
      setError(`Error al cargar los cursos: ${errorMessage}`);
      toast('Error', {
        description: `No se pudieron cargar los cursos: ${errorMessage}`,
      });
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch courses
  useEffect(() => {
    if (user) {
      fetchCourses().catch((error) =>
        console.error('Error fetching courses:', error)
      );
    }
  }, [user, fetchCourses]);

  // Render the component loading, error or data
  if (loading) {
    return (
      <main className="flex h-screen flex-col items-center justify-center">
        <div className="size-32 rounded-full border-y-2 border-primary">
          <span className="sr-only" />
        </div>
        <span className="text-primary">Cargando...</span>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold text-red-500">{error}</p>
          <button
            onClick={fetchCourses}
            className="mt-4 rounded-md bg-primary px-4 py-2 text-white"
          >
            Reintentar
          </button>
        </div>
      </main>
    );
  }

  // Render the component with the data of dashboard en general
  return (
    <main className="min-h-screen bg-[#01142B] text-white">
      <div
        className="
          mx-auto max-w-7xl px-2 py-4
          sm:px-6
          lg:px-8
        "
      >
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink
                className="
                  font-semibold text-[#22C4D3]
                  hover:text-[#00BDD8]
                "
                href="../educadores"
              >
                Inicio
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
          </BreadcrumbList>
        </Breadcrumb>

        <section
          className="
            mb-8 flex flex-col items-center gap-6 rounded-2xl bg-[#1e2939] p-6
            shadow-xl
            md:flex-row md:gap-10
          "
        >
          <GraduationCap className="size-16 flex-shrink-0 text-[#22C4D3] drop-shadow-lg" />
          <div
            className="
              flex flex-col items-center
              md:items-start
            "
          >
            <h1
              className="
                mb-1 text-3xl font-extrabold text-white
                md:text-4xl
              "
            >
              Bienvenido,{' '}
              <span className="text-[#22C4D3]">{user?.firstName}</span>
            </h1>
            <p className="text-lg font-medium text-gray-200">
              Este es tu panel de control de{' '}
              <span className="font-bold text-[#00BDD8]">Artiefy</span>.
              <br
                className="
                  hidden
                  md:block
                "
              />
              Aquí puedes ver tus cursos, estadísticas y más.
            </p>
          </div>
        </section>

        <section className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* Estadísticas */}
          <div
            className="
              flex flex-col items-center rounded-xl border border-[#1d283a]
              bg-[#01142B] p-5 shadow-lg
            "
          >
            <FaGraduationCap className="mb-2 size-10 text-[#22C4D3] drop-shadow" />
            <span className="text-lg font-semibold text-white">
              Promedio estudiantes
            </span>
            <span className="mt-1 text-3xl font-extrabold text-[#22C4D3]">
              {stats.averageEnrollments ?? 0}
            </span>
          </div>
          <div
            className="
              flex flex-col items-center rounded-xl border border-[#1d283a]
              bg-[#01142B] p-5 shadow-lg
            "
          >
            <FaBook className="mb-2 size-10 text-[#00BDD8] drop-shadow" />
            <span className="text-lg font-semibold text-white">
              Total de Cursos
            </span>
            <span className="mt-1 text-3xl font-extrabold text-[#00BDD8]">
              {stats.totalCourses ?? 0}
            </span>
          </div>
          <div
            className="
              flex flex-col items-center rounded-xl border border-[#1d283a]
              bg-[#01142B] p-5 shadow-lg
            "
          >
            <FaChalkboardTeacher className="mb-2 size-10 text-[#2ecc71] drop-shadow" />
            <span className="text-lg font-semibold text-white">
              Total de Clases
            </span>
            <span className="mt-1 text-3xl font-extrabold text-[#2ecc71]">
              {stats.totalLessons ?? 0}
            </span>
          </div>
          <div
            className="
              flex flex-col items-center rounded-xl border border-[#1d283a]
              bg-[#01142B] p-5 shadow-lg
            "
          >
            <FaClock className="mb-2 size-10 text-[#22C4D3] drop-shadow" />
            <span className="text-lg font-semibold text-white">
              Duración total
            </span>
            <span className="mt-1 text-3xl font-extrabold text-[#22C4D3]">
              {stats.totalDuration ?? 0} min
            </span>
          </div>
        </section>

        <section className="rounded-2xl bg-[#1e2939] p-6 shadow-xl">
          <h2 className="mb-4 text-2xl font-bold text-[#22C4D3]">
            Cursos asignados
          </h2>
          <CourseListDetails courses={courses} />
        </section>
      </div>
    </main>
  );
}
