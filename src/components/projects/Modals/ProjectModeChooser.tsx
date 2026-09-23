'use client';

import { useState } from 'react';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  GraduationCap,
  Pencil,
  SlidersHorizontal,
  WandSparkles,
  X,
} from 'lucide-react';

export type ProjectAiMode = 'guided' | 'copilot' | 'autonomous';

/**
 * What the learner typed in the chooser. `ModalResumen` turns it into an
 * AI-generated title and description the moment it opens. A fresh object is
 * created on every "Continuar", so its identity doubles as the run trigger.
 */
export interface ProjectAiSeed {
  idea: string;
  details: string;
  mode: ProjectAiMode;
}

interface ModeOption {
  id: ProjectAiMode;
  label: string;
  icon: typeof GraduationCap;
  title: string;
  description: string;
  userShare: number;
  badge?: string;
}

const MODE_OPTIONS: ModeOption[] = [
  {
    id: 'guided',
    label: 'Guiado',
    icon: GraduationCap,
    title: 'Aprende mientras construyes',
    description: 'Artie te guía paso a paso y tú tomas las decisiones.',
    userShare: 80,
  },
  {
    id: 'copilot',
    label: 'Copiloto',
    icon: WandSparkles,
    title: 'Construyan en equipo',
    description: 'Tú y Artie avanzan juntos en cada parte del proyecto.',
    userShare: 50,
  },
  {
    id: 'autonomous',
    label: 'Autónomo',
    icon: Bot,
    title: 'Artie construye por ti',
    description: 'Artie ejecuta, tú decides en los puntos clave.',
    userShare: 20,
    badge: 'Desarrollo',
  },
];

interface ProjectModeChooserProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  /** "Continuar": open the project wizard pre-filled by AI from the idea. */
  onContinue: (seed: ProjectAiSeed) => void;
  /** "Modo avanzado": open the project wizard as-is, without AI pre-fill. */
  onAdvanced: () => void;
}

/**
 * Step zero of project creation: capture the idea and how much Artie should
 * help. A single Radix dialog that is a bottom sheet on mobile (slides up)
 * and a centered modal from `sm` up. Sits on the same z-layer as
 * `MobileCreateSheet` so it clears `MobileBottomNav`.
 */
