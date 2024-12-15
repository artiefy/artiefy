// src/app/unauthorized/page.tsx
import React from 'react';

const UnauthorizedPage = () => {
  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>No estás autorizado para ingresar a esta ruta según tu rol</h1>
      <p>Tu rol no tiene acceso a esta página. Por favor, contacta al administrador si crees que esto es un error.</p>
    </div>
  );
};

export default UnauthorizedPage;
