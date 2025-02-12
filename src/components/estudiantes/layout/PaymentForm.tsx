'use client';

import React from 'react';
import '~/styles/form.css'; // Import form.css
import { Button } from '~/components/estudiantes/ui/button'; // Import Button component

interface PaymentFormProps {
  onSuccess: (message: string) => void;
  isModalOpen: boolean; // Add isModalOpen prop to track modal state
  planId: string;
}

export const PaymentForm: React.FC<PaymentFormProps> = ({ onSuccess }) => {
  const merchantId = '508029';
  const accountId = '512321';
  const description = 'Test PAYU';
  const referenceCode = 'plan_pro'; // Static reference code for testing
  const amount = '100000';
  const tax = '3193';
  const taxReturnBase = '16806';
  const currency = 'COP';
  const signature = 'd04d2ad0e9bec264297f89e9c1acdd9c'; // Static signature for testing
  const test = '1'; // Changed to 1 for testing
  const responseUrl = 'http://www.test.com/response';
  const confirmationUrl = 'http://www.test.com/confirmation';

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSuccess('Redirigiendo a PayU...');
    const form = document.getElementById('payu-form') as HTMLFormElement;
    if (form) {
      form.submit();
    }
  };

  return (
    <form id="payu-form" method="post" action="https://sandbox.checkout.payulatam.com/ppp-web-gateway-payu/" onSubmit={handleSubmit} className="form">
      <input name="merchantId" type="hidden" value={merchantId} />
      <input name="accountId" type="hidden" value={accountId} />
      <input name="description" type="hidden" value={description} />
      <input name="referenceCode" type="hidden" value={referenceCode} />
      <input name="amount" type="hidden" value={amount} />
      <input name="tax" type="hidden" value={tax} />
      <input name="taxReturnBase" type="hidden" value={taxReturnBase} />
      <input name="currency" type="hidden" value={currency} />
      <input name="signature" type="hidden" value={signature} />
      <input name="test" type="hidden" value={test} />
      <input name="responseUrl" type="hidden" value={responseUrl} />
      <input name="confirmationUrl" type="hidden" value={confirmationUrl} />
      <input name="buyerEmail" type="hidden" value="test@test.com" />

      <Button type="submit" className="checkout-btn">
        Enviar
      </Button>
    </form>
  );
};
