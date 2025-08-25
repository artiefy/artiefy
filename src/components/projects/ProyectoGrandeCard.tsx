'use client';

import React, { useState } from 'react';

import { FaHashtag,FaUsers } from 'react-icons/fa';

import ModalRamaInvestigacion from './Modals/ModalCategoria';
import ModalProyecto from './Modals/ModalProyecto';

export default function ProyectoGrandeCard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [RamaInvestigacionOpen, setRamaInvestigacionOpen] =
    React.useState(false);

  return (
    <>
      <div className="flex h-[75vh] snap-start flex-col justify-between rounded-md bg-[#5B5B5B] p-6 text-white shadow-md">
        <div>
          <h3 className="mb-2 text-2xl font-bold text-cyan-300">
            Título del proyecto
          </h3>
          <p className="mb-4">
            Descripción del proyecto breve y clara para contextualizar.
          </p>
          <div>
            <button
              onClick={() => setRamaInvestigacionOpen(true)}
              className="text-2x1 flex items-center gap-1 rounded bg-[#2f2f2f] px-3 py-1 font-semibold text-cyan-300 hover:scale-105"
            >
              Rama de investigación
            </button>
          </div>
          <ModalRamaInvestigacion
            isOpen={RamaInvestigacionOpen}
            onClose={() => setRamaInvestigacionOpen(false)}
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="text-2x1 flex items-center gap-1 rounded bg-[#2f2f2f] px-3 py-1 font-semibold text-purple-400">
            <FaHashtag /> <FaUsers /> Integrantes
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="text-2x1 rounded bg-cyan-300 px-3 py-1 font-semibold text-black hover:scale-105"
          >
            Ver más
          </button>
        </div>
      </div>

      <ModalProyecto
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
