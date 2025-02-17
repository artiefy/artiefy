// src/app/dashboard/super-admin/components/UserManagement.tsx

import React, { useState } from 'react';
import BulkUploadUsers from './BulkUploadUsers';
import DownloadUsers from './DownloadUsers';

const UserManagement: React.FC = () => {
  const [showSuccessMessage, setShowSuccessMessage] = useState<boolean>(false);

  const handleUploadSuccess = () => {
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 3000); // Mensaje de éxito temporal
  };

  const handleDownloadSuccess = () => {
    alert('Los usuarios se han descargado correctamente.');
  };

  return (
    <div className="user-management-container">
      <h1 className="text-2xl font-bold mb-6">Gestión de Usuarios</h1>

      {showSuccessMessage && (
        <p className="text-green-500 mb-4">Usuarios cargados exitosamente.</p>
      )}

      <BulkUploadUsers onSuccess={handleUploadSuccess} />
      <DownloadUsers onDownloadSuccess={handleDownloadSuccess} />
    </div>
  );
};

export default UserManagement;
