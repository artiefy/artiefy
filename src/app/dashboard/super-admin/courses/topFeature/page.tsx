'use client';

import { useEffect, useState } from 'react';

import { toast } from 'sonner';

interface Course {
  id: number;
  title: string;
  is_top: boolean;
  is_featured: boolean;
}

interface CoursesResponse {
  courses: Course[];
}

const PAGE_SIZE = 8;

export default function TopFeaturedCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [jumpTo, setJumpTo] = useState('');

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await fetch('/api/super-admin/courses/topFeature');
        if (!res.ok) throw new Error();
        const data: CoursesResponse = await res.json(); // ✅ Tipado correcto

        const ordered = [...data.courses].sort((a, b) => {
          const aScore = (a.is_top ? 1 : 0) + (a.is_featured ? 1 : 0);
          const bScore = (b.is_top ? 1 : 0) + (b.is_featured ? 1 : 0);
          return bScore - aScore;
        });

        setCourses(ordered);
        setFilteredCourses(ordered);
      } catch {
        toast.error('Error al cargar cursos');
      }
    };

    fetchCourses();
  }, []);

  const handleSearch = (query: string) => {
    setSearch(query);
    setPage(1);
    const filtered = courses.filter((c) =>
      c.title.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredCourses(filtered);
  };

  const updateCourse = async (
    id: number,
    field: 'is_top' | 'is_featured',
    value: boolean
  ) => {
    try {
      const res = await fetch('/api/super-admin/courses/topFeature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, field, value }),
      });

      if (!res.ok) throw new Error();

      const updated = courses.map((course) =>
        course.id === id ? { ...course, [field]: value } : course
      );

      const reordered = updated.sort((a, b) => {
        const aScore = (a.is_top ? 1 : 0) + (a.is_featured ? 1 : 0);
        const bScore = (b.is_top ? 1 : 0) + (b.is_featured ? 1 : 0);
        return bScore - aScore;
      });

      const filtered = reordered.filter((c) =>
        c.title.toLowerCase().includes(search.toLowerCase())
      );

      setCourses(reordered);
      setFilteredCourses(filtered);
      toast.success('Curso actualizado');
    } catch {
      toast.error('Error al actualizar');
    }
  };

  const totalPages = Math.ceil(filteredCourses.length / PAGE_SIZE);
  const paginatedCourses = filteredCourses.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  const handleJump = () => {
    const n = parseInt(jumpTo);
    if (!isNaN(n) && n >= 1 && n <= totalPages) setPage(n);
    setJumpTo('');
  };

  const renderPagination = () => {
    const buttons = [];
    if (page > 1) buttons.push(1);
    if (page > 3) buttons.push('...');
    for (
      let i = Math.max(2, page - 1);
      i <= Math.min(totalPages - 1, page + 1);
      i++
    ) {
      buttons.push(i);
    }
    if (page < totalPages - 2) buttons.push('...');
    if (page < totalPages) buttons.push(totalPages);

    return (
      <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={() => setPage(page - 1)}
          disabled={page === 1}
          className="rounded border border-cyan-400 bg-[#0b2239] px-3 py-1 text-white hover:bg-cyan-700 disabled:opacity-30"
        >
          ⬅
        </button>

        {buttons.map((btn, idx) =>
          typeof btn === 'number' ? (
            <button
              key={idx}
              onClick={() => setPage(btn)}
              className={`rounded px-3 py-1 ${
                btn === page
                  ? 'bg-cyan-400 font-bold text-black'
                  : 'bg-[#0b2239] text-white hover:bg-cyan-600'
              }`}
            >
              {btn}
            </button>
          ) : (
            <span key={idx} className="px-2 text-white">
              ...
            </span>
          )
        )}

        <button
          onClick={() => setPage(page + 1)}
          disabled={page === totalPages}
          className="rounded border border-cyan-400 bg-[#0b2239] px-3 py-1 text-white hover:bg-cyan-700 disabled:opacity-30"
        >
          ➡
        </button>

        <div className="ml-4 flex items-center gap-2">
          <input
            type="number"
            value={jumpTo}
            onChange={(e) => setJumpTo(e.target.value)}
            className="w-16 rounded bg-[#0b2239] px-2 py-1 text-white focus:outline-none"
            placeholder="#"
          />
          <button
            onClick={handleJump}
            className="rounded bg-cyan-600 px-2 py-1 text-sm font-medium text-black hover:bg-cyan-400"
          >
            Ir
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="mx-auto min-h-screen w-full max-w-7xl bg-[#010920] px-4 py-10">
      <h1 className="mb-6 text-center text-4xl font-bold text-cyan-400">
        Cursos Top & Destacados
      </h1>

      <input
        type="text"
        placeholder="Buscar por nombre..."
        value={search}
        onChange={(e) => handleSearch(e.target.value)}
        className="mb-8 w-full max-w-md rounded border border-cyan-700 bg-[#0b2239] px-4 py-2 text-white placeholder-gray-400 focus:outline-none"
      />

      {paginatedCourses.length === 0 ? (
        <p className="text-center text-gray-400">No hay cursos disponibles.</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {paginatedCourses.map((course) => (
            <div
              key={course.id}
              className="glass-card relative rounded-xl border border-cyan-500 p-5 text-white shadow-lg shadow-cyan-500/30 backdrop-blur-sm transition-all duration-300 hover:scale-[1.03] hover:shadow-cyan-400"
            >
              <div className="mb-2 text-xs text-cyan-400">ID: {course.id}</div>
              <h2 className="mb-4 text-lg font-semibold text-white drop-shadow">
                {course.title}
              </h2>
              <div className="flex flex-col gap-3">
                <label className="flex items-center gap-2 text-cyan-300">
                  <input
                    type="checkbox"
                    checked={course.is_top}
                    onChange={(e) =>
                      updateCourse(course.id, 'is_top', e.target.checked)
                    }
                    className="accent-cyan-300"
                  />
                  Marcar como Top
                </label>
                <label className="flex items-center gap-2 text-yellow-300">
                  <input
                    type="checkbox"
                    checked={course.is_featured}
                    onChange={(e) =>
                      updateCourse(course.id, 'is_featured', e.target.checked)
                    }
                    className="accent-yellow-300"
                  />
                  Marcar como Destacado
                </label>
              </div>
            </div>
          ))}
        </div>
      )}

      {renderPagination()}
    </div>
  );
}
