import { Dialog } from '@headlessui/react';
import { X } from 'lucide-react';
import { FaCalendarAlt } from 'react-icons/fa';
import { LuSquareArrowOutUpRight } from 'react-icons/lu';

interface CourseModalExternalClassProps {
  open: boolean;
  title: string;
  url: string;
  kind: 'video-embed' | 'link';
  embedUrl?: string;
  dateLabel?: string;
  onClose: () => void;
}

const CourseModalExternalClass: React.FC<CourseModalExternalClassProps> = ({
  open,
  title,
  url,
  kind,
  embedUrl,
  dateLabel,
  onClose,
}) => {
  const canEmbed = kind === 'video-embed' && !!embedUrl;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      className="
        fixed inset-0 z-50 flex items-center justify-center bg-black/60
      "
    >
      <div className="flex size-full items-center justify-center p-4">
        <div
          className="
            relative w-full max-w-3xl overflow-hidden rounded-2xl border
            border-border bg-card shadow-2xl
          "
        >
          <button
            className="
              absolute top-4 right-4 rounded-sm opacity-70
              ring-offset-background transition-opacity
              hover:opacity-100
              focus:ring-2 focus:ring-ring focus:ring-offset-2
              focus:outline-none
            "
            onClick={onClose}
            aria-label="Cerrar"
            type="button"
          >
            <X className="size-4" />
            <span className="sr-only">Cerrar</span>
          </button>
          <div
            className="
              flex flex-col space-y-1.5 border-b border-border/50 p-4 pr-10
              text-center
              sm:text-left
            "
          >
            <h2 className="text-base font-medium tracking-tight text-foreground">
              {title}
            </h2>
            {dateLabel && (
              <div
                className="
                  flex items-center justify-center gap-1 text-xs
                  text-muted-foreground
                  sm:justify-start
                "
              >
                <FaCalendarAlt className="size-3.5" />
                <span>{dateLabel}</span>
              </div>
            )}
          </div>

          {canEmbed ? (
            // Inset instead of edge-to-edge: a full-bleed player butts right up
            // against the title and reads as part of the header.
            <div className="mt-4 px-4">
              <div
                className="
                  relative aspect-video w-full overflow-hidden rounded-xl border
                  border-border/50 bg-black
                "
              >
                <iframe
                  src={embedUrl}
                  title={title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
                  allowFullScreen
                  referrerPolicy="strict-origin-when-cross-origin"
                  className="absolute inset-0 size-full border-0"
                />
              </div>
            </div>
          ) : (
            <div className="mt-3 space-y-3 px-4">
              <p className="text-sm leading-relaxed text-muted-foreground">
                Esta clase no tiene grabación en la plataforma. El profesor
                compartió un enlace externo.
              </p>
              <p
                className="
                  rounded-lg border border-border/50 bg-muted/40 p-3 text-xs
                  break-all text-muted-foreground
                "
              >
                {url}
              </p>
            </div>
          )}

          <div
            className="
              flex flex-col gap-2 p-4
              sm:flex-row sm:items-center sm:justify-end
            "
          >
            <button
              type="button"
              onClick={onClose}
              className="
                inline-flex items-center justify-center rounded-lg border
                border-border/50 px-4 py-2 text-sm font-medium
                text-muted-foreground transition-colors
                hover:bg-muted hover:text-foreground
              "
            >
              Cerrar
            </button>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="
                inline-flex items-center justify-center gap-2 rounded-lg
                bg-accent px-4 py-2 text-sm font-semibold
                text-background transition-opacity
                hover:opacity-90
              "
            >
              <LuSquareArrowOutUpRight className="size-4" />
              Abrir enlace
            </a>
          </div>
        </div>
      </div>
    </Dialog>
  );
};

export default CourseModalExternalClass;
