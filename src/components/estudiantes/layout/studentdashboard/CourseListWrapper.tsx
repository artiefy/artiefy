'use client';

import { useEffect, useState } from 'react';

import { useSearchParams } from 'next/navigation';

import '~/styles/search-loader.css';

export function CourseListWrapper({ children }: { children: React.ReactNode }) {
  const [isSearching, setIsSearching] = useState(false);
  const searchParams = useSearchParams();

  // Listen to search state changes
  useEffect(() => {
    const handleSearchStart = () => {
      setIsSearching(true);
    };

    const handleSearchEnd = () => {
      setIsSearching(false);
    };

    window.addEventListener('search-start', handleSearchStart);
    window.addEventListener('search-end', handleSearchEnd);

    return () => {
      window.removeEventListener('search-start', handleSearchStart);
      window.removeEventListener('search-end', handleSearchEnd);
    };
  }, []);

  // Reset searching state when searchParams change (navigation complete)
  useEffect(() => {
    // Cuando los searchParams cambian, significa que la navegación terminó
    const timer = setTimeout(() => {
      setIsSearching(false);
      window.dispatchEvent(new Event('search-end'));
    }, 0);

    return () => clearTimeout(timer);
  }, [searchParams]);

  return (
    <div className="relative">
      {children}
      {isSearching && (
        <div className="search-loader-overlay">
          <div className="mb-4 text-2xl text-muted">Buscando Cursos...</div>
          <div className="search-loader-spinner" />
        </div>
      )}
    </div>
  );
}
