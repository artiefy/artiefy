'use client';

import { lazy, Suspense, useState } from 'react';

import { GrupoAttendanceEmbedContext } from './GrupoAttendanceEmbedContext';

const GrupoDetallePage = lazy(
  () => import('~/app/dashboard/super-admin/grupos/[id]/page')
);

export function GroupAttendanceEmbed({
  groupId,
  courseId,
}: {
  groupId: number;
  courseId: number;
}) {
  const [params] = useState(() => Promise.resolve({ id: String(groupId) }));

  return (
    <GrupoAttendanceEmbedContext.Provider value={{ enabled: true, courseId }}>
      <Suspense
        fallback={
          <div className="flex items-center justify-center gap-2 py-12 text-white/50">
            Cargando hoja de asistencia…
          </div>
        }
      >
        <GrupoDetallePage params={params} />
      </Suspense>
    </GrupoAttendanceEmbedContext.Provider>
  );
}
