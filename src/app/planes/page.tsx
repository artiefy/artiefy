'use client';

import React, { useState } from 'react';
import { AiOutlineCrown } from 'react-icons/ai';
import { BsCheck2Circle, BsStars } from 'react-icons/bs';
import { FaBook, FaTimes } from 'react-icons/fa';
import Footer from '~/components/estudiantes/layout/Footer';
import { Header } from '~/components/estudiantes/layout/Header';
import { Button } from '~/components/estudiantes/ui/button';

const PricingPlans: React.FC = () => {
  interface Plan {
    name: string;
    icon: React.ComponentType;
    price: string;
    period: string;
    courses: number;
    features: string[];
  }

  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [showModal, setShowModal] = useState(false);

  const plans = [
    {
      name: 'Pro',
      icon: BsStars,
      price: '$15mil',
      period: '/mes',
      courses: 10,
      features: [
        'Acceso a todos los cursos',
        'Materiales de curso premium',
        'Soporte comunitario prioritario',
        'Sesiones de mentoría 1 a 1',
        'Acceso a foros exclusivos',
      ],
    },
    {
      name: 'Premium',
      icon: AiOutlineCrown,
      price: '$30mil',
      period: '/mes',
      courses: 20,
      features: [
        'Todo en el plan Pro',
        'Acceso directo a instructores',
        'Orientación profesional',
        'Actualizaciones de cursos',
        'Certificaciones con el Ciadet',
      ],
    },
    {
      name: 'Enterprise',
      icon: FaBook,
      price: '$50mil',
      period: '/mes',
      courses: 50,
      features: [
        'Todo en el plan Premium',
        'Soporte técnico dedicado',
        'Acceso a cursos exclusivos',
        'Consultoría personalizada',
        'Certificaciones con el Ciadet',
      ],
    },
  ];

  const handlePlanSelect = (plan: Plan) => {
    setSelectedPlan(plan);
    setShowModal(true);
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
          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative flex flex-col justify-between rounded-lg bg-gradient-to-r from-primary to-secondary p-4 shadow-lg transition-all duration-200${
                  plan.name === 'Pro' || plan.name === 'Enterprise'
                    ? 'items-center justify-center'
                    : ''
                }`}
              >
                <div className="absolute inset-0 -z-10 overflow-hidden rounded-lg border-2 border-white">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary opacity-50"></div>
                </div>
                <div className="grow p-8">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-bold text-background">
                      {plan.name}
                    </h3>
                    <plan.icon className="size-8 text-background" />
                  </div>
                  <div className="mt-4">
                    <span className="text-4xl font-extrabold text-background">
                      {plan.price}
                    </span>
                    <span className="text-background">{plan.period}</span>
                  </div>
                  <p className="mt-2 text-background">
                    Cursos disponibles:{' '}
                    <span className="text-2xl font-semibold">
                      {plan.courses}
                    </span>
                  </p>
                  <ul className="mt-6 space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center">
                        <BsCheck2Circle className="size-6 text-green-600" />
                        <span className="ml-3 text-background">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mb-4 flex justify-center">
                  <Button
                    onClick={() => handlePlanSelect(plan)}
                    className="group relative h-full overflow-hidden rounded-md border border-b-4 border-white bg-background px-4 py-3 font-medium text-white outline-none duration-300 hover:border-b hover:border-t-4 hover:bg-background hover:brightness-150 active:scale-95 active:opacity-75"
                  >
                    <span className="absolute left-0 top-[-150%] inline-flex h-[5px] w-80 rounded-md bg-white opacity-50 shadow-[0_0_10px_10px_rgba(0,0,0,0.3)] shadow-white duration-500 group-hover:top-[150%]"></span>
                    Seleccionar Plan {plan.name}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showModal && selectedPlan && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-8">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-2xl font-bold text-gray-900">
                Detalles del Plan {selectedPlan.name}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes className="size-6" />
              </button>
            </div>
            <div className="space-y-5">
              <p className="text-gray-600">
                Comienza con nuestro plan {selectedPlan.name} y desbloquea
                características increíbles:
              </p>
              <ul className="space-y-3 pb-1">
                {selectedPlan.features.map((feature: string) => (
                  <li key={feature} className="flex items-center">
                    <BsCheck2Circle className="size-6 font-bold text-green-400" />
                    <span className="ml-3 text-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>
              ...
              <div className="flex justify-center">
                <Button
                  onClick={() => setShowModal(false)}
                  className="group relative -my-6 h-full overflow-hidden rounded-md border border-b-4 border-secondary bg-background px-5 py-3 font-medium text-white outline-none duration-300 hover:border-b hover:border-t-4 hover:bg-background active:scale-95 active:opacity-75"
                >
                  <span className="absolute left-0 top-[150%] inline-flex h-[5px] w-80 rounded-md bg-white opacity-50 shadow-[0_0_10px_10px_rgba(0,0,0,0.3)] shadow-white duration-500 group-hover:top-[150%]"></span>
                  Proceder con el Plan {selectedPlan.name}
                </Button>
              </div>
              ...
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
};

export default PricingPlans;
