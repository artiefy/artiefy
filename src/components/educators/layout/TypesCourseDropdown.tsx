import { useEffect, useState } from 'react';

// Interfaz para los tipos de curso
interface CourseType {
  id: number;
  name: string;
  description: string;
}

// Props que recibe el componente
interface TypesCourseDropdownProps {
  courseTypeId: number | null;
  setCourseTypeId: (typeId: number | null) => void;
  errors?: {
    type?: boolean;
  };
}

const TypesCourseDropdown: React.FC<TypesCourseDropdownProps> = ({
  courseTypeId,
  setCourseTypeId,
  errors,
}) => {
  const [types, setTypes] = useState<CourseType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTypes = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/educadores/typesCourse', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorData = await response.text();
          throw new Error(`Error al obtener tipos de curso: ${errorData}`);
        }

        const data = (await response.json()) as CourseType[];
        setTypes(data);
      } catch (error) {
        console.error('Error al obtener tipos de curso:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTypes().catch((error) =>
      console.error('Error fetching course types:', error)
    );
  }, []);

  return (
    <div className="flex flex-col gap-2">
      {isLoading ? (
        <p className="text-primary">Cargando tipos de curso...</p>
      ) : (
        <select
          id="type-course-select"
          value={courseTypeId ?? ''}
          onChange={(e) => {
            const value = e.target.value;
            setCourseTypeId(value === '' ? null : Number(value));
          }}
          className={`bg-background mb-5 w-60 rounded border p-2 text-white outline-hidden ${
            errors?.type ? 'border-red-500' : 'border-primary'
          }`}
        >
          <option value="">Selecciona un tipo de curso</option>
          {types.map((type) => (
            <option key={type.id} value={type.id}>
              {type.name}
            </option>
          ))}
        </select>
      )}
    </div>
  );
};

export default TypesCourseDropdown;
