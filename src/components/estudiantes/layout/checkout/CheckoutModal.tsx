'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { useSignIn, useUser } from '@clerk/nextjs';
import { isClerkAPIResponseError } from '@clerk/nextjs/errors';

import MiniLoginModal from '~/components/estudiantes/layout/MiniLoginModal';
import { Dialog, DialogContent } from '~/components/estudiantes/ui/dialog';
import { toPayUExpirationDate } from '~/utils/paygateway/cardFormat';
import { products } from '~/utils/paygateway/products';
import { redirectToWebCheckout } from '~/utils/paygateway/webcheckoutRedirect';

import { CardStep } from './CardStep';
import { CheckoutStepper } from './CheckoutStepper';
import { DetailsStep } from './DetailsStep';
import { ProductStep } from './ProductStep';
import { ResultStep } from './ResultStep';

import type {
  CheckoutBuyer,
  CheckoutCardInput,
  CheckoutItem,
  CheckoutPaymentMethod,
  CheckoutPurchaseKind,
  CheckoutStep,
  TokenizedPaymentResult,
} from '~/types/checkout';

/**
 * Four-step checkout.
 *
 * Step 1 picks a subscription or the single course. Step 2 collects the buyer
 * and, when they are not signed in yet, provisions their Artiefy account
 * before any money moves. What happens after that depends on the method:
 *
 *  - Card: steps 3 and 4 stay here. The card is tokenized through PayU's API
 *    and the result is shown in place.
 *  - PSE: PayU's WebCheckout owns steps 3 and 4, so the buyer leaves the modal
 *    at the end of step 2 and comes back on the thank-you page.
 */

/** Only the individual plans are sold here; Enterprise is a sales conversation. */
const SELECTABLE_PLAN_IDS = [1, 2];

const PLAN_TAGLINES: Record<number, string> = {
  1: 'Cursos ilimitados y 15 proyectos',
  2: 'Todo el catálogo, proyectos ilimitados',
};

const EMPTY_CARD: CheckoutCardInput = {
  number: '',
  holderName: '',
  expiry: '',
  securityCode: '',
  documentNumber: '',
  installments: 1,
};

type PrepareBuyerAccountResponse = {
  hasExistingAccount: boolean;
  accountCreated?: boolean;
  credentialsEmailSent?: boolean;
  temporaryPassword?: string;
};

export interface CheckoutModalCourse {
  id: number;
  title: string;
  /** Instructor and category, shown under the title. */
  subtitle: string;
  imageUrl?: string | null;
  individualPrice: number | null;
  /** True when this course can be bought on its own (course type 4). */
  isPurchasableIndividually: boolean;
}

interface CheckoutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course: CheckoutModalCourse;
  /** Runs after an approved card payment, so the page can refresh access. */
  onApproved?: () => void;
}

function splitFullName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] ?? '',
    secondName: parts.length > 2 ? (parts[1] ?? '') : '',
    firstLastName: parts.length > 2 ? (parts[2] ?? '') : (parts[1] ?? ''),
    secondLastName: parts.slice(3).join(' '),
  };
}

