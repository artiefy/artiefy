'use client';

import Link from 'next/link';

import { Button } from '~/components/estudiantes/ui/button';

// Error boundary for the whole student area. `reset` re-renders the failed
// segment so a transient failure (cold database, network) can be retried
// without a full reload.
export default function StudentAreaError({ reset }: { reset: () => void }) {
  return (
    <main
      className="
        mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center
        gap-4 px-4 py-24 text-center
      "
    >
      <h1 className="text-2xl font-bold text-foreground">Algo salió mal</h1>
      <p className="text-sm text-muted-foreground">
        No pudimos cargar esta sección. Intenta de nuevo o vuelve al inicio.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button type="button" onClick={() => reset()}>
          Reintentar
        </Button>
        <Button asChild variant="outline">
          <Link href="/estudiantes">Volver a Estudiantes</Link>
        </Button>
      </div>
    </main>
  );
}
