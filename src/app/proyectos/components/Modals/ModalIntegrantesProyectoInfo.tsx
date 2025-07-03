import React from 'react';

import { UsersIcon } from '@heroicons/react/24/solid';
import { FaHashtag } from 'react-icons/fa';

interface ModalIntegrantesProyectoInfoProps {
  isOpen: boolean;
  onClose: () => void;
}

const ModalIntegrantesProyectoInfo: React.FC<ModalIntegrantesProyectoInfoProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
      <div
        onClick={handleOverlayClick}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      >
        <div className="relative flex h-[90%] w-[90%] max-w-4xl overflow-hidden rounded-lg bg-[#3f4a56] shadow-lg">
          {/* Botón de cerrar */}
          <button
            className="absolute top-2 right-3 text-xl font-bold text-gray-200 hover:text-white"
            onClick={onClose}
          >
            ✕
          </button>
  
          {/* Izquierda - Imagen */}
          <div className="flex w-1/2 items-center justify-center bg-[#0F2940] p-8">
            <div className="flex h-48 w-48 items-center justify-center rounded-lg border-4 border-cyan-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-20 w-20 text-cyan-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 7v13a1 1 0 001 1h16a1 1 0 001-1V7M3 7l8.5 8.5L21 7"
                />
              </svg>
            </div>
          </div>
  
          {/* Parte derecha: contenido */}
          <div className="w-1/2 p-6 text-white">
            <h2 className="text-center mb-5 h-[] text-4xl font-semibold text-cyan-300">
              titulo proyecto
            </h2>
  
            <div className="mb-6 flex gap-4">
              <div className="rounded bg-[#0D1B2A] px-3 py-1 text-2x1 text-cyan-300">
                Rama de investigacion
              </div>
              <div className="flex items-center gap-1 rounded bg-[#2f2f2f] px-3 py-1 text-2x1 text-purple-400">
                <FaHashtag /> de <FaHashtag /> <UsersIcon className="inline h-4 w-4 text-purple-300" />{' '} Integrantes
              </div>
            </div>

            <p className="mb-5 text-2xl">Integrantes:</p>

            <div className='text-center w-full rounded bg-gray-500 px-4 py-2 text-lg font-semibold text-white hover:bg-cyan-600'>
              <p>Nombre de Usuario</p>
            </div>
            <br />
            <div className='text-center w-full rounded bg-gray-500 px-4 py-2 text-lg font-semibold text-white hover:bg-cyan-600'>
              <p>Nombre de Usuario</p>
            </div>
            <br />
            <div className='text-center w-full rounded bg-gray-500 px-4 py-2 text-lg font-semibold text-white hover:bg-cyan-600'>
              <p>Nombre de Usuario</p>
            </div>
            <br />
            <div className='text-center w-full rounded bg-gray-500 px-4 py-2 text-lg font-semibold text-white hover:bg-cyan-600'>
              <p>Nombre de Usuario</p>
            </div>
            <br />
            <div className='text-center w-full rounded bg-gray-500 px-4 py-2 text-lg font-semibold text-white hover:bg-cyan-600'>
              <p>Nombre de Usuario</p>
            </div>
          </div>
        </div>
      </div>
    );
};

export default ModalIntegrantesProyectoInfo;
