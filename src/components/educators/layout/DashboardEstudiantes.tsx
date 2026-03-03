'use client';

import { useCallback, useEffect, useState } from 'react';

import { usePathname, useRouter } from 'next/navigation';

import { Dialog } from '@headlessui/react';
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Title,
  Tooltip,
} from 'chart.js';
import { ChevronLeft, ChevronRight, Eye, Loader2 } from 'lucide-react';
import { Bar } from 'react-chartjs-2';

import { getUsersEnrolledInCourse } from '~/server/queries/queriesEducator';

// ─── ChartJS plugins ───────────────────────────────────────────────────────────
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// ─── Types ─────────────────────────────────────────────────────────────────────

interface LessonProgress {
  lessonId: number;
  progress: number;
  isCompleted: boolean;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  lastConnection?: string;
  enrolledAt?: string | Date | null;
  lessonsProgress: LessonProgress[];
  averageProgress: number;
  tiempoEnCurso?: string;
  completed: boolean;
  parameterGrades: {
    parametroId: number;
    parametroName: string;
    grade: number | null;
  }[];
  activitiesWithGrades: {
    activityId: number;
    activityName: string;
    parametroId: number;
    parametroName: string;
    grade: number;
    parametroPeso?: number | null;
    actividadPeso?: number | null;
    numberOfActivities?: number | null;
  }[];
}

interface Activity {
  id: number;
  name: string;
  parametro: string;
  parametroId: number;
  parametroPeso: number;
  actividadPeso: number;
  numberOfActivities?: number;
}

interface LessonsListProps {
  courseId: number;
  selectedColor: string;
  onCrearActividad?: (parametroId: number) => void;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function calcNotaFinal(
  user: User,
  activities: Activity[],
  grades: Record<string, Record<number, number>>
): string {
  if (!user) return 'N/D';

  const actsByParam: Record<string, Activity[]> = {};
  activities.forEach((act) => {
    if (!actsByParam[act.parametro]) actsByParam[act.parametro] = [];
    actsByParam[act.parametro].push(act);
  });

  const notasParametros = Object.values(actsByParam).map((acts) => {
    let sumNotas = 0;
    let sumPesos = 0;
    acts.forEach((act) => {
      const nota = grades[user.id]?.[act.id] ?? 0;
      sumNotas += nota * (act.actividadPeso / 100);
      sumPesos += act.actividadPeso / 100;
    });
    const promedio = sumPesos > 0 ? sumNotas / sumPesos : 0;
    const pesoParametro = acts[0]?.parametroPeso ?? 0;
    return { promedio, pesoParametro };
  });

  let sumaFinal = 0;
  let sumaPesos = 0;
  notasParametros.forEach(({ promedio, pesoParametro }) => {
    sumaFinal += promedio * (pesoParametro / 100);
    sumaPesos += pesoParametro / 100;
  });

  return sumaPesos > 0 ? (sumaFinal / sumaPesos).toFixed(2) : '0.00';
}

// ─── Subcomponents ─────────────────────────────────────────────────────────────

interface UserModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
}

