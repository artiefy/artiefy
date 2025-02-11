import { useEffect, useState } from "react";
import { Button } from "~/components/educators/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader, DialogFooter } from "~/components/educators/ui/dialog";

interface Student {
  id: string;
  name: string;
  email: string;
  lastLogin: string;
  completedCourses: boolean;
  progress: number;
  timeSpent?: number; // ✅ Agregamos esto para recibir el tiempo desde la BD
}

interface ModalFormCourseProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: number;
}

const ModalFormCourse: React.FC<ModalFormCourseProps> = ({ isOpen, onClose, courseId }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeTracking, setTimeTracking] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!isOpen) return;

    const fetchStudents = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/super-admin/students?courseId=${courseId}`);
        if (!response.ok) throw new Error("Error al obtener los estudiantes");
        const data = await response.json();
        setStudents(data.students);

        // 🔹 Obtener el tiempo de conexión guardado en la BD y localStorage
        const storedTime = JSON.parse(localStorage.getItem("time_tracking") || "{}");
        const today = new Date().toISOString().split("T")[0];

        // 🔹 Mapear el tiempo de conexión de cada estudiante
        const updatedTimeTracking = data.students.reduce((acc: Record<string, number>, student: Student) => {
          acc[student.id] = student.timeSpent || storedTime[student.id]?.[today] || 0; // 🔥 Primero usa el de la BD, luego localStorage
          return acc;
        }, {});

        setTimeTracking(updatedTimeTracking);
      } catch (err) {
        setError("Error al cargar los datos.");
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [isOpen, courseId]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 text-white rounded-lg p-6 max-w-5xl max-h-screen flex flex-col">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl font-extrabold text-center">📚 Estudiantes Inscritos</DialogTitle>
          <DialogDescription className="text-gray-400 text-center">
            Progreso de los estudiantes en este curso.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <p className="text-center">🔄 Cargando...</p>
        ) : error ? (
          <p className="text-center text-red-500">{error}</p>
        ) : students.length === 0 ? (
          <p className="text-center text-gray-500">No hay estudiantes inscritos en este curso.</p>
        ) : (
          <div className="flex-grow">
            <table className="w-full border border-gray-700 text-left text-sm">
              <thead className="bg-gray-800 text-white">
                <tr>
                  <th className="border border-gray-700 px-4 py-3">Nombre</th>
                  <th className="border border-gray-700 px-4 py-3">Email</th>
                  <th className="border border-gray-700 px-4 py-3">Última conexión</th>
                  <th className="border border-gray-700 px-4 py-3">Tiempo Conectado</th>
                  <th className="border border-gray-700 px-4 py-3">Estado</th>
                  <th className="border border-gray-700 px-4 py-3">Progreso</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => {

                  return (
                    <tr key={student.id} className="hover:bg-gray-700">
                      <td className="border border-gray-700 px-4 py-3">{student.name || "No disponible"}</td>
                      <td className="border border-gray-700 px-4 py-3">{student.email}</td>
                      <td className="border border-gray-700 px-4 py-3">
                        {new Date(student.lastLogin).toLocaleString()}
                      </td>
                      <td className="border border-gray-700 px-4 py-3">
  {(() => {
    const totalSeconds = student.timeSpent || 0;

    // Calcular días, horas, minutos y segundos correctamente
    const days = Math.floor(totalSeconds / 86400); // 1 día = 86400 segundos
    const hours = Math.floor((totalSeconds % 86400) / 3600); // Horas restantes
    const minutes = Math.floor((totalSeconds % 3600) / 60); // Minutos restantes después de quitar las horas
    const seconds = totalSeconds % 60; // Segundos restantes después de quitar los minutos

    console.log(
      `Debug: totalSeconds=${totalSeconds}, days=${days}, hours=${hours}, minutes=${minutes}, seconds=${seconds}`
    );

    // Generar la cadena de tiempo en formato legible
    const timeString = [
      days > 0 ? `${days}d` : '',
      hours > 0 ? `${hours}h` : '',
      minutes > 0 ? `${minutes}m` : '',
      seconds > 0 ? `${seconds}s` : ''
    ]
      .filter(Boolean) // Eliminar valores vacíos
      .join(' '); // Unir con espacios

    return timeString || '0s'; // Si no hay tiempo, mostrar "0s"
  })()}
</td>




                      <td className="border border-gray-700 px-4 py-3">
                        {student.completedCourses ? "✅ Completado" : "⏳ En progreso"}
                      </td>
                      <td className="border border-gray-700 px-4 py-3">
                        <div className="relative w-full bg-gray-700 rounded-full h-6">
                          <div
                            className="absolute top-0 left-0 h-6 rounded-full bg-green-500"
                            style={{ width: `${student.progress}%` }}
                          ></div>
                          <p className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
                            {student.progress}%
                          </p>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>

            </table>
          </div>
        )}

        <DialogFooter className="mt-4">
          <Button onClick={onClose} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg">
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ModalFormCourse;
