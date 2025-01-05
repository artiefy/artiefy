"use client";

import React, { useState } from "react";
import { FaTimes } from "react-icons/fa";
import { BsCheck2Circle, BsStars } from "react-icons/bs";
import { AiOutlineCrown } from "react-icons/ai";
import { Header } from "~/components/layout/Header";
import Footer from "~/components/layout/Footer";
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
      price: "$29",
      period: "/mes",
      courses: 10,
      bgColor: "bg-blue-50",
      buttonColor: "bg-blue-600",
      borderColor: "border-blue-200",
      hoverColor: "hover:border-blue-400",
      features: [
        "Acceso a todos los cursos",
        "Materiales de curso premium",
        "Soporte comunitario prioritario",
        "Sesiones de mentoría 1 a 1",
        "Certificados avanzados",
        "Certificaciones con el Ciadet",
      ],
    },
    {
      name: "Premium",
      icon: AiOutlineCrown,
      price: "$49",
      period: "/mes",
      courses: 20,
      bgColor: "bg-amber-50",
      buttonColor: "bg-amber-600",
      borderColor: "border-amber-200",
      hoverColor: "hover:border-amber-400",
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
      icon: AiOutlineCrown,
      price: "$99",
      period: "/mes",
      courses: 50,
      bgColor: "bg-purple-50",
      buttonColor: "bg-purple-600",
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
      <div className="py-12 px-4 sm:px-6 lg:px-8 mb-12">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-primary sm:text-4xl">
              Planes de Pago de Cursos
            </h2>
            <p className="mt-4 text-xl text-primary">
              Elige el plan perfecto para tu viaje de aprendizaje
            </p>
          </div>
          <div className="mt-12 grid gap-8 lg:grid-cols-3 sm:grid-cols-2 grid-cols-1">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-lg shadow-lg ${plan.bgColor} border-2 ${plan.borderColor} ${plan.hoverColor} transition-all duration-200 transform hover:scale-105`}
              >
                <div className="p-8">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-bold text-gray-900">
                      {plan.name}
                    </h3>
                    <plan.icon className="w-8 h-8 text-gray-700" />
                  </div>
                  <div className="mt-4">
                    <span className="text-4xl font-extrabold text-gray-900">
                      {plan.price}
                    </span>
                    <span className="text-gray-600">{plan.period}</span>
                  </div>
                  <p className="mt-2 text-gray-600">
                    Cursos disponibles: <span className="text-2xl font-semibold">{plan.courses}</span>
                  </p>
                  <ul className="mt-6 space-y-4">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center">
                        <BsCheck2Circle className="h-5 w-5 text-green-500" />
                        <span className="ml-3 text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    onClick={() => handlePlanSelect(plan)}
                    className={`mt-8 w-full ${plan.buttonColor} text-white py-3 px-6 rounded-md hover:opacity-90 transition-opacity duration-200 font-semibold`}
                  >
                    Seleccionar Plan {plan.name}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showModal && selectedPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">
                Detalles del Plan {selectedPlan.name}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes className="w-6 h-6" />
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
                  className={`w-full ${selectedPlan.buttonColor} text-white py-3 px-6 rounded-md hover:opacity-90 transition-opacity duration-200 font-semibold`}
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