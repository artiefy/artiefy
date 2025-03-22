'use client';

import '~/styles/buttonclass.css';
import '~/styles/check.css';
import { useState, useMemo, useCallback } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { PencilRuler } from 'lucide-react';
import {
	FaChevronDown,
	FaChevronUp,
	FaLock,
	FaCheckCircle,
	FaCrown,
	FaCheck,
} from 'react-icons/fa';

import {
	Alert,
	AlertDescription,
	AlertTitle,
} from '~/components/estudiantes/ui/alert';
import { Button } from '~/components/estudiantes/ui/button';
import { Progress } from '~/components/estudiantes/ui/progress';
import { cn } from '~/lib/utils';

import type { Course } from '~/types';

interface CourseContentProps {
	course: Course;
	isEnrolled: boolean;
	isSubscriptionActive: boolean;
	subscriptionEndDate: string | null;
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export function CourseContent({
	course,
	isEnrolled,
	isSubscriptionActive,
	subscriptionEndDate,
}: CourseContentProps) {
	const [expandedLesson, setExpandedLesson] = useState<number | null>(null);
	const router = useRouter();

	const toggleLesson = useCallback(
		(lessonId: number) => {
			if (isEnrolled) {
				setExpandedLesson(expandedLesson === lessonId ? null : lessonId);
			}
		},
		[expandedLesson, isEnrolled]
	);

	const memoizedLessons = useMemo(() => {
		return course.lessons
			.sort((a, b) => a.title.localeCompare(b.title))
			.map((lesson, index) => {
				const isUnlocked =
					isEnrolled &&
					(course.courseType?.requiredSubscriptionLevel === 'none' ||
						isSubscriptionActive) &&
					!lesson.isLocked;

				const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
					e.preventDefault();
					router.push(`/estudiantes/clases/${lesson.id}`);
				};

				return (
					<div
						key={lesson.id}
						className={`overflow-hidden rounded-lg border transition-colors ${
							isUnlocked
								? 'bg-gray-50 hover:bg-gray-100'
								: 'bg-gray-100 opacity-75'
						}`}
					>
						<button
							className="flex w-full items-center justify-between px-6 py-4"
							onClick={() => toggleLesson(lesson.id)}
							disabled={!isUnlocked}
						>
							<div className="flex w-full items-center justify-between">
								<div className="flex items-center space-x-2">
									{isUnlocked ? (
										<FaCheckCircle className="mr-2 size-5 text-green-500" />
									) : (
										<FaLock className="mr-2 size-5 text-gray-400" />
									)}
									<span className="font-medium text-background">
										Clase {index + 1}: {lesson.title}{' '}
										<span className="ml-2 text-sm text-gray-500">
											({lesson.duration} mins)
										</span>
									</span>
								</div>
								<div className="flex items-center space-x-2">
									{isUnlocked &&
										lesson.isNew &&
										lesson.porcentajecompletado === 0 && (
											<span className="ml-2 rounded bg-green-500 px-2 py-1 text-xs text-white">
												Nuevo
											</span>
										)}
									{isUnlocked &&
										(expandedLesson === lesson.id ? (
											<FaChevronUp className="text-gray-400" />
										) : (
											<FaChevronDown className="text-gray-400" />
										))}
								</div>
							</div>
						</button>
						{expandedLesson === lesson.id && isUnlocked && (
							<div className="border-t bg-white px-6 py-4">
								<p className="mb-4 text-gray-700">
									{lesson.description ??
										'No hay descripción disponible para esta clase.'}
								</p>
								<div className="mb-4">
									<div className="mb-2 flex items-center justify-between">
										<p className="text-sm font-semibold text-gray-700">
											Progreso De La Clase:
										</p>
									</div>
									<Progress
										value={lesson.porcentajecompletado}
										showPercentage={true}
										className="transition-none"
									/>
								</div>
								<Link
									href={`/estudiantes/clases/${lesson.id}`}
									onClick={handleClick}
								>
									<button className="buttonclass text-background transition-none active:scale-95">
										<div className="outline" />
										<div className="state state--default">
											<div className="icon">
												<svg
													xmlns="http://www.w3.org/2000/svg"
													fill="none"
													viewBox="0 0 24 24"
													height="1.2em"
													width="1.2em"
												>
													<g style={{ filter: 'url(#shadow)' }}>
														<path
															fill="currentColor"
															d="M14.2199 21.63C13.0399 21.63 11.3699 20.8 10.0499 16.83L9.32988 14.67L7.16988 13.95C3.20988 12.63 2.37988 10.96 2.37988 9.78001C2.37988 8.61001 3.20988 6.93001 7.16988 5.60001L15.6599 2.77001C17.7799 2.06001 19.5499 2.27001 20.6399 3.35001C21.7299 4.43001 21.9399 6.21001 21.2299 8.33001L18.3999 16.82C17.0699 20.8 15.3999 21.63 14.2199 21.63ZM7.63988 7.03001C4.85988 7.96001 3.86988 9.06001 3.86988 9.78001C3.86988 10.5 4.85988 11.6 7.63988 12.52L10.1599 13.36C10.3799 13.43 10.5599 13.61 10.6299 13.83L11.4699 16.35C12.3899 19.13 13.4999 20.12 14.2199 20.12C14.9399 20.12 16.0399 19.13 16.9699 16.35L19.7999 7.86001C20.3099 6.32001 20.2199 5.06001 19.5699 4.41001C18.9199 3.76001 17.6599 3.68001 16.1299 4.19001L7.63988 7.03001Z"
														/>
														<path
															fill="currentColor"
															d="M10.11 14.4C9.92005 14.4 9.73005 14.33 9.58005 14.18C9.29005 13.89 9.29005 13.41 9.58005 13.12L13.16 9.53C13.45 9.24 13.93 9.24 14.22 9.53C14.51 9.82 14.51 10.3 14.22 10.59L10.64 14.18C10.5 14.33 10.3 14.4 10.11 14.4Z"
														/>
													</g>
													<defs>
														<filter id="shadow">
															<feDropShadow
																floodOpacity="0.6"
																stdDeviation="0.8"
																dy="1"
																dx="0"
															/>
														</filter>
													</defs>
												</svg>
											</div>
											<p>
												<span style={{ '--i': 0 } as React.CSSProperties}>
													V
												</span>
												<span style={{ '--i': 1 } as React.CSSProperties}>
													e
												</span>
												<span style={{ '--i': 2 } as React.CSSProperties}>
													r
												</span>
												<span style={{ '--i': 3 } as React.CSSProperties}>
													{' '}
												</span>
												<span style={{ '--i': 4 } as React.CSSProperties}>
													C
												</span>
												<span style={{ '--i': 5 } as React.CSSProperties}>
													l
												</span>
												<span style={{ '--i': 6 } as React.CSSProperties}>
													a
												</span>
												<span style={{ '--i': 7 } as React.CSSProperties}>
													s
												</span>
												<span style={{ '--i': 8 } as React.CSSProperties}>
													e
												</span>
											</p>
										</div>
										<div className="state state--sent">
											<div className="icon">
												<svg
													stroke="black"
													strokeWidth="0.5px"
													width="1.2em"
													height="1.2em"
													viewBox="0 0 24 24"
													fill="none"
													xmlns="http://www.w3.org/2000/svg"
												>
													<g style={{ filter: 'url(#shadow)' }}>
														<path
															d="M12 22.75C6.07 22.75 1.25 17.93 1.25 12C1.25 6.07 6.07 1.25 12 1.25C17.93 1.25 22.75 6.07 22.75 12C22.75 17.93 17.93 22.75 12 22.75ZM12 2.75C6.9 2.75 2.75 6.9 2.75 12C2.75 17.1 6.9 21.25 12 21.25C17.1 21.25 21.25 17.1 21.25 12C21.25 6.9 17.1 2.75 12 2.75Z"
															fill="currentColor"
														/>
														<path
															d="M10.5795 15.5801C10.3795 15.5801 10.1895 15.5001 10.0495 15.3601L7.21945 12.5301C6.92945 12.2401 6.92945 11.7601 7.21945 11.4701C7.50945 11.1801 7.98945 11.1801 8.27945 11.4701L10.5795 13.7701L15.7195 8.6301C16.0095 8.3401 16.4895 8.3401 16.7795 8.6301C17.0695 8.9201 17.0695 9.4001 16.7795 9.6901L11.1095 15.3601C10.9695 15.5001 10.7795 15.5801 10.5795 15.5801Z"
															fill="currentColor"
														/>
													</g>
												</svg>
											</div>
											<p>
												<span style={{ '--i': 5 } as React.CSSProperties}>
													V
												</span>
												<span style={{ '--i': 6 } as React.CSSProperties}>
													i
												</span>
												<span style={{ '--i': 7 } as React.CSSProperties}>
													s
												</span>
												<span style={{ '--i': 8 } as React.CSSProperties}>
													t
												</span>
												<span style={{ '--i': 9 } as React.CSSProperties}>
													o
												</span>
												<span style={{ '--i': 10 } as React.CSSProperties}>
													!
												</span>
											</p>
										</div>
									</button>
								</Link>
							</div>
						)}
					</div>
				);
			});
	}, [
		course.lessons,
		expandedLesson,
		isEnrolled,
		isSubscriptionActive,
		router,
		toggleLesson,
		course.courseType?.requiredSubscriptionLevel,
	]);

