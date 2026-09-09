'use client';

import { useEffect, useRef, useState } from 'react';

import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Landmark,
  Loader2,
  Mail,
  Phone,
  User,
} from 'lucide-react';

import { Button } from '~/components/estudiantes/ui/button';
import { Checkbox } from '~/components/estudiantes/ui/checkbox';
import { Input } from '~/components/estudiantes/ui/input';
import { cn } from '~/lib/utils';

import { CHECKOUT_COUNTRIES, findCountryByDialCode } from './countries';

import type { CheckoutBuyer, CheckoutPaymentMethod } from '~/types/checkout';

const FIELD_CLASS = 'h-10 rounded-lg border-border/50 bg-muted/30 pl-8 text-xs';
const LABEL_CLASS =
  'flex items-center gap-1 text-[10px] font-medium tracking-wide text-muted-foreground uppercase';

interface DetailsStepProps {
  buyer: CheckoutBuyer;
  onChangeBuyer: (patch: Partial<CheckoutBuyer>) => void;
  paymentMethod: CheckoutPaymentMethod;
  onChangePaymentMethod: (method: CheckoutPaymentMethod) => void;
  termsAccepted: boolean;
  onChangeTerms: (accepted: boolean) => void;
  /** True once the buyer is signed in, so the email cannot be swapped. */
  emailLocked: boolean;
  loading: boolean;
  error: string | null;
  onBack: () => void;
  onSubmit: () => void;
}

interface LabeledFieldProps {
  label: string;
  optional?: boolean;
  children: React.ReactNode;
}

function LabeledField({ label, optional, children }: LabeledFieldProps) {
  return (
    <div className="space-y-1">
      <label className={LABEL_CLASS}>
        {label}
        {optional ? (
          <span className="text-[9px] tracking-normal normal-case opacity-70">
            (opcional)
          </span>
        ) : null}
      </label>
      {children}
    </div>
  );
}

