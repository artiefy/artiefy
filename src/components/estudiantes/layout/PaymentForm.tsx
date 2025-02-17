'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import '~/styles/form.css';
import { FaLock } from 'react-icons/fa';
import BuyerInfoForm from '~/components/estudiantes/layout/BuyerInfoForm';
import { Button } from '~/components/estudiantes/ui/button';
import { Icons } from '~/components/estudiantes/ui/icons';
import { type FormData, type Product } from '~/types/payu';
import { validateFormData } from '~/utils/validation';

const PaymentForm: React.FC<{ selectedProduct: Product }> = ({
  selectedProduct,
}) => {
  const { user } = useUser();
  const [error, setError] = useState<string | null>(null);
  const [buyerEmail, setBuyerEmail] = useState(user?.emailAddresses[0]?.emailAddress ?? '');
  const [buyerFullName, setBuyerFullName] = useState(user?.fullName ?? '');
  const [telephone, setTelephone] = useState('');
  const [loading, setLoading] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [errors, setErrors] = useState<{
    buyerEmail?: string;
    buyerFullName?: string;
    telephone?: string;
  }>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'buyerEmail') setBuyerEmail(value);
    if (name === 'buyerFullName') setBuyerFullName(value);
    if (name === 'telephone') setTelephone(value);

    if (showErrors) {
      const newErrors = validateFormData(buyerEmail, buyerFullName, telephone);
      setErrors(newErrors);
    }
  };

  useEffect(() => {
    if (showErrors) {
      const newErrors = validateFormData(buyerEmail, buyerFullName, telephone);
      setErrors(newErrors);
    }
  }, [buyerEmail, buyerFullName, telephone, showErrors]);

  const handleSubmit = async (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    event.preventDefault();

    const newErrors = validateFormData(buyerEmail, buyerFullName, telephone);
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setShowErrors(true);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/generatePaymentData', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: selectedProduct.id,
          buyerEmail,
          buyerFullName,
          telephone,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch form data');
      }

      const data: FormData = (await response.json()) as FormData;
      console.log('Form Data:', data);

      const form = document.createElement('form');
      form.method = 'POST';
      form.action =
        'https://checkout.payulatam.com/ppp-web-gateway-payu/';

      for (const key in data) {
        if (data.hasOwnProperty(key)) {
          const hiddenField = document.createElement('input');
          hiddenField.type = 'hidden';
          hiddenField.name = key;
          hiddenField.value = data[key as keyof FormData];
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

  return (
    <form className="form">
      <h3 className="payer-info-title">Datos del pagador</h3>
      <BuyerInfoForm
        formData={{ buyerEmail, buyerFullName, telephone }}
        onChange={handleInputChange}
        showErrors={showErrors}
        errors={errors}
      />
      {error && <p className="error">{error}</p>}
      <div className="security-message">
        <FaLock className="lock-icon" />
        <span>Estás en un formulario de pagos seguro</span>
      </div>
      <Button
        type="button"
        className="checkout-btn"
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <>
            <Icons.spinner
              className="mr-2 text-background"
              style={{ width: '25px', height: '25px' }}
            />
            <span className="font-bold text-background">
              Redirigiendo a PayU...
            </span>
          </>
        ) : (
          'Enviar'
        )}
      </Button>
    </form>
  );
};

export default PaymentForm;
