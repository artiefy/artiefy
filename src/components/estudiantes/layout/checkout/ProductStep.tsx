'use client';

import Image from 'next/image';

import { ChevronRight, Crown, Package } from 'lucide-react';

import { Button } from '~/components/estudiantes/ui/button';
import { cn } from '~/lib/utils';

import { formatCop } from './format';

import type { CheckoutItem, CheckoutPurchaseKind } from '~/types/checkout';

interface ProductStepProps {
  purchaseKind: CheckoutPurchaseKind;
  onSelectKind: (kind: CheckoutPurchaseKind) => void;
  /** The course itself. Null when this course is not sold on its own. */
  unitItem: CheckoutItem | null;
  plans: CheckoutItem[];
  selectedPlanId: number | null;
  onSelectPlan: (planId: number) => void;
  onContinue: () => void;
}

export function ProductStep({
  purchaseKind,
  onSelectKind,
  unitItem,
  plans,
  selectedPlanId,
  onSelectPlan,
  onContinue,
}: ProductStepProps) {
  const isUnit = purchaseKind === 'unit';
  const canContinue = isUnit ? unitItem !== null : selectedPlanId !== null;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-bold text-foreground">
          ¿Qué quieres comprar?
        </h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Elige una suscripción o compra este curso
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onSelectKind('subscription')}
          className={cn(
            'rounded-xl border p-3 text-left transition-all active:scale-[0.97]',
            !isUnit
              ? 'border-primary bg-primary/10 shadow-sm shadow-primary/10'
              : 'border-border/40 bg-muted/20 hover:border-border/70'
          )}
        >
          <Crown
            className={cn(
              'mb-1.5 size-5',
              !isUnit ? 'text-primary' : 'text-muted-foreground'
            )}
          />
          <p
            className={cn(
              'text-xs font-semibold',
              !isUnit ? 'text-foreground' : 'text-muted-foreground'
            )}
          >
            Plan de suscripción
          </p>
          <p className="text-[10px] text-muted-foreground">Acceso completo</p>
        </button>

        <button
          type="button"
          disabled={unitItem === null}
          onClick={() => onSelectKind('unit')}
          className={cn(
            'rounded-xl border p-3 text-left transition-all active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40',
            isUnit
              ? 'border-primary bg-primary/10 shadow-sm shadow-primary/10'
              : 'border-border/40 bg-muted/20 hover:border-border/70'
          )}
        >
          <Package
            className={cn(
              'mb-1.5 size-5',
              isUnit ? 'text-primary' : 'text-muted-foreground'
            )}
          />
          <p
            className={cn(
              'text-xs font-semibold',
              isUnit ? 'text-foreground' : 'text-muted-foreground'
            )}
          >
            Compra unitaria
          </p>
          <p className="text-[10px] text-muted-foreground">Este curso</p>
        </button>
      </div>

      {isUnit && unitItem ? (
        <div className="flex gap-3 rounded-xl border border-border/40 bg-muted/20 p-3">
          {unitItem.imageUrl ? (
            <Image
              src={unitItem.imageUrl}
              alt={unitItem.title}
              width={80}
              height={56}
              className="h-14 w-20 shrink-0 rounded-lg object-cover"
              unoptimized
            />
          ) : (
            <div className="h-14 w-20 shrink-0 rounded-lg bg-muted/40" />
          )}
          <div className="min-w-0 flex-1">
            <p className="line-clamp-2 text-xs leading-snug font-semibold text-foreground">
              {unitItem.title}
            </p>
            <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
              {unitItem.subtitle}
            </p>
            <p className="mt-1 text-sm font-bold text-foreground">
              $&nbsp;{formatCop(unitItem.amount)}
            </p>
          </div>
        </div>
      ) : null}

      {!isUnit ? (
        <div className="space-y-2">
          {plans.map((plan) => {
            const isSelected = plan.id === selectedPlanId;

            return (
              <button
                type="button"
                key={plan.id}
                onClick={() => onSelectPlan(plan.id)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all active:scale-[0.99]',
                  isSelected
                    ? 'border-primary bg-primary/10'
                    : 'border-border/40 bg-muted/20 hover:border-border/70'
                )}
              >
                <Crown
                  className={cn(
                    'size-5 shrink-0',
                    isSelected ? 'text-primary' : 'text-muted-foreground'
                  )}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-foreground">
                    {plan.title}
                  </p>
                  <p className="truncate text-[10px] text-muted-foreground">
                    {plan.subtitle}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-bold text-foreground">
                  $&nbsp;{formatCop(plan.amount)}
                </p>
              </button>
            );
          })}
        </div>
      ) : null}

      <Button
        type="button"
        disabled={!canContinue}
        onClick={onContinue}
        className="h-11 w-full gap-2 rounded-full bg-primary text-sm font-semibold text-background transition-all hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20"
      >
        Continuar
        <ChevronRight className="size-4 opacity-70" />
      </Button>
    </div>
  );
}
