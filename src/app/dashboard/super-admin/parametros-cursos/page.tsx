'use client';

import { useEffect, useState } from 'react';

import Link from 'next/link';

import { FiArrowRight,FiBook } from 'react-icons/fi';

interface Curso {
  id: number;
  title: string;
  description: string;
  rating?: number;
}

const SeleccionarCursoPage = () => {
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCursos = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/cursos');
        if (!res.ok) throw new Error('Error al cargar cursos');
        const data = await res.json();
        setCursos(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    fetchCursos();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8">
        <div className="text-center">
          <div className="loader mx-auto mb-4 h-12 w-12 rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-gray-600">Cargando cursos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Selecciona un Curso
          </h1>
          <p className="mt-2 text-gray-600">
            Elige un curso para gestionar sus parámetros
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {cursos.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
            <p className="text-gray-500">No hay cursos disponibles</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {cursos.map((curso) => (
              <div
                key={curso.id}
                className="group rounded-lg border border-gray-200 bg-white p-6 transition-all hover:border-primary hover:shadow-lg"
              >
                <div className="mb-4 flex items-start justify-between">
                  <FiBook size={24} className="text-primary" />
                  {curso.rating && (
                    <span className="rounded-full bg-yellow-50 px-2 py-1 text-xs font-semibold text-yellow-700">
                      ⭐ {curso.rating.toFixed(1)}
                    </span>
                  )}
                </div>
                <h3 className="mb-2 line-clamp-2 text-lg font-bold text-gray-900">
                  {curso.title}
                </h3>
                {curso.description && (
                  <p className="mb-4 line-clamp-2 text-sm text-gray-600">
                    {curso.description}
                  </p>
                )}
                <Link
                  href={`/dashboard/super-admin/parametros?courseId=${curso.id}`}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-[#01142B] transition-colors group-hover:bg-primary/90"
                >
                  Ver Parámetros
                  <FiArrowRight size={16} />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SeleccionarCursoPage;
