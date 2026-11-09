'use client';

import * as React from 'react';

import { Button } from '~/components/estudiantes/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/estudiantes/ui/dialog';

export interface ConfirmOptions {
  /** Question shown to the user (kept identical to the old native prompt). */
  message: string;
  title?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Destructive confirmations render a red confirm button. Default: true. */
  destructive?: boolean;
}

interface ConfirmDialogProps extends ConfirmOptions {
  open: boolean;
  onResult: (confirmed: boolean) => void;
}

export function ConfirmDialog({
  open,
  message,
  title = 'Confirmar acción',
  confirmLabel = 'Eliminar',
  cancelLabel = 'Cancelar',
  destructive = true,
  onResult,
}: ConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      // Escape, overlay click and the close button all cancel.
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onResult(false);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="whitespace-pre-line">
            {message}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onResult(false)}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={destructive ? 'destructive' : 'default'}
            onClick={() => onResult(true)}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Promise-based replacement for the browser native confirm prompt.
 *
 *   const { confirm, confirmDialog } = useConfirm();
 *   if (!(await confirm({ message: '...' }))) return;
 *   ...
 *   return (<>... {confirmDialog}</>);
 */
export function useConfirm() {
  const [options, setOptions] = React.useState<ConfirmOptions | null>(null);
  const resolverRef = React.useRef<((value: boolean) => void) | null>(null);

  const confirm = (next: ConfirmOptions | string) =>
    new Promise<boolean>((resolve) => {
      // A new request while one is pending cancels the previous one.
      resolverRef.current?.(false);
      resolverRef.current = resolve;
      setOptions(typeof next === 'string' ? { message: next } : next);
    });

  const handleResult = (confirmed: boolean) => {
    resolverRef.current?.(confirmed);
    resolverRef.current = null;
    setOptions(null);
  };

  const confirmDialog = (
    <ConfirmDialog
      open={options !== null}
      message={options?.message ?? ''}
      title={options?.title}
      confirmLabel={options?.confirmLabel}
      cancelLabel={options?.cancelLabel}
      destructive={options?.destructive}
      onResult={handleResult}
    />
  );

  return { confirm, confirmDialog };
}
