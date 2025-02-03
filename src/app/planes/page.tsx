'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AiOutlineCrown } from 'react-icons/ai';
import { BsCheck2Circle, BsStars } from 'react-icons/bs';
import { FaBook, FaTimes } from 'react-icons/fa';
import Footer from '~/components/estudiantes/layout/Footer';
import { Header } from '~/components/estudiantes/layout/Header';
import { Button } from '~/components/estudiantes/ui/button';
import '~/styles/buttonPlanes.css'; // Import the new CSS file

const PricingPlans: React.FC = () => {
	interface Plan {
		name: string;
		icon: React.ComponentType;
		price: string;
		priceUsd: string;
		period: string;
		courses: string;
		projects: number | string;
		features: string[];
	}

	const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
	const [showModal, setShowModal] = useState(false);
	const [activeTab, setActiveTab] = useState('personas');
	const router = useRouter(); // Initialize useRouter

	const plansPersonas = [
		{
			name: 'Pro',
			icon: BsStars,
			price: '$100mil COP',
			priceUsd: '$25 USD',
			period: '/mes',
			courses: '15',
			projects: 5,
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
			price: '$150mil COP',
			priceUsd: '$37 USD',
			period: '/mes',
			courses: 'Ilimitados',
			projects: 15,
			features: [
				'Todo en el plan Pro',
				'Acceso directo a instructores',
				'Orientación profesional',
				'Actualizaciones de cursos',
				'Certificaciones con el Ciadet',
			],
		},
	];

	const plansEmpresas = [
		{
			name: 'Enterprise',
			icon: FaBook,
			price: '$200mil COP',
			priceUsd: '$50 USD',
			period: '/mes',
			courses: 'Ilimitados',
			projects: 'Ilimitados',
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
						<div className={`grid gap-8 ${activeTab === 'personas' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 justify-items-center'} w-full max-w-4xl`}>
							{(activeTab === 'personas' ? plansPersonas : plansEmpresas).map((plan) => (
								<div
									key={plan.name}
									className="relative flex flex-col items-center justify-between rounded-lg bg-linear-to-r from-primary to-secondary p-2 shadow-lg transition-all duration-200 w-full max-w-md"
								>
									{plan.name === 'Pro' && (
										<div className="absolute top-6 -right-5 bg-red-500 text-white text-xs font-bold px-5 py-1 transform rotate-45">
											15 días gratis
										</div>
									)}
									<div className="absolute inset-0 -z-10 overflow-hidden rounded-lg border-2 border-white">
										<div className="absolute inset-0 bg-linear-to-r from-primary to-secondary opacity-50"></div>
									</div>
									{plan.name === 'Enterprise' ? (
										<div className="my-6 px-4">
											<div className="flex items-center justify-between">
												<h3 className="text-2xl font-bold text-background mr-18">
													{plan.name}
												</h3>
												<plan.icon className="size-7 text-background ml-18" />
											</div>
											<div className="mt-4 flex flex-col items-center">
												<span className="text-4xl font-extrabold text-background">
													{plan.price}<span className="text-xl font-normal">/mes</span>
												</span>
												<span className="text-2xl text-gray-600 font-extrabold text-center w-full">
													{plan.priceUsd} <span className="text-xl font-normal">/month</span>
												</span>
											</div>
											<div className="mt-4 text-background text-left">
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
									) : (
										<div className="my-6">
											<div className="flex items-center justify-between">
												<h3 className="text-2xl font-bold text-background">
													{plan.name}
												</h3>
												<plan.icon className="size-8 text-background" />
											</div>
											<div className="m-4 flex flex-col items-start">
												<span className="text-4xl font-extrabold text-background">
													{plan.price}<span className="text-lg font-normal">/mes</span>
												</span>
												<span className="text-2xl text-gray-600 font-extrabold text-center w-full">
													{plan.priceUsd} <span className="text-lg font-normal">/month</span>
												</span>
											</div>
											<div className="text-background text-left">
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
									)}
									<div className="">
										<ul className="mb-5 space-y-3">
											{plan.features.map((feature) => (
												<li key={feature} className="flex items-center">
													<BsCheck2Circle className="size-6 text-green-600" />
													<span className="ml-3 text-background">{feature}</span>
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
							))}
						</div>
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
									className="group relative h-full overflow-hidden rounded-md border border-b-4 border-secondary bg-background p-4 font-medium text-white outline-hidden duration-300 hover:border-t-4 hover:border-b hover:bg-background active:scale-95 active:opacity-75"
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
