'use client';

import { useEffect, useRef, useState } from 'react';

import { X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { FaWandMagicSparkles } from 'react-icons/fa6';

import '~/styles/ai-generate-loader.css';

interface AddCustomSectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (name: string, description: string) => void;
  isLoading?: boolean;
  initialName?: string;
  initialDescription?: string;
  nameLocked?: boolean;
  onGenerateDescription?: (
    currentText: string,
    sectionName: string
  ) => Promise<string | null>;
}

export default function AddCustomSectionModal({
  isOpen,
  onClose,
  onAdd,
  isLoading = false,
  initialName = '',
  initialDescription = '',
  nameLocked = false,
  onGenerateDescription,
}: AddCustomSectionModalProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [sectionName, setSectionName] = useState('');
  const [sectionDescription, setSectionDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const typingTimerRef = useRef<number | null>(null);
  const typingTokenRef = useRef(0);

  const stopTyping = () => {
    if (typingTimerRef.current !== null) {
      window.clearTimeout(typingTimerRef.current);
      typingTimerRef.current = null;
    }
    typingTokenRef.current += 1;
  };

  const shouldReduceMotion = () => {
    if (typeof window === 'undefined') return true;
    return (
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );
  };

  const typeIntoDescription = (fullText: string) => {
    stopTyping();
    if (!fullText) {
      setSectionDescription('');
      return;
    }
    if (shouldReduceMotion()) {
      setSectionDescription(fullText);
      return;
    }

    const token = typingTokenRef.current;
    const total = fullText.length;
    const intervalMs = 12;
    const chunk = Math.max(1, Math.ceil(total / 180));
    let index = 0;

    const step = () => {
      if (typingTokenRef.current !== token) return;
      index = Math.min(total, index + chunk);
      setSectionDescription(fullText.slice(0, index));
      if (index < total) {
        typingTimerRef.current = window.setTimeout(step, intervalMs);
      }
    };

    step();
  };

  useEffect(() => {
    if (!isOpen) return;
    setSectionName(initialName);
    setSectionDescription(initialDescription);
  }, [isOpen, initialName, initialDescription]);

  useEffect(() => {
    setIsMounted(true);
    return () => {
      setIsMounted(false);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (typingTimerRef.current !== null) {
        window.clearTimeout(typingTimerRef.current);
      }
    };
  }, []);

  const handleSubmit = () => {
    const finalName = nameLocked ? initialName.trim() : sectionName.trim();
    if (finalName) {
      onAdd(finalName, sectionDescription.trim());
      setSectionName('');
      setSectionDescription('');
    }
  };

  const handleGenerate = async () => {
    if (!onGenerateDescription) return;
    setIsGenerating(true);
    try {
      const activeName = nameLocked ? initialName.trim() : sectionName.trim();
      const result = await onGenerateDescription(
        sectionDescription.trim() || '',
        activeName
      );
      if (result) {
        typeIntoDescription(result);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen || !isMounted) return null;

  return createPortal(
    <div
      className="
        fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4
      "
      onClick={onClose}
    >
      {/* Modal */}
      <div
        className="
          animate-in fade-in-0 zoom-in-95 relative grid max-h-[90vh] w-full
          max-w-md gap-4 overflow-y-auto rounded-[16px] border border-border/50
          bg-card p-6 shadow-lg duration-200
        "
        onClick={(event) => event.stopPropagation()}
      >
        {/* Header */}
        <div
          className="
            flex flex-col space-y-1.5 text-center
            sm:text-left
          "
        >
          <h2
            className="
              text-lg leading-none font-semibold tracking-tight text-foreground
            "
          >
            Nueva sección personalizada
          </h2>
          <p className="text-sm text-muted-foreground">
            Crea una sección con el nombre y contenido que necesites.
          </p>
        </div>

        {/* Content */}
        <div className="space-y-6 pt-4">
          <div className="space-y-3">
            <label
              className="
                text-sm leading-none font-medium text-foreground
                peer-disabled:cursor-not-allowed peer-disabled:opacity-70
              "
              htmlFor="section-name"
            >
              Nombre de la sección
            </label>
            <input
              className="
                flex h-10 w-full rounded-md border border-border/50 bg-muted/50
                px-3 py-2 text-base ring-offset-background
                file:border-0 file:bg-transparent file:text-sm file:font-medium
                file:text-foreground
                placeholder:text-muted-foreground
                focus-visible:ring-2 focus-visible:ring-ring
                focus-visible:ring-offset-2 focus-visible:outline-none
                disabled:cursor-not-allowed disabled:opacity-50
                md:text-sm
              "
              id="section-name"
              placeholder="Ej: Introducción, Justificación, Antecedentes..."
              value={sectionName}
              onChange={(e) => setSectionName(e.target.value)}
              disabled={isLoading || nameLocked}
            />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <label
                className="
                  text-sm leading-none font-medium text-foreground
                  peer-disabled:cursor-not-allowed peer-disabled:opacity-70
                "
                htmlFor="section-description"
              >
                Descripción
              </label>
              {onGenerateDescription && (
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={isLoading || isGenerating}
                  className="
                    inline-flex h-7 items-center justify-center gap-2 rounded-md
                    px-3 text-xs font-medium whitespace-nowrap text-accent
                    ring-offset-background transition-colors
                    hover:bg-accent/10 hover:text-accent
                    focus-visible:ring-2 focus-visible:ring-ring
                    focus-visible:ring-offset-2 focus-visible:outline-none
                    disabled:pointer-events-none disabled:opacity-50
                    [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0
                  "
                >
                  {isGenerating ? (
                    <span className="ai-generate-loader" aria-hidden />
                  ) : (
                    <FaWandMagicSparkles className="mr-1.5 size-3" />
                  )}
                  <span
                    className={
                      isGenerating
                        ? 'ai-generate-text-pulse text-xs'
                        : 'text-xs'
                    }
                  >
                    {sectionDescription.trim()
                      ? 'Regenerar con IA'
                      : 'Generar con IA'}
                  </span>
                </button>
              )}
            </div>
            <textarea
              className="
                flex min-h-[120px] w-full resize-none rounded-md border
                border-border/50 bg-muted/50 px-3 py-2 text-sm
                ring-offset-background
                placeholder:text-muted-foreground
                focus-visible:ring-2 focus-visible:ring-ring
                focus-visible:ring-offset-2 focus-visible:outline-none
                disabled:cursor-not-allowed disabled:opacity-50
              "
              id="section-description"
              placeholder="Escribe el contenido de esta sección..."
              value={sectionDescription}
              onChange={(e) => {
                stopTyping();
                setSectionDescription(e.target.value);
              }}
              disabled={isLoading || isGenerating}
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="
                inline-flex h-10 items-center justify-center gap-2 rounded-md
                border border-input bg-background px-4 py-2 text-sm font-medium
                whitespace-nowrap ring-offset-background transition-colors
                hover:bg-accent hover:text-accent-foreground
                focus-visible:ring-2 focus-visible:ring-ring
                focus-visible:ring-offset-2 focus-visible:outline-none
                disabled:pointer-events-none disabled:opacity-50
                [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0
              "
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={
                isLoading ||
                isGenerating ||
                !(nameLocked ? initialName.trim() : sectionName.trim())
              }
              className="
                inline-flex h-10 items-center justify-center gap-2 rounded-md
                bg-accent px-4 py-2 text-sm font-medium whitespace-nowrap
                text-accent-foreground ring-offset-background transition-colors
                hover:bg-accent/90
                focus-visible:ring-2 focus-visible:ring-ring
                focus-visible:ring-offset-2 focus-visible:outline-none
                disabled:pointer-events-none disabled:opacity-50
                [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0
              "
            >
              {isLoading ? 'Agregando...' : 'Agregar sección'}
            </button>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isLoading}
          className="
            absolute top-4 right-4 rounded-sm opacity-70 ring-offset-background
            transition-opacity
            hover:opacity-100
            focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-none
            disabled:pointer-events-none
            data-[state=open]:bg-accent data-[state=open]:text-muted-foreground
          "
        >
          <X className="size-4" />
          <span className="sr-only">Cerrar</span>
        </button>
      </div>
    </div>,
    document.body
  );
}
