'use client';

import React, { useState } from 'react';
import '~/styles/form.css';
import BuyerInfoForm from '~/components/estudiantes/layout/BuyerInfoForm';
import { Button } from '~/components/estudiantes/ui/button';
import { Icons } from '~/components/estudiantes/ui/icons';
import { type FormData, type Product } from '~/types/payu';

const PaymentForm: React.FC<{ selectedProduct: Product }> = ({ selectedProduct }) => {
  const [error, setError] = useState<string | null>(null);
  const [buyerEmail, setBuyerEmail] = useState('');
  const [buyerFullName, setBuyerFullName] = useState('');
  const [telephone, setTelephone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'buyerEmail') setBuyerEmail(value);
    if (name === 'buyerFullName') setBuyerFullName(value);
    if (name === 'telephone') setTelephone(value);
  };

  const handleSubmit = async (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    event.preventDefault();

    if (!buyerEmail || !buyerFullName || !telephone) {
      setError('Please fill in all fields.');
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

      const data: FormData = await response.json() as FormData;
      console.log('Form Data:', data);

      const form = document.createElement('form');
      form.method = 'POST';
      form.action = 'https://sandbox.checkout.payulatam.com/ppp-web-gateway-payu/';

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
      <BuyerInfoForm formData={{ buyerEmail, buyerFullName, telephone }} onChange={handleInputChange} />
      {error && <p className="error">{error}</p>}
      <Button type="button" className="checkout-btn" onClick={handleSubmit} disabled={loading}>
        {loading ? (
          <>
            <Icons.spinner className="mr-2 text-background" style={{width:'25px', height:'25px'}} /> 
            <span className="font-bold text-background">Redirigiendo a PayU...</span>
          </>
        ) : (
          'Enviar'
        )}
      </Button>
    </form>
  );
};

export default PaymentForm;
