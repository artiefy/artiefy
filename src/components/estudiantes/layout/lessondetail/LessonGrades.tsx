'use client';
import React from 'react';

interface LessonGradesProps {
  finalGrade: number | null;
  isLoading?: boolean;
  isDisabled?: boolean;
}

export function LessonGrades({
  finalGrade,
  isLoading,
  isDisabled = false,
}: LessonGradesProps) {
  return (
    <div>
      {/* Nota principal removida - ahora se muestra en el historial */}
    </div>
  );
}
