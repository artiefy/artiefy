'use client';

import { useCallback, useEffect, useState } from 'react';

import { toast } from 'sonner';

export type ContentType =
  'lesson' | 'meeting' | 'project' | 'objective' | 'activity';

type Status = 'processing' | 'completed' | 'failed' | 'none';

interface VideoStatusResponse {
  contentId: number;
  hasTranscription: boolean;
  status: Status;
  error?: string;
}

interface GroupStatusResponse {
  total: number;
  completed: number;
  processing: number;
  failed: number;
}

interface StartResponse {
  started?: number;
  skipped?: number;
  total?: number;
  error?: string;
}

/** Cada cuánto se consulta el avance mientras hay jobs corriendo. */
const POLL_MS = 15_000;

/**
 * Polling que solo corre mientras `active` sea true y se limpia al desmontar.
 * `fn` debe ser estable (useCallback) para no reiniciar el intervalo.
 */
function usePolling(active: boolean, fn: () => void) {
  useEffect(() => {
    if (!active) return;
    const id = setInterval(fn, POLL_MS);
    return () => clearInterval(id);
  }, [active, fn]);
}

async function readError(res: Response, fallback: string): Promise<string> {
  const data = (await res.json().catch(() => ({}))) as StartResponse;
  return data.error ?? fallback;
}

/* ------------------------------------------------------------------ */
/* Botón para un solo video                                            */
/* ------------------------------------------------------------------ */

export function TranscribeVideoButton({
  type,
  contentId,
  label = 'Transcribir este video',
  className = '',
}: {
  type: ContentType;
  contentId: number;
  label?: string;
  className?: string;
}) {
  const [status, setStatus] = useState<Status>('none');
  const [hasTranscription, setHasTranscription] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/super-admin/transcriptions/status?type=${type}&contentId=${contentId}`
      );
      if (!res.ok) return;
      const data = (await res.json()) as VideoStatusResponse;
      setStatus(data.status);
      setHasTranscription(data.hasTranscription);
    } catch {
      // Silencioso: es solo el estado, no vale la pena molestar al usuario.
    }
  }, [type, contentId]);

  const poll = useCallback(() => void refresh(), [refresh]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  usePolling(status === 'processing', poll);

  const handleClick = async () => {
    setIsStarting(true);
    try {
      const res = await fetch('/api/super-admin/transcriptions/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, contentId, force: hasTranscription }),
      });

      if (!res.ok) {
        throw new Error(
          await readError(res, 'No se pudo iniciar la transcripción')
        );
      }

      const data = (await res.json()) as StartResponse;

      if (data.started) {
        setStatus('processing');
        toast.success('Transcripción encolada', {
          description:
            'Se procesa en segundo plano, puedes cerrar esta página.',
        });
      } else {
        toast.info('No se inició nada', {
          description: 'No hay video o ya se está procesando.',
        });
      }

      void refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Error al transcribir'
      );
    } finally {
      setIsStarting(false);
    }
  };

  const isProcessing = status === 'processing';

  const text = isStarting
    ? '⏳ Encolando...'
    : isProcessing
      ? '🎙️ Transcribiendo...'
      : hasTranscription
        ? '🔄 Volver a transcribir'
        : `🎙️ ${label}`;

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={() => void handleClick()}
        disabled={isStarting || isProcessing}
        className={`
          inline-block w-full rounded-lg bg-[#22C4D3] px-2 py-1.5 text-center
          text-xs font-medium text-black transition duration-300
          hover:bg-[#00A5C0]
          disabled:cursor-not-allowed disabled:opacity-60
          ${className}
        `}
      >
        {text}
      </button>

      {status === 'failed' && (
        <p className="mt-1 text-center text-[10px] text-red-400">
          Falló la transcripción. Intenta de nuevo.
        </p>
      )}
      {isProcessing && (
        <p className="mt-1 text-center text-[10px] text-white/60">
          En segundo plano. El resultado aparece solo.
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Botón para un grupo (curso o proyecto guiado)                       */
/* ------------------------------------------------------------------ */

function TranscribeGroupButton({
  query,
  body,
  label,
  className = '',
}: {
  /** Query string que identifica al grupo, ej. `courseId=702`. */
  query: string;
  /** Body del POST que arranca el grupo. */
  body: Record<string, number>;
  label: string;
  className?: string;
}) {
  const [summary, setSummary] = useState<GroupStatusResponse | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/super-admin/transcriptions/status?${query}`
      );
      if (!res.ok) return;
      setSummary((await res.json()) as GroupStatusResponse);
    } catch {
      // Silencioso, igual que arriba.
    }
  }, [query]);

  const poll = useCallback(() => void refresh(), [refresh]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  usePolling(Boolean(summary && summary.processing > 0), poll);

  const handleClick = async () => {
    setIsStarting(true);
    try {
      const res = await fetch('/api/super-admin/transcriptions/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        throw new Error(
          await readError(res, 'No se pudieron iniciar las transcripciones')
        );
      }

      const data = (await res.json()) as StartResponse;

      if (data.started) {
        toast.success(`${data.started} video(s) en cola`, {
          description: 'Se procesan en segundo plano, uno por uno.',
        });
      } else {
        toast.info('No había videos pendientes por transcribir');
      }

      void refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Error al transcribir'
      );
    } finally {
      setIsStarting(false);
    }
  };

  const processing = summary?.processing ?? 0;

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={() => void handleClick()}
        disabled={isStarting}
        className={`
          rounded-full border border-[#22C4D3]/40 bg-[#22C4D3]/10 px-3 py-1.5
          text-xs font-semibold whitespace-nowrap text-[#22C4D3]
          transition-colors
          hover:bg-[#22C4D3]/20
          disabled:cursor-not-allowed disabled:opacity-60
          ${className}
        `}
      >
        {isStarting ? '⏳ Encolando...' : `🎙️ ${label}`}
      </button>

      {summary && summary.total > 0 && (
        <p className="text-[10px] font-normal text-white/50">
          {summary.completed}/{summary.total} transcritos
          {processing > 0 && ` · ${processing} en proceso`}
          {summary.failed > 0 && ` · ${summary.failed} con error`}
        </p>
      )}
    </div>
  );
}

/** Transcribe las clases y las grabaciones de Teams de un curso. */
export function TranscribeCourseButton({
  courseId,
  className,
}: {
  courseId: number;
  className?: string;
}) {
  return (
    <TranscribeGroupButton
      query={`courseId=${courseId}`}
      body={{ courseId }}
      label="Transcribir todos los videos"
      className={className}
    />
  );
}

/** Transcribe el proyecto guiado, sus objetivos y sus actividades. */
export function TranscribeProjectButton({
  projectId,
  className,
}: {
  projectId: number;
  className?: string;
}) {
  return (
    <TranscribeGroupButton
      query={`projectId=${projectId}`}
      body={{ projectId }}
      label="Transcribir videos del proyecto"
      className={className}
    />
  );
}