export default function CheckoutModal({
  open,
  onOpenChange,
  course,
  onApproved,
}: CheckoutModalProps) {
  const { user, isSignedIn } = useUser();
  const { signIn } = useSignIn();

  const unitItem = useMemo<CheckoutItem | null>(() => {
    const amount = course.individualPrice ?? 0;
    if (!course.isPurchasableIndividually || amount <= 0) return null;

    return {
      id: course.id,
      title: course.title,
      subtitle: course.subtitle,
      amount,
      imageUrl: course.imageUrl,
    };
  }, [course]);

  // Priced from the same table the payment route charges from, so the modal can
  // never quote a number the server will not honor.
  const plans = useMemo<CheckoutItem[]>(
    () =>
      products
        .filter((product) => SELECTABLE_PLAN_IDS.includes(product.id))
        .map((product) => ({
          id: product.id,
          title: `Plan ${product.name.split('_').pop() ?? product.name}`,
          subtitle: PLAN_TAGLINES[product.id] ?? product.description,
          amount: Number(product.amount),
        })),
    []
  );

  const [step, setStep] = useState<CheckoutStep>(1);
  const [purchaseKind, setPurchaseKind] = useState<CheckoutPurchaseKind>(
    unitItem ? 'unit' : 'subscription'
  );
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(
    plans[0]?.id ?? null
  );
  const [paymentMethod, setPaymentMethod] =
    useState<CheckoutPaymentMethod>('card');
  const [buyer, setBuyer] = useState<CheckoutBuyer>({
    firstName: '',
    secondName: '',
    firstLastName: '',
    secondLastName: '',
    email: '',
    dialCode: '+57',
    phone: '',
  });
  const [card, setCard] = useState<CheckoutCardInput>(EMPTY_CARD);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(
    null
  );
  const [result, setResult] = useState<TokenizedPaymentResult | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Course type 4 sells on its own, so it opens on "Compra unitaria"; anything
  // else can only be unlocked with a plan.
  useEffect(() => {
    if (!open) return;
    setPurchaseKind(unitItem ? 'unit' : 'subscription');
  }, [open, unitItem]);

  // Prefill from the Clerk profile once the buyer is known, without wiping
  // anything they already typed by hand.
  useEffect(() => {
    if (!isSignedIn || !user) return;

    const email = user.emailAddresses[0]?.emailAddress?.trim().toLowerCase();
    const names = splitFullName(user.fullName ?? '');

    setBuyer((current) => ({
      ...current,
      email: current.email || (email ?? ''),
      firstName: current.firstName || names.firstName,
      secondName: current.secondName || names.secondName,
      firstLastName: current.firstLastName || names.firstLastName,
      secondLastName: current.secondLastName || names.secondLastName,
    }));
  }, [isSignedIn, user]);

  const selectedItem = useMemo<CheckoutItem | null>(() => {
    if (purchaseKind === 'unit') return unitItem;
    return plans.find((plan) => plan.id === selectedPlanId) ?? null;
  }, [purchaseKind, unitItem, plans, selectedPlanId]);

  const buyerFullName = [
    buyer.firstName,
    buyer.secondName,
    buyer.firstLastName,
    buyer.secondLastName,
  ]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(' ');

  const telephone = `${buyer.dialCode}${buyer.phone.replace(/\D/g, '')}`;

  const resetState = useCallback(() => {
    setStep(1);
    setCard(EMPTY_CARD);
    setError(null);
    setResult(null);
    setLoading(false);
  }, []);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) resetState();
    onOpenChange(nextOpen);
  };

  /** Sends the buyer to PayU's hosted form. Nothing after this runs. */
  const goToWebCheckout = useCallback(async () => {
    if (!selectedItem) return;

    await redirectToWebCheckout({
      paymentType: purchaseKind === 'unit' ? 'course' : 'plan',
      productId: selectedItem.id,
      amount: selectedItem.amount.toFixed(2),
      description: selectedItem.title,
      buyerEmail: buyer.email.trim().toLowerCase(),
      buyerFullName: buyerFullName || 'Comprador Artiefy',
      telephone,
    });
  }, [selectedItem, purchaseKind, buyer.email, buyerFullName, telephone]);

  /** Card path stays in the modal; PSE hands off to PayU right away. */
  const continueToPayment = useCallback(async () => {
    if (paymentMethod === 'pse') {
      await goToWebCheckout();
      return;
    }

    setStep(3);
  }, [paymentMethod, goToWebCheckout]);

  const signInWithTemporaryPassword = async (
    emailAddress: string,
    password: string
  ) => {
    if (!signIn) {
      throw new Error('No se pudo iniciar sesión automáticamente.');
    }

    const { error: signInError } = await signIn.password({
      emailAddress,
      password,
    });

    if (signInError) throw signInError;

    if (signIn.status === 'complete') {
      await signIn.finalize();
      return;
    }

    throw new Error('No se pudo completar el inicio de sesión automático.');
  };

  const handleDetailsSubmit = async () => {
    if (loading) return;

    setError(null);

    // Signed-in buyers already have an account; go straight to payment.
    if (isSignedIn) {
      setLoading(true);
      try {
        await continueToPayment();
      } catch (paymentError) {
        setError(
          paymentError instanceof Error
            ? paymentError.message
            : 'No se pudo continuar al pago.'
        );
      } finally {
        setLoading(false);
      }
      return;
    }

    setLoading(true);

    try {
      const normalizedEmail = buyer.email.trim().toLowerCase();

      const response = await fetch('/api/checkout/prepareBuyerAccount', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: normalizedEmail,
          firstName: buyer.firstName.trim(),
          lastName: buyer.firstLastName.trim(),
        }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(
          payload.error ?? 'No se pudo preparar la cuenta del comprador.'
        );
      }

      const payload = (await response.json()) as PrepareBuyerAccountResponse;

      // Already registered: the buyer signs in, then the flow resumes.
      if (payload.hasExistingAccount) {
        setShowLoginModal(true);
        return;
      }

      if (!payload.temporaryPassword) {
        throw new Error(
          'Creamos tu cuenta pero no pudimos iniciar sesión. Revisa tu correo e ingresa manualmente.'
        );
      }

      // Kept in memory only so step 4 can offer an immediate password change.
      setTemporaryPassword(payload.temporaryPassword);
      await signInWithTemporaryPassword(
        normalizedEmail,
        payload.temporaryPassword
      );
      await continueToPayment();
    } catch (prepareError) {
      const message = isClerkAPIResponseError(prepareError)
        ? (prepareError.errors[0]?.longMessage ??
          prepareError.errors[0]?.message ??
          'No se pudo preparar la cuenta.')
        : prepareError instanceof Error
          ? prepareError.message
          : 'No se pudo preparar la cuenta.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleCardSubmit = async () => {
    if (loading || !selectedItem) return;

    const expirationDate = toPayUExpirationDate(card.expiry);
    if (!expirationDate) {
      setError('La fecha de vencimiento no es válida.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/checkout/tokenizePayment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purchaseKind,
          productId: selectedItem.id,
          buyerEmail: buyer.email.trim().toLowerCase(),
          buyerFullName: buyerFullName || 'Comprador Artiefy',
          buyerPhone: telephone,
          card: {
            number: card.number,
            holderName: card.holderName.trim(),
            expirationDate,
            securityCode: card.securityCode,
            documentNumber: card.documentNumber,
            installments: card.installments,
          },
        }),
      });

      const payload = (await response.json()) as TokenizedPaymentResult;

      // The card fields are dropped as soon as the charge is attempted; a retry
      // re-enters them rather than keeping them alive in component state.
      setCard(EMPTY_CARD);
      setResult(payload);
      setStep(4);

      if (payload.state === 'APPROVED') onApproved?.();
    } catch {
      setError('No pudimos contactar la pasarela de pago. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSuccess = () => {
    setShowLoginModal(false);
    setLoading(true);

    void continueToPayment()
      .catch((paymentError: unknown) => {
        setError(
          paymentError instanceof Error
            ? paymentError.message
            : 'No se pudo continuar al pago.'
        );
      })
      .finally(() => setLoading(false));
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="flex max-h-[92vh] flex-col gap-0 overflow-hidden rounded-2xl border-border/50 bg-card p-0 transition-all duration-300 sm:max-w-[480px]">
          <CheckoutStepper current={step} />

          <div className="overflow-y-auto px-5 pt-4 pb-6">
            {step === 1 ? (
              <ProductStep
                purchaseKind={purchaseKind}
                onSelectKind={setPurchaseKind}
                unitItem={unitItem}
                plans={plans}
                selectedPlanId={selectedPlanId}
                onSelectPlan={setSelectedPlanId}
                onContinue={() => setStep(2)}
              />
            ) : null}

            {step === 2 ? (
              <DetailsStep
                buyer={buyer}
                onChangeBuyer={(patch) =>
                  setBuyer((current) => ({ ...current, ...patch }))
                }
                paymentMethod={paymentMethod}
                onChangePaymentMethod={setPaymentMethod}
                termsAccepted={termsAccepted}
                onChangeTerms={setTermsAccepted}
                emailLocked={Boolean(isSignedIn)}
                loading={loading}
                error={error}
                onBack={() => setStep(1)}
                onSubmit={() => void handleDetailsSubmit()}
              />
            ) : null}

            {step === 3 ? (
              <CardStep
                card={card}
                onChangeCard={(patch) =>
                  setCard((current) => ({ ...current, ...patch }))
                }
                amount={selectedItem?.amount ?? 0}
                loading={loading}
                error={error}
                onBack={() => setStep(2)}
                onSubmit={() => void handleCardSubmit()}
              />
            ) : null}

            {step === 4 && result ? (
              <ResultStep
                result={result}
                temporaryPassword={temporaryPassword}
                buyerEmail={buyer.email.trim().toLowerCase()}
                onRetry={() => {
                  setResult(null);
                  setError(null);
                  setStep(3);
                }}
                onFinish={() => handleOpenChange(false)}
              />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      <MiniLoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLoginSuccess={handleLoginSuccess}
        initialEmail={buyer.email}
        infoMessage="Ya tienes una cuenta en Artiefy. Ingresa para continuar con tu compra."
      />
    </>
  );
}
