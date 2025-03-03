'use client';

import React from 'react';

interface ModalErrorProps {
  isOpen: boolean;
  onClose: () => void;
  onCloseAction: () => void;
  message?: string;
}

export const ModalError: React.FC<ModalErrorProps> = ({
  isOpen,
  onClose,
  onCloseAction,
  message = 'Ha ocurrido un error inesperado.',
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-6 shadow-lg max-w-sm w-full">
        <h2 className="text-lg font-bold text-red-600">Error</h2>
        <p className="mt-4 text-gray-700">{message}</p>
        <div className="mt-6 flex justify-end space-x-4">
          <button
            className="px-4 py-2 bg-gray-300 rounded-md"
            onClick={onClose}
          >
            Cerrar
          </button>
          <button
            className="px-4 py-2 bg-red-600 text-white rounded-md"
            onClick={onCloseAction}
          >
            Reintentar
          </button>
        </div>
      </div>
    </div>
  );
};
