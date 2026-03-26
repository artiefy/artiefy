'use client';

import { useCallback, useEffect, useState } from 'react';

import { useSignIn, useUser } from '@clerk/nextjs';
import { isClerkAPIResponseError } from '@clerk/nextjs/errors';

import BuyerInfoForm from '~/components/estudiantes/layout/BuyerInfoForm';
import MiniLoginModal from '~/components/estudiantes/layout/MiniLoginModal';
import MiniSignUpModal from '~/components/estudiantes/layout/MiniSignUpModal';
import { validateFormData } from '~/utils/paygateway/validation';

import type { FormData, Product } from '~/types/payu';

import '~/styles/form.css';

type PrepareBuyerAccountResponse = {
  hasExistingAccount: boolean;
  accountCreated?: boolean;
  credentialsEmailSent?: boolean;
  temporaryPassword?: string;
};

const PaymentForm: React.FC<{
  selectedProduct: Product;
  requireAuthOnSubmit?: boolean;
  redirectUrlOnAuth?: string;
  persistOnAuth?: { key: string; value: string };
  isIndividualPurchase?: boolean; // Nuevo: indica si es compra individual sin suscripción
  submitLabel?: string;
  showTitle?: boolean;
  variant?: 'default' | 'inline-course-card' | 'inline-plan-card';
}> = ({
  selectedProduct,
  requireAuthOnSubmit = false,
  redirectUrlOnAuth = '',
  persistOnAuth,
  isIndividualPurchase = false,
  submitLabel = 'Enviar',
  showTitle = true,
  variant = 'default',
}) => {
  const { signIn } = useSignIn();
  const { user } = useUser();
  const [error, setError] = useState<string | null>(null);

  // Estados locales para email y nombre si no hay usuario autenticado
  const [manualEmail, setManualEmail] = useState('');
  const [manualFirstName, setManualFirstName] = useState('');
  const [manualLastName, setManualLastName] = useState('');

  // Estados para los modales de login y signup
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignUpModal, setShowSignUpModal] = useState(false);
  const [autoPayAfterLogin, setAutoPayAfterLogin] = useState(false);
  const [isPreparingBuyerAccount, setIsPreparingBuyerAccount] = useState(false);
  const [isAutoSigningIn, setIsAutoSigningIn] = useState(false);
  const [loginModalInfo, setLoginModalInfo] = useState('');
  const [prePayMessage, setPrePayMessage] = useState<string | null>(null);
  const [isRedirectingToPayU, setIsRedirectingToPayU] = useState(false);

  // Si hay usuario, prefijar datos pero permitir editar para evitar bloqueo cuando faltan datos en el perfil
  const isLoggedIn = !!user;
  const userEmail =
    user?.emailAddresses[0]?.emailAddress?.trim().toLowerCase() ?? '';
  const userFullName = user?.fullName ?? '';
  const [userFirstName = '', ...userLastNameParts] = userFullName
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const userLastName = userLastNameParts.join(' ');

  const buyerEmail = (manualEmail || userEmail).trim().toLowerCase();
  const buyerFirstName = (manualFirstName || userFirstName).trim();
  const buyerLastName = (manualLastName || userLastName).trim();
  const buyerFullName = `${buyerFirstName} ${buyerLastName}`.trim();
  const buyerFullNameForPayment =
    buyerFullName || user?.fullName?.trim() || 'Comprador Artiefy';
  const [telephone, setTelephone] = useState('');
  const [loading, setLoading] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [errors, setErrors] = useState<{
    telephone?: string;
    termsAndConditions?: string;
    privacyPolicy?: string;
  }>({});
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const skipTelephoneValidation = false;

  const getValidationErrors = useCallback(() => {
    const nextErrors = validateFormData(
      telephone,
      termsAccepted,
      privacyAccepted
    );

    if (skipTelephoneValidation) {
      delete nextErrors.telephone;
    }

    return nextErrors;
  }, [telephone, termsAccepted, privacyAccepted, skipTelephoneValidation]);

  // Función para validar si el formulario está completo
  const isFormValid = (): boolean => {
    // Validar email
    const emailToValidate = isLoggedIn ? buyerEmail : manualEmail;
    const emailValid =
      !!emailToValidate && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailToValidate);

    // Validar nombre y apellido
    const firstNameToValidate = isLoggedIn ? buyerFirstName : manualFirstName;
    const lastNameToValidate = isLoggedIn ? buyerLastName : manualLastName;
    const requiresEditableName = !(
      isLoggedIn &&
      (variant === 'inline-course-card' || variant === 'inline-plan-card')
    );
    const nameValid = !requiresEditableName
      ? true
      : !!firstNameToValidate &&
        !!lastNameToValidate &&
        firstNameToValidate.trim().length > 1 &&
        lastNameToValidate.trim().length > 1;

    // Validar teléfono internacional (E.164): + y entre 7 y 15 dígitos
    const telephoneValid =
      skipTelephoneValidation || /^\+\d{7,15}$/.test(telephone);

    // Validar términos y condiciones
    const termsValid = termsAccepted && privacyAccepted;

    return !!(emailValid && nameValid && telephoneValid && termsValid);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked } = e.target;
    if (name === 'telephone') {
      const sanitized =
        value === '+'
          ? '+'
          : value.startsWith('+')
            ? `+${value.replace(/[^\d]/g, '')}`
            : value.replace(/[^\d]/g, '');
      const normalized = sanitized.startsWith('+')
        ? `+${sanitized.replace(/\+/g, '')}`
        : sanitized;
      setTelephone(normalized);
    }
    if (name === 'termsAndConditions') {
      // El formulario usa un único checkbox para aceptar términos y privacidad.
      setTermsAccepted(checked);
      setPrivacyAccepted(checked);
    }
    if (name === 'privacyPolicy') setPrivacyAccepted(checked);

    // Permitir editar email y nombre incluso si hay usuario (para casos sin datos completos en el perfil)
    if (name === 'buyerEmail') setManualEmail(value);
    if (name === 'buyerFirstName') setManualFirstName(value);
    if (name === 'buyerLastName') setManualLastName(value);

    if (showErrors) {
      const newErrors = getValidationErrors();
      setErrors(newErrors);
    }
  };

  useEffect(() => {
    if (showErrors) {
      const newErrors = getValidationErrors();
      setErrors(newErrors);
    }
  }, [showErrors, getValidationErrors]);

  const getAutoLoginErrorMessage = (input: unknown): string => {
    if (isClerkAPIResponseError(input) && input.errors.length > 0) {
      const firstError = input.errors[0];
      return (
        firstError?.longMessage ??
        firstError?.message ??
        'No se pudo iniciar sesion automatica.'
      );
    }

    if (input instanceof Error && input.message.trim().length > 0) {
      return input.message;
    }

    return 'No se pudo iniciar sesion automatica.';
  };

  const signInWithTemporaryPassword = async (
    emailAddress: string,
    temporaryPassword: string
  ) => {
    if (!signIn) {
      throw new Error(
        'No se pudo iniciar sesion automatica. Inicia sesion manualmente para continuar.'
      );
    }

    const { error: signInError } = await signIn.password({
      emailAddress,
      password: temporaryPassword,
    });

    if (signInError) {
      throw signInError;
    }

    if (signIn.status === 'complete') {
      await signIn.finalize();
      return;
    }

    throw new Error(
      'No se pudo completar el inicio de sesion automatico. Inicia sesion manualmente para continuar.'
    );
  };

  const wait = (ms: number) =>
    new Promise<void>((resolve) => {
      window.setTimeout(resolve, ms);
    });

  const processPayment = async () => {
    if (loading) return;

    setLoading(true);
    setError(null);

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 10000);

    try {
      const endpoint = selectedProduct.name.startsWith('Curso:')
        ? '/api/generateCoursePayment'
        : '/api/generatePaymentData';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProduct.id,
          amount: selectedProduct.amount,
          description: selectedProduct.description,
          buyerEmail: isLoggedIn ? buyerEmail : manualEmail,
          buyerFullName: buyerFullNameForPayment,
          telephone,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error('No se pudo generar el pago. Intenta de nuevo.');
      }

      const data: FormData = (await response.json()) as FormData;

      const form = document.createElement('form');
      form.method = 'POST';
      const isLocalhostRuntime =
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1';
      const sandboxCheckoutUrl =
        'https://sandbox.checkout.payulatam.com/ppp-web-gateway-payu/';
      const productionCheckoutUrl =
        'https://checkout.payulatam.com/ppp-web-gateway-payu/';
      form.action = isLocalhostRuntime
        ? sandboxCheckoutUrl
        : (process.env.NEXT_PUBLIC_PAYU_URL ?? productionCheckoutUrl);

      for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
          const hiddenField = document.createElement('input');
          hiddenField.type = 'hidden';
          hiddenField.name = key;
          hiddenField.value = String(data[key as keyof FormData]);
          form.appendChild(hiddenField);
        }
      }

      document.body.appendChild(form);
      form.submit();
    } catch (error) {
      const isAbort = (error as Error).name === 'AbortError';
      setError(
        isAbort
          ? 'La solicitud tardó demasiado, vuelve a intentarlo.'
          : (error as Error).message
      );
      setPrePayMessage(null);
      setIsRedirectingToPayU(false);
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  const handleSubmit = async (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    event.preventDefault();
    setPrePayMessage(null);

    if (loading || isPreparingBuyerAccount || isAutoSigningIn) return;

    // Bloqueo defensivo: nunca continuar si el formulario completo no es válido.
    if (!isFormValid()) {
      const newErrors = getValidationErrors();
      setErrors(newErrors);
      setShowErrors(true);
      return;
    }

    // Validar formulario primero
    const newErrors = getValidationErrors();
    if (
      Object.keys(newErrors).length > 0 ||
      !termsAccepted ||
      !privacyAccepted
    ) {
      setErrors(newErrors);
      setShowErrors(true);
      return;
    }

    // Flujo inteligente para compra individual sin login:
    // - Si ya tiene cuenta en Clerk => abrir mini login y luego pagar automáticamente.
    // - Si no tiene cuenta => crear cuenta + enviar credenciales y continuar a PayU.
    if (!isLoggedIn && isIndividualPurchase) {
      try {
        setIsPreparingBuyerAccount(true);
        setError(null);

        const response = await fetch('/api/checkout/prepareBuyerAccount', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: manualEmail,
            firstName: manualFirstName,
            lastName: manualLastName,
          }),
        });

        if (!response.ok) {
          const payload = (await response.json()) as { error?: string };
          throw new Error(
            payload.error ?? 'No se pudo preparar la cuenta del comprador.'
          );
        }

        const payload = (await response.json()) as PrepareBuyerAccountResponse;

        if (payload.hasExistingAccount) {
          setPrePayMessage(null);
          setLoginModalInfo('');
          setAutoPayAfterLogin(true);
          setShowLoginModal(true);
          return;
        }

        // Cuenta nueva creada: iniciar sesion automaticamente y continuar a PayU.
        const normalizedManualEmail = manualEmail.trim().toLowerCase();
        if (!normalizedManualEmail || !payload.temporaryPassword) {
          setPrePayMessage(null);
          setLoginModalInfo(
            '✅ Creamos tu cuenta en Artiefy. Revisa tu correo y usa la contraseña temporal para ingresar.'
          );
          setAutoPayAfterLogin(true);
          setShowLoginModal(true);
          return;
        }

        try {
          setPrePayMessage(
            `Te enviamos tu contrasena temporal al correo ${normalizedManualEmail}`
          );
          setIsAutoSigningIn(true);
          setIsRedirectingToPayU(true);
          await signInWithTemporaryPassword(
            normalizedManualEmail,
            payload.temporaryPassword
          );
          await wait(1500);
          await processPayment();
          return;
        } catch (autoLoginError) {
          setPrePayMessage(null);
          setIsRedirectingToPayU(false);
          setError(
            `${getAutoLoginErrorMessage(autoLoginError)} Puedes iniciar sesion manualmente para continuar con el pago.`
          );
          setLoginModalInfo(
            '✅ Creamos tu cuenta en Artiefy. Revisa tu correo y usa la contraseña temporal para ingresar.'
          );
          setAutoPayAfterLogin(true);
          setShowLoginModal(true);
          return;
        } finally {
          setIsAutoSigningIn(false);
        }
      } catch (prepareError) {
        setError(
          prepareError instanceof Error
            ? prepareError.message
            : 'No fue posible preparar la cuenta. Intenta nuevamente.'
        );
        return;
      } finally {
        setIsPreparingBuyerAccount(false);
      }
    }

    // Si requiere autenticación y no hay usuario, mostrar modal de login
    // EXCEPTO si es una compra individual de curso (pago único)
    if (requireAuthOnSubmit && !isLoggedIn && !isIndividualPurchase) {
      // Persistencia opcional (p.ej. planes) para reabrir el modal tras login SIN query params.
      // Importante: NO persistir por defecto para no afectar otros flujos (cursos, etc.).
      if (persistOnAuth) {
        sessionStorage.setItem(persistOnAuth.key, persistOnAuth.value);
      }

      // Guardar los datos manuales en sessionStorage para recuperarlos después del login
      sessionStorage.setItem('pendingBuyerEmail', manualEmail);
      sessionStorage.setItem('pendingBuyerFirstName', manualFirstName);
      sessionStorage.setItem('pendingBuyerLastName', manualLastName);
      sessionStorage.setItem('pendingTelephone', telephone);
      sessionStorage.setItem('pendingTermsAccepted', termsAccepted.toString());
      sessionStorage.setItem(
        'pendingPrivacyAccepted',
        privacyAccepted.toString()
      );

      setShowLoginModal(true);
      return;
    }

    // Si está autenticado o no requiere autenticación, procesar el pago
    await processPayment();
  };

  const handleLoginSuccess = () => {
    setShowLoginModal(false);

    if (autoPayAfterLogin) {
      setAutoPayAfterLogin(false);
      setLoginModalInfo('');
      setPrePayMessage(null);
      setIsRedirectingToPayU(true);
      void processPayment();
    }
  };

  const handleSignUpSuccess = () => {
    setShowSignUpModal(false);
    // NO procesar el pago automáticamente
    // Dejar que el usuario revise y llene el formulario primero
  };

  const handleSwitchToSignUp = () => {
    setShowLoginModal(false);
    setShowSignUpModal(true);
  };

  const handleSwitchToLogin = () => {
    setShowSignUpModal(false);
    setShowLoginModal(true);
  };

  // Recuperar datos manuales después del login y limpiar sessionStorage
  useEffect(() => {
    if (isLoggedIn && !manualEmail && !manualFirstName && !manualLastName) {
      const pendingEmail = sessionStorage.getItem('pendingBuyerEmail');
      const pendingFirstName = sessionStorage.getItem('pendingBuyerFirstName');
      const pendingLastName = sessionStorage.getItem('pendingBuyerLastName');
      const pendingTelephone = sessionStorage.getItem('pendingTelephone');
      const pendingTermsAccepted = sessionStorage.getItem(
        'pendingTermsAccepted'
      );
      const pendingPrivacyAccepted = sessionStorage.getItem(
        'pendingPrivacyAccepted'
      );

      if (pendingEmail) setManualEmail(pendingEmail);
      if (pendingFirstName) setManualFirstName(pendingFirstName);
      if (pendingLastName) setManualLastName(pendingLastName);
      if (pendingTelephone) setTelephone(pendingTelephone);
      if (pendingTermsAccepted) {
        const accepted = pendingTermsAccepted === 'true';
        setTermsAccepted(accepted);
        setPrivacyAccepted(accepted);
      } else if (pendingPrivacyAccepted) {
        setPrivacyAccepted(pendingPrivacyAccepted === 'true');
      }

      // Limpiar sessionStorage
      sessionStorage.removeItem('pendingBuyerEmail');
      sessionStorage.removeItem('pendingBuyerFirstName');
      sessionStorage.removeItem('pendingBuyerLastName');
      sessionStorage.removeItem('pendingTelephone');
      sessionStorage.removeItem('pendingTermsAccepted');
      sessionStorage.removeItem('pendingPrivacyAccepted');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);

  return (
    <>
      {/* Overlay de redirección a PayU */}
      {isRedirectingToPayU && (
        <div
          className="
            pointer-events-auto fixed inset-0 z-[1300] flex flex-col
            items-center justify-center gap-4 bg-background/90 backdrop-blur-sm
          "
        >
          <div
            className="
              size-12 animate-spin rounded-full border-4 border-accent/30
              border-t-accent
            "
          />
          {prePayMessage ? (
            <p className="max-w-sm text-center text-sm font-medium text-accent">
              {prePayMessage}
            </p>
          ) : null}
          <p className="text-sm font-medium text-accent">
            Redirigiendo a PayU...
          </p>
        </div>
      )}

      {/* Nota: evitamos <form> aquí para que Enter no dispare navegación al route actual */}
      <div
        className={`
          form
          ${variant !== 'default' ? 'form--course-card' : ''}
        `}
        role="form"
      >
        {showTitle ? (
          <h3 className="payer-info-title">Datos del pagador</h3>
        ) : null}
        <BuyerInfoForm
          formData={{
            buyerEmail,
            buyerFirstName,
            buyerLastName,
            telephone,
          }}
          termsAndConditions={termsAccepted}
          privacyPolicy={privacyAccepted}
          onChangeAction={handleInputChange}
          showErrors={showErrors}
          errors={errors}
          onSubmitAction={handleSubmit}
          loading={loading || isPreparingBuyerAccount || isAutoSigningIn}
          readOnly={isLoggedIn}
          isFormValid={isFormValid()} // Nuevo: validar si el formulario está completo
          submitLabel={submitLabel}
          variant={variant}
        />
        {error && <p className="error">{error}</p>}
      </div>

      {/* Mini Login Modal */}
      <MiniLoginModal
        isOpen={showLoginModal}
        onClose={() => {
          setShowLoginModal(false);
          setAutoPayAfterLogin(false);
          setLoginModalInfo('');
          setPrePayMessage(null);
        }}
        onLoginSuccess={handleLoginSuccess}
        redirectUrl={redirectUrlOnAuth}
        onSwitchToSignUp={handleSwitchToSignUp}
        initialEmail={manualEmail || buyerEmail}
        infoMessage={loginModalInfo}
      />

      {/* Mini SignUp Modal */}
      <MiniSignUpModal
        isOpen={showSignUpModal}
        onClose={() => {
          setShowSignUpModal(false);
        }}
        onSignUpSuccess={handleSignUpSuccess}
        redirectUrl={redirectUrlOnAuth}
        onSwitchToLogin={handleSwitchToLogin}
      />
    </>
  );
};

export default PaymentForm;