export function ProjectModeChooser({
  isOpen,
  onOpenChange,
  onContinue,
  onAdvanced,
}: ProjectModeChooserProps) {
  const [idea, setIdea] = useState('');
  const [details, setDetails] = useState('');
  const [mode, setMode] = useState<ProjectAiMode>('guided');

  const selected =
    MODE_OPTIONS.find((option) => option.id === mode) ?? MODE_OPTIONS[0]!;
  const canContinue = idea.trim().length >= 3;

  const resetDraft = () => {
    setIdea('');
    setDetails('');
    setMode('guided');
  };

  const handleContinue = () => {
    if (!canContinue) return;
    onContinue({ idea: idea.trim(), details: details.trim(), mode });
    resetDraft();
  };

  const handleAdvanced = () => {
    onAdvanced();
    resetDraft();
  };

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className="
            fixed inset-0 z-[2147483001] bg-black/60
            data-[state=closed]:animate-out data-[state=closed]:fade-out-0
            data-[state=open]:animate-in data-[state=open]:fade-in-0
            motion-reduce:animate-none
          "
        />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="
            fixed inset-x-0 bottom-0 z-[2147483002] flex max-h-[92dvh]
            flex-col rounded-t-[10px] border border-primary/20 bg-background
            pb-[env(safe-area-inset-bottom,0px)] shadow-2xl
            data-[state=closed]:animate-out
            data-[state=closed]:slide-out-to-bottom
            data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom
            motion-reduce:animate-none
            sm:inset-0 sm:m-auto sm:h-fit sm:max-h-[90dvh] sm:w-[calc(100%-2rem)]
            sm:max-w-2xl sm:rounded-2xl sm:pb-0
          "
        >
          <div
            className="
              mx-auto mt-4 h-2 w-[100px] shrink-0 rounded-full bg-muted
              sm:hidden
            "
          />
          <DialogPrimitive.Title className="sr-only">
            Crear proyecto
          </DialogPrimitive.Title>

          <div
            className="
              flex items-center gap-3 border-b border-border/50 px-5 pt-1 pb-4
              sm:px-7 sm:pt-5
            "
          >
            <DialogPrimitive.Close
              type="button"
              aria-label="Cerrar"
              className="
                inline-flex size-8 items-center justify-center rounded-md
                text-muted-foreground transition-colors
                hover:bg-accent hover:text-primary
                focus-visible:ring-2 focus-visible:ring-ring
                focus-visible:outline-none
              "
            >
              <ArrowLeft className="size-4" />
            </DialogPrimitive.Close>
            <div className="flex-1">
              <h2 className="text-base font-semibold text-foreground">
                Crear proyecto
              </h2>
              <p className="text-xs text-muted-foreground">
                Elige cómo quieres construirlo
              </p>
            </div>
            <DialogPrimitive.Close
              type="button"
              aria-label="Cerrar"
              className="
                hidden size-8 items-center justify-center rounded-md
                text-muted-foreground transition-colors
                hover:bg-accent hover:text-primary
                focus-visible:ring-2 focus-visible:ring-ring
                focus-visible:outline-none
                sm:inline-flex
              "
            >
              <X className="size-4" />
            </DialogPrimitive.Close>
          </div>

          <div className="space-y-5 overflow-y-auto p-5 sm:px-7 sm:py-6">
            <section className="rounded-lg border border-primary/35 bg-primary/5 p-4">
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="text-[11px] font-semibold text-primary uppercase">
                  Tu idea
                </span>
                <Pencil className="size-3.5 text-muted-foreground" />
              </div>
              <input
                type="text"
                value={idea}
                onChange={(event) => setIdea(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') handleContinue();
                }}
                placeholder="¿Qué quieres crear?"
                aria-label="¿Qué quieres crear?"
                maxLength={160}
                className="
                  w-full bg-transparent text-lg font-semibold text-foreground
                  outline-none
                  placeholder:text-muted-foreground
                "
              />
              <textarea
                value={details}
                onChange={(event) => setDetails(event.target.value)}
                placeholder="Cuéntale más a Artie (opcional)"
                aria-label="Cuéntale más a Artie (opcional)"
                rows={2}
                maxLength={1000}
                className="
                  mt-1 w-full resize-none bg-transparent text-sm text-foreground
                  outline-none
                  placeholder:text-muted-foreground
                "
              />
            </section>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleAdvanced}
                className="
                  inline-flex items-center gap-1.5 rounded-md border
                  border-border/60 border-t-primary bg-secondary/30 px-3 py-1.5
                  text-xs font-medium text-foreground transition-colors
                  hover:border-primary/40 hover:bg-primary/10 hover:text-primary
                "
              >
                <SlidersHorizontal className="size-3.5 text-primary" />
                Modo avanzado
              </button>
            </div>

            <section>
              <h3 className="mb-3 text-sm font-semibold text-foreground">
                ¿Cómo quieres crearlo con Artie?
              </h3>
              <div
                role="radiogroup"
                aria-label="Nivel de ayuda de Artie"
                className="
                  flex w-full items-center justify-start gap-1 rounded-full
                  border border-border/60 bg-secondary/30 p-1
                "
              >
                {MODE_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  const isActive = option.id === mode;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      role="radio"
                      aria-checked={isActive}
                      onClick={() => setMode(option.id)}
                      className={`
                        relative flex h-10 flex-1 items-center justify-center
                        gap-2 rounded-full border px-3 py-2 text-xs font-medium
                        whitespace-nowrap transition-colors
                        focus-visible:ring-2 focus-visible:ring-ring
                        focus-visible:outline-none
                        ${
                          isActive
                            ? 'border-primary/50 bg-primary/20 text-primary'
                            : `
                              border-transparent text-muted-foreground
                              hover:bg-secondary/70 hover:text-foreground
                            `
                        }
                      `}
                    >
                      {option.badge ? (
                        <span
                          className="
                            absolute -top-1 -right-1 rounded-full bg-accent
                            px-1.5 text-[8px] font-semibold
                            text-accent-foreground
                          "
                        >
                          {option.badge}
                        </span>
                      ) : null}
                      <Icon className="size-4 shrink-0" />
                      <span className="truncate">{option.label}</span>
                    </button>
                  );
                })}
              </div>
              <div className="mt-2 flex justify-between px-1 text-[11px] text-muted-foreground">
                <span>Aprendes más</span>
                <span>Artie hace más</span>
              </div>
            </section>

            <section className="rounded-lg border border-border/60 bg-secondary/25 p-4">
              <h3 className="font-semibold text-foreground">
                {selected.title}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {selected.description}
              </p>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="
                    h-full rounded-full bg-gradient-to-r from-primary to-accent
                    transition-[width] duration-300
                    motion-reduce:transition-none
                  "
                  style={{ width: `${selected.userShare}%` }}
                />
              </div>
              <div className="mt-2 flex justify-between text-xs font-medium">
                <span className="text-primary">Tú {selected.userShare}%</span>
                <span className="text-accent">
                  Artie {100 - selected.userShare}%
                </span>
              </div>
            </section>

            <button
              type="button"
              onClick={handleContinue}
              disabled={!canContinue}
              className="
                inline-flex h-12 w-full items-center justify-center gap-2
                rounded-lg bg-primary px-4 py-2 text-sm font-semibold
                text-primary-foreground shadow-lg shadow-primary/20
                transition-colors
                hover:bg-primary/90
                focus-visible:ring-2 focus-visible:ring-ring
                focus-visible:ring-offset-2 focus-visible:outline-none
                disabled:cursor-not-allowed disabled:opacity-50
              "
            >
              Continuar
              <ArrowRight className="size-4" />
            </button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
