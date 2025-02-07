'use client';

import React, { useState } from 'react';
import { AiOutlineCrown } from 'react-icons/ai';
import { BsCheck2Circle, BsStars } from 'react-icons/bs';
import { FaBook, FaTimes, FaTimesCircle } from 'react-icons/fa';
import Footer from '~/components/estudiantes/layout/Footer';
import { Header } from '~/components/estudiantes/layout/Header';
import { PaymentForm } from '~/components/estudiantes/layout/PaymentForm';
import { Button } from '~/components/estudiantes/ui/button';
import '~/styles/buttonPlanes.css';

interface Plan {
  id: string;
  name: string;
  icon: React.ComponentType;
  price: number;
  priceUsd: number;
  period: string;
  courses: string;
  projects: number | string;
  features: { text: string; available: boolean }[];
}

const PricingPlans: React.FC = () => {
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState('personas');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const plansPersonas: Plan[] = [
    {
      id: 'pro',
      name: 'Pro',
      icon: BsStars,
      price: 100000,
      priceUsd: 25,
      period: '/mes',
      courses: 'Ilimitados',
      projects: 15,
      features: [
        { text: 'Acceso limitado a programas', available: false },
        { text: 'Materiales de curso premium', available: true },
        { text: 'Soporte comunitario prioritario', available: true },
        { text: 'Sesiones de mentoría 1 a 1', available: true },
        { text: 'Acceso a foros exclusivos', available: true },
      ],
    },
    {
      id: 'premium',
      name: 'Premium',
      icon: AiOutlineCrown,
      price: 150000,
      priceUsd: 37,
      period: '/mes',
      courses: 'Ilimitados',
      projects: 'Ilimitados',
      features: [
        { text: 'Acceso a todos los cursos', available: true },
        { text: 'Materiales de curso premium', available: true },
        { text: 'Soporte comunitario prioritario', available: true },
        { text: 'Sesiones de mentoría 1 a 1', available: true },
        { text: 'Acceso a foros exclusivos', available: true },
      ],
    },
  ];

  const plansEmpresas: Plan[] = [
    {
      id: 'enterprise',
      name: 'Enterprise',
      icon: FaBook,
      price: 200000,
      priceUsd: 50,
      period: '/mes',
      courses: 'Ilimitados',
      projects: 'Ilimitados',
      features: [
        { text: 'Todo en el plan Premium', available: true },
        { text: 'Soporte técnico dedicado', available: true },
        { text: 'Acceso a cursos exclusivos', available: true },
        { text: 'Consultoría personalizada', available: true },
        { text: 'Certificaciones con el Ciadet', available: true },
      ],
    },
  ];

  const handlePlanSelect = (plan: Plan) => {
    setSelectedPlan(plan);
    setShowModal(true);
  };

  const handleSuccess = (message: string) => {
    setSuccessMessage(message);
    setShowModal(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="mb-12 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
              Planes Artiefy
            </h2>
            <p className="mt-4 text-xl text-primary">
              Elige el plan perfecto para tu viaje de aprendizaje
            </p>
          </div>
          <div className="mt-8 flex justify-center space-x-4">
            <button
              className={`button ${activeTab === 'personas' ? 'bg-primary text-white' : 'bg-white text-primary'}`}
              onClick={() => setActiveTab('personas')}
            >
              Personas
              <div className="hoverEffect">
                <div></div>
              </div>
            </button>
            <button
              className={`button ${activeTab === 'empresas' ? 'bg-primary text-white' : 'bg-white text-primary'}`}
              onClick={() => setActiveTab('empresas')}
            >
              Empresas
              <div className="hoverEffect">
                <div></div>
              </div>
            </button>
          </div>
          <div className="mt-12 flex justify-center">
            <div
              className={`grid gap-8 ${activeTab === 'personas' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 justify-items-center'} w-full max-w-4xl`}
            >
              {(activeTab === 'personas' ? plansPersonas : plansEmpresas).map(
                (plan) => (
                  <div
                    key={plan.id}
                    className="relative flex w-full max-w-md flex-col items-center justify-between rounded-lg bg-linear-to-r from-primary to-secondary p-2 shadow-lg transition-all duration-200"
                  >
                    {plan.name === 'Pro' && (
                      <div className="absolute top-6 -right-5 rotate-45 transform bg-red-500 px-5 py-1 text-xs font-bold text-white">
                        15 días gratis
                      </div>
                    )}
                    <div className="absolute inset-0 -z-10 overflow-hidden rounded-lg border-2 border-white">
                      <div className="absolute inset-0 bg-linear-to-r from-primary to-secondary opacity-50"></div>
                    </div>
                    <div className="my-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-2xl font-bold text-background">
                          {plan.name}
                        </h3>
                        {React.createElement(
                          plan.icon as React.ComponentType<{
                            className: string;
                          }>,
                          { className: 'size-8 text-background' }
                        )}
                      </div>
                      <div className="m-4 flex flex-col items-start">
                        <span className="text-4xl font-extrabold text-background">
                          ${plan.price.toLocaleString('es-CO')}
                          <span className="text-lg font-normal">/mes</span>
                        </span>
                        <span className="w-full text-center text-2xl font-extrabold text-gray-600">
                          ${plan.priceUsd}{' '}
                          <span className="text-lg font-normal">/month</span>
                        </span>
                      </div>
                      <div className="text-left text-background">
                        <p>
                          Cursos disponibles:{' '}
                          <span className="text-2xl font-semibold">
                            {plan.courses}
                          </span>
                        </p>
                        <p>
                          Proyectos disponibles:{' '}
                          <span className="text-2xl font-semibold">
                            {plan.projects}
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="">
                      <ul className="mb-5 space-y-3">
                        {plan.features.map((feature) => (
                          <li key={feature.text} className="flex items-center">
                            {feature.available ? (
                              <BsCheck2Circle className="size-6 text-green-600" />
                            ) : (
                              <FaTimesCircle className="size-6 text-red-600" />
                            )}
                            <span className="ml-3 text-background">
                              {feature.text}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="mb-5 flex justify-center">
                      <Button
                        onClick={() => handlePlanSelect(plan)}
                        className="group relative h-full overflow-hidden rounded-md border border-b-4 border-white bg-background px-4 py-3 font-medium text-white outline-hidden duration-300 hover:border-t-4 hover:border-b hover:bg-background hover:brightness-150 active:scale-95 active:opacity-75"
                      >
                        <span className="absolute top-[-150%] left-0 inline-flex h-[5px] w-80 rounded-md bg-white opacity-50 shadow-[0_0_10px_10px_rgba(0,0,0,0.3)] shadow-white duration-500 group-hover:top-[150%]"></span>
                        Seleccionar Plan {plan.name}
                      </Button>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </div>

      {showModal && selectedPlan && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-lg bg-white p-4">
            <div className="relative mb-4 flex items-center justify-between">
              <h3 className="w-full text-center text-xl font-semibold text-gray-900">
                Llena este formulario
                <br />
                <span className="font-bold">Plan {selectedPlan.name}</span>
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-0 right-0 mt-2 mr-2 text-gray-500 hover:text-gray-700"
              >
                <FaTimes className="h-6 w-6" />
              </button>
            </div>
            <div>
              <PaymentForm onSuccess={handleSuccess} planId={selectedPlan.id} />
            </div>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-lg bg-white p-8">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-2xl font-bold text-gray-900">Éxito</h3>
              <button
                onClick={() => setSuccessMessage(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes />
              </button>
            </div>
            <p className="text-gray-600">{successMessage}</p>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
};

export default PricingPlans;
