'use client';

import { useMemo } from 'react';

import { usePathname, useSearchParams } from 'next/navigation';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/estudiantes/ui/select';

export type CourseSortValue =
  | 'random'
  | 'az'
  | 'created'
  | 'category'
  | 'guided-projects';

const SORT_OPTIONS: Array<{ value: CourseSortValue; label: string }> = [
  { value: 'az', label: 'A la Z' },
  { value: 'created', label: 'Fecha de creación' },
  { value: 'category', label: 'Categorías' },
  { value: 'guided-projects', label: 'Proyectos guiados' },
  { value: 'random', label: 'Aleatorio' },
];

interface CourseSortControlProps {
  value: CourseSortValue;
  onSortChange?: (value: CourseSortValue) => void;
}

export default function CourseSortControl({
  value,
  onSortChange,
}: CourseSortControlProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentLabel = useMemo(
    () =>
      SORT_OPTIONS.find((option) => option.value === value)?.label ??
      'Aleatorio',
    [value]
  );

  const handleChange = (nextValue: string) => {
    const params = new URLSearchParams(searchParams?.toString() ?? '');

    if (nextValue === 'random') {
      params.delete('sort');
    } else {
      params.set('sort', nextValue);
    }

    params.delete('page');

    const query = params.toString();
    onSortChange?.(nextValue as CourseSortValue);
    window.history.pushState(
      null,
      '',
      query ? `${pathname}?${query}` : pathname
    );
  };

  return (
    <Select value={value} onValueChange={handleChange}>
      <SelectTrigger
        aria-label="Ordenar cursos"
        className="
          h-auto w-full min-w-0 gap-3 rounded-2xl border border-border/50
          bg-card/80 px-5 py-3 text-sm text-foreground
          shadow-[0_8px_30px_rgba(0,0,0,0.12)] backdrop-blur-sm
          hover:border-primary/30
          focus:ring-primary/30
        "
      >
        <span className="flex min-w-0 flex-1 items-center gap-2.5">
          <span className="shrink-0 text-muted-foreground">Ordenar por:</span>
          <SelectValue aria-label={currentLabel}>
            <span className="truncate font-medium text-foreground">
              {currentLabel}
            </span>
          </SelectValue>
        </span>
      </SelectTrigger>
      <SelectContent
        align="end"
        className="
          z-[120] w-[var(--radix-select-trigger-width)] max-w-[calc(100vw-2rem)]
          min-w-[260px] rounded-xl border border-primary/20 bg-[#061C37] p-1
          text-foreground shadow-[0_16px_40px_rgba(0,0,0,0.35)]
        "
      >
        {SORT_OPTIONS.map((option) => (
          <SelectItem
            key={option.value}
            value={option.value}
            className="
              cursor-pointer rounded-lg text-sm text-foreground
              focus:bg-primary/15 focus:text-primary
              data-[state=checked]:bg-primary/10
              data-[state=checked]:text-primary
            "
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
