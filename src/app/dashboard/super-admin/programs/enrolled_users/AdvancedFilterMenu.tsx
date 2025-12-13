'use client';

import { useEffect, useMemo, useState } from 'react';

import { Search, X } from 'lucide-react';

interface FilterOption {
  value: string;
  count: number;
}

interface AdvancedFilterMenuProps {
  columnId: string;
  columnLabel: string;
  columnType: 'text' | 'date' | 'select';
  allValues: (string | null | undefined)[]; // TODOS los valores del dataset
  currentFilters: string[]; // valores actualmente filtrados
  onApplyFilters: (filters: string[]) => void;
  onClose: () => void;
  position?: { top: number; left: number; width: number };
}

export function AdvancedFilterMenu({
  columnLabel,
  allValues,
  currentFilters,
  onApplyFilters,
  onClose,
  position,
}: AdvancedFilterMenuProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<Set<string>>(
    new Set(currentFilters)
  );
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | 'count'>('asc');
  const [adjustedPosition, setAdjustedPosition] = useState(position);

  // Ajustar posición si se sale de pantalla
  useEffect(() => {
    if (!position) return;

    const menuWidth = Math.max(position.width, 350);
    const menuHeight = 600;
    const padding = 16;

    // Viewport dimensions
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let finalTop = position.top;
    let finalLeft = position.left;

    // Ajustar horizontalmente
    const rightEdge = finalLeft + menuWidth;
    if (rightEdge + padding > viewportWidth) {
      // Se sale por la derecha - mover hacia la izquierda
      finalLeft = Math.max(padding, viewportWidth - menuWidth - padding);
    }

    if (finalLeft < padding) {
      // Se sale por la izquierda - mover hacia la derecha
      finalLeft = padding;
    }

    // Ajustar verticalmente
    const bottomEdge = finalTop + menuHeight;
    if (bottomEdge + padding > viewportHeight) {
      // Se sale por abajo - mostrar encima del botón
      finalTop = Math.max(padding, position.top - menuHeight - 8);
    }

    const t = setTimeout(() => {
      setAdjustedPosition({
        top: finalTop,
        left: finalLeft,
        width: menuWidth,
      });
    }, 0);
    return () => clearTimeout(t);
  }, [position]);

  // Generar opciones únicas con conteos
  const filterOptions = useMemo(() => {
    const valueMap = new Map<string, number>();

    allValues.forEach((val) => {
      if (val === null || val === undefined || val === '') return;
      const str = String(val).trim();
      if (str) {
        valueMap.set(str, (valueMap.get(str) ?? 0) + 1);
      }
    });

    let options: FilterOption[] = Array.from(valueMap.entries()).map(
      ([value, count]) => ({
        value,
        count,
      })
    );

    // Ordenar según selección del usuario
    if (sortOrder === 'asc') {
      options.sort((a, b) => a.value.localeCompare(b.value));
    } else if (sortOrder === 'desc') {
      options.sort((a, b) => b.value.localeCompare(a.value));
    } else if (sortOrder === 'count') {
      options.sort((a, b) => b.count - a.count);
    }

    // Filtrar por búsqueda
    if (searchTerm) {
      options = options.filter((opt) =>
        opt.value.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return options;
  }, [allValues, searchTerm, sortOrder]);

  const handleSelectAll = () => {
    if (selectedFilters.size === filterOptions.length) {
      setSelectedFilters(new Set());
    } else {
      setSelectedFilters(new Set(filterOptions.map((o) => o.value)));
    }
  };

  const handleToggle = (value: string) => {
    const newSet = new Set(selectedFilters);
    if (newSet.has(value)) {
      newSet.delete(value);
    } else {
      newSet.add(value);
    }
    setSelectedFilters(newSet);
  };

  const handleApply = () => {
    onApplyFilters(Array.from(selectedFilters));
    onClose();
  };

  const handleClear = () => {
    setSelectedFilters(new Set());
    onApplyFilters([]);
    onClose();
  };

  return (
    <div
      className="fixed z-[70] flex max-h-[600px] flex-col overflow-hidden rounded-lg border border-gray-600 bg-gray-800 shadow-2xl"
      style={
        adjustedPosition
          ? {
              top: `${adjustedPosition.top}px`,
              left: `${adjustedPosition.left}px`,
              width: `${adjustedPosition.width}px`,
              maxWidth: 'calc(100vw - 32px)',
            }
          : undefined
      }
    >
      {/* Header */}
      <div className="bg-gray-750 border-b border-gray-700 px-4 py-3">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold text-white">{columnLabel}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 transition hover:text-white"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute top-2.5 left-2 size-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded bg-gray-700 py-2 pr-3 pl-8 text-sm text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Sort Controls */}
        <div className="mt-2 flex gap-1">
          <button
            onClick={() => setSortOrder('asc')}
            className={`flex-1 rounded px-2 py-1 text-xs font-medium transition ${
              sortOrder === 'asc'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            A → Z
          </button>
          <button
            onClick={() => setSortOrder('desc')}
            className={`flex-1 rounded px-2 py-1 text-xs font-medium transition ${
              sortOrder === 'desc'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Z → A
          </button>
          <button
            onClick={() => setSortOrder('count')}
            className={`flex-1 rounded px-2 py-1 text-xs font-medium transition ${
              sortOrder === 'count'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Conteo
          </button>
        </div>
      </div>

      {/* Options List */}
      <div className="flex-1 space-y-1 overflow-y-auto px-2 py-2">
        {/* Select All */}
        <button
          onClick={handleSelectAll}
          className="w-full rounded px-3 py-2 text-left text-sm font-medium text-blue-400 transition hover:bg-gray-700"
        >
          {selectedFilters.size === filterOptions.length
            ? '☑ Deseleccionar todo'
            : '☐ Seleccionar todo'}
        </button>

        {/* Separator */}
        <div className="my-1 border-t border-gray-700" />

        {/* Filter options */}
        {filterOptions.length === 0 ? (
          <div className="px-3 py-2 text-center text-sm text-gray-400">
            Sin resultados
          </div>
        ) : (
          filterOptions.map((opt) => {
            const isSelected = selectedFilters.has(opt.value);
            return (
              <button
                key={opt.value}
                onClick={() => handleToggle(opt.value)}
                className="group flex w-full items-center justify-between rounded px-3 py-2 text-left transition hover:bg-gray-700"
              >
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => undefined}
                    className="cursor-pointer rounded"
                  />
                  <span
                    className="truncate text-sm text-gray-200"
                    title={opt.value}
                  >
                    {opt.value || '(vacío)'}
                  </span>
                </div>
                <span className="ml-2 flex-shrink-0 text-xs text-gray-500">
                  {opt.count}
                </span>
              </button>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-750 flex items-center justify-between gap-2 border-t border-gray-700 px-4 py-3">
        <button
          onClick={handleClear}
          className="rounded bg-gray-700 px-3 py-2 text-sm text-white transition hover:bg-gray-600"
        >
          Limpiar
        </button>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="rounded bg-gray-700 px-3 py-2 text-sm text-white transition hover:bg-gray-600"
          >
            Cancelar
          </button>
          <button
            onClick={handleApply}
            className="rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            Aplicar
          </button>
        </div>
      </div>
    </div>
  );
}
