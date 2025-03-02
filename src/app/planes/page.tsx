'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter, usePathname } from 'next/navigation';
import { BsCheck2Circle } from 'react-icons/bs';
import { FaTimesCircle, FaTimes } from 'react-icons/fa';
import Footer from '~/components/estudiantes/layout/Footer';
import { Header } from '~/components/estudiantes/layout/Header';
import PaymentForm from '~/components/estudiantes/layout/PaymentForm';
import { Button } from '~/components/estudiantes/ui/button';
import { plansPersonas, plansEmpresas, type Plan } from '~/types/plans';
import '~/styles/buttonPlanes.css';
import { getProductById } from '~/utils/paygateway/products';
import { toast } from 'sonner';

const PlansPage: React.FC = () => {
	const { isSignedIn } = useAuth();
	const router = useRouter();
	const pathname = usePathname();
	const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
	const [showModal, setShowModal] = useState(false);
	const [activeTab, setActiveTab] = useState('personas');
	const [isProcessing, setIsProcessing] = useState(false);

	useEffect(() => {
		const timer = setTimeout(() => {
			setIsProcessing(false);
		}, 1000);

		return () => clearTimeout(timer);
	}, []);

	const handlePlanSelect = (plan: Plan) => {
		if (isProcessing) return;
		setIsProcessing(true);

		if (!isSignedIn) {
			// Mostrar toast y esperar a que se complete
			toast.error('Debes iniciar sesión para seleccionar un plan');

			// Dar tiempo para que el toast se muestre antes de redirigir
			setTimeout(() => {
				setIsProcessing(false);
				void router.push(`/sign-in?redirect_url=${pathname}`);
			}, 2000);
			return;
		}

		try {
			setSelectedPlan(plan);
			setShowModal(true);
			toast.success(`Has seleccionado el plan ${plan.name}`);
		} finally {
			setIsProcessing(false);
		}
	};

	const selectedProduct = selectedPlan ? getProductById(selectedPlan.id) : null;

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
					<div className="mt-8 flex justify-center space-x-4">
						<button
							className={`button-rounded ${activeTab === 'personas' ? 'bg-primary text-white' : 'bg-white text-primary'}`}
							onClick={() => setActiveTab('personas')}
						>
							Personas
							<div className="hoverEffect">
								<div></div>
							</div>
						</button>
						<button
							className={`button-rounded ${activeTab === 'empresas' ? 'bg-primary text-white' : 'bg-white text-primary'}`}
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
											<div className="m-4 flex flex-col items-center">
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
												onClick={() => handlePlanSelect(plan)} // Activa el modal y selecciona el plan
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

			{showModal && selectedPlan && selectedProduct && (
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
							<PaymentForm selectedProduct={selectedProduct} />
						</div>
					</div>
				</div>
			)}
			<Footer />
		</div>
	);
};

export default PlansPage;
