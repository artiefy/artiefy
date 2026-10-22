'use client';

import {
  type Dispatch,
  type SetStateAction,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

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

/** Round attach / dictate buttons on the left of the toolbar. */
const toolButtonClass = `
  inline-flex h-9 min-w-9 items-center justify-center gap-1 rounded-full
  bg-white/[0.06] text-muted-foreground transition-colors
  hover:bg-white/[0.12] hover:text-foreground
  focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:outline-none
`;

/** Primary send button: soft cyan glow, lifts and sweeps a sheen on hover. */
const sendButtonClass = `
  group/send relative inline-flex shrink-0 items-center justify-center
  overflow-hidden rounded-full bg-primary text-slate-950
  shadow-[0_0_22px_hsl(185_72%_48%/0.4)] transition-all duration-300
  hover:shadow-[0_0_34px_hsl(185_72%_48%/0.6)]
  focus-visible:ring-2 focus-visible:ring-primary/60
  focus-visible:ring-offset-2 focus-visible:ring-offset-background
  focus-visible:outline-none
  disabled:cursor-not-allowed disabled:opacity-50
  motion-safe:enabled:hover:-translate-y-0.5
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
  /**
   * `lg` is the landing hero: a growing text area and a labelled "Iniciar
   * proyecto" button, without the mode picker (it starts in Guided mode).
   */
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
  placeholder = 'Dile a Artie la idea que vas a desarrollar',
  size = 'md',
}: ArtieIdeaComposerProps) {
  const [ownIdea, setOwnIdea] = useState('');
  const idea = controlledIdea ?? ownIdea;
  const setIdea = onIdeaChange ?? setOwnIdea;
  const isLarge = size === 'lg';
  const [files, setFiles] = useState<File[]>([]);
  const [mode, setMode] = useState<ProjectAiMode>('guided');
  const [isSending, setIsSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  // The landing's text area grows with the idea, whether it was typed,
  // dictated or filled by a suggestion, so it is measured after each change.
  useLayoutEffect(() => {
    const textArea = textAreaRef.current;
    if (!textArea) return;
    textArea.style.height = 'auto';
    textArea.style.height = `${textArea.scrollHeight}px`;
  }, [idea]);

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

  const sendIcon = isSending ? (
    <Loader2 aria-hidden="true" className="relative z-10 size-4 animate-spin" />
  ) : (
    <SendHorizontal
      aria-hidden="true"
      className="
        relative z-10 size-4 transition-transform duration-300
        motion-safe:group-hover/send:translate-x-0.5
      "
    />
  );

  return (
    // Same travelling beam as the header search (`NeonSearchShell`), without
    // its halo: only the border lights up. The surface is a 2px inset in the
    // flow, so the frame grows with the text and the attachment chips; the
    // deep drop shadow is the only depth effect.
    <form
      onSubmit={(event) => void handleSubmit(event)}
      className="
        relative isolate rounded-[28px] p-[2px] text-left
        shadow-[0_18px_50px_-20px_hsl(222_47%_2%/0.8)]
      "
    >
      <div
        aria-hidden="true"
        className="neon-search-ring pointer-events-none absolute inset-0 rounded-[28px]"
      />
      <div className="relative rounded-[26px] bg-surface-deep">
        <div
          className={`
            flex gap-3 px-6 pt-5
            ${isLarge ? 'items-start pb-2' : 'items-center pb-3'}
          `}
        >
          <Brain
            aria-hidden="true"
            className={`
              size-5 shrink-0 text-primary
              ${isLarge ? 'mt-[7px]' : ''}
            `}
          />
          {isLarge ? (
            <textarea
              ref={textAreaRef}
              rows={1}
              value={idea}
              onChange={(event) => setIdea(event.target.value)}
              onKeyDown={(event) => {
                // Enter sends, like a chat; Shift+Enter adds a new line.
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  void handleSubmit();
                }
              }}
              placeholder={placeholder}
              aria-label={placeholder}
              className="
                block max-h-48 min-w-0 flex-1 resize-none border-0 bg-transparent
                p-0 text-base leading-7 [overflow-wrap:anywhere] text-foreground
                placeholder:text-muted-foreground
                focus:outline-none
              "
            />
          ) : (
            <input
              value={idea}
              onChange={(event) => setIdea(event.target.value)}
              placeholder={placeholder}
              aria-label="Tu idea o problema"
              className="
                min-w-0 flex-1 bg-transparent text-base text-foreground
                placeholder:text-muted-foreground
                focus:outline-none
              "
            />
          )}
        </div>

        {files.length > 0 ? (
          <ul
            aria-label="Archivos adjuntos"
            className="flex flex-wrap gap-1.5 px-6 pb-2"
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

        <div className="flex items-center justify-between gap-3 px-4 pt-1 pb-4">
          <div className="flex shrink-0 items-center gap-2">
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
              className={toolButtonClass}
            >
              <Plus aria-hidden="true" className="size-5" />
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
                ${toolButtonClass}
                ${dictation.isListening ? 'animate-pulse bg-primary/15 px-3 text-primary' : ''}
              `}
            >
              <Mic aria-hidden="true" className="size-5" />
              {dictation.isListening ? (
                <span className="text-xs">Escuchando…</span>
              ) : null}
            </button>
          </div>

          {isLarge ? (
            <button
              type="submit"
              disabled={!canSend}
              className={`${sendButtonClass} h-11 gap-2.5 pr-4 pl-5 text-sm font-semibold`}
            >
              <span aria-hidden="true" className="send-button-sheen" />
              <span className="relative z-10 whitespace-nowrap">
                Iniciar proyecto
              </span>
              {sendIcon}
            </button>
          ) : (
            <div className="flex shrink-0 items-center gap-2">
              <Menu>
                <MenuButton
                  aria-label={`Modo de trabajo: ${selectedMode.label}`}
                  className="
                    inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm
                    text-foreground transition-colors
                    hover:bg-white/[0.06]
                    focus-visible:ring-2 focus-visible:ring-primary/50
                    focus-visible:outline-none
                  "
                >
                  {selectedMode.label}
                  <ChevronDown
                    aria-hidden="true"
                    className="size-3.5 opacity-60"
                  />
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
              <button
                type="submit"
                aria-label="Enviar a Artie"
                disabled={!canSend}
                className={`${sendButtonClass} size-9`}
              >
                <span aria-hidden="true" className="send-button-sheen" />
                {sendIcon}
              </button>
            </div>
          )}
        </div>
      </div>
    </form>
  );
}
