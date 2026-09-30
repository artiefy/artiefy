'use client';

import { useEffect, useRef, useState } from 'react';

import type { CatalogSearchResult } from '~/server/actions/estudiantes/search/searchCatalogPreview';

const DEBOUNCE_MS = 250;

/**
 * State for the "Crear con Artie" search: query, debounced catalog results
 * and open/close behaviour (outside click and Escape close the dropdown).
 */
export function useArtieSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CatalogSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    // Race guard: a slow response for an older query must not overwrite the
    // results of the query the user is typing now.
    let cancelled = false;
    setIsLoading(true);
    const timeout = setTimeout(async () => {
      try {
        const { searchCatalogPreview } =
          await import('~/server/actions/estudiantes/search/searchCatalogPreview');
        const next = await searchCatalogPreview(trimmed);
        if (!cancelled) setResults(next);
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [query]);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const reset = () => {
    setQuery('');
    setResults([]);
    setIsLoading(false);
    setIsOpen(false);
  };

  return {
    query,
    setQuery,
    results,
    isLoading,
    isOpen: isOpen && query.trim().length > 0,
    open: () => setIsOpen(true),
    reset,
    containerRef,
  };
}
