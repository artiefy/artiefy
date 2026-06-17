'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';

import { FaArrowRight, FaSearch } from 'react-icons/fa';

import { Button } from '~/components/estudiantes/ui/button';
import { Input } from '~/components/estudiantes/ui/input';

export function SearchBar() {
  const [query, setQuery] = useState('');
  const [error, setError] = useState(false);
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) {
      setError(true);
      return;
    }
    setError(false);
    router.push(`/cursos?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <form
      onSubmit={handleSearch}
      className="relative flex w-full max-w-2xl items-center"
    >
      <div className="group relative w-full">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-6">
          <FaSearch className="size-5 text-slate-400 transition-colors group-focus-within:text-primary" />
        </div>
        <Input
          type="text"
          placeholder="¿Qué quieres aprender hoy? Ej. Inteligencia Artificial..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (error) setError(false);
          }}
          className={`h-16 w-full rounded-full border bg-slate-900/60 pr-36 pl-14 text-lg text-white shadow-2xl backdrop-blur-xl transition-all placeholder:text-slate-500 focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-0 ${
            error
              ? 'border-destructive/80 bg-red-950/20'
              : 'border-white/10 hover:border-white/20'
          }`}
        />
        <div className="absolute inset-y-0 right-2 flex items-center">
          <Button
            type="submit"
            className="h-12 rounded-full bg-primary px-6 font-semibold text-primary-foreground shadow-lg transition-all hover:scale-105 hover:bg-primary/90 hover:shadow-primary/25"
          >
            Buscar
            <FaArrowRight className="ml-2 size-4" />
          </Button>
        </div>
      </div>
    </form>
  );
}
