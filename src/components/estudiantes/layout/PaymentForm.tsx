'use client';

import React, { useState } from 'react';
import '~/styles/form.css'; // Import form.css
import { Button } from '~/components/estudiantes/ui/button'; // Import Button component

interface PaymentFormProps {
  onSuccess: (message: string) => void;
  planId: string;
}

interface TokenResponse {
  success: boolean;
  data: {
    id: string;
  };
}

interface CustomerResponse {
  success: boolean;
  data: {
    customerId: string;
  };
}

interface SubscriptionResponse {
  success: boolean;
  data: {
    subscriptionId: string;
  };
}

export const PaymentForm: React.FC<PaymentFormProps> = ({ onSuccess, planId }) => {
  // Definimos el estado para los campos de la tarjeta
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpYear, setCardExpYear] = useState('');
  const [cardExpMonth, setCardExpMonth] = useState('');
  const [cardCvc, setCardCvc] = useState('');

  const [docType] = useState('CC'); // Eliminamos el setDocType ya que no se utiliza
  const [docNumber, setDocNumber] = useState('');
  const [name, setName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [cellPhone, setCellPhone] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Generate token
      const tokenResponse = await fetch('/api/token-card', {
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

      const tokenData: TokenResponse = await tokenResponse.json();

      if (!tokenData.success) {
        setError('Error al generar el token');
        setLoading(false);
        return;
      }

      const tokenCardId = tokenData.data.id;

      // Create customer
      const customerResponse = await fetch('/api/create-customer', {
        method: 'POST',
        body: JSON.stringify({
          docType,
          docNumber,
          name,
          lastName,
          email,
          cellPhone,
          phone,
          address,
          city,
          cardTokenId: tokenCardId,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const customerData: CustomerResponse = await customerResponse.json();

      if (!customerData.success) {
        setError('Error al crear el cliente');
        setLoading(false);
        return;
      }

      const customerId = customerData.data.customerId;

      // Create subscription
      const subscriptionResponse = await fetch('/api/create-subscription', {
        method: 'POST',
        body: JSON.stringify({
          customerId,
          planId,
          tokenCardId,
          docType,
          docNumber,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const subscriptionData: SubscriptionResponse = await subscriptionResponse.json();

      if (!subscriptionData.success) {
        setError('Error al crear la suscripción');
        setLoading(false);
        return;
      }

      onSuccess('Suscripción creada y cobrada exitosamente');
    } catch (error) {
      console.error('Error en el pago:', error);
      setError('Error al procesar el pago');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form">
      <div className="split">
        <div className="label">
          <label htmlFor="name" className="block">
            <span className="title">Nombre</span>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Joe"
              required
              className="input-field"
            />
          </label>
        </div>
        <div className="label">
          <label htmlFor="lastName" className="block">
            <span className="title">Apellido</span>
            <input
              type="text"
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Doe"
              required
              className="input-field"
            />
          </label>
        </div>
      </div>
      <div className="split">
        <div className="label">
          <label htmlFor="email" className="block">
            <span className="title">Email</span>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="joe@payco.co"
              required
              className="input-field"
            />
          </label>
        </div>
        <div className="label">
          <label htmlFor="cellPhone" className="block">
            <span className="title">Celular</span>
            <input
              type="text"
              id="cellPhone"
              value={cellPhone}
              onChange={(e) => setCellPhone(e.target.value)}
              placeholder="3010000001"
              required
              className="input-field"
            />
          </label>
        </div>
      </div>
      <div className="split">
        <div className="label">
          <label htmlFor="phone" className="block">
            <span className="title">Teléfono</span>
            <input
              type="text"
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="1234567"
              required
              className="input-field"
            />
          </label>
        </div>
        <div className="label">
          <label htmlFor="address" className="block">
            <span className="title">Dirección</span>
            <input
              type="text"
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Cr 4 # 55 36"
              required
              className="input-field"
            />
          </label>
        </div>
      </div>
      <div className="split">
        <div className="label">
          <label htmlFor="city" className="block">
            <span className="title">Ciudad</span>
            <input
              type="text"
              id="city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Bogotá"
              required
              className="input-field"
            />
          </label>
        </div>
        <div className="label">
          <label htmlFor="docNumber" className="block">
            <span className="title">Número de documento</span>
            <input
              type="text"
              id="docNumber"
              value={docNumber}
              onChange={(e) => setDocNumber(e.target.value)}
              placeholder="123456789"
              required
              className="input-field"
            />
          </label>
        </div>
      </div>
      <div className="label">
        <label htmlFor="cardNumber" className="block">
          <span className="title">Número de tarjeta</span>
          <input
            type="text"
            id="cardNumber"
            value={cardNumber}
            onChange={(e) => setCardNumber(e.target.value)}
            placeholder="1234 5678 9876 5432"
            required
            className="input-field"
          />
        </label>
      </div>
      <div className="split">
        <div className="label">
          <label htmlFor="cardExpMonth" className="block">
            <span className="title">Mes de Expiración</span>
            <input
              type="text"
              id="cardExpMonth"
              value={cardExpMonth}
              onChange={(e) => setCardExpMonth(e.target.value)}
              placeholder="MM"
              required
              className="input-field"
            />
          </label>
        </div>
        <div className="label">
          <label htmlFor="cardExpYear" className="block">
            <span className="title">Año de Expiración</span>
            <input
              type="text"
              id="cardExpYear"
              value={cardExpYear}
              onChange={(e) => setCardExpYear(e.target.value)}
              placeholder="YYYY"
              required
              className="input-field"
            />
          </label>
        </div>
      </div>
      <div className="label">
        <label htmlFor="cardCvc" className="block">
          <span className="title">CVC</span>
          <input
            type="text"
            id="cardCvc"
            value={cardCvc}
            onChange={(e) => setCardCvc(e.target.value)}
            placeholder="CVC"
            required
            className="input-field"
          />
        </label>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <Button type="submit" disabled={loading} className="checkout-btn">
        {loading ? 'Procesando...' : 'Pagar'}
      </Button>
    </form>
  );
};
