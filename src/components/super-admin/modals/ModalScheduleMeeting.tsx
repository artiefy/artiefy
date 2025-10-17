'use client';

import { useEffect, useMemo, useState } from 'react';

import { Button } from '~/components/educators/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/educators/ui/dialog';

interface ModalScheduleMeetingProps {
  isOpen: boolean;
  onClose: () => void;
  onMeetingsCreated: (meetings: ScheduledMeeting[]) => void;
  courseId: number;
}

export interface ScheduledMeeting {
  title: string;
  startDateTime: string;
  endDateTime: string;
  weekNumber: number;
  joinUrl?: string;
  videoUrl?: string | null;
  recordingContentUrl?: string | null;
  video_key?: string | null; // ⬅️ nuevo
}

const weekDays = [
  'lunes',
  'martes',
  'miércoles',
  'jueves',
  'viernes',
  'sábado',
  'domingo',
];

export const ModalScheduleMeeting = ({
  isOpen,
  onClose,
  onMeetingsCreated,
  courseId,
}: ModalScheduleMeetingProps) => {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState(60);
  const [repeatCount, setRepeatCount] = useState(1);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [customTitles, setCustomTitles] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const firstDayOfWeek = useMemo(() => {
    if (!date) return '';
    const [year, month, day] = date.split('-').map(Number);
    const localDate = new Date(year, month - 1, day);
    const dayNames = [
      'domingo',
      'lunes',
      'martes',
      'miércoles',
      'jueves',
      'viernes',
      'sábado',
    ];
    return dayNames[localDate.getDay()];
  }, [date]);

  useEffect(() => {
    if (!firstDayOfWeek) return;
    setSelectedDays((prev) =>
      prev.includes(firstDayOfWeek) ? prev : [firstDayOfWeek, ...prev]
    );
  }, [firstDayOfWeek]);

  const toggleDay = (day: string) => {
    if (day === firstDayOfWeek) return;

    setSelectedDays((prev) => {
      const newDays = prev.includes(day)
        ? prev.filter((d) => d !== day)
        : [...prev, day];

      const totalWeeks = repeatCount;
      if (customTitles.length < totalWeeks) {
        setCustomTitles((prevTitles) => [
          ...prevTitles,
          ...Array<string>(totalWeeks - prevTitles.length).fill(''),
        ]);
      }

      return newDays;
    });
  };

  const handleCustomTitleChange = (index: number, value: string) => {
    const updated = [...customTitles];
    updated[index] = value;
    setCustomTitles(updated);
  };

  const handleSubmit = async () => {
    setFormError(null); // Limpiar error previo
    setIsLoading(true); // Activar carga


    // Validaciones
    if (!title.trim()) {
      setFormError('Debes ingresar un título general.');
      return;
    }

    if (!date) {
      setFormError('Debes seleccionar una fecha de inicio.');
      return;
    }

    if (!time) {
      setFormError('Debes seleccionar una hora de inicio.');
      return;
    }

    if (duration < 15) {
      setFormError('La duración mínima debe ser de 15 minutos.');
      return;
    }

    if (repeatCount < 1) {
      setFormError('Debes ingresar al menos 1 semana de repetición.');
      return;
    }

    if (selectedDays.length === 0) {
      setFormError('Debes seleccionar al menos un día de la semana.');
      return;
    }

    const missingTitleDays = selectedDays.filter((_, i) => {
      return !customTitles[i]?.trim();
    });

    if (missingTitleDays.length > 0) {
      setFormError(
        `Faltan títulos para los siguientes días: ${missingTitleDays.join(', ')}`
      );
      return;
    }

    try {
      const startDateTime = `${date}T${time}`;

      // Expand titles: repetir el título correspondiente al día, para cada semana
      const expandedTitles = Array.from(
        { length: repeatCount },
        (_, _weekIndex) => {
          return selectedDays.map((_, dayIndex) => {
            return customTitles[dayIndex] || '';
          });
        }
      ).flat();

      const res = await fetch('/api/super-admin/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseId,
          title,
          startDateTime,
          durationMinutes: duration,
          repeatCount,
          daysOfWeek: selectedDays,
          customTitles:
            expandedTitles.length > 0
              ? expandedTitles.map((t) => t.trim()).filter(Boolean)
              : undefined,
        }),
      });

      if (!res.ok) throw new Error('No se pudieron crear las clases');

      const data = (await res.json()) as { meetings: ScheduledMeeting[] };
      onMeetingsCreated(data.meetings);
      onClose();
    } catch (error) {
      console.error('Error al crear clases:', error);
      alert('Ocurrió un error al crear las clases.');
    } finally {
      setIsLoading(false); // Desactivar carga
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-screen w-full max-w-screen-sm overflow-y-auto p-4">
        <DialogHeader>
          <DialogTitle>Agendar clases en Teams</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Título general */}
          <div className="flex flex-col space-y-1">
            <label className="text-sm font-medium text-white">
              Título general
            </label>
            <input
              className="bg-background w-full rounded border border-gray-500 p-2 text-white"
              placeholder="Ej. Matemáticas Avanzadas"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Fecha de inicio */}
          <div className="flex flex-col space-y-1">
            <label className="text-sm font-medium text-white">
              Fecha de inicio
            </label>
            <input
              type="date"
              className="bg-background w-full rounded border border-gray-500 p-2 text-white"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          {/* Hora de inicio */}
          <div className="flex flex-col space-y-1">
            <label className="text-sm font-medium text-white">
              Hora de inicio
            </label>
            <input
              type="time"
              className="bg-background w-full rounded border border-gray-500 p-2 text-white"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>

          {/* Duración */}
          <div className="flex flex-col space-y-1">
            <label className="text-sm font-medium text-white">
              Duración (minutos)
            </label>
            <input
              type="number"
              min={15}
              step={15}
              className="bg-background w-full rounded border border-gray-500 p-2 text-white"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
            />
          </div>

          {/* Repeticiones */}
          <div className="flex flex-col space-y-1">
            <label className="text-sm font-medium text-white">
              Número de semanas
            </label>
            <input
              type="number"
              min={1}
              max={50}
              className="bg-background w-full rounded border border-gray-500 p-2 text-white"
              value={repeatCount}
              onChange={(e) => {
                const newCount = Number(e.target.value);
                setRepeatCount(newCount);
                const total = newCount;
                if (customTitles.length < total) {
                  setCustomTitles((prev) => [
                    ...prev,
                    ...Array<string>(newCount - prev.length).fill(''),
                  ]);
                }
              }}
            />
          </div>

          {/* Días de la semana */}
          <div className="flex flex-col space-y-1">
            <label className="text-sm font-medium text-white">
              Días de la semana
            </label>
            <div className="flex flex-wrap gap-2">
              {weekDays.map((day) => (
                <button
                  key={day}
                  type="button"
                  disabled={day === firstDayOfWeek}
                  className={`rounded border px-3 py-1 text-sm ${selectedDays.includes(day)
                    ? day === firstDayOfWeek
                      ? 'cursor-not-allowed bg-gray-400 text-white'
                      : 'bg-white text-black'
                    : 'border-gray-500 bg-transparent text-white'
                    }`}
                  onClick={() => toggleDay(day)}
                >
                  {day.slice(0, 3)}
                </button>
              ))}
            </div>
            {firstDayOfWeek && (
              <p className="mt-1 text-xs text-gray-400">
                El día <strong>{firstDayOfWeek}</strong> es obligatorio porque
                es el inicio de clases.
              </p>
            )}
          </div>

          {/* Títulos por día de la semana */}
          <div className="flex flex-col space-y-1">
            <label className="text-sm font-medium text-white">
              Títulos por día (opcional)
            </label>
            {selectedDays.map((day, index) => (
              <div key={day} className="mb-2 flex items-center gap-2">
                <span className="w-20 text-white">{day.slice(0, 3)}:</span>
                <input
                  placeholder={`Título para ${day}`}
                  className="bg-background w-full rounded border border-gray-500 p-2 text-white"
                  value={customTitles[index] || ''}
                  onChange={(e) =>
                    handleCustomTitleChange(index, e.target.value)
                  }
                />
              </div>
            ))}
          </div>
        </div>
        {formError && (
          <div className="rounded border border-red-500 bg-red-100 px-4 py-2 text-sm text-red-800">
            {formError}
          </div>
        )}

        <DialogFooter className="pt-4">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!selectedDays.length || isLoading}>
            {isLoading ? 'Creando clases...' : 'Crear clases'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
