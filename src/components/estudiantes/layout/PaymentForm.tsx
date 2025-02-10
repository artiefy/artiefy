/* eslint-disable */

'use client';

import React, { useState } from 'react';

interface PaymentFormProps {
  onSuccess: (message: string) => void;
  planId: string;
}

export const PaymentForm: React.FC<PaymentFormProps> = ({ onSuccess, planId }) => {
  // Definimos el estado para los campos de la tarjeta
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpYear, setCardExpYear] = useState('');
  const [cardExpMonth, setCardExpMonth] = useState('');
  const [cardCvc, setCardCvc] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Realiza la llamada a la API con los datos de la tarjeta
      const response = await fetch('/api/token-card', {
        method: 'POST',
        body: JSON.stringify({
          cardNumber,
          cardExpYear,
          cardExpMonth,
          cardCvc,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data && data.token) {
        onSuccess('Token generado exitosamente');
      } else {
        onSuccess('Error al generar el token');
      }
    } catch (error) {
      console.error('Error en el pago:', error);
      onSuccess('Error al procesar el pago');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="cardNumber" className="block">Número de tarjeta</label>
        <input
          type="text"
          id="cardNumber"
          value={cardNumber}
          onChange={(e) => setCardNumber(e.target.value)}
          placeholder="1234 5678 9876 5432"
          required
          className="input-field"
        />
      </div>
      <div className="flex space-x-4">
        <div>
          <label htmlFor="cardExpMonth" className="block">Mes de Expiración</label>
          <input
            type="text"
            id="cardExpMonth"
            value={cardExpMonth}
            onChange={(e) => setCardExpMonth(e.target.value)}
            placeholder="MM"
            required
            className="input-field"
          />
        </div>
        <div>
          <label htmlFor="cardExpYear" className="block">Año de Expiración</label>
          <input
            type="text"
            id="cardExpYear"
            value={cardExpYear}
            onChange={(e) => setCardExpYear(e.target.value)}
            placeholder="YY"
            required
            className="input-field"
          />
        </div>
      </div>
      <div>
        <label htmlFor="cardCvc" className="block">CVC</label>
        <input
          type="text"
          id="cardCvc"
          value={cardCvc}
          onChange={(e) => setCardCvc(e.target.value)}
          placeholder="CVC"
          required
          className="input-field"
        />
      </div>

      <button type="submit" className="submit-button">
        Enviar
      </button>
    </form>
  );
};
