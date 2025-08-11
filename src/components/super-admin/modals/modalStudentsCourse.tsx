import { useEffect, useState } from 'react';

import { X } from 'lucide-react';

interface Student {
  id: string;
  name: string;
  email: string;
  progress: number; // Progreso en porcentaje
}

interface ModalStudentProgressProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: number | null;
}

const ModalStudentProgress: React.FC<ModalStudentProgressProps> = ({
  isOpen,
  onClose,
  courseId,
}) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !courseId) return;

    async function fetchStudents() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `/api/super-admin/students?courseId=${courseId}`
        );
        if (!response.ok) throw new Error('Error al obtener estudiantes');

        const data = (await response.json()) as { students: Student[] };
        setStudents(data.students || []);
      } catch {
        setError('No se pudieron cargar los estudiantes.');
      } finally {
        setLoading(false);
      }
    }

    fetchStudents().catch((err) => console.error(err));
  }, [isOpen, courseId]);

  if (!isOpen) return null;

  return (
    <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black p-4 backdrop-blur-md">
      <div className="relative w-full max-w-lg rounded-lg bg-white p-6 shadow-lg">
        {/* 🔹 Modal Header */}
        <div className="flex items-center justify-between border-b pb-2">
          <h2 className="text-lg font-semibold text-gray-800">
            Estudiantes inscritos
          </h2>
          <button onClick={onClose}>
            <X className="size-6 text-gray-600 hover:text-red-500" />
          </button>
        </div>

        {/* 🔄 Cargando datos */}
        {loading && (
          <p className="mt-4 text-center text-gray-500">
            Cargando estudiantes...
          </p>
        )}
        {error && <p className="mt-4 text-center text-red-500">{error}</p>}

        {/* 📌 Lista de estudiantes */}
        {!loading && !error && (
          <ul className="mt-4 space-y-3">
            {students.length === 0 ? (
              <p className="text-center text-gray-500">
                No hay estudiantes inscritos en este curso.
              </p>
            ) : (
              students.map((student) => (
                <li
                  key={student.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      {student.name}
                    </p>
                    <p className="text-xs text-gray-500">{student.email}</p>
                  </div>
                  <div className="h-4 w-36 overflow-hidden rounded-full bg-gray-200">
                    <div
                      className="h-full bg-blue-500 text-center text-xs text-white"
                      style={{ width: `${student.progress}%` }}
                    >
                      {student.progress}%
                    </div>
                  </div>
                </li>
              ))
            )}
          </ul>
        )}

        {/* 🔘 Botón de cierre */}
        <div className="mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-md bg-gray-600 px-4 py-2 text-white hover:bg-gray-700"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalStudentProgress;
