'use client';

import { useState } from 'react';

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
  courseId: number; // <-- agrega esto
}

export interface ScheduledMeeting {
  title: string;
  startDateTime: string;
  endDateTime: string;
  weekNumber: number;
  joinUrl?: string; // <- opcional por si a veces no lo envían
  videoUrl?: string | null; // ✅ nuevo campo opcional
  recordingContentUrl?: string | null; // ✅ nuevo campo opcional
}

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

  const handleSubmit = async () => {
    try {
      const startDateTime = `${date}T${time}`; // string local sin Z

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
        }),
      });

      if (!res.ok) {
        throw new Error('No se pudieron crear las clases');
      }

      const data = (await res.json()) as { meetings: ScheduledMeeting[] };
      onMeetingsCreated(data.meetings);

      onClose();
    } catch (error) {
      console.error('Error al crear clases:', error);
      alert('Ocurrió un error al crear las clases.');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Agendar clases en Teams</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex flex-col space-y-1">
            <label className="text-sm font-medium text-white">
              Título de la clase
            </label>
            <input
              className="bg-background rounded border border-gray-500 p-2 text-white"
              placeholder="Ej. Matemáticas Avanzadas"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="flex flex-col space-y-1">
            <label className="text-sm font-medium text-white">
              Fecha de inicio
            </label>
            <input
              type="date"
              className="bg-background rounded border border-gray-500 p-2 text-white"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="flex flex-col space-y-1">
            <label className="text-sm font-medium text-white">
              Hora de inicio
            </label>
            <input
              type="time"
              className="bg-background rounded border border-gray-500 p-2 text-white"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>

          <div className="flex flex-col space-y-1">
            <label className="text-sm font-medium text-white">
              Duración (minutos)
            </label>
            <input
              type="number"
              min={15}
              step={15}
              className="bg-background rounded border border-gray-500 p-2 text-white"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
            />
          </div>

          <div className="flex flex-col space-y-1">
            <label className="text-sm font-medium text-white">
              Número de clases (semanas)
            </label>
            <input
              type="number"
              min={1}
              max={12}
              className="bg-background rounded border border-gray-500 p-2 text-white"
              value={repeatCount}
              onChange={(e) => setRepeatCount(Number(e.target.value))}
            />
          </div>
        </div>
        <DialogFooter className="pt-4">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit}>Crear clases</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
