'use client';

import React, { useState } from 'react';

import { useRouter } from 'next/navigation';
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
	const router = useRouter(); // Initialize useRouter

	const plans = [
		{
			name: 'Pro',
			icon: BsStars,
			price: '$100mil',
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
			price: '$150mil',
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
			price: '$200mil',
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

	const handleProceedWithPlan = () => {
		setShowModal(false);
		try {
			// Navigate to the course details page dynamically
			const courseId = 1; // Replace with dynamic course ID retrieval logic
			router.push(`/estudiantes/cursos/${courseId}`);
		} catch (error) {
			console.error('Error navigating to the course details page:', error);
		}
	};

	return (
		<div className="bg-background min-h-screen">
			<Header />
			<div className="mb-12 px-4 py-12 sm:px-6 lg:px-8">
				<div className="mx-auto max-w-7xl">
					<div className="text-center">
						<h2 className="text-3xl font-extrabold text-white sm:text-4xl">
							Planes Artiefy
						</h2>
						<p className="text-primary mt-4 text-xl">
							Elige el plan perfecto para tu viaje de aprendizaje
						</p>
					</div>
					<div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
						{plans.map((plan) => (
							<div
								key={plan.name}
								className="from-primary to-secondary relative flex flex-col items-center justify-between rounded-lg bg-linear-to-r p-4 shadow-lg transition-all duration-200"
							>
								<div className="absolute inset-0 -z-10 overflow-hidden rounded-lg border-2 border-white">
									<div className="from-primary to-secondary absolute inset-0 bg-linear-to-r opacity-50"></div>
								</div>
								<div className="grow p-8">
									<div className="flex items-center justify-between">
										<h3 className="text-background text-2xl font-bold">
											{plan.name}
										</h3>
										<plan.icon className="text-background size-8" />
									</div>
									<div className="mt-4">
										<span className="text-background text-4xl font-extrabold">
											{plan.price}
										</span>
										<span className="text-background">{plan.period}</span>
									</div>
									<p className="text-background mt-2">
										Cursos disponibles:{' '}
										<span className="text-2xl font-semibold">
											{plan.courses}
										</span>
									</p>
									<ul className="mt-6 space-y-3">
										{plan.features.map((feature) => (
											<li key={feature} className="flex items-center">
												<BsCheck2Circle className="size-6 text-green-600" />
												<span className="text-background ml-3">{feature}</span>
											</li>
										))}
									</ul>
								</div>
								<div className="mb-4 flex justify-center">
									<Button
										onClick={() => handlePlanSelect(plan)}
										className="group bg-background hover:bg-background relative h-full overflow-hidden rounded-md border border-b-4 border-white px-4 py-3 font-medium text-white outline-hidden duration-300 hover:border-t-4 hover:border-b hover:brightness-150 active:scale-95 active:opacity-75"
									>
										<span className="absolute top-[-150%] left-0 inline-flex h-[5px] w-80 rounded-md bg-white opacity-50 shadow-[0_0_10px_10px_rgba(0,0,0,0.3)] shadow-white duration-500 group-hover:top-[150%]"></span>
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
							<div className="flex justify-center">
								<Button
									onClick={handleProceedWithPlan}
									className="group border-secondary bg-background hover:bg-background relative h-full overflow-hidden rounded-md border border-b-4 p-4 font-medium text-white outline-hidden duration-300 hover:border-t-4 hover:border-b active:scale-95 active:opacity-75"
								>
									<span className="absolute top-[150%] left-0 inline-flex h-[5px] w-80 rounded-md bg-white opacity-50 shadow-[0_0_10px_10px_rgba(0,0,0,0.3)] shadow-white duration-500 group-hover:top-[150%]"></span>
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
