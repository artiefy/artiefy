// En tu frontend de Next.js
"use client"
import React, { useState } from 'react';
import axios from 'axios';

const LoginForm = () => {
  const [jwtToken, setJwtToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);

    try {
      // Llamar a la API Route en Next.js para obtener el JWT token
      const response = await axios.post<{ token: string }>('/api/login');
      setJwtToken(response.data.token);
    } catch (err) {
      setError('Error al obtener el JWT Token');
      console.error('Error al hacer la solicitud:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={handleLogin} disabled={loading}>
        {loading ? 'Cargando...' : 'Obtener JWT Token'}
      </button>
      {error && <p>{error}</p>}
      {jwtToken && <p>JWT Token: {jwtToken}</p>}
    </div>
  );
};

export default LoginForm;
