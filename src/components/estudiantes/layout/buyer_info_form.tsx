'use client';

import React, { useState } from 'react';
import { Button } from '~/components/estudiantes/ui/button'; // Import Button component
import '~/styles/form.css'; // Import form.css

interface BuyerInfoFormProps {
  onSubmit: (buyerEmail: string, buyerFullName: string, telephone: string) => void;
}

const BuyerInfoForm: React.FC<BuyerInfoFormProps> = ({ onSubmit }) => {
  const [buyerEmail, setBuyerEmail] = useState('');
  const [buyerFullName, setBuyerFullName] = useState('');
  const [telephone, setTelephone] = useState('');

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSubmit(buyerEmail, buyerFullName, telephone);
  };

  return (
    <form onSubmit={handleSubmit} className="form">
      <div className="label">
        <label htmlFor="buyerEmail" className="title">Correo Electrónico:</label>
        <input
          type="email"
          id="buyerEmail"
          name="buyerEmail"
          className="input-field"
          value={buyerEmail}
          onChange={(e) => setBuyerEmail(e.target.value)}
          required
        />
      </div>
      <div className="label">
        <label htmlFor="buyerFullName" className="title">Nombre Completo:</label>
        <input
          type="text"
          id="buyerFullName"
          name="buyerFullName"
          className="input-field"
          value={buyerFullName}
          onChange={(e) => setBuyerFullName(e.target.value)}
          required
        />
      </div>
      <div className="label">
        <label htmlFor="telephone" className="title">Teléfono:</label>
        <input
          type="tel"
          id="telephone"
          name="telephone"
          className="input-field"
          value={telephone}
          onChange={(e) => setTelephone(e.target.value)}
          required
        />
      </div>
      <Button type="submit" className="checkout-btn">Enviar</Button>
    </form>
  );
};

export default BuyerInfoForm;
