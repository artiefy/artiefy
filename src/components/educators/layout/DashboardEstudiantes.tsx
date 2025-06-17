'use client';

import { useState, useEffect, useCallback } from 'react';

import { Dialog } from '@headlessui/react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Loader2, Eye } from 'lucide-react';
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

  // 1️⃣ Filtrar usuarios
  const filteredUsers = users.filter(
    (user) =>
      searchQuery === '' ||
      user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 2️⃣ Definir la paginación
  const [currentPage, setCurrentPage] = useState(1);

  const [grades, setGrades] = useState<Record<string, Record<number, number>>>(
    {}
  );
  const [activities, setActivities] = useState<
    { id: number; name: string; parametro: string }[]
  >([]);

  const usersPerPage = 12;
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);

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
        <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-[#3AF4EF] via-[#00BDD8] to-[#01142B] opacity-0 blur-sm transition duration-500 group-hover:opacity-100" />

        <header className="bg-primary relative z-20 flex flex-col rounded-lg p-6 text-center text-2xl font-bold text-[#01142B] shadow-md sm:flex-row sm:items-center sm:justify-between sm:text-left sm:text-3xl">
          <h1>📊 Estadísticas de Estudiantes</h1>
        </header>

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

              {/* 🧾 Tabla responsive */}
              <div className="overflow-auto rounded-lg border border-gray-600 shadow-md">
                <table className="w-full min-w-[900px] text-white">
                  <thead className="bg-[#1f2937]">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold">
                        Nombre
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold">
                        Correo
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold">
                        Progreso
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold">
                        Última conexión
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold">
                        Tiempo
                      </th>
                      {activities.map((activity) => (
                        <th
                          key={activity.id}
                          className="px-4 py-3 text-center text-xs font-bold"
                        >
                          {activity.name}
                          <br />
                          <span className="text-xs text-blue-400 italic">
                            {activity.parametro}
                          </span>
                        </th>
                      ))}
                      <th className="px-4 py-3 text-center text-xs font-bold">
                        Nota Final
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-bold">
                        Acciones
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {currentUsers.length > 0 ? (
                      currentUsers.map((user) => (
                        <tr
                          key={user.id}
                          className="border-t border-gray-600 transition hover:bg-gray-700"
                        >
                          <td className="px-4 py-2 text-sm">
                            {user.firstName} {user.lastName}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-300">
                            {user.email}
                          </td>
                          <td className="flex items-center gap-2 px-4 py-2 text-sm">
                            <div className="h-2.5 w-full rounded-full bg-gray-500">
                              <div
                                className="h-2.5 rounded-full bg-blue-500"
                                style={{ width: `${user.averageProgress}%` }}
                              />
                            </div>
                            <span className="text-xs">
                              {user.averageProgress.toFixed(1)}%
                            </span>
                          </td>
                          <td className="px-4 py-2 text-xs text-gray-400">
                            {user.lastConnection ?? 'N/D'}
                          </td>
                          <td className="px-4 py-2 text-xs text-gray-400">
                            {user.tiempoEnCurso ?? 'N/D'}
                          </td>

                          {activities.map((activity) => (
                            <td
                              key={`${user.id}-${activity.id}`}
                              className="px-2 py-2 text-center text-xs"
                            >
                              <input
                                type="number"
                                min={0}
                                max={100}
                                step={0.5}
                                className="w-16 rounded bg-gray-600 p-1 text-center text-white"
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

                          <td className="px-4 py-2 text-center text-sm font-semibold text-green-300">
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

                          <td className="px-4 py-2 text-center">
                            <button
                              onClick={() => openUserDetails(user)}
                              className="rounded bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-700"
                            >
                              <Eye size={14} className="mr-1 inline-block" />
                              Ver
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={activities.length + 6}
                          className="py-4 text-center text-gray-400"
                        >
                          No hay usuarios inscritos.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* ⏮⏭ Paginación */}
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className="rounded bg-gray-700 px-4 py-2 text-white disabled:opacity-50"
                >
                  Anterior
                </button>

                <span className="rounded bg-gray-800 px-4 py-2 text-white">
                  Página {currentPage} de{' '}
                  {Math.ceil(filteredUsers.length / usersPerPage)}
                </span>

                <button
                  onClick={() =>
                    setCurrentPage((prev) =>
                      prev < Math.ceil(filteredUsers.length / usersPerPage)
                        ? prev + 1
                        : prev
                    )
                  }
                  disabled={
                    currentPage ===
                    Math.ceil(filteredUsers.length / usersPerPage)
                  }
                  className="rounded bg-gray-700 px-4 py-2 text-white disabled:opacity-50"
                >
                  Siguiente
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
