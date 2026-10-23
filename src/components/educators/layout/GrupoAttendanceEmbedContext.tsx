'use client';

import { createContext } from 'react';

export const GrupoAttendanceEmbedContext = createContext<{
  enabled: boolean;
  courseId: number | null;
}>({ enabled: false, courseId: null });
