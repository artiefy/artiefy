'use client';

import { createElement, useEffect, useRef, useState } from 'react';

import Image from 'next/image';
import { useSearchParams } from 'next/navigation';

import { useAuth, useUser } from '@clerk/nextjs';
import { BsCheck2Circle } from 'react-icons/bs';
import { FaTimes, FaTimesCircle } from 'react-icons/fa';

import Footer from '~/components/estudiantes/layout/Footer';
import { Header } from '~/components/estudiantes/layout/Header';
import PaymentForm from '~/components/estudiantes/layout/PaymentForm';
import { Button } from '~/components/estudiantes/ui/button';
import { type Plan, plansEmpresas, plansPersonas } from '~/types/plans';
import { getProductById } from '~/utils/paygateway/products';

import '~/styles/buttonPlanes.css';

const PlansPage: React.FC = () => {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const searchParams = useSearchParams();
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const hasProcessedUrlRef = useRef(false);

  const planIdParam = searchParams?.get('plan_id') ?? null;

  // Detectar plan_id en la URL y abrir modal si corresponde (solo una vez)
  useEffect(() => {
    if (!planIdParam) return;
    if (hasProcessedUrlRef.current) return;
    hasProcessedUrlRef.current = true;

    const allPlans = [...plansPersonas, ...plansEmpresas];
    const plan = allPlans.find((p) => String(p.id) === String(planIdParam));
    if (!plan) return;
    if (plan.name === 'Enterprise') return;

    const openModal = () => {
      setSelectedPlan(plan);
      setShowModal(true);
    };
    if (typeof queueMicrotask === 'function') {
      queueMicrotask(openModal);
    } else {
      setTimeout(openModal, 0);
    }

    // Limpiar plan_id de la URL (por si aún existe)
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('plan_id');
      window.history.replaceState({}, '', url.pathname + url.search);
    }
  }, [planIdParam]);

  // Permitir abrir el modal siempre
  const handlePlanSelect = (plan: Plan) => {
    if (plan.name === 'Enterprise') return;
    if (isProcessing) return;
    setIsProcessing(true);

    setSelectedPlan(plan);
    setShowModal(true);
    setIsProcessing(false);
  };

  // Manejar cierre del modal
  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedPlan(null);
    setIsProcessing(false);
  };

  const selectedProduct = selectedPlan ? getProductById(selectedPlan.id) : null;
  const allPlans = [...plansPersonas, ...plansEmpresas];

  // Función para sobreescribir el precio COP mostrado de algunos planes
  const getDisplayCopPrice = (plan: Plan) =>
    plan.name === 'Pro' ? 99900 : plan.name === 'Premium' ? 124900 : plan.price;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div
        className="
          mb-12 px-4 py-12
          sm:px-6
          lg:px-8
        "
      >
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2
              className="
                text-4xl font-extrabold text-white
                md:text-5xl
              "
            >
              Elige tu plan <span className="text-primary">perfecto</span>
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Selecciona el plan que mejor se adapte a tus necesidades de
              aprendizaje
            </p>
          </div>

          <div
            className="
              mx-auto grid max-w-6xl gap-6
              md:grid-cols-3
            "
          >
            {allPlans.map((plan) => {
              const isPremium = plan.name === 'Premium';
              const isPro = plan.name === 'Pro';
              const isEnterprise = plan.name === 'Enterprise';
              const isCurrentPlanProcessing =
                isProcessing && selectedPlan?.id === plan.id;
              const isPlanDisabled = isEnterprise || isCurrentPlanProcessing;
              const ctaLabel =
                plan.name === 'Enterprise' ? 'Muy pronto' : 'Comenzar ahora';
              const planDescription =
                plan.description ?? 'Impulsa tu aprendizaje con Artiefy';
              return (
                <div
                  key={plan.id}
                  aria-disabled={isPlanDisabled}
                  className={`
                    relative overflow-hidden rounded-lg border border-border
                    bg-card text-card-foreground shadow-sm transition-all
                    duration-300
                    ${
                      isEnterprise
                        ? 'cursor-not-allowed'
                        : 'hover:-translate-y-2 hover:border-primary/50'
                    }
                    ${
                      isCurrentPlanProcessing
                        ? 'pointer-events-none cursor-not-allowed opacity-60'
                        : ''
                    }
                  `}
                >
                  {isPro && (
                    <div
                      className="
                        absolute top-0 right-0 rounded-bl-lg bg-green-500 px-3
                        py-1 text-xs font-semibold text-white
                      "
                    >
                      15 días gratis
                    </div>
                  )}
                  {isPremium && (
                    <div
                      className="
                        absolute top-0 right-0 rounded-bl-lg bg-primary px-3
                        py-1 text-xs font-semibold text-primary-foreground
                      "
                    >
                      Más popular
                    </div>
                  )}
                  {isEnterprise && (
                    <div
                      className="
                        absolute top-0 right-0 rounded-bl-lg bg-amber-400 px-3
                        py-1 text-xs font-semibold text-black
                      "
                    >
                      Muy pronto
                    </div>
                  )}

                  <div className="flex flex-col space-y-1.5 p-6 pb-2 text-center">
                    <div
                      className="
                        mx-auto mb-4 flex size-14 items-center justify-center
                        rounded-2xl bg-primary text-white
                      "
                    >
                      {createElement(
                        plan.icon as React.ComponentType<{ className: string }>,
                        { className: 'h-6 w-6' }
                      )}
                    </div>
                    <h3 className="font-display text-2xl font-bold text-white">
                      {plan.name}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {planDescription}
                    </p>
                    <div className="mt-4">
                      <span
                        className="
                          font-display text-4xl font-bold text-foreground
                        "
                      >
                        ${getDisplayCopPrice(plan).toLocaleString('es-CO')}
                      </span>
                      <span className="text-muted-foreground">/mes</span>
                    </div>
                  </div>

                  <div className="p-6 pt-6">
                    <ul className="mb-6 space-y-3">
                      {plan.features.map((feature) => (
                        <li
                          key={feature.text}
                          className="flex items-start gap-3"
                        >
                          <div
                            className="
                              mt-0.5 flex size-5 flex-shrink-0 items-center
                              justify-center rounded-full bg-primary/20
                            "
                          >
                            {feature.available ? (
                              <BsCheck2Circle className="size-3 text-primary" />
                            ) : (
                              <FaTimesCircle className="size-3 text-red-500" />
                            )}
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {feature.text}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      onClick={() => handlePlanSelect(plan)}
                      disabled={isPlanDisabled}
                      className="
                        h-10 w-full border border-transparent bg-secondary
                        text-white
                        hover:border-primary/60 hover:bg-secondary/80
                        disabled:cursor-not-allowed disabled:opacity-50
                      "
                    >
                      {isCurrentPlanProcessing ? 'Cargando...' : ctaLabel}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {showModal && selectedPlan && selectedProduct && (
        <div
          className="
            pointer-events-auto fixed inset-0 z-[1000] flex items-center
            justify-center bg-black/60 px-4 py-8
          "
        >
          <div
            className="
              relative grid h-[calc(100vh-64px)] max-h-[780px] w-full max-w-lg
              grid-rows-[auto,minmax(0,1fr)] gap-0 overflow-hidden rounded-2xl
              border border-border/50 bg-card shadow-lg
            "
          >
            <div
              className="
                bg-gradient-to-br from-primary/15 via-primary/5 to-transparent
                px-5 pt-5 pb-4
              "
            >
              <div
                className="
                  flex flex-col space-y-1 text-center
                  sm:text-left
                "
              >
                <h3 className="text-lg font-bold tracking-tight text-foreground">
                  Suscribete a un plan
                </h3>
                <p className="text-xs text-muted-foreground">
                  Selecciona tu plan y completa tus datos para comenzar
                </p>
              </div>
            </div>

            <div
              className="
                plans-payment-modal-scroll min-h-0 space-y-4 overflow-y-auto
                overscroll-contain px-5 pt-6 pb-5
              "
            >
              {isSignedIn ? (
                <div
                  className="
                    flex items-center gap-3 rounded-xl border border-border/40
                    bg-muted/30 p-3
                  "
                >
                  <Image
                    src={user?.imageUrl || '/artiefy-icon.png'}
                    alt={user?.fullName?.trim() || 'Usuario Artiefy'}
                    width={40}
                    height={40}
                    className="
                      size-10 rounded-full object-cover ring-2 ring-primary/30
                    "
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {user?.fullName?.trim() || 'Usuario Artiefy'}
                    </p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {user?.emailAddresses?.[0]?.emailAddress ||
                        'correo@artiefy.com'}
                    </p>
                  </div>
                  <div
                    className="
                      inline-flex items-center gap-1 rounded-full
                      bg-emerald-500/10 px-2 py-1 text-[10px] text-emerald-400
                    "
                  >
                    <BsCheck2Circle className="size-3" />
                    Verificado
                  </div>
                </div>
              ) : null}

              <div className="space-y-2">
                <p
                  className="
                    text-[11px] font-semibold tracking-wider
                    text-muted-foreground uppercase
                  "
                >
                  Plan
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {allPlans.map((plan) => {
                    const isEnterprise = plan.name === 'Enterprise';
                    const isSelected = selectedPlan.id === plan.id;
                    const price =
                      getDisplayCopPrice(plan).toLocaleString('es-CO');
                    const badgeConfig =
                      plan.name === 'Pro'
                        ? {
                            label: '15 dias gratis',
                            className:
                              'bg-emerald-400 text-[#080c16] ring-1 ring-emerald-300/50',
                          }
                        : plan.name === 'Premium'
                          ? {
                              label: 'Popular',
                              className:
                                'bg-primary text-[#080c16] ring-1 ring-primary/40',
                            }
                          : plan.name === 'Enterprise'
                            ? {
                                label: 'Muy pronto',
                                className:
                                  'bg-amber-400 text-black ring-1 ring-amber-300/40',
                              }
                            : null;

                    return (
                      <button
                        key={`modal-${plan.id}`}
                        type="button"
                        disabled={isEnterprise}
                        onClick={() => !isEnterprise && setSelectedPlan(plan)}
                        className={`
                          relative flex flex-col items-center gap-1.5 rounded-xl
                          border p-3 text-center transition-all duration-200
                          active:scale-[0.97]
                          ${
                            isSelected
                              ? `
                                border-primary bg-primary/10 shadow-sm
                                shadow-primary/10
                              `
                              : `
                                border-border/40 bg-muted/20
                                hover:border-border/70
                              `
                          }
                          ${isEnterprise ? 'cursor-not-allowed opacity-50' : ''}
                        `}
                      >
                        {badgeConfig ? (
                          <span
                            className={`
                              absolute -top-1.5 right-1.5 rounded-full px-1.5
                              py-0.5 text-[8px] font-semibold
                              ${badgeConfig.className}
                            `}
                          >
                            {badgeConfig.label}
                          </span>
                        ) : null}

                        <div
                          className={`
                            flex size-8 items-center justify-center rounded-lg
                            ${
                              isSelected
                                ? `
                                  bg-primary text-[#080c16] ring-1
                                  ring-primary/40
                                `
                                : `
                                  bg-muted/50 text-foreground ring-1
                                  ring-border/40
                                `
                            }
                          `}
                        >
                          {createElement(
                            plan.icon as React.ComponentType<{
                              className: string;
                            }>,
                            { className: 'h-4.5 w-4.5' }
                          )}
                        </div>
                        <span
                          className={`
                            text-xs font-semibold
                            ${isSelected ? 'text-foreground' : 'text-muted-foreground'}`}
                        >
                          {plan.name}
                        </span>
                        <span
                          className={`
                            text-[10px]
                            ${isSelected ? 'text-foreground' : 'text-muted-foreground'}`}
                        >
                          ${price}/mes
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div
                className="
                  flex items-center gap-2 rounded-xl border border-primary
                  bg-primary/10 p-2.5
                "
              >
                <BsCheck2Circle className="size-4 text-foreground" />
                <div className="text-left">
                  <p className="text-[11px] font-medium text-foreground">
                    PayU
                  </p>
                  <p className="text-[9px] text-muted-foreground">
                    Tarjeta / PSE
                  </p>
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-border/40">
                <div className="border-b border-border/30 bg-muted/20 px-3 py-2">
                  <p
                    className="
                      text-[11px] font-semibold tracking-wider
                      text-muted-foreground uppercase
                    "
                  >
                    Resumen
                  </p>
                </div>
                <div className="space-y-2 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      Plan {selectedPlan.name}
                    </span>
                    <span className="text-xs font-medium text-foreground">
                      $
                      {getDisplayCopPrice(selectedPlan).toLocaleString('es-CO')}
                      /mes
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedPlan.features
                      .filter((feature) => feature.available)
                      .slice(0, 4)
                      .map((feature) => (
                        <span
                          key={`chip-${selectedPlan.id}-${feature.text}`}
                          className="
                            inline-flex items-center gap-1 rounded-full
                            bg-muted/30 px-2 py-0.5 text-[10px]
                            text-muted-foreground
                          "
                        >
                          <BsCheck2Circle className="size-2.5 text-primary" />
                          {feature.text}
                        </span>
                      ))}
                  </div>
                  <div
                    className="
                      flex items-center justify-between border-t
                      border-border/30 pt-2
                    "
                  >
                    <span className="text-xs font-medium text-foreground">
                      Total mensual
                    </span>
                    <span className="text-lg font-bold text-foreground">
                      $
                      {getDisplayCopPrice(selectedPlan).toLocaleString('es-CO')}
                    </span>
                  </div>
                </div>
              </div>

              <PaymentForm
                selectedProduct={selectedProduct}
                requireAuthOnSubmit={false}
                submitLabel={`Suscribirse por $${getDisplayCopPrice(selectedPlan).toLocaleString('es-CO')}/mes`}
                showTitle={false}
                variant="inline-plan-card"
              />
            </div>

            <div className="pointer-events-none absolute inset-x-0 top-0 h-1" />

            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1" />

            <div className="absolute top-4 right-4">
              <button
                onClick={handleCloseModal}
                className="
                  rounded-sm opacity-70 ring-offset-background
                  transition-opacity
                  hover:opacity-100
                  focus:ring-2 focus:ring-ring focus:ring-offset-2
                  focus:outline-none
                "
                type="button"
              >
                <FaTimes className="size-4" />
              </button>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
};

export default PlansPage;
