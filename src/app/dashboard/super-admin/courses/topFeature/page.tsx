'use client';

import { useEffect, useMemo, useState } from 'react';

import { toast } from 'sonner';

import { normalizeSearch } from '~/lib/utils';

type ItemKind = 'course' | 'guidedProject';

interface TopFeatureItem {
  id: number;
  title: string;
  type: ItemKind;
  is_top: boolean;
  is_featured: boolean;
}

interface TopFeatureResponse {
  items: TopFeatureItem[];
}

type TypeFilter = 'all' | ItemKind;

const PAGE_SIZE = 8;

const TYPE_FILTERS: { value: TypeFilter; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'course', label: 'Cursos' },
  { value: 'guidedProject', label: 'Proyectos guiados' },
];

const TYPE_LABELS: Record<ItemKind, string> = {
  course: 'Curso',
  guidedProject: 'Proyecto guiado',
};

const itemKey = (item: Pick<TopFeatureItem, 'id' | 'type'>) =>
  `${item.type}-${item.id}`;

/** Flagged items first, so the current selection is always on page one. */
const byFlagScore = (a: TopFeatureItem, b: TopFeatureItem) => {
  const aScore = (a.is_top ? 1 : 0) + (a.is_featured ? 1 : 0);
  const bScore = (b.is_top ? 1 : 0) + (b.is_featured ? 1 : 0);
  return bScore - aScore;
};

