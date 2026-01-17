import { ImHappy } from 'react-icons/im';
import { PiSmileySad } from 'react-icons/pi';

import { formatScore } from '~/utils/formatScore';

interface LessonGradeHistoryInlineProps {
  gradeSummary: {
    finalGrade: number;
    courseCompleted?: boolean;
    parameters: {
      name: string;
      grade: number;
      weight: number;
      activities: {
        id: number;
        name: string;
        grade: number;
      }[];
    }[];
  } | null;
}

export function LessonGradeHistoryInline({
  gradeSummary,
}: LessonGradeHistoryInlineProps) {
  if (!gradeSummary) return null;

  // Ordenar los parámetros por nombre (asumiendo que los nombres son "Parámetro 1", "Parámetro 2", etc.)
  const sortedParameters = [...gradeSummary.parameters].sort((a, b) => {
    const aNum = parseInt(a.name.split(' ')[1]);
    const bNum = parseInt(b.name.split(' ')[1]);
    return aNum - bNum;
  });

  const getGradeColor = (grade: number) => {
    if (grade >= 4) return 'emerald';
    if (grade >= 3) return 'blue';
    if (grade >= 2) return 'yellow';
    return 'red';
  };

  const getGradeText = (grade: number) => {
    if (grade >= 4.5) return 'Excelente';
    if (grade >= 4) return 'Muy Bueno';
    if (grade >= 3.5) return 'Bueno';
    if (grade >= 3) return 'Aceptable';
    if (grade >= 2) return 'Deficiente';
    return 'Insuficiente';
  };

  return (
    <div className="mt-6 mb-6 space-y-4">
      {/* Final grade summary - moved to top */}
      <div
        className={`rounded-2xl border p-5 transition-all ${
          gradeSummary.finalGrade >= 3
            ? 'border-green-500/20 bg-green-500/10'
            : 'border-red-500/20 bg-red-500/10'
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <h4 className="mb-1 font-medium text-foreground">
              Nota Final del Curso
            </h4>
            <p className="text-xs text-muted-foreground">
              Calculado como suma de (nota × peso/100) para cada parámetro
            </p>
          </div>
          <div className="ml-4 shrink-0 text-right">
            <div
              className={`text-2xl font-bold tabular-nums ${gradeSummary.finalGrade >= 3 ? 'text-green-400' : 'text-red-400'}`}
            >
              {formatScore(gradeSummary.finalGrade)}
            </div>
            <p
              className={`mt-0.5 text-xs font-medium ${gradeSummary.finalGrade >= 3 ? 'text-green-400' : 'text-red-400'}`}
            >
              {gradeSummary.finalGrade >= 3 ? 'Aprobado' : 'Reprobado'}
            </p>
          </div>
        </div>
        <div className="mt-4 flex items-start gap-3 border-t border-border/30 pt-4">
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${gradeSummary.finalGrade >= 3 ? 'bg-green-500/20' : 'bg-red-500/20'}`}
          >
            {gradeSummary.finalGrade >= 3 ? (
              <ImHappy className="h-4 w-4 text-green-400" />
            ) : (
              <PiSmileySad className="h-4 w-4 text-red-400" />
            )}
          </div>
          <div>
            <p className="mb-1 text-xs font-medium text-muted-foreground">
              Estado del Curso
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {gradeSummary.finalGrade >= 3
                ? '¡Felicitaciones! Has aprobado el curso.'
                : 'Necesitas mejorar para aprobar el curso.'}
            </p>
          </div>
        </div>
      </div>

      {/* Parameters and their activities */}
      {sortedParameters.map((param, index) => (
        <div key={index} className="space-y-3">
          {param.activities.map((activity, actIndex) => {
            const color = getGradeColor(activity.grade);
            return (
              <div
                key={actIndex}
                className={`rounded-2xl border p-5 transition-all bg-${color}-500/10 border-${color}-500/20`}
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <h4 className="mb-1 font-medium text-foreground">
                      {activity.name}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {param.name} ({param.weight}%)
                    </p>
                  </div>
                  <div className="ml-4 shrink-0 text-right">
                    <div
                      className={`text-2xl font-bold tabular-nums text-${color}-400`}
                    >
                      {formatScore(activity.grade)}
                    </div>
                    <p
                      className={`mt-0.5 text-xs font-medium text-${color}-400`}
                    >
                      {getGradeText(activity.grade)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
