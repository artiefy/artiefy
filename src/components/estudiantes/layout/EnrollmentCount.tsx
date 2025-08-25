'use client';

import { useEffect, useState } from 'react';

import { Users } from 'lucide-react';

import { getProgramEnrollmentCount } from '~/server/actions/estudiantes/programs/getProgramEnrollmentCount';

export function EnrollmentCount({ programId }: { programId: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const fetchCount = async () => {
      const enrollmentCount = await getProgramEnrollmentCount(programId);
      setCount(enrollmentCount);
    };

    void fetchCount();
  }, [programId]);
  return (
    <div className="inline-flex items-center gap-1 rounded-md bg-violet-500/10 px-1.5 py-1 sm:gap-2 sm:px-2 sm:py-1">
      <span className="text-xs font-semibold text-violet-500 sm:text-base">
        {count}
      </span>
      <Users className="size-3.5 text-violet-500 sm:size-4" />
      <span className="text-xs font-medium text-violet-500 sm:text-base">
        Estudiantes
      </span>
    </div>
  );
}
