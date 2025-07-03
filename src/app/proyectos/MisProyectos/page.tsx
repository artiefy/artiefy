'use client';

import React, { useState } from 'react';

import { FaArrowLeft, FaPlus } from 'react-icons/fa';

import { Header } from '~/components/estudiantes/layout/Header';

import ModalActividades from '../components/Modals/ModalActividades';
import ModalJustificacion from '../components/Modals/ModalJustificacion';
import ModalObjetivoGen from '../components/Modals/ModalObjetivoGen';
import ModalObjetivosEsp from '../components/Modals/ModalObjetivosEsp';
import ModalPlanteamiento from '../components/Modals/ModalPlanteamiento';
import ModalResumen from '../components/Modals/ModalResumen';
import ProyectoCard from '../components/ProyectoCard';

export default function ProyectosPage() {
  // Datos simulados
  const proyectos = Array(6).fill({
    titulo: 'titulo proyecto',
    descripcion: 'Descripcion proyecto',
    rama: 'Rama de investigación',
  });

  const [planteamientoOpen, setPlanteamientoOpen] = React.useState(false);
  const [planteamientoTexto, setPlanteamientoTexto] = useState('');
  const [justificacionOpen, setJustificacionOpen] = React.useState(false);
  const [justificacionTexto, setJustificacionTexto] = useState('');
  const [objetivoGenOpen, setObjetivoGenOpen] = React.useState(false);
  const [objetivoGenTexto, setObjetivoGenTexto] = useState('');
  const [ObjetivosEspOpen, setObjetivosEspOpen] = React.useState(false);
  const [ObjetivosEspTexto, setObjetivosEspTexto] = useState<string[]>([]);
  const [actividadesOpen, setActividadesOpen] = React.useState(false);
  const [actividadesTexto, setActividadesTexto] = useState<string[]>([]);
  const [ResumenOpen, setResumenOpen] = React.useState(false);

  const handleConfirmarPlanteamiento = () => {
    setPlanteamientoOpen(false);
    setJustificacionOpen(true);
  };
  const handleAnteriorJustificacion = () => {
    setJustificacionOpen(false);
    setPlanteamientoOpen(true);
  };
  const handleConfirmarJustificacion = () => {
    setJustificacionOpen(false);
    setObjetivoGenOpen(true);
  };
  const handleAnteriorObjetivoGen = () => {
    setObjetivoGenOpen(false);
    setJustificacionOpen(true);
  };
  const handleConfirmarObjetivoGen = () => {
    setObjetivoGenOpen(false);
    setObjetivosEspOpen(true);
  };
  const handleAnteriorObjetivosEsp = () => {
    setObjetivosEspOpen(false);
    setObjetivoGenOpen(true);
  };
  const handleConfirmarObjetivosEsp = () => {
    setObjetivosEspOpen(false);
    setActividadesOpen(true);
  };
  const handleAnteriorActividades = () => {
    setActividadesOpen(false);
    setObjetivosEspOpen(true);
  };
  const handleConfirmarActividades = () => {
    setActividadesOpen(false);
    setResumenOpen(true);
  };

  return (
    <div className="relative flex min-h-screen flex-col">
      <div className="relative z-10 flex min-h-screen flex-col">
        <Header />
        <main className="min-h-screen bg-[#041C3C] text-white">
          <section className="flex flex-col p-6">
            <div className="mb-6 flex items-center justify-between">
              <button
                className="ml-15 text-2xl font-semibold text-cyan-300 transition hover:scale-155"
                onClick={() => window.history.back()}
              >
                <FaArrowLeft />
              </button>
              <h1 className="text-4xl font-bold text-cyan-300">
                Mis Proyectos
              </h1>
              <div>
                <button
                  onClick={() => {
                    setPlanteamientoTexto('');
                    setJustificacionTexto('');
                    setObjetivoGenTexto('');
                    setObjetivosEspTexto([]); // ← Array vacío
                    setActividadesTexto([]);
                    setPlanteamientoOpen(true);
                  }}
                  className="mr-15 text-2xl font-semibold text-cyan-300 transition hover:scale-155"
                >
                  <FaPlus />
                </button>
              </div>
            </div>

            {/* Modales */}
            <ModalPlanteamiento
              isOpen={planteamientoOpen}
              onClose={() => setPlanteamientoOpen(false)}
              onConfirm={handleConfirmarPlanteamiento}
              texto={planteamientoTexto}
              setTexto={setPlanteamientoTexto}
            />

            <ModalJustificacion
              isOpen={justificacionOpen}
              onClose={() => setJustificacionOpen(false)}
              onAnterior={handleAnteriorJustificacion}
              onConfirm={handleConfirmarJustificacion}
              texto={justificacionTexto}
              setTexto={setJustificacionTexto}
            />
            <ModalObjetivoGen
              isOpen={objetivoGenOpen}
              onClose={() => setObjetivoGenOpen(false)}
              onAnterior={handleAnteriorObjetivoGen}
              onConfirm={handleConfirmarObjetivoGen}
              texto={objetivoGenTexto}
              setTexto={setObjetivoGenTexto}
            />
            <ModalObjetivosEsp
              isOpen={ObjetivosEspOpen}
              onClose={() => setObjetivosEspOpen(false)}
              onAnterior={handleAnteriorObjetivosEsp}
              onConfirm={handleConfirmarObjetivosEsp}
              texto={ObjetivosEspTexto}
              setTexto={setObjetivosEspTexto}
            />

            <ModalActividades
              isOpen={actividadesOpen}
              onClose={() => setActividadesOpen(false)}
              onAnterior={handleAnteriorActividades}
              onConfirm={handleConfirmarActividades}
              texto={actividadesTexto}
              setTexto={setActividadesTexto}
            />
            <ModalResumen
              isOpen={ResumenOpen}
              onClose={() => setResumenOpen(false)}
              planteamiento={planteamientoTexto}
              justificacion={justificacionTexto}
              objetivoGen={objetivoGenTexto}
              objetivosEsp={ObjetivosEspTexto}
              actividad={actividadesTexto}
              setObjetivosEsp={setObjetivosEspTexto}
              setActividades={setActividadesTexto}
            />

            {/* Grid de tarjetas */}
            <div className="grid grid-cols-1 items-center justify-center gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {proyectos.map((_, index) => (
                <ProyectoCard key={index} />
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
