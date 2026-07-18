'use client';

import { useEffect, useId, useRef, useState } from 'react';

import { useRouter } from 'next/navigation';

import {
  ExternalLink,
  FileText,
  Link as LinkIcon,
  LoaderCircle,
  Plus,
  Save,
  Upload,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '~/components/estudiantes/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/estudiantes/ui/dialog';
import { Input } from '~/components/estudiantes/ui/input';
import { Label } from '~/components/estudiantes/ui/label';
import {
  getGuidedSubmissionFileError,
  GUIDED_SUBMISSION_FILE_ACCEPT,
  GUIDED_SUBMISSION_LIMITS,
  normalizeGuidedSubmissionUrl,
} from '~/lib/guidedActivitySubmissions';

import type {
  GuidedActivitySubmissionLatest,
  GuidedActivitySubmissionLatestResponse,
  GuidedActivitySubmissionResponse,
} from '~/lib/guidedActivitySubmissions';

interface GuidedActivitySubmissionDialogProps {
  activityId: number;
  activityName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: number;
}

export function GuidedActivitySubmissionDialog({
  activityId,
  activityName,
  open,
  onOpenChange,
  projectId,
}: GuidedActivitySubmissionDialogProps) {
  const router = useRouter();
  const fileInputId = useId();
  const linkInputId = useId();
  const abortControllerRef = useRef<AbortController | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const requestIdRef = useRef<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [links, setLinks] = useState<string[]>([]);
  const [linkValue, setLinkValue] = useState('');
  const [linkError, setLinkError] = useState<string | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [latestSubmission, setLatestSubmission] =
    useState<GuidedActivitySubmissionLatest | null>(null);
  const [isLoadingLatest, setIsLoadingLatest] = useState(false);

  // Load the student's most recent submission whenever the dialog opens, so
  // they can see what they already delivered (file names + clickable links).
  useEffect(() => {
    if (!open) return;

    const controller = new AbortController();
    setIsLoadingLatest(true);
    setLatestSubmission(null);

    fetch(
      `/api/estudiantes/guided-projects/${projectId}/activities/${activityId}/submission`,
      { signal: controller.signal }
    )
      .then(async (response) => {
        const data = (await response
          .json()
          .catch(() => null)) as GuidedActivitySubmissionLatestResponse | null;
        if (response.ok && data?.success === true) {
          setLatestSubmission(data.submission);
        }
      })
      .catch(() => {
        // Silent: showing the draft form is still fully usable without history.
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoadingLatest(false);
      });

    return () => controller.abort();
  }, [open, projectId, activityId]);

  const resetDraft = () => {
    requestIdRef.current = null;
    setFiles([]);
    setLinks([]);
    setLinkValue('');
    setLinkError(null);
    setSubmissionError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && isSubmitting) return;
    if (!nextOpen) {
      resetDraft();
    }
    onOpenChange(nextOpen);
  };

  const addFiles = (incomingFiles: FileList | File[]) => {
    if (isSubmitting) return;
    const incoming = Array.from(incomingFiles);
    if (incoming.length === 0) return;

    const knownFiles = new Set(
      files.map((file) => `${file.name}:${file.size}:${file.lastModified}`)
    );
    const uniqueIncoming = incoming.filter((file) => {
      const fileKey = `${file.name}:${file.size}:${file.lastModified}`;
      if (knownFiles.has(fileKey)) return false;
      knownFiles.add(fileKey);
      return true;
    });

    const invalidFile = uniqueIncoming.find((file) =>
      getGuidedSubmissionFileError(file)
    );
    if (invalidFile) {
      setSubmissionError(getGuidedSubmissionFileError(invalidFile));
      return;
    }

    const nextFiles = [...files, ...uniqueIncoming];
    if (nextFiles.length > GUIDED_SUBMISSION_LIMITS.maxFiles) {
      setSubmissionError('Puedes adjuntar hasta 3 archivos.');
      return;
    }

    const totalSize = nextFiles.reduce((total, file) => total + file.size, 0);
    if (totalSize > GUIDED_SUBMISSION_LIMITS.maxTotalFileSizeBytes) {
      setSubmissionError('Los archivos pueden pesar hasta 10 MB en total.');
      return;
    }

    requestIdRef.current = null;
    setSubmissionError(null);
    setFiles(nextFiles);
  };

  const addLink = () => {
    const normalizedLink = normalizeGuidedSubmissionUrl(linkValue);
    if (!normalizedLink) {
      setLinkError(
        'Ingresa un enlace válido que comience con http:// o https://.'
      );
      return;
    }

    if (
      !links.includes(normalizedLink) &&
      links.length >= GUIDED_SUBMISSION_LIMITS.maxUrls
    ) {
      setLinkError('Puedes agregar hasta 5 enlaces.');
      return;
    }

    if (!links.includes(normalizedLink)) {
      requestIdRef.current = null;
      setLinks((current) => [...current, normalizedLink]);
    }
    setLinkValue('');
    setLinkError(null);
    setSubmissionError(null);
  };

  const handleSubmit = async () => {
    if (files.length === 0 && links.length === 0) {
      setSubmissionError('Agrega al menos un archivo o enlace.');
      return;
    }

    setIsSubmitting(true);
    setSubmissionError(null);
    const requestId = requestIdRef.current ?? crypto.randomUUID();
    requestIdRef.current = requestId;

    const formData = new FormData();
    formData.append('requestId', requestId);
    files.forEach((file) => formData.append('files', file));
    links.forEach((link) => formData.append('urls', link));

    const controller = new AbortController();
    abortControllerRef.current = controller;
    let timedOut = false;
    const timeout = window.setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, GUIDED_SUBMISSION_LIMITS.clientUploadTimeoutMs);

    try {
      const response = await fetch(
        `/api/estudiantes/guided-projects/${projectId}/activities/${activityId}/submission`,
        { method: 'POST', body: formData, signal: controller.signal }
      );
      const data = (await response
        .json()
        .catch(() => null)) as GuidedActivitySubmissionResponse | null;

      if (!response.ok || data?.success !== true) {
        const message =
          data?.success === false
            ? data.error
            : 'No se pudo guardar la entrega. Intenta nuevamente.';
        throw new Error(message);
      }

      resetDraft();
      onOpenChange(false);
      toast.success('Actividad entregada y marcada como completada.');
      router.refresh();
    } catch (error) {
      const wasAborted = controller.signal.aborted;
      setSubmissionError(
        wasAborted
          ? timedOut
            ? 'La carga superó el tiempo máximo. Puedes intentarlo nuevamente.'
            : 'Carga cancelada. Puedes intentarlo nuevamente.'
          : error instanceof Error
            ? error.message
            : 'No se pudo guardar la entrega. Intenta nuevamente.'
      );
    } finally {
      window.clearTimeout(timeout);
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Entregar actividad</DialogTitle>
          <DialogDescription className="sr-only">
            Prepara archivos y enlaces para la actividad seleccionada.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5">
          <div>
            <p className="mb-1 text-xs text-muted-foreground">Actividad</p>
            <p className="text-sm font-medium text-foreground">
              {activityName}
            </p>
          </div>

          {isLoadingLatest && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <LoaderCircle
                className="size-4 animate-spin"
                aria-hidden="true"
              />
              Cargando tu última entrega...
            </div>
          )}

          {!isLoadingLatest &&
            latestSubmission &&
            (latestSubmission.files.length > 0 ||
              latestSubmission.urls.length > 0) && (
              <div className="rounded-xl border border-border/50 bg-muted/10 p-3">
                <p className="mb-2 text-xs font-medium text-muted-foreground">
                  Tu última entrega
                </p>
                <ul className="flex flex-col gap-1.5">
                  {latestSubmission.files.map((file, index) => (
                    <li
                      key={`${file.name}-${index}`}
                      className="flex items-center gap-2 text-sm text-foreground"
                    >
                      <FileText
                        className="size-4 shrink-0 text-muted-foreground"
                        aria-hidden="true"
                      />
                      <span className="min-w-0 flex-1 truncate">
                        {file.name}
                      </span>
                    </li>
                  ))}
                  {latestSubmission.urls.map((url) => (
                    <li key={url} className="flex items-center gap-2 text-sm">
                      <LinkIcon
                        className="size-4 shrink-0 text-muted-foreground"
                        aria-hidden="true"
                      />
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-w-0 flex-1 items-center gap-1 truncate text-primary hover:underline"
                      >
                        <span className="min-w-0 truncate">{url}</span>
                        <ExternalLink
                          className="size-3 shrink-0"
                          aria-hidden="true"
                        />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              addFiles(event.dataTransfer.files);
            }}
            className="rounded-xl border-2 border-dashed border-border/60 bg-muted/20 p-6 text-center transition-colors hover:border-accent/50 hover:bg-muted/30 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
            aria-describedby={`${fileInputId}-hint`}
          >
            <span className="mx-auto mb-3 flex size-10 items-center justify-center rounded-full border border-accent/30 bg-accent/15 text-accent">
              <Upload className="size-5" aria-hidden="true" />
            </span>
            <span className="block text-sm font-medium text-foreground">
              Arrastra tus archivos aquí
            </span>
            <span
              id={`${fileInputId}-hint`}
              className="mt-1 block text-xs text-muted-foreground"
            >
              o haz clic para seleccionarlos
            </span>
          </button>
          <input
            ref={fileInputRef}
            id={fileInputId}
            type="file"
            multiple
            accept={GUIDED_SUBMISSION_FILE_ACCEPT}
            disabled={isSubmitting}
            className="hidden"
            onChange={(event) => {
              if (event.target.files) addFiles(event.target.files);
              event.target.value = '';
            }}
          />

          {files.length > 0 && (
            <ul className="flex flex-col gap-2" aria-label="Archivos adjuntos">
              {files.map((file, index) => (
                <li
                  key={`${file.name}-${file.size}-${file.lastModified}`}
                  className="flex items-center gap-2 rounded-lg border border-border/50 bg-muted/20 px-3 py-2"
                >
                  <FileText
                    className="size-4 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                    {file.name}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    disabled={isSubmitting}
                    onClick={() => {
                      requestIdRef.current = null;
                      setSubmissionError(null);
                      setFiles((current) =>
                        current.filter((_, fileIndex) => fileIndex !== index)
                      );
                    }}
                    aria-label={`Quitar ${file.name}`}
                  >
                    <X aria-hidden="true" />
                  </Button>
                </li>
              ))}
            </ul>
          )}

          <div className="flex flex-col gap-2">
            <Label
              htmlFor={linkInputId}
              className="text-xs text-muted-foreground"
            >
              Agregar enlaces
            </Label>
            <div className="flex gap-2">
              <div className="relative min-w-0 flex-1">
                <LinkIcon
                  className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  id={linkInputId}
                  type="url"
                  value={linkValue}
                  disabled={isSubmitting}
                  onChange={(event) => {
                    setLinkValue(event.target.value);
                    if (linkError) setLinkError(null);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      addLink();
                    }
                  }}
                  placeholder="https://..."
                  className="pl-9"
                  aria-invalid={Boolean(linkError)}
                  aria-describedby={
                    linkError ? `${linkInputId}-error` : undefined
                  }
                />
              </div>
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting || !linkValue.trim()}
                onClick={addLink}
              >
                <Plus data-icon="inline-start" aria-hidden="true" />
                Agregar
              </Button>
            </div>
            {linkError && (
              <p
                id={`${linkInputId}-error`}
                role="alert"
                aria-live="assertive"
                className="text-xs text-destructive"
              >
                {linkError}
              </p>
            )}
          </div>

          {links.length > 0 && (
            <ul className="flex flex-col gap-2" aria-label="Enlaces adjuntos">
              {links.map((link, index) => (
                <li
                  key={link}
                  className="flex items-center gap-2 rounded-lg border border-border/50 bg-muted/20 px-3 py-2"
                >
                  <LinkIcon
                    className="size-4 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                    {link}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    disabled={isSubmitting}
                    onClick={() => {
                      requestIdRef.current = null;
                      setSubmissionError(null);
                      setLinks((current) =>
                        current.filter((_, linkIndex) => linkIndex !== index)
                      );
                    }}
                    aria-label={`Quitar enlace ${index + 1}`}
                  >
                    <X aria-hidden="true" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              if (isSubmitting) {
                abortControllerRef.current?.abort();
                return;
              }
              handleOpenChange(false);
            }}
          >
            {isSubmitting ? 'Cancelar carga' : 'Cancelar'}
          </Button>
          <Button
            type="button"
            disabled={
              isSubmitting || (files.length === 0 && links.length === 0)
            }
            aria-busy={isSubmitting}
            aria-describedby={
              submissionError ? 'guided-submission-error' : undefined
            }
            onClick={handleSubmit}
            className="bg-gradient-to-r from-primary to-primary/80 font-semibold text-[#01152d] hover:text-[#01152d]"
          >
            {isSubmitting ? (
              <LoaderCircle
                className="animate-spin"
                data-icon="inline-start"
                aria-hidden="true"
              />
            ) : (
              <Save data-icon="inline-start" aria-hidden="true" />
            )}
            {isSubmitting ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogFooter>
        {submissionError && (
          <p
            id="guided-submission-error"
            role="alert"
            aria-live="assertive"
            className="text-right text-xs text-destructive"
          >
            {submissionError}
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
