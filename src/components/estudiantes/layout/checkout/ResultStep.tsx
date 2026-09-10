'use client';

import { useState } from 'react';

import { useUser } from '@clerk/nextjs';
import { isClerkAPIResponseError } from '@clerk/nextjs/errors';
import {
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  XCircle,
} from 'lucide-react';

import { Button } from '~/components/estudiantes/ui/button';
import { Input } from '~/components/estudiantes/ui/input';
import { cn } from '~/lib/utils';

import type { TokenizedPaymentResult } from '~/types/checkout';

interface ResultStepProps {
  result: TokenizedPaymentResult;
  /**
   * Set only when this checkout created the account. Clerk needs it as the
   * current password to let the buyer choose a new one right away.
   */
  temporaryPassword: string | null;
  buyerEmail: string;
  onRetry: () => void;
  onFinish: () => void;
}

function ResultIcon({ state }: { state: TokenizedPaymentResult['state'] }) {
  if (state === 'APPROVED') {
    return <CheckCircle2 className="size-7 text-primary" />;
  }
  if (state === 'PENDING') {
    return <Clock className="size-7 text-primary" />;
  }
  return <XCircle className="size-7 text-destructive" />;
}

function PasswordPanel({
  temporaryPassword,
  buyerEmail,
}: {
  temporaryPassword: string;
  buyerEmail: string;
}) {
  const { user } = useUser();
  const [open, setOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!user || saving) return;

    setSaving(true);
    setError(null);

    try {
      await user.updatePassword({
        currentPassword: temporaryPassword,
        newPassword,
      });
      setDone(true);
      setNewPassword('');
    } catch (updateError) {
      const message = isClerkAPIResponseError(updateError)
        ? (updateError.errors[0]?.longMessage ??
          updateError.errors[0]?.message ??
          'No pudimos cambiar la contraseña.')
        : 'No pudimos cambiar la contraseña.';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  if (done) {
    return (
      <div className="flex items-start gap-2 rounded-xl border border-border/40 bg-muted/20 p-3">
        <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-primary" />
        <p className="text-[10px] leading-tight text-muted-foreground">
          Listo, tu contraseña quedó actualizada.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2 rounded-xl border border-border/40 bg-muted/20 p-3">
      <div className="flex items-start gap-2">
        <KeyRound className="mt-0.5 size-3.5 shrink-0 text-primary" />
        <p className="text-[10px] leading-tight text-muted-foreground">
          Creamos tu cuenta y enviamos la contraseña a{' '}
          <span className="text-foreground">{buyerEmail}</span>. Puedes
          cambiarla ahora o dejarla como está.
        </p>
      </div>

      {open ? (
        <div className="space-y-2">
          <div className="relative">
            <Input
              type={visible ? 'text' : 'password'}
              className="h-10 rounded-lg border-border/50 bg-muted/30 pr-9 text-xs"
              placeholder="Nueva contraseña"
              autoComplete="new-password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
            />
            <button
              type="button"
              aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              onClick={() => setVisible((value) => !value)}
              className="absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
            >
              {visible ? (
                <EyeOff className="size-3.5" />
              ) : (
                <Eye className="size-3.5" />
              )}
            </button>
          </div>

          {error ? (
            <p className="text-[10px] leading-snug text-destructive">{error}</p>
          ) : null}

          <Button
            type="button"
            disabled={newPassword.trim().length < 8 || saving}
            onClick={handleSave}
            className="h-9 w-full rounded-full bg-primary text-xs font-semibold text-background hover:bg-primary/90"
          >
            {saving ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                Guardando...
              </>
            ) : (
              'Guardar contraseña'
            )}
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-[10px] font-medium text-primary hover:underline"
        >
          Cambiar contraseña
        </button>
      )}
    </div>
  );
}

export function ResultStep({
  result,
  temporaryPassword,
  buyerEmail,
  onRetry,
  onFinish,
}: ResultStepProps) {
  const isApproved = result.state === 'APPROVED';
  const isPending = result.state === 'PENDING';
  const canRetry = !isApproved && !isPending;

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center gap-2 pt-2 text-center">
        <div
          className={cn(
            'flex size-14 items-center justify-center rounded-full border',
            isApproved || isPending
              ? 'border-primary/40 bg-primary/10'
              : 'border-destructive/40 bg-destructive/10'
          )}
        >
          <ResultIcon state={result.state} />
        </div>
        <h3 className="text-base font-bold text-foreground">
          {isApproved
            ? '¡Pago aprobado!'
            : isPending
              ? 'Pago en revisión'
              : 'No pudimos cobrar'}
        </h3>
        <p className="max-w-[320px] text-xs leading-snug text-muted-foreground">
          {result.message}
        </p>
      </div>

      {result.referenceCode ? (
        <div className="space-y-1 rounded-xl border border-border/40 bg-muted/20 p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] text-muted-foreground">
              Referencia
            </span>
            <span className="truncate text-[10px] font-medium text-foreground">
              {result.referenceCode}
            </span>
          </div>
          {result.maskedNumber ? (
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] text-muted-foreground">Tarjeta</span>
              <span className="text-[10px] font-medium text-foreground">
                {result.maskedNumber}
              </span>
            </div>
          ) : null}
          {result.transactionId ? (
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] text-muted-foreground">
                Transacción
              </span>
              <span className="truncate text-[10px] font-medium text-foreground">
                {result.transactionId}
              </span>
            </div>
          ) : null}
        </div>
      ) : null}

      {temporaryPassword ? (
        <PasswordPanel
          temporaryPassword={temporaryPassword}
          buyerEmail={buyerEmail}
        />
      ) : null}

      <div className="flex gap-2">
        {canRetry ? (
          <Button
            type="button"
            variant="outline"
            onClick={onRetry}
            className="h-11 flex-1 rounded-full border-border/50 text-sm font-semibold"
          >
            Reintentar
          </Button>
        ) : null}
        <Button
          type="button"
          onClick={onFinish}
          className="h-11 flex-1 rounded-full bg-primary text-sm font-semibold text-background transition-all hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20"
        >
          {isApproved ? 'Empezar ahora' : 'Cerrar'}
        </Button>
      </div>
    </div>
  );
}
