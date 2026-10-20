'use client';

import { type Dispatch, type SetStateAction, useRef, useState } from 'react';

import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import {
  Brain,
  Check,
  ChevronDown,
  FileText,
  Loader2,
  Mic,
  Plus,
  SendHorizontal,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

import {
  MODE_OPTIONS,
  type ProjectAiMode,
  type ProjectAiSeed,
} from '~/components/projects/Modals/ProjectModeChooser';

import {
  ATTACHMENT_ACCEPT,
  buildAttachmentDetails,
  MAX_ATTACHMENT_BYTES,
  MAX_ATTACHMENTS,
} from './readAttachmentText';
import { useSpeechDictation } from './useSpeechDictation';

/** Same minimum the mode chooser asks for before generating a project. */
const MIN_IDEA_LENGTH = 3;

const SELECTABLE_MODES = MODE_OPTIONS.filter((option) => !option.disabled);

const controlClass = `
  inline-flex items-center justify-center gap-1 rounded-full px-1.5
  text-muted-foreground transition-colors
  hover:bg-white/5 hover:text-foreground
  focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:outline-none
`;

interface ArtieIdeaComposerProps {
  /** Receives the idea, the attached files' text and the chosen mode. */
  onSubmit: (seed: ProjectAiSeed) => void;
  /**
   * Controlled idea text, for pages that fill it from outside (e.g. the
   * landing's suggestions). Omit both to let the composer own the text.
   */
  idea?: string;
  onIdeaChange?: Dispatch<SetStateAction<string>>;
  placeholder?: string;
  /** `lg` is the landing hero's larger input. */
  size?: 'md' | 'lg';
}

/**
 * The idea box on `/proyectos` and the landing: the learner writes (or
 * dictates) the idea, may attach documents, picks Guided or Copilot, and
 * sends it to Artie, who builds the project and opens the Coach on it.
 */
export function ArtieIdeaComposer({
  onSubmit,
  idea: controlledIdea,
  onIdeaChange,
  placeholder = 'Dile a Artie qué problema vas a solucionar',
  size = 'md',
}: ArtieIdeaComposerProps) {
  const [ownIdea, setOwnIdea] = useState('');
  const idea = controlledIdea ?? ownIdea;
  const setIdea = onIdeaChange ?? setOwnIdea;
  const isLarge = size === 'lg';
  // The landing's large variant is used on phones, so its controls keep a
  // finger-sized target there and shrink back on wider screens.
  const controlSize = isLarge
    ? 'h-10 min-w-10 sm:h-8 sm:min-w-8'
    : 'h-8 min-w-8 sm:h-6 sm:min-w-6';
  const iconSize = isLarge ? 'size-4' : 'size-3.5';
  const [files, setFiles] = useState<File[]>([]);
  const [mode, setMode] = useState<ProjectAiMode>('guided');
  const [isSending, setIsSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const dictation = useSpeechDictation((text) =>
    setIdea((current) => (current.trim() ? `${current.trim()} ${text}` : text))
  );

  const selectedMode =
    SELECTABLE_MODES.find((option) => option.id === mode) ??
    SELECTABLE_MODES[0]!;
  const canSend = idea.trim().length >= MIN_IDEA_LENGTH && !isSending;

  const handleFilesPicked = (event: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(event.target.files ?? []);
    // Reset so picking the same file again after removing it still fires.
    event.target.value = '';

    const tooBig = picked.filter((file) => file.size > MAX_ATTACHMENT_BYTES);
    if (tooBig.length > 0) {
      toast.error(
        `Cada archivo puede pesar hasta 10 MB: ${tooBig
          .map((file) => file.name)
          .join(', ')}`
      );
    }

    const accepted = picked.filter(
      (file) =>
        file.size <= MAX_ATTACHMENT_BYTES &&
        !files.some(
          (existing) =>
            existing.name === file.name && existing.size === file.size
        )
    );
    const next = [...files, ...accepted];
    if (next.length > MAX_ATTACHMENTS) {
      toast.error(`Puedes adjuntar hasta ${MAX_ATTACHMENTS} archivos.`);
    }
    setFiles(next.slice(0, MAX_ATTACHMENTS));
  };

  const removeFile = (target: File) =>
    setFiles((current) => current.filter((file) => file !== target));

  const handleSubmit = async (event?: React.FormEvent) => {
    event?.preventDefault();
    if (!canSend) return;

    dictation.stop();
    setIsSending(true);
    try {
      const { details, unreadable } = await buildAttachmentDetails(files);
      if (unreadable.length > 0) {
        toast.warning(
          `No pudimos leer el texto de: ${unreadable.join(', ')}. Artie seguirá solo con tu idea.`
        );
      }
      onSubmit({ idea: idea.trim(), details, mode });
      setIdea('');
      setFiles([]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    // Same travelling beam as the header search (`NeonSearchShell`), but the
    // surface is a 2px inset in the flow instead of absolute, so the frame
    // grows with the attachment chips.
    <form
      onSubmit={(event) => void handleSubmit(event)}
      className="group relative isolate rounded-2xl p-[2px] text-left"
    >
      <div
        aria-hidden="true"
        className="
          neon-search-glow pointer-events-none absolute -inset-0.5 -z-10
          rounded-2xl
        "
      />
      <div
        aria-hidden="true"
        className="neon-search-ring pointer-events-none absolute inset-0 rounded-2xl"
      />
      <div
        className="
          relative rounded-[14px] border border-border/40 bg-surface-deep
          transition-colors duration-300
          group-focus-within:border-primary/80
        "
      >
        <div
          className={`
            flex items-center gap-3
            ${isLarge ? 'px-5 pt-5 pb-4 sm:px-6' : 'px-5 py-4'}
          `}
        >
          <Brain
            className={`
              flex-shrink-0 text-primary
              ${isLarge ? 'size-6' : 'size-5'}
            `}
          />
          <input
            value={idea}
            onChange={(event) => setIdea(event.target.value)}
            placeholder={placeholder}
            aria-label="Tu idea o problema"
            className={`
              min-w-0 flex-1 bg-transparent text-foreground
              placeholder:text-muted-foreground
              focus:outline-none
              ${isLarge ? 'text-base sm:text-lg' : 'text-sm'}
            `}
          />
        </div>

        {files.length > 0 ? (
          <ul
            aria-label="Archivos adjuntos"
            className="flex flex-wrap gap-1.5 px-5 pb-2"
          >
            {files.map((file) => (
              <li
                key={`${file.name}-${file.size}`}
                className="
                inline-flex max-w-full items-center gap-1.5 rounded-full
                bg-white/5 py-0.5 pr-1 pl-2 text-[11px] text-foreground ring-1
                ring-white/10 ring-inset
              "
              >
                <FileText className="size-3 shrink-0 text-primary" />
                <span className="max-w-[180px] truncate">{file.name}</span>
                <button
                  type="button"
                  onClick={() => removeFile(file)}
                  aria-label={`Quitar ${file.name}`}
                  className="
                  flex size-4 items-center justify-center rounded-full
                  text-muted-foreground transition-colors
                  hover:bg-white/10 hover:text-foreground
                "
                >
                  <X className="size-3" />
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="flex items-center justify-between gap-3 px-2.5 pt-0 pb-2.5">
          <div className="flex shrink-0 items-center gap-0.5">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={ATTACHMENT_ACCEPT}
              onChange={handleFilesPicked}
              className="hidden"
              tabIndex={-1}
            />
            <button
              type="button"
              aria-label="Adjuntar archivo"
              title="Adjuntar archivo (PDF, Word, Excel o texto)"
              onClick={() => fileInputRef.current?.click()}
              className={`${controlClass} ${controlSize}`}
            >
              <Plus className={iconSize} />
            </button>
            <button
              type="button"
              aria-label={
                dictation.isListening ? 'Detener dictado' : 'Escribir con voz'
              }
              aria-pressed={dictation.isListening}
              title={
                dictation.isListening ? 'Detener dictado' : 'Dictar tu idea'
              }
              onClick={dictation.toggle}
              className={`
              ${controlClass} ${controlSize}
              ${dictation.isListening ? 'animate-pulse bg-primary/15 text-primary' : ''}
            `}
            >
              <Mic className={iconSize} />
              {dictation.isListening ? (
                <span className="text-[11px]">Escuchando…</span>
              ) : null}
            </button>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <Menu>
              <MenuButton
                aria-label={`Modo de trabajo: ${selectedMode.label}`}
                className={`
                  ${controlClass} ${controlSize} text-foreground
                  ${isLarge ? 'px-2.5 text-xs' : 'text-[11px]'}
                `}
              >
                {selectedMode.label}
                <ChevronDown className="size-3 opacity-60" />
              </MenuButton>
              <MenuItems
                anchor="bottom end"
                className="
                z-50 w-64 rounded-xl border border-white/10 bg-surface-deep p-1
                shadow-2xl [--anchor-gap:6px]
                focus:outline-none
              "
              >
                {SELECTABLE_MODES.map((option) => {
                  const Icon = option.icon;
                  const isSelected = option.id === mode;
                  return (
                    <MenuItem key={option.id}>
                      <button
                        type="button"
                        onClick={() => setMode(option.id)}
                        className="
                        flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2
                        text-left transition-colors
                        data-focus:bg-neon/12
                      "
                      >
                        <Icon className="mt-0.5 size-4 shrink-0 text-primary" />
                        <span className="min-w-0 flex-1">
                          <span className="block text-xs font-medium text-foreground">
                            {option.label}
                          </span>
                          <span className="block text-[11px] text-muted-foreground">
                            {option.description}
                          </span>
                        </span>
                        {isSelected ? (
                          <Check className="mt-0.5 size-3.5 shrink-0 text-primary" />
                        ) : null}
                      </button>
                    </MenuItem>
                  );
                })}
              </MenuItems>
            </Menu>
            {/* The large variant names its action, so the visible label is
                the accessible name instead of the icon's aria-label. */}
            <button
              type="submit"
              aria-label={isLarge ? undefined : 'Enviar a Artie'}
              disabled={!canSend}
              className={`
                inline-flex shrink-0 items-center justify-center rounded-full
                bg-primary text-slate-950
                shadow-[0_0_14px_hsl(185_72%_48%/0.35)] transition-colors
                hover:bg-primary/90
                disabled:cursor-not-allowed disabled:opacity-50
                ${isLarge ? 'ml-1 size-10 gap-2 text-sm font-semibold sm:h-9 sm:w-auto sm:px-4' : 'size-8 sm:size-6'}
              `}
            >
              {isSending ? (
                <Loader2 className={`${iconSize} animate-spin`} />
              ) : (
                <SendHorizontal className={iconSize} />
              )}
              {/* Phones keep the icon only; the label stays as its name. */}
              {isLarge ? (
                <span className="max-sm:sr-only">Iniciar proyecto</span>
              ) : null}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
