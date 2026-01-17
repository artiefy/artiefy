'use client';

import { useEffect, useMemo, useRef } from 'react';

import { Icons } from '~/components/estudiantes/ui/icons';

type TranscriptionItem = { start: number; end: number; text: string };

interface LessonTranscriptionProps {
  transcription: TranscriptionItem[];
  isLoading: boolean;
  currentTime?: number;
}

const LessonTranscription = ({
  transcription,
  isLoading,
  currentTime = 0,
}: LessonTranscriptionProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const currentTranscriptionIndex = useMemo(() => {
    if (!transcription || transcription.length === 0) return 0;
    const idx = transcription.findIndex(
      (item) => currentTime >= item.start && currentTime <= item.end
    );
    return idx !== -1 ? idx : 0;
  }, [transcription, currentTime]);

  const isScrollable = useMemo(
    () => (transcription?.length ?? 0) > 8,
    [transcription]
  );

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const target = container.querySelector<HTMLElement>(
      `[data-transcription-idx="${currentTranscriptionIndex}"]`
    );
    if (target && isScrollable) {
      target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [currentTranscriptionIndex, isScrollable]);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-8 text-muted-foreground">
        <Icons.spinner className="h-4 w-4" />
        <span className="text-sm">Cargando transcripción...</span>
      </div>
    );
  }

  if (transcription.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-white">
          No hay transcripción disponible para esta clase.
        </p>
      </div>
    );
  }

  const formatTime = (s: number) => {
    if (!Number.isFinite(s)) return '0:00';
    const sec = Math.floor(s % 60)
      .toString()
      .padStart(2, '0');
    const min = Math.floor(s / 60).toString();
    return `${min}:${sec}`;
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full px-4 py-4 text-sm text-white"
      style={{ minHeight: '10rem', maxHeight: '22rem', overflow: 'auto' }}
    >
      {transcription.map((item, idx) => {
        const isCurrent = idx === currentTranscriptionIndex;
        return (
          <div
            key={`${item.start}-${idx}`}
            data-transcription-idx={idx}
            className={`mb-3 flex items-start gap-3 transition-all ${
              isCurrent ? 'rounded-md bg-accent/20 p-2' : ''
            }`}
          >
            <div className="flex-shrink-0">
              <span
                className={`inline-block font-mono text-xs text-muted-foreground`}
              >
                {formatTime(item.start)}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p
                className={`text-sm leading-relaxed ${isCurrent ? 'font-semibold text-foreground' : 'text-white/90'}`}
              >
                {item.text}
              </p>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  Inicio: {formatTime(item.start)}
                </span>
                <span className="text-xs text-muted-foreground">
                  Fin: {formatTime(item.end)}
                </span>
                {isCurrent && (
                  <span className="ml-2 rounded-full bg-foreground/10 px-2 py-0.5 text-xs font-medium text-foreground">
                    {Math.floor(currentTime)}s
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default LessonTranscription;
