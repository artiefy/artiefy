'use client';

import { useCallback,useEffect, useState } from 'react';

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
import { ChevronLeft, ChevronRight,Eye, Loader2 } from 'lucide-react';
import { Bar } from 'react-chartjs-2';

import { getUsersEnrolledInCourse } from '~/server/queries/queriesEducator';

// Registro de los plugins de ChartJS que son para las estadísticas de los estudiantes 'No terminado'
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Interfaz para el progreso de las lecciones
interface LessonProgress {
  lessonId: number;
  progress: number;
  isCompleted: boolean;
}

// Interfaz para los usuarios
interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  lastConnection?: string;
  enrolledAt?: string | Date | null; // ✅ Permitir null para evitar errores
  lessonsProgress: LessonProgress[];
  averageProgress: number;
  tiempoEnCurso?: string; // ✅ si quieres tener tipado esto también
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
  }[];
}

// Propiedades del componente para la lista de lecciones
interface LessonsListProps {
  courseId: number;
  selectedColor: string;
}

const DashboardEstudiantes: React.FC<LessonsListProps> = ({ courseId }) => {
  const [users, setUsers] = useState<User[]>([]);
  // 🔍 Estados de búsqueda y filtros
  const [searchQuery, setSearchQuery] = useState(''); // Búsqueda por nombre o correo
  const [loading, setLoading] = useState(true); // Estado de carga
  const [error, setError] = useState<string | null>(null); // Estado de error
  const [isModalOpen, setIsModalOpen] = useState(false); // Estado del modal
  const [selectedUser, setSelectedUser] = useState<User | null>(null); // Usuario seleccionado
  // justo arriba de los filtros y la paginación
  const [activeTab, setActiveTab] = useState<'actuales' | 'completos'>(
    'actuales'
  );

  // 2️⃣ Grades y activities (mantener aquí)
  const [grades, setGrades] = useState<Record<string, Record<number, number>>>(
    {}
  );
  const [activities, setActivities] = useState<
    { id: number; name: string; parametro: string }[]
  >([]);

  // 3️⃣ Paginación
  const [currentPage, setCurrentPage] = useState(1);

  // 3️⃣ Paginación
  const usersPerPage = 12;

  // ———————— Helper para “completos” ————————
  const isStudentCompleted = (user: User): boolean => {
    const avg100 = user.averageProgress === 100;
    const userGrades = grades[user.id] ?? {};
    const hasAllGrades = activities.every(
      (act) => typeof userGrades[act.id] === 'number'
    );
    return avg100 && hasAllGrades;
  };

  // ———————— Filtrado en 3 pasos ————————
  // 1) Por pestaña
  const tabFilteredUsers = users.filter((user) =>
    activeTab === 'completos'
      ? isStudentCompleted(user)
      : !isStudentCompleted(user)
  );

  // 2) Por búsqueda
  const searchedUsers = tabFilteredUsers.filter(
    (user) =>
      searchQuery === '' ||
      user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 3️⃣ Calcular paginación
  const totalPages = Math.ceil(searchedUsers.length / usersPerPage);
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = searchedUsers.slice(indexOfFirstUser, indexOfLastUser);

  const handleGradeChange = (
    userId: string,
    activityId: number,
    newGrade: number
  ) => {
    setGrades((prev) => ({
      ...prev,
      [userId]: {
        ...(prev[userId] || {}),
        [activityId]: newGrade,
      },
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

  // 3️⃣ Obtener usuarios inscritos en el curso
  const fetchEnrolledUsers = useCallback(async (courseId: number) => {
    try {
      const rawUsers = await getUsersEnrolledInCourse(courseId);

      // Calcular promedio y formato
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
          const enrolledDate = new Date(user.enrolledAt);
          const now = new Date();
          const diffMs = now.getTime() - enrolledDate.getTime();
          const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
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
          /* ⬇ mantenemos las notas por parámetro tal como llegan */
          parameterGrades: user.parameterGrades,
        };
      });

      // ←← Extraer lecciones únicas y mapa de promedios
      const activityMap = new Map<
        number,
        { name: string; parametro: string }
      >();
      const gradesMap: Record<string, Record<number, number>> = {};

      rawUsers.forEach((u) => {
        const g: Record<number, number> = {};
        u.activitiesWithGrades.forEach((a) => {
          activityMap.set(a.activityId, {
            name: a.activityName,
            parametro: a.parametroName,
          });
          g[a.activityId] = a.grade;
        });
        gradesMap[u.id] = g;
      });

      const allActivities = Array.from(activityMap.entries()).map(
        ([id, data]) => ({
          id,
          name: data.name,
          parametro: data.parametro,
        })
      );

      setActivities(allActivities);
      setGrades(gradesMap);

      setUsers(formattedUsers);
      console.log('✅ Usuarios con actividades:', formattedUsers);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      console.error('Error fetching enrolled users:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  //Abrir modal o popup para ver detalles del usuario
  const openUserDetails = (user: User) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  //Cerrar modal o popup
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
  };

  // 4️⃣ Obtener datos para el gráfico de progreso
  const getChartData = (user: User) => {
    return {
      labels: user.lessonsProgress.map(
        (lesson) => `Lección ${lesson.lessonId}`
      ),
      datasets: [
        {
          label: 'Progreso',
          data: user.lessonsProgress.map((lesson) => lesson.progress),
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1,
        },
      ],
    };
  };

  // 5️⃣ Efecto para cargar los usuarios inscritos
  useEffect(() => {
    void fetchEnrolledUsers(courseId);
  }, [fetchEnrolledUsers, courseId]);

  // 6️⃣ Vista del componente 'un dashboard de estudiantes que tiene una tabla con los estudiantes inscritos en un curso'
  return (
    <>
      {/* Modal de detalles del usuario */}
      <Dialog
        open={isModalOpen}
        onClose={closeModal}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      >
        <div className="min-h-screen px-4 text-center">
          <span
            className="inline-block h-screen align-middle"
            aria-hidden="true"
          >
            &#8203;
          </span>
          <div className="inline-block w-full max-w-2xl transform overflow-hidden rounded-xl bg-gray-900 p-6 text-left align-middle shadow-2xl transition-all">
            <Dialog.Title
              as="h3"
              className="mb-4 border-b border-gray-700 pb-3 text-2xl font-semibold text-white"
            >
              👤 Detalles del Estudiante
            </Dialog.Title>

            {selectedUser && (
              <div className="space-y-3 text-sm text-gray-300">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="font-semibold text-gray-400">Nombre:</p>
                    <p>
                      {selectedUser.firstName} {selectedUser.lastName}
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-400">Correo:</p>
                    <p>{selectedUser.email}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-400">
                      Progreso Promedio:
                    </p>
                    <p>{selectedUser.averageProgress.toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-400">
                      Última Conexión:
                    </p>
                    <p>{selectedUser.lastConnection}</p>
                  </div>
                </div>

                <div className="mt-6">
                  <h4 className="text-md mb-2 font-semibold text-white">
                    📊 Progreso por Lección
                  </h4>
                  <div className="rounded-md border border-gray-700 bg-gray-800 p-3">
                    <Bar
                      data={getChartData(selectedUser)}
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
                onClick={closeModal}
                className="rounded-md bg-blue-600 px-5 py-2 text-sm text-white transition hover:bg-blue-700"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </Dialog>

      {/* Fin del modal */}
      <div className="group relative">
        <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-[#3AF4EF] opacity-0 blur-sm transition duration-500" />

        <header className="bg-primary relative z-20 flex flex-col rounded-lg p-6 text-center text-2xl font-bold text-[#01142B] shadow-md sm:flex-row sm:items-center sm:justify-between sm:text-left sm:text-3xl">
          <h1>📊 Estadísticas de Estudiantes</h1>
        </header>
        <div className="relative z-20 mt-4 flex justify-center space-x-4">
          {' '}
          <button
            onClick={() => {
              setActiveTab('actuales');
              setCurrentPage(1);
            }}
            className={`rounded-lg px-4 py-2 ${
              activeTab === 'actuales'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Estudiantes Actuales
          </button>
          <button
            onClick={() => {
              setActiveTab('completos');
              setCurrentPage(1);
            }}
            className={`rounded-lg px-4 py-2 ${
              activeTab === 'completos'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Estudiantes calificación al 100%
          </button>
        </div>

        <div className="relative z-20 mt-4 rounded-lg bg-gray-800 p-6">
          {error && currentUsers.length <= 0 && (
            <div className="mb-6 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700">
              <p>{error}</p>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="text-primary size-6 animate-spin" />
              <span className="ml-2 text-white">Cargando usuarios...</span>
            </div>
          ) : (
            <>
              {/* 🔍 Buscador */}
              <div className="mb-6 rounded-lg bg-gray-700 p-4 shadow-md">
                <label className="mb-2 block text-sm font-semibold text-white">
                  Buscar estudiante
                </label>
                <input
                  type="text"
                  placeholder="Nombre o correo..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="focus:ring-primary w-full rounded-md border border-gray-500 px-4 py-2 text-sm text-black focus:ring-2 focus:outline-none"
                />
              </div>

              <div className="space-y-4">
                {/* ─── Versión móvil compacta ─── */}
                <div className="block space-y-3 bg-gray-800 p-2 sm:hidden">
                  {currentUsers.map((user) => {
                    // Cálculo nota final
                    const notasArray = Object.values(grades[user.id] ?? {});
                    const notaFinal =
                      notasArray.length > 0
                        ? (
                            notasArray.reduce((a, b) => a + b, 0) /
                            notasArray.length
                          ).toFixed(2)
                        : 'N/D';

                    return (
                      <div
                        key={user.id}
                        className="rounded-lg border border-gray-600 bg-gray-700 p-3 shadow-sm"
                      >
                        {/* Nombre y correo en una línea */}
                        <div className="flex justify-between text-sm font-medium">
                          <span className="truncate">
                            {user.firstName} {user.lastName}
                          </span>
                          <span className="truncate text-gray-300">
                            {user.email}
                          </span>
                        </div>

                        {/* Progreso con barra fina */}
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

                        {/* Última conexión y tiempo en grid 2 cols */}
                        <div className="mt-2 grid grid-cols-2 gap-x-2 text-[11px] text-gray-400">
                          <div className="truncate">
                            Última:{' '}
                            <span className="text-white">
                              {user.lastConnection ?? 'N/D'}
                            </span>
                          </div>
                          <div className="truncate">
                            Tiempo:{' '}
                            <span className="text-white">
                              {user.tiempoEnCurso ?? 'N/D'}
                            </span>
                          </div>
                        </div>

                        {/* Notas por actividad en listado compacto */}
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
                            </div>
                          ))}
                        </div>

                        {/* Nota final y botón */}
                        <div className="mt-3 flex items-center justify-between">
                          <span className="text-xs font-medium">Final</span>
                          <span className="text-xs font-semibold text-green-300">
                            {notaFinal}
                          </span>
                        </div>
                        <div className="mt-2 text-right">
                          <button
                            onClick={() => openUserDetails(user)}
                            className="inline-flex items-center gap-1 rounded bg-blue-600 px-2 py-1 text-xs font-medium text-white hover:bg-blue-700"
                          >
                            <Eye size={14} />
                            Ver
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 2️⃣ – Tabla para desktop */}
                <div className="hidden overflow-x-auto rounded-lg border border-gray-600 shadow-md sm:block">
                  <table className="w-full divide-y divide-gray-700 text-white">
                    <thead className="sticky top-0 bg-gray-900">
                      <tr>
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
                            key={activity.id}
                            className="hidden px-4 py-3 text-center text-xs font-semibold whitespace-nowrap uppercase lg:table-cell"
                          >
                            {activity.name}
                            <br />
                            <span className="text-[10px] text-blue-400 italic">
                              {activity.parametro}
                            </span>
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
                              <input
                                type="number"
                                min={0}
                                max={100}
                                step={0.5}
                                className="w-16 rounded bg-gray-700 p-1 text-center text-white"
                                value={grades[user.id]?.[activity.id] ?? 0}
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
                            </td>
                          ))}

                          <td className="px-4 py-2 text-center text-sm font-semibold whitespace-nowrap text-green-300">
                            {(() => {
                              const notas = Object.values(
                                grades[user.id] ?? {}
                              );
                              if (!notas.length) return 'N/D';
                              const promedio =
                                notas.reduce((a, b) => a + b, 0) / notas.length;
                              return promedio.toFixed(2);
                            })()}
                          </td>

                          <td className="px-4 py-2 text-center whitespace-nowrap">
                            <button
                              onClick={() => openUserDetails(user)}
                              className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700"
                            >
                              <Eye size={14} />
                              Ver
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              {/* ─── Paginación con números ─── */}
              <div className="mt-4 flex items-center justify-center gap-2">
                {/* Botón «Anterior» */}
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  aria-label="Página anterior"
                  className="flex h-8 w-8 items-center justify-center rounded bg-gray-700 text-white transition hover:bg-gray-600 disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                {/* Indicador de página */}
                <span className="rounded bg-gray-800 px-3 py-1 text-sm font-medium text-white">
                  {/* En móvil: “1 / 10” | en sm+: “Página 1 de 10” */}
                  <span className="sm:hidden">
                    {currentPage} / {totalPages}
                  </span>
                  <span className="hidden sm:inline">
                    Página {currentPage} de {totalPages}
                  </span>
                </span>

                {/* Botón «Siguiente» */}
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  aria-label="Página siguiente"
                  className="flex h-8 w-8 items-center justify-center rounded bg-gray-700 text-white transition hover:bg-gray-600 disabled:opacity-50"
                >
                  <ChevronRight className="h-4 w-4" />
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
