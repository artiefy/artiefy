'use client';
import React, { useState } from 'react';

import { FiDownload, FiUpload, FiX } from 'react-icons/fi';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  status: string;
  selected?: boolean;
  isNew?: boolean;
}

const BulkUploadUsers = ({
  onUsersUploaded,
}: {
  onUsersUploaded: (newUsers: User[]) => void;
}) => {
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Manejar la selección de archivo
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files ? e.target.files[0] : null;
    setFile(selectedFile);
  };

  const showNotification = (message: string, type: 'success' | 'error') => {
    // Implement your notification logic here
    alert(`${type.toUpperCase()}: ${message}`);
  };

  const handleUpload = async () => {
    if (!file) {
      showNotification('Por favor selecciona un archivo primero.', 'error');
      return;
    }
    setUploading(true); // ✅ Indicar que la carga ha comenzado

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/usersMasive', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Error al subir los usuarios');

      // 📌 Asegurar que la respuesta es JSON
      const contentType = res.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        throw new Error('Respuesta inesperada del servidor, no es JSON.');
      }

      // ✅ Recibir JSON con usuarios creados
      const { users: newUsers }: { users: User[] } = (await res.json()) as {
        users: User[];
      };

      // ✅ Enviar los usuarios creados al Dashboard
      onUsersUploaded(newUsers);

      // ✅ Cerrar el modal después de la carga
      setModalIsOpen(false);
    } catch (error) {
      showNotification(
        error instanceof Error ? error.message : 'Error desconocido',
        'error'
      );
    } finally {
      setUploading(false);
    }
  };

  // Descargar plantilla de usuarios
  const handleDownloadTemplate = async () => {
    try {
      const res = await fetch('/api/usersMasive/', {
        method: 'GET',
      });

      if (!res.ok) {
        throw new Error('Error al descargar la plantilla');
      }

      const data = await res.blob();
      const url = window.URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'plantilla_usuarios.xlsx';
      link.click();
    } catch {
      alert('Error al descargar la plantilla');
    }
  };

  return (
    <div>
      {/* Botón para abrir el modal */}
      <button
        onClick={() => setModalIsOpen(true)}
        className="bg-primary flex items-center gap-2 rounded-md px-6 py-2 text-white transition hover:scale-105"
      >
        <FiUpload /> Usuarios Masivos
      </button>

      {/* Modal */}
      {modalIsOpen && (
        <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center backdrop-blur-lg transition-all duration-300">
          <div className="w-96 transform rounded-lg bg-white p-6 shadow-xl transition-transform duration-300">
            {/* Header del Modal */}
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-[#01142B]">
                Subir Usuarios Masivos
              </h2>
              <button onClick={() => setModalIsOpen(false)}>
                <FiX size={24} className="text-gray-500 hover:text-gray-800" />
              </button>
            </div>

            {/* Cuerpo del Modal */}
            <div className="mt-4">
              {/* Input para seleccionar archivo */}
              <input
                type="file"
                accept=".xlsx"
                onChange={handleFileChange}
                className="mb-4 w-full rounded-md border border-gray-300 bg-gray-100 p-3"
              />
              {/* Botón para subir archivo */}
              <button
                onClick={handleUpload}
                className="mb-4 w-full rounded-md bg-[#00BDD8] px-6 py-2 text-[#01142B] transition hover:scale-105 hover:bg-[#00A5C0]"
                disabled={uploading}
              >
                {uploading ? 'Subiendo...' : 'Subir Archivo'}
              </button>

              {/* Botón para descargar plantilla */}
              <button
                onClick={handleDownloadTemplate}
                className="w-full rounded-md bg-[#3AF4EF] px-6 py-2 text-[#01142B] transition hover:scale-105 hover:bg-[#00A5C0]"
              >
                <FiDownload className="mr-2" /> Descargar Plantilla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkUploadUsers;
