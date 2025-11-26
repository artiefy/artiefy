import React from 'react';

import { FaHashtag, FaUsers } from 'react-icons/fa';

import ModalRamaInvestigacion from './ModalCategoria';
import ModalConfirmacionRegistro from './ModalConfirmacionIscripcion';

interface ModalProyectoProps {
  isOpen: boolean;
  onClose: () => void;
}

const ModalProyecto: React.FC<ModalProyectoProps> = ({ isOpen, onClose }) => {
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [RamaInvestigacionOpen, setRamaInvestigacionOpen] =
    React.useState(false);
  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
    >
      <div className="relative flex h-auto max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-lg bg-[#3f4a56] shadow-lg md:h-auto md:flex-row">
        {/* Botón de cerrar */}
        <button
          className="absolute top-2 right-3 z-10 text-lg font-bold text-gray-200 hover:text-white sm:text-xl"
          onClick={onClose}
        >
          ✕
        </button>

        {/* Izquierda - Imagen */}
        <div className="flex w-full items-center justify-center bg-[#0F2940] p-4 md:w-1/2 md:p-8">
          <div className="flex h-32 w-32 items-center justify-center rounded-lg border-4 border-cyan-400 sm:h-40 sm:w-40 md:h-48 md:w-48">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 text-cyan-400 sm:h-16 sm:w-16 md:h-20 md:w-20"
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
        <div className="w-full overflow-y-auto p-4 text-white md:w-1/2 md:p-6">
          <h2 className="mb-4 text-2xl font-bold text-cyan-300 sm:text-3xl md:text-4xl">
            titulo proyecto
          </h2>

          <p className="mb-4 text-lg sm:text-xl md:text-2xl">Planteamiento</p>
          <p className="mb-4 text-lg sm:text-xl md:text-2xl">Objetivo</p>

          <div className="mb-4 flex flex-col gap-2 font-semibold sm:flex-row sm:gap-4">
            <div className="flex items-center gap-1 rounded bg-[#1F3246] px-3 py-1 text-lg text-cyan-300 hover:scale-105 sm:text-xl">
              <button onClick={() => setRamaInvestigacionOpen(true)}>
                Rama de investigación
              </button>
            </div>
            <ModalRamaInvestigacion
              isOpen={RamaInvestigacionOpen}
              onClose={() => setRamaInvestigacionOpen(false)}
            />
            <div className="flex items-center gap-1 rounded bg-[#2f2f2f] px-3 py-1 text-lg text-purple-400 sm:text-xl">
              <FaHashtag /> <FaUsers /> Integrantes
            </div>
          </div>

          <button
            className="w-full rounded bg-cyan-700 px-4 py-2 text-base font-semibold text-white hover:bg-cyan-600 sm:text-lg"
            onClick={() => setConfirmOpen(true)}
          >
            Inscribirse
          </button>

          {/* Modal de confirmación */}
          <ModalConfirmacionRegistro
            isOpen={confirmOpen}
            onClose={() => setConfirmOpen(false)}
          />
        </div>
      </div>
    </div>
  );
};

export default ModalProyecto;
