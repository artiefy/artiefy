'use client';

import { Check } from 'lucide-react';

import { cn } from '~/lib/utils';

import type { CheckoutStep } from '~/types/checkout';

const STEP_LABELS = ['Producto', 'Tus datos', 'Pago', 'Confirmación'] as const;

interface CheckoutStepperProps {
  current: CheckoutStep;
}

export function CheckoutStepper({ current }: CheckoutStepperProps) {
  return (
    <div className="shrink-0 border-b border-border/40 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent px-5 pt-5 pb-4">
      <div className="flex items-center justify-between">
        {STEP_LABELS.map((label, index) => {
          const step = index + 1;
          const isDone = current > step;
          const isCurrent = current === step;
          const isLast = step === STEP_LABELS.length;

          return (
            <div
              key={label}
              className="flex flex-1 items-center last:flex-none"
            >
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={cn(
                    'flex size-8 items-center justify-center rounded-full border text-xs font-bold transition-all duration-300',
                    isDone &&
                      'border-primary bg-primary text-primary-foreground',
                    isCurrent &&
                      'border-primary bg-primary/15 text-primary shadow-[0_0_16px_color-mix(in_oklab,var(--color-primary)_35%,transparent)]',
                    !isDone &&
                      !isCurrent &&
                      'border-border/50 bg-muted/30 text-muted-foreground'
                  )}
                >
                  {isDone ? <Check className="size-4" /> : step}
                </div>
                <span
                  className={cn(
                    'text-[9px] font-medium whitespace-nowrap',
                    isCurrent ? 'text-foreground' : 'text-muted-foreground'
                  )}
                >
                  {label}
                </span>
              </div>
              {!isLast && (
                <div className="relative mx-1.5 mb-4 h-px flex-1 overflow-hidden rounded-full bg-border/40">
                  <div
                    className="absolute inset-y-0 left-0 bg-primary transition-all duration-500"
                    style={{ width: isDone ? '100%' : '0%' }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
