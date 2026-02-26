'use client';

import { useEffect } from 'react';

import { useRouter, useSearchParams } from 'next/navigation';

export default function ProyectosPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Construir la URL de destino preservando todos los parámetros
    const params = new URLSearchParams(searchParams.toString());
    const targetUrl = `/estudiantes${params.toString() ? `?${params.toString()}` : ''}`;

    // Redirigir a la página de estudiantes
    router.replace(targetUrl);
  }, [router, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-slate-400">Redirigiendo...</p>
    </div>
  );
}
