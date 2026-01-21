import { useEffect, useState } from 'react';

interface CourseType {
  id: number;
  name: string;
  description: string;
}

// Caché global para evitar múltiples fetches
let courseTypesCache: CourseType[] | null = null;
let courseTypesCachePromise: Promise<CourseType[]> | null = null;

export const useCourseTypes = () => {
  const [types, setTypes] = useState<CourseType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchTypes = async () => {
      try {
        // Si ya hay caché, usar eso
        if (courseTypesCache) {
          console.log('[useCourseTypes] 🚀 Usando caché de tipos de curso');
          setTypes(courseTypesCache);
          setIsLoading(false);
          return;
        }

        // Si hay una promesa en vuelo, esperar a ella
        if (courseTypesCachePromise) {
          console.log(
            '[useCourseTypes] ⏳ Esperando a promesa existente de tipos'
          );
          const result = await courseTypesCachePromise;
          setTypes(result);
          setIsLoading(false);
          return;
        }

        // Si no hay nada, fetchar
        console.log('[useCourseTypes] 🔄 Iniciando fetch de tipos de curso');
        courseTypesCachePromise = fetch('/api/educadores/typesCourse', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          cache: 'no-store',
        })
          .then((response) => {
            if (!response.ok) {
              throw new Error(`Error: ${response.statusText}`);
            }
            return response.json();
          })
          .then((data) => {
            courseTypesCache = data;
            console.log('[useCourseTypes] ✅ Tipos de curso cacheados:', data);
            return data;
          });

        const result = await courseTypesCachePromise;
        setTypes(result);
        setIsLoading(false);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        console.error('[useCourseTypes] ❌ Error:', error);
        setError(error);
        setIsLoading(false);
        courseTypesCachePromise = null; // Limpiar promesa en error
      }
    };

    fetchTypes();
  }, []);

  return { types, isLoading, error };
};
