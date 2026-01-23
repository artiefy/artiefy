'use client';

import { createElement, useEffect, useRef, useState } from 'react';

import { usePathname, useSearchParams } from 'next/navigation';

import { useAuth } from '@clerk/nextjs';
import { BsCheck2Circle } from 'react-icons/bs';
import { FaTimes, FaTimesCircle } from 'react-icons/fa';

import Footer from '~/components/estudiantes/layout/Footer';
import { Header } from '~/components/estudiantes/layout/Header';
import MiniLoginModal from '~/components/estudiantes/layout/MiniLoginModal';
import MiniSignUpModal from '~/components/estudiantes/layout/MiniSignUpModal';
import PaymentForm from '~/components/estudiantes/layout/PaymentForm';
import { Button } from '~/components/estudiantes/ui/button';
import { type Plan, plansEmpresas, plansPersonas } from '~/types/plans';
import { getProductById } from '~/utils/paygateway/products';

import '~/styles/buttonPlanes.css';

const PlansPage: React.FC = () => {
  const { isSignedIn } = useAuth();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const hasProcessedUrlRef = useRef(false);
  const initialSearchParamsRef = useRef<URLSearchParams | null>(null);
  const PENDING_PLAN_KEY = 'pendingPlanPurchaseId';
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignUpModal, setShowSignUpModal] = useState(false);
  const [authDismissed, setAuthDismissed] = useState(false);

  const planIdParam = searchParams?.get('plan_id') ?? null;

  // Detectar plan_id en la URL y abrir modal si corresponde (solo una vez)
  useEffect(() => {
    // Guardar searchParams inicial solo una vez
    if (!initialSearchParamsRef.current) {
      initialSearchParamsRef.current = searchParams;
    }

    // 1) Intentar recuperar el plan pendiente guardado (login sin query params)
    const pendingPlanId =
      typeof window !== 'undefined'
        ? window.sessionStorage.getItem(PENDING_PLAN_KEY)
        : null;

    // 2) Si no hay pending, usar el plan_id del query actual
    const effectivePlanId = pendingPlanId ?? planIdParam;
    if (!effectivePlanId) return;

    const allPlans = [...plansPersonas, ...plansEmpresas];
    const plan = allPlans.find((p) => String(p.id) === String(effectivePlanId));
    if (!plan) return;

    // Si NO está logueado: primero mostrar login/signup y limpiar la URL.
    // Guardamos el plan pendiente para que, al autenticarse, se abra el modal de pago automáticamente.
    if (!isSignedIn) {
      if (typeof window !== 'undefined') {
        if (!pendingPlanId) {
          window.sessionStorage.setItem(PENDING_PLAN_KEY, String(plan.id));
        }

        // Limpiar plan_id de la URL inmediatamente (no queremos mostrarlo ni depender de él)
        if (planIdParam) {
          const url = new URL(window.location.href);
          url.searchParams.delete('plan_id');
          window.history.replaceState({}, '', url.pathname + url.search);
        }
      }

      // Abrir el modal de login si no está abierto
      if (!authDismissed && !showLoginModal && !showSignUpModal) {
        const openAuth = () => setShowLoginModal(true);
        if (typeof queueMicrotask === 'function') {
          queueMicrotask(openAuth);
        } else {
          setTimeout(openAuth, 0);
        }
      }
      return;
    }

    // Si está logueado: abrir el modal de pago una sola vez desde pending/query
    if (hasProcessedUrlRef.current) return;
    hasProcessedUrlRef.current = true;

    const openModal = () => {
      setSelectedPlan(plan);
      setShowModal(true);
    };
    if (typeof queueMicrotask === 'function') {
      queueMicrotask(openModal);
    } else {
      setTimeout(openModal, 0);
    }

    // Consumir el pendingPlanId (si existía)
    if (typeof window !== 'undefined' && pendingPlanId) {
      window.sessionStorage.removeItem(PENDING_PLAN_KEY);
    }

    // Limpiar plan_id de la URL (por si aún existe)
    if (typeof window !== 'undefined' && planIdParam) {
      const url = new URL(window.location.href);
      url.searchParams.delete('plan_id');
      window.history.replaceState({}, '', url.pathname + url.search);
    }
  }, [
    isSignedIn,
    planIdParam,
    showLoginModal,
    showSignUpModal,
    authDismissed,
    searchParams,
  ]);

  // Permitir abrir el modal siempre
  const handlePlanSelect = (plan: Plan) => {
    if (plan.name === 'Enterprise') return;
    if (isProcessing) return;
    setIsProcessing(true);
    // Si no está logueado, primero autenticación; luego se abrirá el modal de pago automáticamente.
    if (!isSignedIn && typeof window !== 'undefined') {
      window.sessionStorage.setItem(PENDING_PLAN_KEY, String(plan.id));
      setAuthDismissed(false);
      setShowLoginModal(true);
      setIsProcessing(false);
      return;
    }

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

  const handleLoginSuccess = () => {
    setShowLoginModal(false);
    // No abrir manualmente aquí: el useEffect lo hace al detectar isSignedIn + pendingPlanPurchaseId
  };

  const handleSignUpSuccess = () => {
    setShowSignUpModal(false);
    // No abrir manualmente aquí: el useEffect lo hace al detectar isSignedIn + pendingPlanPurchaseId
  };

  const handleAuthClose = () => {
    setShowLoginModal(false);
    setShowSignUpModal(false);
    setAuthDismissed(true);
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem(PENDING_PLAN_KEY);
    }
  };

  const handleSwitchToSignUp = () => {
    setShowLoginModal(false);
    setShowSignUpModal(true);
  };

  const handleSwitchToLogin = () => {
    setShowSignUpModal(false);
    setShowLoginModal(true);
  };

  const selectedProduct = selectedPlan ? getProductById(selectedPlan.id) : null;
  const allPlans = [...plansPersonas, ...plansEmpresas];

  // Función para sobreescribir el precio COP mostrado de algunos planes
  const getDisplayCopPrice = (plan: Plan) =>
    plan.name === 'Pro' ? 99900 : plan.name === 'Premium' ? 124900 : plan.price;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="mb-12 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="text-4xl font-extrabold text-white md:text-5xl">
              Elige tu plan <span className="text-primary">perfecto</span>
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Selecciona el plan que mejor se adapte a tus necesidades de
              aprendizaje
            </p>
          </div>

          <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-3">
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
                  className={`group relative overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-sm transition-all duration-300 ${
                    isPlanDisabled
                      ? 'cursor-not-allowed opacity-60 grayscale'
                      : 'hover:-translate-y-2 hover:border-primary/50'
                  }`}
                >
                  {isPro && (
                    <div className="absolute top-0 right-0 rounded-bl-lg bg-green-500 px-3 py-1 text-xs font-semibold text-white">
                      15 días gratis
                    </div>
                  )}
                  {isPremium && (
                    <div className="absolute top-0 right-0 rounded-bl-lg bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                      Más popular
                    </div>
                  )}
                  {isEnterprise && (
                    <div className="absolute top-0 right-0 rounded-bl-lg bg-amber-400 px-3 py-1 text-xs font-semibold text-black">
                      Muy pronto
                    </div>
                  )}

                  {isEnterprise && (
                    <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white/80 bg-black/30" />
                    </div>
                  )}

                  <div className="flex flex-col space-y-1.5 p-6 pb-2 text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-white">
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
                      <span className="font-display text-4xl font-bold text-foreground">
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
                          <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary/20">
                            {feature.available ? (
                              <BsCheck2Circle className="h-3 w-3 text-primary" />
                            ) : (
                              <FaTimesCircle className="h-3 w-3 text-red-500" />
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
                      className="h-10 w-full border border-transparent bg-secondary text-white hover:border-primary/60 hover:bg-secondary/80 disabled:cursor-not-allowed disabled:opacity-50"
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
        <div className="pointer-events-auto fixed inset-0 z-[1000] flex items-center justify-center bg-black/50">
          <div className="relative w-full max-w-lg rounded-lg bg-white p-4">
            <div className="relative mb-4 flex items-center justify-between">
              <h3 className="w-full text-center text-xl font-semibold text-gray-900">
                Llena este formulario
                <br />
                <span className="font-bold">Plan {selectedPlan.name}</span>
              </h3>
              <button
                onClick={handleCloseModal}
                className="absolute top-0 right-0 z-[1010] mt-2 mr-2 text-gray-500 hover:text-gray-700"
                type="button"
              >
                <FaTimes className="h-6 w-6" />
              </button>
            </div>
            <div>
              <PaymentForm
                selectedProduct={selectedProduct}
                requireAuthOnSubmit={!isSignedIn}
                // Redirigir de vuelta a /planes SIN query params.
                // El plan se reabre con sessionStorage(pendingPlanPurchaseId).
                redirectUrlOnAuth={pathname}
                persistOnAuth={{
                  key: PENDING_PLAN_KEY,
                  value: String(selectedPlan.id),
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Auth primero (planes) */}
      <MiniLoginModal
        isOpen={showLoginModal}
        onClose={handleAuthClose}
        onLoginSuccess={handleLoginSuccess}
        redirectUrl={pathname}
        onSwitchToSignUp={handleSwitchToSignUp}
      />

      <MiniSignUpModal
        isOpen={showSignUpModal}
        onClose={handleAuthClose}
        onSignUpSuccess={handleSignUpSuccess}
        redirectUrl={pathname}
        onSwitchToLogin={handleSwitchToLogin}
      />
      <Footer />
    </div>
  );
};

export default PlansPage;
