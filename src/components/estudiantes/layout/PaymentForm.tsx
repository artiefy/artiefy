'use client';

import { useEffect, useState } from 'react';

import { useUser } from '@clerk/nextjs';

import BuyerInfoForm from '~/components/estudiantes/layout/BuyerInfoForm';
import MiniLoginModal from '~/components/estudiantes/layout/MiniLoginModal';
import MiniSignUpModal from '~/components/estudiantes/layout/MiniSignUpModal';
import { validateFormData } from '~/utils/paygateway/validation';

import type { FormData, Product } from '~/types/payu';

import '~/styles/form.css';

const PaymentForm: React.FC<{
  selectedProduct: Product;
  requireAuthOnSubmit?: boolean;
  redirectUrlOnAuth?: string;
}> = ({
  selectedProduct,
  requireAuthOnSubmit = false,
  redirectUrlOnAuth = '',
}) => {
  const { user } = useUser();
  const [error, setError] = useState<string | null>(null);

  // Estados locales para email y nombre si no hay usuario autenticado
  const [manualEmail, setManualEmail] = useState('');
  const [manualFullName, setManualFullName] = useState('');

  // Estados para los modales de login y signup
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignUpModal, setShowSignUpModal] = useState(false);

  // Si hay usuario, usar sus datos y bloquear campos; si no, usar los manuales y permitir editar
  const isLoggedIn = !!user;
  const buyerEmail = isLoggedIn
    ? (user.emailAddresses[0]?.emailAddress?.trim().toLowerCase() ?? '')
    : manualEmail;
  const buyerFullName = isLoggedIn ? (user.fullName ?? '') : manualFullName;
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

  // Función para validar si el formulario está completo
  const isFormValid = (): boolean => {
    // Validar email
    const emailToValidate = isLoggedIn ? buyerEmail : manualEmail;
    const emailValid =
      !!emailToValidate && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailToValidate);

    // Validar nombre completo
    const nameToValidate = isLoggedIn ? buyerFullName : manualFullName;
    const nameValid = !!nameToValidate && nameToValidate.trim().length > 2;

    // Validar teléfono (debe tener al menos 10 caracteres y comenzar con +)
    const telephoneValid =
      !!telephone && telephone.startsWith('+') && telephone.length >= 10;

    // Validar términos y condiciones
    const termsValid = termsAccepted && privacyAccepted;

    return !!(emailValid && nameValid && telephoneValid && termsValid);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked } = e.target;
    if (name === 'telephone') setTelephone(value);
    if (name === 'termsAndConditions') setTermsAccepted(checked);
    if (name === 'privacyPolicy') setPrivacyAccepted(checked);

    // Permitir editar email y nombre solo si no hay usuario autenticado
    if (!isLoggedIn) {
      if (name === 'buyerEmail') setManualEmail(value);
      if (name === 'buyerFullName') setManualFullName(value);
    }

    if (showErrors) {
      const newErrors = validateFormData(
        telephone,
        termsAccepted,
        privacyAccepted
      );
      setErrors(newErrors);
    }
  };

  useEffect(() => {
    if (showErrors) {
      const newErrors = validateFormData(
        telephone,
        termsAccepted,
        privacyAccepted
      );
      setErrors(newErrors);
    }
  }, [telephone, termsAccepted, privacyAccepted, showErrors]);

  const processPayment = async () => {
    setLoading(true);

    try {
      // Determinar el endpoint correcto
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
          buyerFullName: isLoggedIn ? buyerFullName : manualFullName,
          telephone,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch form data');
      }

      const data: FormData = (await response.json()) as FormData;

      const form = document.createElement('form');
      form.method = 'POST';
      form.action = 'https://checkout.payulatam.com/ppp-web-gateway-payu/';

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
      setError((error as Error).message);
      setLoading(false);
    }
  };

  const handleSubmit = async (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    event.preventDefault();

    // Validar formulario primero
    const newErrors = validateFormData(
      telephone,
      termsAccepted,
      privacyAccepted
    );
    if (
      Object.keys(newErrors).length > 0 ||
      !termsAccepted ||
      !privacyAccepted
    ) {
      setErrors(newErrors);
      setShowErrors(true);
      return;
    }

    // Si requiere autenticación y no hay usuario, mostrar modal de login
    if (requireAuthOnSubmit && !isLoggedIn) {
      // Guardar los datos manuales en sessionStorage para recuperarlos después del login
      sessionStorage.setItem('pendingBuyerEmail', manualEmail);
      sessionStorage.setItem('pendingBuyerFullName', manualFullName);
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
    // NO procesar el pago automáticamente
    // Dejar que el usuario revise y llene el formulario primero
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
    if (isLoggedIn && !manualEmail && !manualFullName) {
      const pendingEmail = sessionStorage.getItem('pendingBuyerEmail');
      const pendingFullName = sessionStorage.getItem('pendingBuyerFullName');
      const pendingTelephone = sessionStorage.getItem('pendingTelephone');
      const pendingTermsAccepted = sessionStorage.getItem(
        'pendingTermsAccepted'
      );
      const pendingPrivacyAccepted = sessionStorage.getItem(
        'pendingPrivacyAccepted'
      );

      if (pendingEmail) setManualEmail(pendingEmail);
      if (pendingFullName) setManualFullName(pendingFullName);
      if (pendingTelephone) setTelephone(pendingTelephone);
      if (pendingTermsAccepted) {
        setTermsAccepted(pendingTermsAccepted === 'true');
      }
      if (pendingPrivacyAccepted) {
        setPrivacyAccepted(pendingPrivacyAccepted === 'true');
      }

      // Limpiar sessionStorage
      sessionStorage.removeItem('pendingBuyerEmail');
      sessionStorage.removeItem('pendingBuyerFullName');
      sessionStorage.removeItem('pendingTelephone');
      sessionStorage.removeItem('pendingTermsAccepted');
      sessionStorage.removeItem('pendingPrivacyAccepted');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);

  return (
    <>
      <form className="form">
        <h3 className="payer-info-title">Datos del pagador</h3>
        <BuyerInfoForm
          formData={{ buyerEmail, buyerFullName, telephone }}
          termsAndConditions={termsAccepted}
          privacyPolicy={privacyAccepted}
          onChangeAction={handleInputChange}
          showErrors={showErrors}
          errors={errors}
          onSubmitAction={handleSubmit}
          loading={loading}
          readOnly={isLoggedIn} // Solo lectura si hay usuario autenticado
          isFormValid={isFormValid()} // Nuevo: validar si el formulario está completo
        />
        {error && <p className="error">{error}</p>}
      </form>

      {/* Mini Login Modal */}
      <MiniLoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLoginSuccess={handleLoginSuccess}
        redirectUrl={redirectUrlOnAuth}
        onSwitchToSignUp={handleSwitchToSignUp}
      />

      {/* Mini SignUp Modal */}
      <MiniSignUpModal
        isOpen={showSignUpModal}
        onClose={() => setShowSignUpModal(false)}
        onSignUpSuccess={handleSignUpSuccess}
        redirectUrl={redirectUrlOnAuth}
        onSwitchToLogin={handleSwitchToLogin}
      />
    </>
  );
};

export default PaymentForm;
