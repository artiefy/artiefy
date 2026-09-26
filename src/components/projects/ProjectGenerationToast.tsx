'use client';

import { CircleAlert, CircleCheck, Sparkles, X } from 'lucide-react';
import { toast } from 'sonner';

export type ProjectGenerationState =
  | { status: 'running'; label: string; progress: number }
  | { status: 'done'; title: string }
  | { status: 'error'; message: string; onRetry?: () => void };

interface ProjectGenerationToastProps {
  toastId: string | number;
  state: ProjectGenerationState;
}

/**
 * Corner card that follows a project being generated in the background. It
 * lives in sonner's own layer (mounted once in the root layout), so it keeps
 * updating while the learner navigates elsewhere in the app.
 */
function ProjectGenerationToast({
  toastId,
  state,
}: ProjectGenerationToastProps) {
  const progress = state.status === 'running' ? state.progress : 100;

  return (
    <div
      role="status"
      aria-live="polite"
      className="
        w-[var(--width,356px)] max-w-[calc(100vw-2rem)] rounded-xl border
        border-primary/30 bg-background p-4 text-foreground shadow-2xl
        shadow-primary/10
      "
    >
      <div className="flex items-start gap-3">
        <span
          className="
            flex size-9 shrink-0 items-center justify-center rounded-lg
            bg-primary/15
          "
        >
          {state.status === 'running' ? (
            <Sparkles className="size-4 animate-pulse text-primary motion-reduce:animate-none" />
          ) : state.status === 'done' ? (
            <CircleCheck className="size-4 text-primary" />
          ) : (
            <CircleAlert className="size-4 text-destructive" />
          )}
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">
            {state.status === 'running'
              ? 'Artie está creando tu proyecto'
              : state.status === 'done'
                ? '¡Tu proyecto está listo!'
                : 'No pudimos crear tu proyecto'}
          </p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {state.status === 'running'
              ? state.label
              : state.status === 'done'
                ? state.title
                : state.message}
          </p>
        </div>

        {state.status !== 'running' ? (
          <button
            type="button"
            onClick={() => toast.dismiss(toastId)}
            aria-label="Cerrar"
            className="
              -mt-1 -mr-1 inline-flex size-7 shrink-0 items-center
              justify-center rounded-md text-muted-foreground transition-colors
              hover:bg-accent hover:text-primary
            "
          >
            <X className="size-3.5" />
          </button>
        ) : null}
      </div>

      {state.status !== 'error' ? (
        <div className="mt-3 flex items-center gap-3">
          <div
            className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
            aria-label="Progreso de la creación del proyecto"
          >
            <div
              className="
                h-full rounded-full bg-gradient-to-r from-primary to-accent
                transition-[width] duration-500 ease-out
                motion-reduce:transition-none
              "
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="w-9 text-right text-xs font-medium text-primary tabular-nums">
            {progress}%
          </span>
        </div>
      ) : state.onRetry ? (
        <button
          type="button"
          onClick={() => {
            toast.dismiss(toastId);
            state.onRetry?.();
          }}
          className="
            mt-3 inline-flex h-8 items-center rounded-md bg-primary px-3
            text-xs font-semibold text-primary-foreground transition-colors
            hover:bg-primary/90
          "
        >
          Reintentar
        </button>
      ) : null}
    </div>
  );
}

/** Creates the toast on the first call and updates it in place afterwards. */
export function showProjectGenerationToast(
  id: string,
  state: ProjectGenerationState
): void {
  toast.custom(
    (toastId) => <ProjectGenerationToast toastId={toastId} state={state} />,
    {
      id,
      duration:
        state.status === 'running'
          ? Infinity
          : state.status === 'done'
            ? 6000
            : 12000,
    }
  );
}
