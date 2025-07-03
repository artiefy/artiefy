'use client';

import React, { useState } from 'react';

import { UsersIcon } from '@heroicons/react/24/solid';
import { FaArrowDown , FaArrowLeft } from 'react-icons/fa';

import { Header } from '~/components/estudiantes/layout/Header';


import ModalConfirmacionEliminacion from '../components/Modals/ModalConfirmacionEliminacion';
import ModalIntegrantesProyectoInfo from '../components/Modals/ModalIntegrantesProyectoInfo';
import ModalRamaInvestigacion from '../components/Modals/ModalRamaInvestigacion';

export default function DetalleProyectoPage() {
  const [RamaInvestigacionOpen, setRamaInvestigacionOpen] =
    React.useState(false);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  return (
    <div className="min-h-screen bg-[#041C3C] px-6 py-4 text-white">
      {/* Header (Navbar superior) */}
      <Header />
      {/* Título y etiquetas */}
      <section className="mt-6">
        <div className="mb-6 flex items-start gap-4">
          <button
            className="ml-8 text-2xl font-semibold text-cyan-300 transition hover:scale-155"
            onClick={() => window.history.back()}
          >
            <FaArrowLeft />
          </button>

          <div className="flex h-[35vh] w-full flex-col justify-end rounded-lg bg-gray-700 p-4">
            <h1 className="text-4xl font-bold text-cyan-300">
              Título del Proyecto
            </h1>
          </div>
        </div>

        <div className="mt-2 flex flex-wrap gap-3">
          <div>
            <button
              onClick={() => setRamaInvestigacionOpen(true)}
              className="flex items-center gap-1 rounded bg-[#1F3246] px-3 py-1 text-sm text-cyan-300 hover:scale-105"
            >
              Rama de investigación
            </button>
          </div>
          <ModalRamaInvestigacion
            isOpen={RamaInvestigacionOpen}
            onClose={() => setRamaInvestigacionOpen(false)}
          />
          <div>
            <span className="rounded bg-[#1F3246] px-3 py-1 text-sm text-cyan-300">
              📅 Creado:
            </span>
          </div>
          <div>
            <span className="rounded bg-[#1F3246] px-3 py-1 text-sm text-cyan-300">
              📅 Actualizado:
            </span>
          </div>
          <div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-1 rounded bg-[#1F3246] px-3 py-1 text-sm text-purple-300 hover:scale-105"
            >
              # <UsersIcon className="inline h-4 w-4 text-purple-300" />{' '}
              Integrantes
            </button>
          </div>
          <ModalIntegrantesProyectoInfo
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
          />

          <div className="ml-auto flex flex-col gap-2">
            <div className="rounded bg-[#1F3246] px-3 py-1 text-cyan-300">
              Nombre del Responsable
            </div>
            <div className="rounded bg-[#1F3246] px-3 py-7 text-cyan-300" />
          </div>
        </div>
      </section>

      {/* Información y botones */}
      <section className="mt-6 flex items-start justify-between">
        <div>
          <p className="text-lg">Introducción del proyecto</p>
        </div>
        <div className="flex flex-col gap-2">
          <button className="rounded bg-green-600 px-4 py-2 font-semibold text-white hover:bg-green-700">
            Publicar Proyecto
          </button>
          <button className="rounded bg-cyan-600 px-4 py-2 font-semibold text-white hover:bg-cyan-700">
            Editar Proyecto
          </button>
          <button
            className="rounded bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700"
            onClick={() => setConfirmOpen(true)}
          >
            Eliminar Proyecto
          </button>

          {/* Modal de confirmación */}
          <ModalConfirmacionEliminacion
            isOpen={confirmOpen}
            onClose={() => setConfirmOpen(false)}
          />
        </div>
      </section>

      {/* Secciones de contenido */}
      <section className="mt-8 grid grid-cols-2 gap-6">
        {[
          { title: 'Planteamiento del Problema', content: 'Texto' },
          { title: 'Justificación', content: 'Texto' },
          { title: 'Objetivo', content: 'Texto' },
          { title: 'Actividades', content: 'Texto' },
        ].map((item, i) => (
          <div key={i} className="relative rounded bg-[#1F3246] p-4">
            <h3 className="text-md font-semibold">{item.title}</h3>
            <p className="mt-2">{item.content}</p>
            <FaArrowDown className="absolute right-2 bottom-2 text-cyan-300" />
          </div>
        ))}
      </section>

      {/* Cronograma */}
      <section className="relative mx-auto mt-6 max-w-md rounded bg-[#1F3246] p-4">
        <h3 className="mb-2 text-center font-semibold">Cronograma</h3>
        <p className="text-center">Tabla</p>
        <FaArrowDown className="absolute right-2 bottom-2 text-cyan-300" />
      </section>
    </div>
  );
}
