'use client';

import { useEffect, useState } from 'react';

import Image from 'next/image';
import { useParams, useSearchParams } from 'next/navigation';

import { Calendar, Loader2, User } from 'lucide-react';

interface Stats {
  totalLessons: number;
  completedLessons: number;
  progressPercentage: number;
  averageLessonProgress: number; // Agregamos este campo
  totalActivities: number;
  completedActivities: number;
  forumPosts: number;
  userScore: number;
  totalTimeSpent: number; // 🔹 Tiempo total invertido
  globalCourseScore: string; // 🔹 Nota global del curso
  activities: ActivityDetail[]; // 🔹 Lista de actividades detalladas
  lessonDetails: LessonDetail[]; // Add this line
  evaluationParameters: {
    id: number;
    name: string;
    description: string;
    percentage: number;
  }[];
}

interface ActivityDetail {
  activityId: number;
  name: string;
  description: string;
  isCompleted: boolean;
  score: number;
}

interface UserInfo {
  firstName: string;
  email: string;
  role: string;
}

interface CourseInfo {
  title: string;
  instructor: string;
  createdAt: string;
  nivel: string;
  coverImageKey?: string;
  difficulty?: string; // Añadido para compatibilidad con vistas antiguas
}
interface LessonDetail {
  lessonId: number;
  title: string;
  progress: number;
  isCompleted: boolean;
  lastUpdated: string; // Add this line
}

