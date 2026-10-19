'use client';

import { Sparkles } from 'lucide-react';

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '~/components/estudiantes/ui/dialog';

interface ComingSoonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Name of the section that is not available yet, e.g. "Espacios". */
  feature: string;
}

/**
 * Notice for a navigation entry that is shown but not built yet. Uses the
 * shared dialog, which portals above the floating mobile header and hides the
 * bottom bar while it is open.
 */
export function ComingSoonDialog({
  open,
  onOpenChange,
  feature,
}: ComingSoonDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="
          rounded-2xl border-white/10 bg-[#061c37] p-8 text-center
          shadow-[0_0_40px_-8px_rgba(34,196,211,0.45)]
          sm:max-w-sm
        "
      >
        <span
          aria-hidden="true"
          className="
            mx-auto flex size-14 items-center justify-center rounded-full
            bg-primary/15 shadow-[0_0_24px_rgba(34,196,211,0.35)] ring-1
            ring-primary/40 ring-inset
          "
        >
          <Sparkles className="size-7 text-primary" />
        </span>
        <DialogTitle className="text-xl font-bold text-foreground">
          ¡Disponible muy pronto!
        </DialogTitle>
        <DialogDescription className="text-sm text-muted-foreground">
          La sección de{' '}
          <span className="font-semibold text-primary">{feature}</span> estará
          habilitada próximamente. ¡Gracias por tu interés!
        </DialogDescription>
        <DialogClose
          className="
            mx-auto mt-1 rounded-full bg-primary px-6 py-2 text-sm
            font-semibold text-slate-950 transition-transform duration-200
            hover:scale-105
            focus-visible:ring-2 focus-visible:ring-primary/60
            focus-visible:outline-none
            active:scale-95
          "
        >
          Entendido
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}