	const isFullyCompleted = useMemo(() => {
		return course.lessons?.every(
			(lesson) => lesson.porcentajecompletado === 100
		);
	}, [course.lessons]);

	const handleSubscriptionRedirect = useCallback(() => {
		window.open('/planes', '_blank', 'noopener,noreferrer');
	}, []);

	const shouldShowSubscriptionAlert = useMemo(() => {
		return (
			isEnrolled &&
			!isSubscriptionActive &&
			course.courseType?.requiredSubscriptionLevel !== 'none'
		);
	}, [
		isEnrolled,
		isSubscriptionActive,
		course.courseType?.requiredSubscriptionLevel,
	]);

	const shouldBlurContent = useMemo(() => {
		const isPremiumOrPro =
			course.courseType?.requiredSubscriptionLevel !== 'none';
		return isEnrolled && !isSubscriptionActive && isPremiumOrPro;
	}, [
		isEnrolled,
		isSubscriptionActive,
		course.courseType?.requiredSubscriptionLevel,
	]);

	const formatDate = (dateString: string | null) => {
		if (!dateString) return '';
		return new Date(dateString).toLocaleDateString('es-ES', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
		});
	};

	return (
		<div className="relative rounded-lg border bg-white p-6 shadow-sm">
			<div className="mb-6 flex items-center justify-between">
				<h2 className="text-2xl font-bold text-background">
					Contenido del curso
				</h2>
				<div className="mt-6 flex flex-col items-end gap-2">
					{isSubscriptionActive && (
						<div className="flex items-center gap-2 text-green-500">
							<FaCheck className="size-4" />
							<span className="font-medium">Suscripción Activa</span>
						</div>
					)}
					{isSubscriptionActive && subscriptionEndDate && (
						<p className="text-sm text-red-500">
							Finaliza: {formatDate(subscriptionEndDate)}
						</p>
					)}
				</div>
			</div>

			{isEnrolled && isFullyCompleted && (
				<div className="artiefy-check-container mb-4">
					<h2 className="animate-pulse bg-gradient-to-r from-green-400 to-emerald-600 bg-clip-text text-3xl font-extrabold text-transparent drop-shadow-[0_2px_2px_rgba(0,200,0,0.4)]">
						¡Curso Completado!
					</h2>
					<div className="artiefy-static-checkmark" />
				</div>
			)}

			<PencilRuler
				className={`absolute top-4 right-7 transition-colors ${
					expandedLesson !== null ? 'text-orange-500' : 'text-gray-400'
				}`}
			/>
			{shouldShowSubscriptionAlert && (
				<Alert
					variant="destructive"
					className="mb-6 border-2 border-red-500 bg-red-50"
				>
					<div className="flex items-center gap-3">
						<FaCrown className="size-8 text-red-500" />
						<div className="flex-1">
							<AlertTitle className="mb-2 text-xl font-bold text-red-700">
								¡Tu suscripción ha expirado!
							</AlertTitle>
							<AlertDescription className="text-base text-red-600">
								<p className="mb-4">
									Para seguir disfrutando de todo el contenido premium y
									continuar tu aprendizaje, necesitas renovar tu suscripción.
								</p>
								<Button
									onClick={handleSubscriptionRedirect}
									className="transform rounded-lg bg-red-500 px-6 py-2 font-semibold text-white transition-all duration-300 hover:scale-105 hover:bg-red-600 active:scale-95"
								>
									<FaCrown className="mr-2" />
									Renovar Suscripción Ahora
								</Button>
							</AlertDescription>
						</div>
					</div>
				</Alert>
			)}

			<div
				className={cn(
					'transition-all duration-300',
					shouldBlurContent && 'pointer-events-none opacity-75 blur-[2px]',
					!isEnrolled && 'pointer-events-none opacity-75'
				)}
			>
				<div className="space-y-4">{memoizedLessons}</div>
			</div>
		</div>
	);
}
