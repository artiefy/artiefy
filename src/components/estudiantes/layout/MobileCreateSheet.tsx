'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';

import { CreateMenuOptions } from '~/components/estudiantes/proyectos/subcomponents/CreateMenuOptions';

interface MobileCreateSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectProject: () => void;
  onSelectPost: () => void;
}

/**
 * Bottom sheet opened by the "+" button in `MobileBottomNav`. Offers the
 * same two "Crear" choices as the desktop dropdown in `ProjectsLeftRail`
 * (`CreateMenuOptions`), routed through `requestCreateEntry` so it works
 * from any route, not just `/proyectos` — see `createEntryBus.ts` for why.
 *
 * Built directly on the Radix primitive (rather than the shared
 * `estudiantes/ui/dialog` component) because that one is tuned for a
 * center-screen dialog; this needs to slide up from the bottom and sit
 * above `MobileBottomNav`'s very high `z-[2147483000]`.
 */
export function MobileCreateSheet({
  isOpen,
  onOpenChange,
  onSelectProject,
  onSelectPost,
}: MobileCreateSheetProps) {
  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className="
            data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0
            fixed inset-0
            z-[2147483001] bg-black/60
            motion-reduce:animate-none motion-reduce:transition-none
          "
        />
        <DialogPrimitive.Content
          className="
            data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom fixed inset-x-0
            bottom-0 z-[2147483002] rounded-t-2xl
            border-t
            border-border/50
            bg-card
            pb-[calc(env(safe-area-inset-bottom,0px)+1rem)] shadow-2xl
            motion-reduce:animate-none motion-reduce:transition-none
          "
        >
          <DialogPrimitive.Title className="sr-only">
            Crear
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            Elige qué quieres crear: un proyecto completo o una publicación.
          </DialogPrimitive.Description>

          <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-border" />

          <CreateMenuOptions
            className="py-2"
            onSelectProject={() => {
              onOpenChange(false);
              onSelectProject();
            }}
            onSelectPost={() => {
              onOpenChange(false);
              onSelectPost();
            }}
          />
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
