'use client';

import { useMemo } from 'react';

import {
  ChevronLeft,
  CreditCard,
  IdCard,
  Loader2,
  Lock,
  ShieldCheck,
} from 'lucide-react';

import { Button } from '~/components/estudiantes/ui/button';
import { Input } from '~/components/estudiantes/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/estudiantes/ui/select';
import { cn } from '~/lib/utils';
import {
  detectCardNetwork,
  formatCardNumberForDisplay,
  formatExpiryForDisplay,
  isValidCardNumber,
  normalizeCardNumber,
  securityCodeLength,
  toPayUExpirationDate,
} from '~/utils/paygateway/cardFormat';

import { formatCop } from './format';

import type { CheckoutCardInput } from '~/types/checkout';

// Matches DetailsStep: a full-strength placeholder reads as an already-filled
// value, which is worse here where the example is a card number.
const FIELD_CLASS =
  'h-10 rounded-lg border-border/50 bg-muted/30 text-xs placeholder:text-muted-foreground/50';
const LABEL_CLASS =
  'text-[10px] font-medium tracking-wide text-muted-foreground uppercase';

const INSTALLMENT_OPTIONS = [1, 2, 3, 6, 12, 18, 24, 36];

const NETWORK_LABELS: Record<string, string> = {
  VISA: 'Visa',
  MASTERCARD: 'Mastercard',
  AMEX: 'American Express',
  DINERS: 'Diners Club',
  CODENSA: 'Codensa',
};

interface CardStepProps {
  card: CheckoutCardInput;
  onChangeCard: (patch: Partial<CheckoutCardInput>) => void;
  amount: number;
  loading: boolean;
  error: string | null;
  onBack: () => void;
  onSubmit: () => void;
}

export function CardStep({
  card,
  onChangeCard,
  amount,
  loading,
  error,
  onBack,
  onSubmit,
}: CardStepProps) {
  const network = useMemo(() => detectCardNetwork(card.number), [card.number]);
  const cvvLength = securityCodeLength(network);

  const isValid =
    isValidCardNumber(card.number) &&
    network !== null &&
    card.holderName.trim().length > 2 &&
    toPayUExpirationDate(card.expiry) !== null &&
    new RegExp(`^\\d{${cvvLength}}$`).test(card.securityCode) &&
    /^\d{5,15}$/.test(card.documentNumber);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-bold text-foreground">
          Datos de tu tarjeta
        </h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Pago seguro procesado por PayU
        </p>
      </div>

      <div className="space-y-2.5">
        <div className="space-y-1">
          <label className={LABEL_CLASS}>Número de tarjeta</label>
          <div className="relative">
            <CreditCard className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              inputMode="numeric"
              autoComplete="cc-number"
              className={cn(FIELD_CLASS, 'pl-8')}
              placeholder="4111 1111 1111 1111"
              value={formatCardNumberForDisplay(card.number)}
              onChange={(event) =>
                onChangeCard({
                  number: normalizeCardNumber(event.target.value).slice(0, 19),
                })
              }
            />
            {network ? (
              <span className="absolute top-1/2 right-2.5 -translate-y-1/2 text-[9px] font-semibold tracking-wide text-primary uppercase">
                {NETWORK_LABELS[network]}
              </span>
            ) : null}
          </div>
        </div>

        <div className="space-y-1">
          <label className={LABEL_CLASS}>
            Nombre como aparece en la tarjeta
          </label>
          <Input
            autoComplete="cc-name"
            className={cn(FIELD_CLASS, 'px-3')}
            placeholder="JUAN RUIZ"
            maxLength={60}
            value={card.holderName}
            onChange={(event) =>
              onChangeCard({ holderName: event.target.value })
            }
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className={LABEL_CLASS}>Vencimiento</label>
            <Input
              inputMode="numeric"
              autoComplete="cc-exp"
              className={cn(FIELD_CLASS, 'px-3')}
              placeholder="MM/AA"
              maxLength={5}
              value={card.expiry}
              onChange={(event) =>
                onChangeCard({
                  expiry: formatExpiryForDisplay(event.target.value),
                })
              }
            />
          </div>

          <div className="space-y-1">
            <label className={LABEL_CLASS}>Código de seguridad</label>
            <div className="relative">
              <Lock className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                inputMode="numeric"
                autoComplete="cc-csc"
                className={cn(FIELD_CLASS, 'pl-8')}
                placeholder={cvvLength === 4 ? '1234' : '123'}
                maxLength={cvvLength}
                value={card.securityCode}
                onChange={(event) =>
                  onChangeCard({
                    securityCode: event.target.value
                      .replace(/\D/g, '')
                      .slice(0, cvvLength),
                  })
                }
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className={LABEL_CLASS}>Documento del titular</label>
            <div className="relative">
              <IdCard className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                inputMode="numeric"
                className={cn(FIELD_CLASS, 'pl-8')}
                placeholder="1020304050"
                maxLength={15}
                value={card.documentNumber}
                onChange={(event) =>
                  onChangeCard({
                    documentNumber: event.target.value
                      .replace(/\D/g, '')
                      .slice(0, 15),
                  })
                }
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className={LABEL_CLASS}>Cuotas</label>
            {/* A native <select> renders its open list through the operating
                system, which ignores the modal's palette and drops a light
                grey panel over the dark checkout. Radix draws the list itself,
                so it stays themed on every browser. */}
            <Select
              value={String(card.installments)}
              onValueChange={(value) =>
                onChangeCard({ installments: Number(value) })
              }
            >
              <SelectTrigger
                // `py-0` and the pinned min/max height are deliberate: the
                // shared trigger ships `h-9 py-2` while the Input beside it
                // resolves to `h-10 py-1`, so the two controls only line up if
                // this one stops carrying its own vertical padding.
                className={cn(
                  FIELD_CLASS,
                  'h-10 max-h-10 min-h-10 w-full justify-between px-3 py-0 [&>span]:text-xs'
                )}
                aria-label="Cuotas"
              >
                <SelectValue />
              </SelectTrigger>
              {/* The dialog overlay sits at z-[100010] and its content at
                  z-[100011]; the shared SelectContent only reaches z-50, so
                  without this the list opens *underneath* the modal and the
                  field looks like it never responds to a click. */}
              <SelectContent className="z-[100012] border-border/50 bg-card">
                {INSTALLMENT_OPTIONS.map((option) => (
                  <SelectItem
                    key={option}
                    value={String(option)}
                    className="text-xs focus:bg-primary/15 focus:text-foreground"
                  >
                    {option === 1 ? '1 cuota' : `${option} cuotas`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="flex items-start gap-2 rounded-xl border border-border/40 bg-muted/20 p-2.5">
        <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-primary" />
        <p className="text-[10px] leading-tight text-muted-foreground">
          Tus datos viajan cifrados y los procesa PayU. Artiefy no almacena el
          número de tu tarjeta.
        </p>
      </div>

      {error ? (
        <p className="text-[11px] leading-snug text-destructive">{error}</p>
      ) : null}

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={loading}
          className="h-11 rounded-full border-border/50 px-4"
        >
          <ChevronLeft className="size-4" />
        </Button>
        <Button
          type="button"
          disabled={!isValid || loading}
          onClick={onSubmit}
          className="h-11 flex-1 gap-2 rounded-full bg-primary text-sm font-semibold text-background transition-all hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20"
        >
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Procesando...
            </>
          ) : (
            <>Pagar $&nbsp;{formatCop(amount)}</>
          )}
        </Button>
      </div>
    </div>
  );
}
