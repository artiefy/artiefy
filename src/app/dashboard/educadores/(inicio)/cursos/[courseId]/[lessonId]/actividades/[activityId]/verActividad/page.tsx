'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbSeparator,
} from '~/components/educators/ui/breadcrumb';
import ActSubida from '~/components/verActividades/ActSubida';
import VerListPreguntaAbierta from '~/components/verActividades/PreguntaCompletado';
import VerQuestionVOFList from '~/components/verActividades/PreguntaFOV';
import VerQuestionList from '~/components/verActividades/PreguntasOM';
import ResponderPreguntas from '~/components/verActividades/ResponderPreguntas';

interface ActivityDetails {
	id: number;
	name: string;
	description: string;
	typeid: number;
	type: {
		id: number;
		name: string;
		description: string;
	};
	lesson: {
		id: number;
		title: string;
		coverImageKey: string;
		courseId: number;
		courseTitle: string;
		courseDescription: string;
		courseInstructor: string;
	};
}

interface ActivityScore {
	totalQuestions: number;
	correctAnswers: number;
	percentage: number;
	passed: boolean;
}

const RealizarActividad: React.FC = () => {
	const params = useParams();
	const actividadIdUrl = params?.activityId ?? null;
	const [loading, setLoading] = useState(true);
	const [actividad, setActividad] = useState<ActivityDetails | null>(null);
	const [error, setError] = useState<string | null>(null);
	const actividadIdString = Array.isArray(actividadIdUrl)
		? actividadIdUrl[0]
		: actividadIdUrl;
	const actividadIdNumber = actividadIdString
		? parseInt(actividadIdString)
		: null;
	const [activityScore, setActivityScore] = useState<ActivityScore>({
		totalQuestions: 0,
		correctAnswers: 0,
		percentage: 0,
		passed: false,
	});
	const [totalQuestions, setTotalQuestions] = useState(0);

	const fetchActividad = useCallback(async () => {
		if (actividadIdNumber !== null) {
			try {
				setLoading(true);
				setError(null);
				const response = await fetch(
					`/api/educadores/actividades/${actividadIdNumber}`
				);

				if (response.ok) {
					const data = (await response.json()) as ActivityDetails;
					setActividad(data);
				} else {
					const errorData = (await response.json()) as { error?: string };
					const errorMessage = errorData.error ?? response.statusText;
					setError(`Error al cargar la actividad: ${errorMessage}`);
					toast('Error', {
						description: `No se pudo cargar la actividad: ${errorMessage}`,
					});
				}
			} catch (error: unknown) {
				const errorMessage =
					error instanceof Error ? error.message : 'Error desconocido';
				setError(`Error al cargar la actividad: ${errorMessage}`);
				toast('Error', {
					description: `No se pudo cargar la actividad: ${errorMessage}`,
				});
			} finally {
				setLoading(false);
			}
		}
	}, [actividadIdNumber]);

	useEffect(() => {
		void fetchActividad();
	}, [fetchActividad]);

	useEffect(() => {
		const countQuestions = async () => {
			if (actividad?.id && actividad.type.id === 2) {
				try {
					const [omResponse, completarResponse, vofResponse] =
						await Promise.all([
							fetch(
								`/api/educadores/question/opcionMulti?activityId=${actividad.id}`
							),
							fetch(
								`/api/educadores/question/completar?activityId=${actividad.id}`
							),
							fetch(
								`/api/educadores/question/VerdaderoOFalso?activityId=${actividad.id}`
							),
						]);

					const [omData, completarData, vofData] = await Promise.all([
						omResponse.json() as Promise<{
							questionsOM: {
								id: number;
								question: string;
								options: string[];
								correctOption: number;
							}[];
						}>,
						completarResponse.json() as Promise<{
							questionsACompletar: {
								id: number;
								question: string;
								answer: string;
							}[];
						}>,
						vofResponse.json() as Promise<{
							questionsVOF: { id: number; question: string; isTrue: boolean }[];
						}>,
					]);

					const total =
						(omData.questionsOM?.length || 0) +
						(completarData.questionsACompletar?.length || 0) +
						(vofData.questionsVOF?.length || 0);

					setTotalQuestions(total);
					setActivityScore((prev) => ({
						...prev,
						totalQuestions: total,
					}));
				} catch (error) {
					console.error('Error contando preguntas:', error);
				}
			}
		};

		void countQuestions();
	}, [actividad]);

	const handleQuestionResult = (isCorrect: boolean) => {
		setActivityScore((prev) => {
			const newCorrect = prev.correctAnswers + (isCorrect ? 1 : 0);
			const newPercentage = (newCorrect / totalQuestions) * 100;

			return {
				totalQuestions,
				correctAnswers: newCorrect,
				percentage: newPercentage,
				passed: newPercentage >= 65,
			};
		});
	};

	if (loading) {
		return (
			<main className="flex h-screen flex-col items-center justify-center">
				<div className="size-32 animate-spin rounded-full border-y-2 border-primary">
					<span className="sr-only"></span>
				</div>
				<span className="text-primary">Cargando...</span>
			</main>
		);
	}

	if (error) return <div>Error: {error}</div>;

	return (
		<>
			<Breadcrumb>
				<BreadcrumbList>
					<BreadcrumbItem>
						<BreadcrumbLink
							className="text-primary transition duration-300 hover:scale-105 hover:text-gray-300"
							href="/dashboard/educadores"
						>
							Cursos
						</BreadcrumbLink>
					</BreadcrumbItem>
					<BreadcrumbSeparator />
					<BreadcrumbItem>
						<BreadcrumbLink
							className="text-primary transition duration-300 hover:scale-105 hover:text-gray-300"
							href="/dashboard/educadores/cursos"
						>
							Lista de cursos
						</BreadcrumbLink>
					</BreadcrumbItem>
					<BreadcrumbSeparator />
					<BreadcrumbItem>
						<BreadcrumbLink
							className="text-primary transition duration-300 hover:scale-105 hover:text-gray-300"
							href={`/dashboard/educadores/cursos`}
						>
							Detalles curso
						</BreadcrumbLink>
					</BreadcrumbItem>
					<BreadcrumbSeparator />
					<BreadcrumbItem>
						<BreadcrumbLink
							href={`/dashboard/educadores/cursos`}
							className="text-primary transition duration-300 hover:scale-105 hover:text-gray-300"
						>
							Lección
						</BreadcrumbLink>
					</BreadcrumbItem>
					<BreadcrumbSeparator />
					<BreadcrumbItem>
						<BreadcrumbLink
							href="#"
							onClick={() => window.history.back()}
							className="text-primary transition duration-300 hover:scale-105 hover:text-gray-300"
						>
							Creación de actividad
						</BreadcrumbLink>
					</BreadcrumbItem>
					<BreadcrumbSeparator />
					<BreadcrumbItem>
						<BreadcrumbLink
							href="#"
							onClick={() => window.history.back()}
							className="text-primary transition duration-300 hover:scale-105 hover:text-gray-300"
						>
							Realizacion de actividad
						</BreadcrumbLink>
					</BreadcrumbItem>
				</BreadcrumbList>
			</Breadcrumb>
			<div className="h-auto rounded-lg bg-gradient-to-br from-primary to-indigo-500 p-8 text-indigo-500">
				<div className="max-w-6xl px-4">
					<header className="mb-8">
						{actividad && (
							<>
								<h1 className="mb-2 text-center text-3xl font-bold text-gray-800">
									{actividad.name}
								</h1>
								<p className="text-center text-gray-600">
									{actividad.description}
								</p>
								<p className="text-center text-gray-600">
									Docente: {actividad.lesson.courseInstructor}
								</p>
								{actividad.type.id === 1 ? (
									<>
										<ActSubida activityId={actividad.id} />
									</>
								) : actividad.type.id === 2 ? (
									<>
										<VerQuestionList
											activityId={actividad.id}
											onQuestionAnswered={handleQuestionResult}
										/>
										<VerListPreguntaAbierta
											activityId={actividad.id}
											onQuestionAnswered={handleQuestionResult}
										/>
										<VerQuestionVOFList
											activityId={actividad.id}
											onQuestionAnswered={handleQuestionResult}
										/>

										{activityScore.totalQuestions > 0 && (
											<div
												className={`mt-4 rounded-lg p-4 text-center ${
													activityScore.passed ? 'bg-green-100' : 'bg-red-100'
												}`}
											>
												<h3 className="text-lg font-semibold">
													Resultado de la Actividad
												</h3>
												<p>
													Preguntas respondidas: {activityScore.totalQuestions}
												</p>
												<p>
													Respuestas correctas: {activityScore.correctAnswers}
												</p>
												<p>
													Porcentaje: {activityScore.percentage.toFixed(2)}%
												</p>
												<p
													className={`font-bold ${
														activityScore.passed
															? 'text-green-600'
															: 'text-red-600'
													}`}
												>
													{activityScore.passed
														? '¡Felicitaciones! Has aprobado la actividad 🎉'
														: 'No has alcanzado el porcentaje mínimo requerido ❌'}
												</p>
											</div>
										)}
									</>
								) : actividad.type.id === 4 ? (
									<>
										<ResponderPreguntas
											onQuestionAnswered={handleQuestionResult}
											activityId={actividad.id}
										/>
									</>
								) : (
									<>
										Actividad no encontrada, escribenos y comentanos que
										actividad te gustaria ver aqui en Artiefy!!.
									</>
								)}
							</>
						)}
					</header>
				</div>
			</div>
		</>
	);
};

export default RealizarActividad;