function UserModal({ user, isOpen, onClose }: UserModalProps) {
  const getChartData = (u: User) => ({
    labels: u.lessonsProgress.map((l) => `Lección ${l.lessonId}`),
    datasets: [
      {
        label: 'Progreso',
        data: u.lessonsProgress.map((l) => l.progress),
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  });

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
    >
      <div className="min-h-screen px-4 text-center">
        <span className="inline-block h-screen align-middle" aria-hidden="true">
          &#8203;
        </span>

        <div className="inline-block w-full max-w-2xl transform overflow-hidden rounded-xl bg-gray-900 p-6 text-left align-middle shadow-2xl transition-all">
          <Dialog.Title
            as="h3"
            className="mb-4 border-b border-gray-700 pb-3 text-2xl font-semibold text-white"
          >
            👤 Detalles del Estudiante
          </Dialog.Title>

          {user && (
            <div className="space-y-3 text-sm text-gray-300">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-semibold text-gray-400">Nombre:</p>
                  <p>
                    {user.firstName} {user.lastName}
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-gray-400">Correo:</p>
                  <p>{user.email}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-400">
                    Progreso Promedio:
                  </p>
                  <p>{user.averageProgress.toFixed(1)}%</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-400">
                    Última Conexión:
                  </p>
                  <p>{user.lastConnection}</p>
                </div>
              </div>

              <div className="mt-6">
                <h4 className="text-md mb-2 font-semibold text-white">
                  📊 Progreso por Lección
                </h4>
                <div className="rounded-md border border-gray-700 bg-gray-800 p-3">
                  <Bar
                    data={getChartData(user)}
                    options={{
                      responsive: true,
                      plugins: {
                        legend: { display: false },
                        title: { display: false },
                      },
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 text-right">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md bg-blue-600 px-5 py-2 text-sm text-white transition hover:bg-blue-700"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}

// ─── Mobile Card ───────────────────────────────────────────────────────────────

interface MobileUserCardProps {
  user: User;
  activities: Activity[];
  grades: Record<string, Record<number, number>>;
  onGradeChange: (userId: string, activityId: number, grade: number) => void;
  onSaveGrade: (userId: string, activityId: number, grade: number) => void;
  onViewDetails: (user: User) => void;
}

function MobileUserCard({
  user,
  activities,
  grades,
  onGradeChange,
  onSaveGrade,
  onViewDetails,
}: MobileUserCardProps) {
  const notaFinal = calcNotaFinal(user, activities, grades);

  return (
    <div className="rounded-lg border border-gray-600 bg-gray-700 p-3 shadow-sm">
      <div className="flex justify-between text-sm font-medium">
        <span className="truncate">
          {user.firstName} {user.lastName}
        </span>
        <span className="truncate text-gray-300">{user.email}</span>
      </div>

      <div className="mt-2">
        <div className="flex justify-between text-xs font-medium">
          <span>Progreso</span>
          <span>{user.averageProgress.toFixed(1)}%</span>
        </div>
        <div className="mt-1 h-1 w-full rounded-full bg-gray-600">
          <div
            className="h-1 rounded-full bg-blue-500"
            style={{ width: `${user.averageProgress}%` }}
          />
        </div>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-x-2 text-[11px] text-gray-400">
        <div className="truncate">
          Última:{' '}
          <span className="text-white">{user.lastConnection ?? 'N/D'}</span>
        </div>
        <div className="truncate">
          Tiempo:{' '}
          <span className="text-white">{user.tiempoEnCurso ?? 'N/D'}</span>
        </div>
      </div>

      <div className="mt-2 text-xs font-medium">Notas:</div>
      <div className="mt-1 space-y-1 text-[11px]">
        {activities.map((activity) => (
          <div
            key={`${user.id}-${activity.id}`}
            className="flex items-center justify-between"
          >
            <span className="truncate">{activity.name}</span>
            <input
              type="number"
              min={0}
              max={100}
              step={0.5}
              className="w-12 rounded bg-gray-600 p-[2px] text-center text-xs text-white"
              value={grades[user.id]?.[activity.id] ?? ''}
              placeholder="--"
              onChange={(e) =>
                onGradeChange(user.id, activity.id, parseFloat(e.target.value))
              }
              onBlur={() =>
                onSaveGrade(
                  user.id,
                  activity.id,
                  grades[user.id]?.[activity.id] ?? 0
                )
              }
            />
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs font-medium">Final</span>
        <span className="text-xs font-semibold text-green-300">
          {notaFinal}
        </span>
      </div>

      <div className="mt-2 text-right">
        <button
          onClick={() => onViewDetails(user)}
          className="inline-flex items-center gap-1 rounded bg-blue-600 px-2 py-1 text-xs font-medium text-white hover:bg-blue-700"
        >
          <Eye size={14} /> Ver
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

const DashboardEstudiantes: React.FC<LessonsListProps> = ({
  courseId,
  selectedColor: _selectedColor,
  onCrearActividad,
}) => {
  const pathname = usePathname();
  const router = useRouter();
  void router;

  const isSuperAdmin = pathname?.includes('/dashboard/super-admin/') ?? false;
  const handleCrearActividad = onCrearActividad ?? (() => {});

  // ─── State ─────────────────────────────────────────────────────────────────
  const [users, setUsers] = useState<User[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [grades, setGrades] = useState<Record<string, Record<number, number>>>(
    {}
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'actuales' | 'completos'>(
    'actuales'
  );
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const USERS_PER_PAGE = 10;

  // ─── Computed ──────────────────────────────────────────────────────────────

  const isStudentCompleted = (user: User): boolean => {
    const userGrades = grades[user.id] ?? {};
    const hasAllGrades = activities.every(
      (act) => typeof userGrades[act.id] === 'number'
    );
    return user.completed || (user.averageProgress === 100 && hasAllGrades);
  };

  const tabFilteredUsers = users.filter((user) =>
    activeTab === 'completos'
      ? isStudentCompleted(user)
      : !isStudentCompleted(user)
  );

  const searchedUsers = tabFilteredUsers.filter(
    (user) =>
      searchQuery === '' ||
      user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(searchedUsers.length / USERS_PER_PAGE);
  const currentUsers = searchedUsers.slice(
    (currentPage - 1) * USERS_PER_PAGE,
    currentPage * USERS_PER_PAGE
  );

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleGradeChange = (
    userId: string,
    activityId: number,
    newGrade: number
  ) => {
    setGrades((prev) => ({
      ...prev,
      [userId]: { ...(prev[userId] ?? {}), [activityId]: newGrade },
    }));
  };

  const saveGrade = async (
    userId: string,
    activityId: number,
    grade: number
  ) => {
    try {
      await fetch('/api/activities/getFileSubmission/getNotaEstudiantes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, activityId, grade }),
      });
    } catch (err) {
      console.error('Error guardando la nota', err);
    }
  };

  const openUserDetails = (user: User) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
  };

  const handleMarkComplete = async (userIds: string[]) => {
    const res = await fetch('/api/enrollments/markComplete', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userIds, courseId }),
    });
    if (res.ok) {
      setSelectedIds([]);
      void fetchEnrolledUsers(courseId);
    }
  };

  const handleMarkIncomplete = async (userIds: string[]) => {
    await fetch('/api/enrollments/markIncomplete', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userIds, courseId }),
    });
    setSelectedIds([]);
    void fetchEnrolledUsers(courseId);
  };

  const navigateToNewActivity = async (
    parametroId: number,
    numberOfActivities?: number
  ) => {
    const basePath = isSuperAdmin ? 'super-admin' : 'educadores';
    console.log(
      '[NAVIGATE] Intentando crear actividad para parámetro:',
      parametroId
    );
    try {
      const res = await fetch(
        `/api/educadores/actividades/sugerido?parametroId=${parametroId}`
      );
      const data = await res.json();
      console.log('[NAVIGATE] Respuesta del endpoint sugerido:', data);
      if (
        data.porcentajeSugerido === null ||
        data.porcentajeSugerido === undefined
      ) {
        console.warn(
          '[NAVIGATE] No se puede crear actividad: parámetro lleno o sin sugerencia.'
        );
        alert(
          'No se puede crear una nueva actividad: el parámetro ya está lleno o no tiene sugerencia.'
        );
        return;
      }
      window.location.href = `/dashboard/${basePath}/cursos/${courseId}/newActivity?parametroId=${parametroId}&porcentajeSugerido=${data.porcentajeSugerido}`;
    } catch (err) {
      console.error('[NAVIGATE] Error al consultar sugerencia:', err);
      alert('Error al consultar el porcentaje sugerido.');
    }
  };

  // ─── Data Fetching ─────────────────────────────────────────────────────────

  const fetchEnrolledUsers = useCallback(async (courseId: number) => {
    try {
      const rawUsers = await getUsersEnrolledInCourse(courseId);

      const formattedUsers = rawUsers.map((user) => {
        const totalProgress = user.lessonsProgress.reduce(
          (acc, lesson) => acc + lesson.progress,
          0
        );
        const averageProgress =
          user.lessonsProgress.length > 0
            ? totalProgress / user.lessonsProgress.length
            : 0;

        let tiempoEnCurso = 'Desconocido';
        if (user.enrolledAt) {
          const diffDays = Math.floor(
            (Date.now() - new Date(user.enrolledAt).getTime()) /
              (1000 * 60 * 60 * 24)
          );
          tiempoEnCurso = `${diffDays} días`;
        }

        return {
          ...user,
          firstName: user.firstName ?? 'Nombre no disponible',
          lastName: user.lastName ?? 'Apellido no disponible',
          email: user.email ?? 'Correo no disponible',
          averageProgress,
          lastConnection:
            typeof user.lastConnection === 'number'
              ? new Date(user.lastConnection).toLocaleDateString()
              : (user.lastConnection ?? 'Fecha no disponible'),
          tiempoEnCurso,
        };
      });

      // Build activity map
      const activityMap = new Map<number, Omit<Activity, 'id'>>();
      const gradesMap: Record<string, Record<number, number>> = {};

      rawUsers.forEach((u) => {
        const g: Record<number, number> = {};
        u.activitiesWithGrades.forEach((a) => {
          activityMap.set(a.activityId, {
            name: a.activityName,
            parametro: a.parametroName,
            parametroId: a.parametroId,
            parametroPeso: a.parametroPeso ?? 0,
            actividadPeso: a.actividadPeso ?? 0,
          });
          g[a.activityId] = a.grade;
        });
        gradesMap[u.id] = g;
      });

      // Build parameter map (for params without activities)
      const parametroMap = new Map<
        number,
        { parametroName: string; parametroPeso: number }
      >();
      rawUsers.forEach((u) => {
        u.parameterGrades.forEach((p) => {
          if (!parametroMap.has(p.parametroId)) {
            parametroMap.set(p.parametroId, {
              parametroName: p.parametroName,
              parametroPeso: p.parametroPeso ?? 0,
            });
          }
        });
      });

      const allActivities: Activity[] = Array.from(activityMap.entries()).map(
        ([id, data]) => ({ id, ...data })
      );

      // Add placeholder activities for parameters with no activities
      parametroMap.forEach((param, parametroId) => {
        const exists = allActivities.some(
          (act) => act.parametro === param.parametroName
        );
        if (!exists) {
          allActivities.push({
            id: -parametroId,
            name: 'Sin actividad',
            parametroId,
            parametro: param.parametroName,
            parametroPeso: param.parametroPeso,
            actividadPeso: 0,
          });
        }
      });

      setActivities(allActivities);
      setGrades(gradesMap);
      setUsers(formattedUsers);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      console.error('Error fetching enrolled users:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchEnrolledUsers(courseId);
  }, [fetchEnrolledUsers, courseId]);

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <UserModal
        user={selectedUser}
        isOpen={isModalOpen}
        onClose={closeModal}
      />

      <div className="group relative">
        <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-[#3AF4EF] opacity-0 blur-sm transition duration-500" />

        {/* Header */}
        <header className="relative z-20 flex flex-col rounded-lg bg-primary p-6 text-center text-2xl font-bold text-[#01142B] shadow-md sm:flex-row sm:items-center sm:justify-between sm:text-left sm:text-3xl">
          <h1>📊 Estadísticas de Estudiantes</h1>
        </header>

        {/* Tabs */}
        <div className="relative z-20 mt-4 flex justify-center space-x-4">
          {(['actuales', 'completos'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setCurrentPage(1);
              }}
              className={`rounded-lg px-4 py-2 ${
                activeTab === tab
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {tab === 'actuales'
                ? 'Estudiantes Actuales'
                : 'Estudiantes calificación al 100%'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="relative z-20 mt-4 rounded-lg bg-gray-800 p-6">
          {error && currentUsers.length === 0 && (
            <div className="mb-6 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700">
              <p>{error}</p>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="size-6 animate-spin text-primary" />
              <span className="ml-2 text-white">Cargando usuarios...</span>
            </div>
          ) : (
            <>
              {/* Search */}
              <div className="mb-6 rounded-lg bg-gray-700 p-4 shadow-md">
                <label className="mb-2 block text-sm font-semibold text-white">
                  Buscar estudiante
                </label>
                <input
                  type="text"
                  placeholder="Nombre o correo..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-md border border-gray-500 px-4 py-2 text-sm text-black focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>

              {/* Bulk actions */}
              {activeTab === 'actuales' ? (
                <button
                  disabled={!selectedIds.length}
                  onClick={() => handleMarkComplete(selectedIds)}
                  className="mb-4 rounded bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700 disabled:opacity-50"
                >
                  Marcar como completos
                </button>
              ) : (
                <button
                  disabled={!selectedIds.length}
                  onClick={() => handleMarkIncomplete(selectedIds)}
                  className="mb-4 rounded bg-red-700 px-4 py-2 text-sm text-white hover:bg-red-950 disabled:opacity-50"
                >
                  Desmarcar como completo
                </button>
              )}

              {/* Mobile cards */}
              <div className="block space-y-3 bg-gray-800 p-2 sm:hidden">
                {currentUsers.map((user) => (
                  <MobileUserCard
                    key={user.id}
                    user={user}
                    activities={activities}
                    grades={grades}
                    onGradeChange={handleGradeChange}
                    onSaveGrade={saveGrade}
                    onViewDetails={openUserDetails}
                  />
                ))}
              </div>

              {/* Desktop table */}
              <div className="hidden overflow-x-auto rounded-lg border border-gray-600 shadow-md sm:block">
                <table className="w-full divide-y divide-gray-700 text-white">
                  <thead className="sticky top-0 bg-gray-900">
                    <tr>
                      <th className="px-4">
                        <input
                          type="checkbox"
                          checked={
                            currentUsers.length > 0 &&
                            selectedIds.length === currentUsers.length
                          }
                          onChange={(e) =>
                            setSelectedIds(
                              e.target.checked
                                ? currentUsers.map((u) => u.id)
                                : []
                            )
                          }
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase">
                        Nombre
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase">
                        Correo
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold whitespace-nowrap uppercase">
                        Progreso
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold whitespace-nowrap uppercase">
                        Última conexión
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold whitespace-nowrap uppercase">
                        Tiempo
                      </th>

                      {activities.map((activity) => (
                        <th
                          key={`${activity.parametro}-${activity.id}`}
                          className="hidden px-4 py-3 text-center text-xs font-semibold whitespace-nowrap uppercase lg:table-cell"
                        >
                          <span className="mb-1 block text-[10px] text-blue-400 italic">
                            {activity.parametro} ({activity.parametroPeso}%)
                          </span>
                          {activity.name === 'Sin actividad' ? (
                            <button
                              type="button"
                              className="rounded bg-green-600 px-1 py-0.5 text-[9px] font-bold text-white hover:bg-green-700"
                              onClick={() =>
                                handleCrearActividad(activity.parametroId)
                              }
                            >
                              + Crear
                            </button>
                          ) : (
                            `${activity.name} (${activity.actividadPeso}%)`
                          )}
                        </th>
                      ))}

                      <th className="px-4 py-3 text-center text-xs font-semibold whitespace-nowrap uppercase">
                        Nota Final
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold whitespace-nowrap uppercase">
                        Acciones
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-700">
                    {currentUsers.map((user) => (
                      <tr
                        key={user.id}
                        className="transition-colors hover:bg-gray-700"
                      >
                        <td className="px-4 text-center">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(user.id)}
                            onChange={(e) =>
                              setSelectedIds((prev) =>
                                e.target.checked
                                  ? [...prev, user.id]
                                  : prev.filter((id) => id !== user.id)
                              )
                            }
                          />
                        </td>

                        <td className="px-4 py-2 whitespace-nowrap">
                          {user.firstName} {user.lastName}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-gray-300">
                          {user.email}
                        </td>

                        <td className="px-4 py-2 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="h-2.5 w-full rounded-full bg-gray-700">
                              <div
                                className="h-2.5 rounded-full bg-blue-500"
                                style={{ width: `${user.averageProgress}%` }}
                              />
                            </div>
                            <span className="text-xs">
                              {user.averageProgress.toFixed(1)}%
                            </span>
                          </div>
                        </td>

                        <td className="px-4 py-2 text-xs whitespace-nowrap text-gray-400">
                          {user.lastConnection ?? 'N/D'}
                        </td>
                        <td className="px-4 py-2 text-xs whitespace-nowrap text-gray-400">
                          {user.tiempoEnCurso ?? 'N/D'}
                        </td>

                        {activities.map((activity) => (
                          <td
                            key={`${user.id}-${activity.id}`}
                            className="hidden px-4 py-2 text-center text-xs whitespace-nowrap lg:table-cell"
                          >
                            {activity.name === 'Sin actividad' ? (
                              <div className="flex items-center justify-center space-x-2">
                                <input
                                  type="number"
                                  value={
                                    user.parameterGrades.find(
                                      (p) =>
                                        p.parametroName === activity.parametro
                                    )?.grade ?? 0
                                  }
                                  disabled
                                  className="w-16 cursor-not-allowed rounded bg-gray-700 p-1 text-center text-white opacity-50"
                                />
                                <button
                                  onClick={() =>
                                    navigateToNewActivity(
                                      activity.parametroId,
                                      activity.numberOfActivities
                                    )
                                  }
                                  className="rounded bg-green-600 px-2 py-1 text-xs text-white hover:bg-green-700"
                                >
                                  Crear
                                </button>
                              </div>
                            ) : (
                              <input
                                type="number"
                                min={0}
                                max={100}
                                step={0.5}
                                className="w-16 rounded bg-gray-700 p-1 text-center text-white"
                                value={grades[user.id]?.[activity.id] ?? ''}
                                onChange={(e) =>
                                  handleGradeChange(
                                    user.id,
                                    activity.id,
                                    parseFloat(e.target.value)
                                  )
                                }
                                onBlur={() =>
                                  saveGrade(
                                    user.id,
                                    activity.id,
                                    grades[user.id]?.[activity.id] ?? 0
                                  )
                                }
                              />
                            )}
                          </td>
                        ))}

                        <td className="px-4 py-2 text-center text-sm font-semibold whitespace-nowrap text-green-300">
                          {calcNotaFinal(user, activities, grades)}
                        </td>

                        <td className="px-4 py-2 text-center whitespace-nowrap">
                          <button
                            onClick={() => openUserDetails(user)}
                            className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700"
                          >
                            <Eye size={14} /> Ver
                          </button>
                          <button
                            onClick={() => handleMarkComplete([user.id])}
                            className="ml-2 text-xs text-green-400 hover:underline"
                          >
                            Completar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="mt-4 flex items-center justify-center gap-2">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  aria-label="Página anterior"
                  className="flex size-8 items-center justify-center rounded bg-gray-700 text-white transition hover:bg-gray-600 disabled:opacity-50"
                >
                  <ChevronLeft className="size-4" />
                </button>

                <span className="rounded bg-gray-800 px-3 py-1 text-sm font-medium text-white">
                  <span className="sm:hidden">
                    {currentPage} / {totalPages}
                  </span>
                  <span className="hidden sm:inline">
                    Página {currentPage} de {totalPages}
                  </span>
                </span>

                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  aria-label="Página siguiente"
                  className="flex size-8 items-center justify-center rounded bg-gray-700 text-white transition hover:bg-gray-600 disabled:opacity-50"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default DashboardEstudiantes;
