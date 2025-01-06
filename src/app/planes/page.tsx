"use client";

import React, { useState } from "react";
import { AiOutlineCrown } from "react-icons/ai";
import { BsCheck2Circle, BsStars } from "react-icons/bs";
import { FaTimes, FaBook } from "react-icons/fa";
import Footer from "~/components/layout/Footer";
import { Header } from "~/components/layout/Header";
import { Button } from "~/components/ui/button";

const PricingPlans: React.FC = () => {
  interface Plan {
    name: string;
    icon: React.ComponentType;
    price: string;
    period: string;
    courses: number;
    bgColor: string;
    buttonColor: string;
    hoverButtonColor: string;
    borderColor: string;
    hoverColor: string;
    features: string[];
  }

  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [showModal, setShowModal] = useState(false);

  const plans = [
    {
      name: "Pro",
      icon: BsStars,
      price: "$15mil",
      period: "/mes",
      courses: 10,
      bgColor: "bg-green-50", // Cambiado a verde
      buttonColor: "bg-green-600",
      hoverButtonColor: "hover:bg-green-700",
      borderColor: "border-green-200",
      hoverColor: "hover:border-green-400",
      features: [
        "Acceso a todos los cursos",
        "Materiales de curso premium",
        "Soporte comunitario prioritario",
        "Sesiones de mentoría 1 a 1",
      ],
    },
    {
      name: "Premium",
      icon: AiOutlineCrown,
      price: "$30mil",
      period: "/mes",
      courses: 20,
      bgColor: "bg-blue-50", // Cambiado a azul
      buttonColor: "bg-blue-600",
      hoverButtonColor: "hover:bg-blue-700",
      borderColor: "border-blue-200",
      hoverColor: "hover:border-blue-400",
      features: [
        "Todo en el plan Pro",
        "Acceso exclusivo a talleres",
        "Acceso directo a instructores",
        "Sesiones de orientación profesional",
        "Actualizaciones de cursos de por vida",
        "Certificaciones con el Ciadet",
      ],
    },
    {
      name: "Enterprise",
      icon: FaBook,
      price: "$50mil",
      period: "/mes",
      courses: 50,
      bgColor: "bg-purple-50", // Cambiado a morado
      buttonColor: "bg-purple-600",
      hoverButtonColor: "hover:bg-purple-700",
      borderColor: "border-purple-200",
      hoverColor: "hover:border-purple-400",
      features: [
        "Todo en el plan Premium",
        "Soporte técnico dedicado",
        "Acceso a cursos exclusivos",
        "Consultoría personalizada",
        "Certificaciones con el Ciadet",
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
            <h2 className="text-3xl font-extrabold text-primary sm:text-4xl">
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
                className={`flex flex-col justify-between rounded-lg shadow-lg ${plan.bgColor} border-2 ${plan.borderColor} ${plan.hoverColor} transform transition-all duration-200 hover:scale-105`}
              >
                <div className="flex-grow p-8">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-bold text-gray-900">
                      {plan.name}
                    </h3>
                    <plan.icon className="h-8 w-8 text-gray-700" />
                  </div>
                  <div className="mt-4">
                    <span className="text-4xl font-extrabold text-gray-900">
                      {plan.price}
                    </span>
                    <span className="text-gray-600">{plan.period}</span>
                  </div>
                  <p className="mt-2 text-gray-600">
                    Cursos disponibles:{" "}
                    <span className="text-2xl font-semibold">
                      {plan.courses}
                    </span>
                  </p>
                  <ul className="mt-6 space-y-4">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center">
                        <BsCheck2Circle className="h-5 w-5 text-green-500" />
                        <span className="ml-3 text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <Button
                  onClick={() => handlePlanSelect(plan)}
                  className={`m-5 ${plan.buttonColor} ${plan.hoverButtonColor} text-white rounded-md font-semibold transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-lg`}
                >
                  Seleccionar Plan {plan.name}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showModal && selectedPlan && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-8">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-2xl font-bold text-gray-900">
                Detalles del Plan {selectedPlan.name}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-4">
              <p className="text-gray-600">
                Comienza con nuestro plan {selectedPlan.name} y desbloquea
                características increíbles:
              </p>
              <ul className="space-y-3">
                {selectedPlan.features.map((feature: string) => (
                  <li key={feature} className="flex items-center">
                    <BsCheck2Circle className="h-5 w-5 text-green-500" />
                    <span className="ml-3 text-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6">
                <Button
                  onClick={() => setShowModal(false)}
                  className={`w-full ${selectedPlan.buttonColor} ${selectedPlan.hoverButtonColor} rounded-md px-6 py-3 font-semibold text-white transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-lg`}
                >
                  Proceder con el Plan {selectedPlan.name}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
};

export default PricingPlans;