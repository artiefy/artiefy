'use client';

import React, { useState, useCallback } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/solid';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useProgress } from '@bprogress/next';
import { Button } from '~/components/estudiantes/ui/button';
import { Icons } from '~/components/estudiantes/ui/icons';
import { Input } from '~/components/estudiantes/ui/input';
import {
  saveScrollPosition,
  restoreScrollPosition,
} from '~/utils/scrollPosition';

const SearchForm: React.FC = () => {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const { start, stop } = useProgress();
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get('query') ?? ''
  );

  const handleSearch = useCallback(() => {
    saveScrollPosition();
    const params = new URLSearchParams();
    if (searchQuery) {
      params.set('query', searchQuery);
    }
    start();
    setIsSearching(true);
    router.push(`${pathname}?${params.toString()}`);
  }, [searchQuery, pathname, router, start]);

  React.useEffect(() => {
    setIsSearching(false);
    stop();
    restoreScrollPosition();
  }, [searchParams, stop]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  return (
    <div className="flex w-full justify-center p-4 sm:p-8 lg:justify-end lg:px-20">
      <div className="relative w-full max-w-lg">
        <Input
          type="search"
          placeholder="Buscar cursos..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full bg-white pr-10 text-background"
          aria-label="Buscar cursos"
        />
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
          {isSearching ? (
            <Icons.spinner
              className="size-4 text-background"
              aria-hidden="true"
            />
          ) : (
            <MagnifyingGlassIcon
              className="size-4 text-gray-400"
              aria-hidden="true"
            />
          )}
        </div>
      </div>
      <Button
        onClick={handleSearch}
        disabled={isSearching}
        className="ml-2 border border-primary bg-primary text-background hover:bg-background hover:text-primary"
        aria-label="Realizar búsqueda"
      >
        Buscar
      </Button>
    
</div>
  );
};

export default SearchForm;