export default function TopFeaturedCourses() {
  const [items, setItems] = useState<TopFeatureItem[]>([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [page, setPage] = useState(1);
  const [jumpTo, setJumpTo] = useState('');

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const res = await fetch('/api/super-admin/courses/topFeature');
        if (!res.ok) throw new Error();
        const data = (await res.json()) as TopFeatureResponse;
        setItems([...data.items].sort(byFlagScore));
      } catch {
        toast.error('Error al cargar cursos y proyectos');
      }
    };

    void fetchItems();
  }, []);

  // Derived instead of a second state: the previous copy could drift out of
  // sync with `items` after a toggle.
  const filteredItems = useMemo(() => {
    const normalizedSearch = normalizeSearch(search);
    return items.filter(
      (item) =>
        (typeFilter === 'all' || item.type === typeFilter) &&
        normalizeSearch(item.title).includes(normalizedSearch)
    );
  }, [items, search, typeFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const updateItem = async (
    item: TopFeatureItem,
    field: 'is_top' | 'is_featured',
    value: boolean
  ) => {
    const previousItems = items;
    // Optimistic: the checkbox reflects the intent right away and rolls back
    // if the request fails.
    setItems((current) =>
      current
        .map((entry) =>
          itemKey(entry) === itemKey(item)
            ? { ...entry, [field]: value }
            : entry
        )
        .sort(byFlagScore)
    );

    try {
      const res = await fetch('/api/super-admin/courses/topFeature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, type: item.type, field, value }),
      });

      if (!res.ok) throw new Error();

      toast.success(`${TYPE_LABELS[item.type]} actualizado`);
    } catch {
      setItems(previousItems);
      toast.error('Error al actualizar');
    }
  };

  const handleJump = () => {
    const n = parseInt(jumpTo);
    if (!isNaN(n) && n >= 1 && n <= totalPages) setPage(n);
    setJumpTo('');
  };

  const renderPagination = () => {
    const buttons: (number | string)[] = [];
    if (currentPage > 1) buttons.push(1);
    if (currentPage > 3) buttons.push('...');
    for (
      let i = Math.max(2, currentPage - 1);
      i <= Math.min(totalPages - 1, currentPage + 1);
      i++
    ) {
      buttons.push(i);
    }
    if (currentPage < totalPages - 2) buttons.push('...');
    if (currentPage < totalPages) buttons.push(totalPages);

    return (
      <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={() => setPage(currentPage - 1)}
          disabled={currentPage === 1}
          className="
            rounded border border-cyan-400 bg-[#0b2239] px-3 py-1 text-white
            hover:bg-cyan-700
            disabled:opacity-30
          "
        >
          ⬅
        </button>

        {buttons.map((btn, idx) =>
          typeof btn === 'number' ? (
            <button
              key={idx}
              onClick={() => setPage(btn)}
              className={`
                rounded px-3 py-1
                ${
                  btn === currentPage
                    ? 'bg-cyan-400 font-bold text-black'
                    : `
                    bg-[#0b2239] text-white
                    hover:bg-cyan-600
                  `
                }
              `}
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
          onClick={() => setPage(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="
            rounded border border-cyan-400 bg-[#0b2239] px-3 py-1 text-white
            hover:bg-cyan-700
            disabled:opacity-30
          "
        >
          ➡
        </button>

        <div className="ml-4 flex items-center gap-2">
          <input
            type="number"
            value={jumpTo}
            onChange={(e) => setJumpTo(e.target.value)}
            className="
              w-16 rounded bg-[#0b2239] px-2 py-1 text-white
              focus:outline-none
            "
            placeholder="#"
          />
          <button
            onClick={handleJump}
            className="
              rounded bg-cyan-600 px-2 py-1 text-sm font-medium text-black
              hover:bg-cyan-400
            "
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
        Cursos y Proyectos Top & Destacados
      </h1>

      <div className="mb-8 flex flex-wrap items-center gap-4">
        <input
          type="text"
          placeholder="Buscar por nombre..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="
            w-full max-w-md rounded border border-cyan-700 bg-[#0b2239] px-4
            py-2 text-white placeholder-gray-400
            focus:outline-none
          "
        />

        <div className="flex flex-wrap gap-2">
          {TYPE_FILTERS.map((filter) => (
            <button
              key={filter.value}
              onClick={() => {
                setTypeFilter(filter.value);
                setPage(1);
              }}
              className={`
                rounded-full border px-4 py-1.5 text-sm font-medium
                transition-colors
                ${
                  typeFilter === filter.value
                    ? 'border-cyan-400 bg-cyan-400 text-black'
                    : `
                      border-cyan-700 bg-[#0b2239] text-white
                      hover:border-cyan-400
                    `
                }
              `}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {paginatedItems.length === 0 ? (
        <p className="text-center text-gray-400">
          No hay cursos ni proyectos disponibles.
        </p>
      ) : (
        <div
          className="
          grid grid-cols-1 gap-6
          sm:grid-cols-2
          md:grid-cols-3
          lg:grid-cols-4
        "
        >
          {paginatedItems.map((item) => (
            <div
              key={itemKey(item)}
              className="
                glass-card relative rounded-xl border border-cyan-500 p-5
                text-white shadow-lg shadow-cyan-500/30 backdrop-blur-sm
                transition-all duration-300
                hover:scale-[1.03] hover:shadow-cyan-400
              "
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-xs text-cyan-400">ID: {item.id}</span>
                <span
                  className={`
                    rounded-full px-2 py-0.5 text-[11px] font-semibold
                    ${
                      item.type === 'guidedProject'
                        ? 'bg-purple-500/20 text-purple-300'
                        : 'bg-cyan-500/20 text-cyan-300'
                    }
                  `}
                >
                  {TYPE_LABELS[item.type]}
                </span>
              </div>
              <h2 className="mb-4 text-lg font-semibold text-white drop-shadow">
                {item.title}
              </h2>
              <div className="flex flex-col gap-3">
                <label className="flex items-center gap-2 text-cyan-300">
                  <input
                    type="checkbox"
                    checked={item.is_top}
                    onChange={(e) =>
                      updateItem(item, 'is_top', e.target.checked)
                    }
                    className="accent-cyan-300"
                  />
                  Marcar como Top
                </label>
                <label className="flex items-center gap-2 text-yellow-300">
                  <input
                    type="checkbox"
                    checked={item.is_featured}
                    onChange={(e) =>
                      updateItem(item, 'is_featured', e.target.checked)
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