function CountrySelect({
  dialCode,
  onChange,
}: {
  dialCode: string;
  onChange: (dialCode: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selected = findCountryByDialCode(dialCode);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [open]);

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex h-10 items-center gap-1.5 rounded-lg border border-border/50 bg-muted/30 px-2.5 text-foreground transition-colors hover:border-border"
      >
        <span className="text-base leading-none">{selected.flag}</span>
        <span className="text-xs font-medium">{selected.dialCode}</span>
        <ChevronDown className="size-3 text-muted-foreground" />
      </button>

      {open ? (
        <ul
          role="listbox"
          className="absolute top-full left-0 z-50 mt-1 max-h-56 w-52 overflow-y-auto rounded-lg border border-border/50 bg-card p-1 shadow-lg"
        >
          {CHECKOUT_COUNTRIES.map((country) => (
            <li key={country.code}>
              <button
                type="button"
                role="option"
                aria-selected={country.dialCode === dialCode}
                onClick={() => {
                  onChange(country.dialCode);
                  setOpen(false);
                }}
                className={cn(
                  'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors hover:bg-muted/40',
                  country.dialCode === dialCode
                    ? 'text-foreground'
                    : 'text-muted-foreground'
                )}
              >
                <span className="text-base leading-none">{country.flag}</span>
                <span className="flex-1 truncate">{country.name}</span>
                <span className="font-medium">{country.dialCode}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function DetailsStep({
  buyer,
  onChangeBuyer,
  paymentMethod,
  onChangePaymentMethod,
  termsAccepted,
  onChangeTerms,
  emailLocked,
  loading,
  error,
  onBack,
  onSubmit,
}: DetailsStepProps) {
  const country = findCountryByDialCode(buyer.dialCode);

  const isValid =
    buyer.firstName.trim().length > 1 &&
    buyer.firstLastName.trim().length > 1 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyer.email.trim()) &&
    buyer.phone.replace(/\D/g, '').length >= 7 &&
    termsAccepted;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-bold text-foreground">Tus datos</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Completa tu información y elige cómo pagar
        </p>
      </div>

      <div className="space-y-2.5">
        <div className="grid grid-cols-2 gap-2">
          <LabeledField label="Primer nombre">
            <div className="relative">
              <User className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                className={FIELD_CLASS}
                placeholder="Juan"
                maxLength={60}
                value={buyer.firstName}
                onChange={(event) =>
                  onChangeBuyer({ firstName: event.target.value })
                }
              />
            </div>
          </LabeledField>

          <LabeledField label="Segundo nombre" optional>
            <div className="relative">
              <User className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                className={FIELD_CLASS}
                placeholder="José"
                maxLength={60}
                value={buyer.secondName}
                onChange={(event) =>
                  onChangeBuyer({ secondName: event.target.value })
                }
              />
            </div>
          </LabeledField>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <LabeledField label="Primer apellido">
            <div className="relative">
              <User className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                className={FIELD_CLASS}
                placeholder="Ruiz"
                maxLength={60}
                value={buyer.firstLastName}
                onChange={(event) =>
                  onChangeBuyer({ firstLastName: event.target.value })
                }
              />
            </div>
          </LabeledField>

          <LabeledField label="Segundo apellido" optional>
            <div className="relative">
              <User className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                className={FIELD_CLASS}
                placeholder="Gómez"
                maxLength={60}
                value={buyer.secondLastName}
                onChange={(event) =>
                  onChangeBuyer({ secondLastName: event.target.value })
                }
              />
            </div>
          </LabeledField>
        </div>

        <LabeledField label="Correo electrónico">
          <div className="relative">
            <Mail className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="email"
              className={FIELD_CLASS}
              placeholder="correo@ejemplo.com"
              maxLength={255}
              readOnly={emailLocked}
              value={buyer.email}
              onChange={(event) => onChangeBuyer({ email: event.target.value })}
            />
          </div>
        </LabeledField>

        <LabeledField label="Número de celular">
          <div className="flex gap-2">
            <CountrySelect
              dialCode={buyer.dialCode}
              onChange={(dialCode) => onChangeBuyer({ dialCode })}
            />
            <div className="relative flex-1">
              <Phone className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="tel"
                inputMode="numeric"
                className={FIELD_CLASS}
                placeholder={country.example}
                maxLength={15}
                value={buyer.phone}
                onChange={(event) =>
                  onChangeBuyer({
                    phone: event.target.value.replace(/[^\d\s]/g, ''),
                  })
                }
              />
            </div>
          </div>
        </LabeledField>
      </div>

      <div className="space-y-2">
        <p className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
          Método de pago
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onChangePaymentMethod('card')}
            className={cn(
              'flex items-center gap-2 rounded-xl border p-2.5 text-left transition-all active:scale-[0.97]',
              paymentMethod === 'card'
                ? 'border-primary bg-primary/10'
                : 'border-border/40 bg-muted/20 hover:border-border/70'
            )}
          >
            <CreditCard
              className={cn(
                'size-4 shrink-0',
                paymentMethod === 'card'
                  ? 'text-primary'
                  : 'text-muted-foreground'
              )}
            />
            <div>
              <p
                className={cn(
                  'text-[11px] font-medium',
                  paymentMethod === 'card'
                    ? 'text-foreground'
                    : 'text-muted-foreground'
                )}
              >
                Tarjeta
              </p>
              <p className="text-[9px] text-muted-foreground">
                Crédito / Débito
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onChangePaymentMethod('pse')}
            className={cn(
              'flex items-center gap-2 rounded-xl border p-2.5 text-left transition-all active:scale-[0.97]',
              paymentMethod === 'pse'
                ? 'border-primary bg-primary/10'
                : 'border-border/40 bg-muted/20 hover:border-border/70'
            )}
          >
            <Landmark
              className={cn(
                'size-4 shrink-0',
                paymentMethod === 'pse'
                  ? 'text-primary'
                  : 'text-muted-foreground'
              )}
            />
            <div>
              <p
                className={cn(
                  'text-[11px] font-medium',
                  paymentMethod === 'pse'
                    ? 'text-foreground'
                    : 'text-muted-foreground'
                )}
              >
                Cuenta bancaria
              </p>
              <p className="text-[9px] text-muted-foreground">PSE vía PayU</p>
            </div>
          </button>
        </div>
      </div>

      <div className="space-y-0.5">
        <label className="flex cursor-pointer items-start gap-2">
          <Checkbox
            checked={termsAccepted}
            onCheckedChange={(checked) => onChangeTerms(checked === true)}
            className="mt-0.5 size-3.5 rounded border-border/50 data-[state=checked]:border-primary data-[state=checked]:bg-primary"
          />
          <span className="text-[10px] leading-tight text-muted-foreground">
            Acepto los{' '}
            <a
              href="/terminos"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Términos y Condiciones
            </a>{' '}
            y la{' '}
            <a
              href="/privacidad"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Política de Privacidad
            </a>
          </span>
        </label>
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
          className="h-11 flex-1 gap-2 rounded-full bg-primary text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20"
        >
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Preparando...
            </>
          ) : (
            <>
              Ir al pago
              <ChevronRight className="size-4 opacity-70" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