export default function StudentCourseDashboard() {
  const params = useParams() ?? {};
  const searchParams = useSearchParams();
  // const router = useRouter(); // Eliminado porque no se usa

  const user = searchParams?.get('user') ?? '';
  const courseId = Array.isArray(params.courseId)
    ? params.courseId[0]
    : params.courseId;

  const [stats, setStats] = useState<Stats | null>(null);

  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [courseInfo, setCourseInfo] = useState<CourseInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [lessonDetails, setLessonDetails] = useState<LessonDetail[]>([]); // Eliminado
  const [evaluationParameters, setEvaluationParameters] = useState<
    { id: number; name: string; description: string; percentage: number }[]
  >([]);

  void lessonDetails;
  void evaluationParameters;

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Usar el endpoint correcto para super-admin
        const res = await fetch(
          `/api/super-admin/course/${courseId}/stats/${user}`
        );
        const data = await res.json();

        // Validar y asignar todos los datos recibidos
        setEvaluationParameters(
          data.statistics?.evaluationParameters &&
            Array.isArray(data.statistics.evaluationParameters)
            ? data.statistics.evaluationParameters
            : []
        );

        setStats({
          ...data.statistics,
          averageLessonProgress: data.statistics?.averageLessonProgress ?? 0,
          activities: data.statistics?.activities ?? [],
        });

        // Si hay detalles de lecciones, asignar
        setLessonDetails(data.statistics?.lessonDetails ?? []);

        setUserInfo(data.user ?? null);
        setCourseInfo(data.course ?? null);
      } catch (error) {
        console.error('❌ Error cargando estadísticas:', error);
      } finally {
        setLoading(false);
      }
    };

    void fetchData();
  }, [courseId, user]);

  return (
    <>
      <div className="relative flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#01142B] to-[#1e2939] p-0">
        {/* Header futurista reorganizado */}
        <header className="relative z-20 mx-auto flex w-full max-w-6xl flex-col rounded-b-3xl bg-[#01142B] px-4 py-8 shadow-2xl transition-all duration-700 md:py-12">
          <div className="flex w-full flex-col gap-8 md:flex-row">
            {/* Card principal: imagen + info curso */}
            <div className="flex flex-1 flex-col items-center gap-6 rounded-2xl bg-[#182235] p-6 shadow-xl md:flex-row">
              <div className="relative flex w-[320px] flex-shrink-0 flex-col items-center justify-center md:w-[260px]">
                <Image
                  src={
                    courseInfo?.coverImageKey
                      ? `${process.env.NEXT_PUBLIC_AWS_S3_URL ?? ''}/${courseInfo.coverImageKey}`
                      : '/img/curso-visual.png'
                  }
                  alt="Visual del curso"
                  width={260}
                  height={140}
                  className="mb-2 h-36 w-full rounded-xl object-cover shadow-lg"
                  priority
                  quality={75}
                />
                <span className="absolute top-3 left-3 rounded-full bg-yellow-500/90 px-3 py-1 text-xs font-bold text-[#232B3E] shadow">
                  ★ Premium
                </span>
              </div>
              <div className="flex w-full flex-col items-center justify-center gap-2 md:items-start">
                <h1 className="text-2xl font-extrabold tracking-wide text-white drop-shadow-lg md:text-3xl">
                  {courseInfo?.title ?? 'Portal de Notas del Estudiante'}
                </h1>
                <p className="text-sm font-semibold text-[#3AF4EF]">
                  Instructor: {courseInfo?.instructor}
                </p>
                <span className="rounded bg-[#3AF4EF]/10 px-3 py-1 text-xs font-semibold text-[#3AF4EF]">
                  Nivel: {courseInfo?.nivel}
                </span>
                <div className="mt-1 flex items-center gap-2 text-xs text-white/60">
                  <Calendar className="size-4" />
                  Creado el{' '}
                  {courseInfo?.createdAt
                    ? new Date(courseInfo.createdAt).toLocaleDateString()
                    : '-'}
                </div>
                <span className="mt-2 text-xs font-semibold text-[#3AF4EF]">
                  Incluido en tu plan PREMIUM <span className="ml-1">👑</span>
                </span>
                <button className="mt-2 w-full max-w-[180px] rounded-lg bg-[#3AF4EF] px-4 py-2 font-bold text-white shadow-lg transition-all hover:bg-[#27c2c2]">
                  Suscrito ✓
                </button>
              </div>
            </div>
            {/* Card estudiante */}
            <div className="mx-auto flex max-w-[320px] min-w-[220px] flex-col items-center justify-center rounded-2xl bg-[#1e2939] p-6 shadow-xl md:mx-0">
              <User className="mb-2 size-12 animate-pulse text-[#3AF4EF]" />
              <h2 className="mb-1 text-xl font-bold text-white">
                {userInfo?.firstName}
              </h2>
              <p className="mb-1 text-sm text-[#3AF4EF]">{userInfo?.email}</p>
              <span className="rounded bg-[#3AF4EF]/10 px-3 py-1 text-xs font-semibold text-[#3AF4EF]">
                {userInfo?.role}
              </span>
            </div>
          </div>
        </header>

        {/* Tabla de notas editable y detalles completos */}
        <div className="animate-slide-up mx-auto mt-10 max-w-6xl rounded-2xl bg-[#1e2939] p-8 shadow-2xl">
          <h2 className="animate-fade-in mb-6 text-center text-2xl font-bold text-[#3AF4EF]">
            Clases y Notas del Estudiante
          </h2>
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="size-8 animate-spin text-[#3AF4EF]" />
              <span className="animate-fade-in ml-4 text-lg text-white">
                Cargando datos...
              </span>
            </div>
          ) : stats ? (
            <div className="animate-fade-in overflow-x-auto">
              {/* Tabla de lecciones/clases */}
              <h3 className="mb-4 text-lg font-bold text-[#3AF4EF]">
                Progreso por Clases
              </h3>
              <table className="mb-8 w-full border-separate border-spacing-y-2">
                <thead>
                  <tr className="bg-[#182235] text-lg text-[#3AF4EF]">
                    <th className="rounded-l-xl px-6 py-3">Clase</th>
                    <th className="px-6 py-3">Progreso (%)</th>
                    <th className="px-6 py-3">Estado</th>
                    <th className="rounded-r-xl px-6 py-3">
                      Última actualización
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {stats.lessonDetails?.map((lesson) => (
                    <tr
                      key={lesson.lessonId}
                      className="bg-[#101A2B] text-white shadow-lg transition-all duration-300 hover:scale-[1.01] hover:bg-[#232B3E]"
                    >
                      <td className="px-6 py-4 font-semibold text-[#3AF4EF]">
                        {lesson.title}
                      </td>
                      <td className="px-6 py-4 text-center text-lg font-bold">
                        {lesson.progress ?? 0}%
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${lesson.isCompleted ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}
                        >
                          {lesson.isCompleted ? 'Completada' : 'Pendiente'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-xs text-white/70">
                        {lesson.lastUpdated
                          ? new Date(lesson.lastUpdated).toLocaleDateString()
                          : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {/* Tabla de actividades/notas */}
              <h3 className="mb-4 text-lg font-bold text-[#3AF4EF]">
                Notas por Actividad
              </h3>
              <table className="w-full border-separate border-spacing-y-2">
                <thead>
                  <tr className="bg-[#182235] text-lg text-[#3AF4EF]">
                    <th className="rounded-l-xl px-6 py-3">Actividad</th>
                    <th className="px-6 py-3">Descripción</th>
                    <th className="px-6 py-3">Estado</th>
                    <th className="px-6 py-3">Nota</th>
                    <th className="rounded-r-xl px-6 py-3">Editar</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.activities.map((activity) => (
                    <tr
                      key={activity.activityId}
                      className="bg-[#101A2B] text-white shadow-lg transition-all duration-300 hover:scale-[1.01] hover:bg-[#232B3E]"
                    >
                      <td className="px-6 py-4 font-semibold text-[#3AF4EF]">
                        {activity.name}
                      </td>
                      <td className="px-6 py-4 text-white/80">
                        {activity.description}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${activity.isCompleted ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}
                        >
                          {activity.isCompleted ? 'Completada' : 'Pendiente'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-lg font-bold">
                        {activity.score ?? 0}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          step={0.5}
                          className="w-20 rounded-lg border-2 border-[#3AF4EF] bg-[#232B3E] px-2 py-1 text-center font-bold text-[#3AF4EF] shadow-md transition-all duration-300 focus:scale-105 focus:border-[#3AF4EF] focus:bg-[#101A2B] focus:outline-none"
                          value={activity.score ?? 0}
                          onChange={(e) => {
                            const newScore = parseFloat(e.target.value);
                            setStats((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    activities: prev.activities.map((a) =>
                                      a.activityId === activity.activityId
                                        ? { ...a, score: newScore }
                                        : a
                                    ),
                                  }
                                : prev
                            );
                          }}
                          onBlur={async (e) => {
                            const newScore = parseFloat(e.target.value);
                            try {
                              await fetch(`/api/activities/updateScore`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  activityId: activity.activityId,
                                  userId: user,
                                  score: newScore,
                                }),
                              });
                            } catch (err) {
                              // Puedes mostrar un toast futurista aquí
                              console.error('Error actualizando nota', err);
                            }
                          }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {/* Mostrar detalles adicionales del curso y estudiante */}
              <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-2">
                <div className="rounded-xl bg-[#182235] p-6 shadow-lg">
                  <h3 className="mb-2 text-lg font-bold text-[#3AF4EF]">
                    Datos del Curso
                  </h3>
                  <p className="text-white/80">
                    <span className="font-bold text-white">Título:</span>{' '}
                    {courseInfo?.title}
                  </p>
                  <p className="text-white/80">
                    <span className="font-bold text-white">Instructor:</span>{' '}
                    {courseInfo?.instructor}
                  </p>
                  <p className="text-white/80">
                    <span className="font-bold text-white">Nivel:</span>{' '}
                    {courseInfo?.nivel}
                  </p>
                  <p className="text-white/80">
                    <span className="font-bold text-white">Creado el:</span>{' '}
                    {courseInfo?.createdAt
                      ? new Date(courseInfo.createdAt).toLocaleDateString()
                      : ''}
                  </p>
                </div>
                <div className="rounded-xl bg-[#182235] p-6 shadow-lg">
                  <h3 className="mb-2 text-lg font-bold text-[#3AF4EF]">
                    Datos del Estudiante
                  </h3>
                  <p className="text-white/80">
                    <span className="font-bold text-white">Nombre:</span>{' '}
                    {userInfo?.firstName}
                  </p>
                  <p className="text-white/80">
                    <span className="font-bold text-white">Email:</span>{' '}
                    {userInfo?.email}
                  </p>
                  <p className="text-white/80">
                    <span className="font-bold text-white">Rol:</span>{' '}
                    {userInfo?.role}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <p className="animate-fade-in mt-6 text-center text-white">
              No hay datos disponibles.
            </p>
          )}
        </div>

        {/* Resumen y progreso */}
        <div className="animate-slide-up mx-auto mt-10 grid max-w-6xl grid-cols-1 gap-8 md:grid-cols-3">
          <div className="rounded-2xl bg-[#1e2939] p-6 text-center shadow-xl transition-all duration-500 hover:scale-105">
            <h3 className="mb-2 text-lg font-bold text-[#3AF4EF]">
              Progreso General
            </h3>
            <div className="mb-2 h-3 w-full rounded-full bg-[#232B3E]">
              <div
                className="h-3 rounded-full bg-[#3AF4EF] transition-all duration-700"
                style={{ width: `${stats?.progressPercentage ?? 0}%` }}
              />
            </div>
            <span className="text-xl font-bold text-white">
              {stats?.progressPercentage ?? 0}%
            </span>
          </div>
          <div className="rounded-2xl bg-[#1e2939] p-6 text-center shadow-xl transition-all duration-500 hover:scale-105">
            <h3 className="mb-2 text-lg font-bold text-[#3AF4EF]">
              Lecciones Completadas
            </h3>
            <span className="text-xl font-bold text-white">
              {stats?.completedLessons ?? 0} / {stats?.totalLessons ?? 0}
            </span>
          </div>
          <div className="rounded-2xl bg-[#1e2939] p-6 text-center shadow-xl transition-all duration-500 hover:scale-105">
            <h3 className="mb-2 text-lg font-bold text-[#3AF4EF]">
              Nota Global
            </h3>
            <span className="text-xl font-bold text-white">
              {stats?.globalCourseScore ?? 'N/A'}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
