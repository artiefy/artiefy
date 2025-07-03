import React from 'react';

import { FaUsers, FaHashtag } from 'react-icons/fa';

import ModalConfirmacionRegistro from './ModalConfirmacionIscripcion';
import ModalRamaInvestigacion from './ModalRamaInvestigacion';

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
          <h2 className="h-[] mb-4 text-4xl font-bold text-cyan-300">
            titulo proyecto
          </h2>

          <p className="mb-45 text-2xl">Planteamiento</p>
          <p className="mb-45 text-2xl">Objetivo</p>

          <div className="font-semibold mb-4 flex gap-4">
            <div className="text-2x1 flex items-center gap-1 rounded bg-[#1F3246] px-3 py-1 text-cyan-300 hover:scale-105">
              <button onClick={() => setRamaInvestigacionOpen(true)}>
                Rama de investigación
              </button>
            </div>
            <ModalRamaInvestigacion
              isOpen={RamaInvestigacionOpen}
              onClose={() => setRamaInvestigacionOpen(false)}
            />
            <div className="text-2x1 flex items-center gap-1 rounded bg-[#2f2f2f] px-3 py-1 text-purple-400">
              <FaHashtag /> <FaUsers /> Integrantes
            </div>
          </div>

          <button
            className=" w-full rounded bg-cyan-700 px-4 py-2 text-lg font-semibold text-white hover:bg-cyan-600"
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
