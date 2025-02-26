'use client';
import { useEffect, useState } from 'react';
import { ArrowRightIcon } from '@heroicons/react/24/solid';
import Image from 'next/image';
import Link from 'next/link';
import { LoadingCourses } from '~/app/dashboard/educadores/(inicio)/cursos/page';
import { Badge } from '~/components/educators/ui/badge';
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from '~/components/educators/ui/card';

interface ActividadModels {
	id: number;
	name: string;
	description: string;
	type: {
		id: number;
		name: string;
	};
	lessonsId: {
		id: number;
		title: string;
	};
}

interface ActividadListProps {
	lessonId: number;
	selectedColor: string;
	coverImageKey: string | null;
	courseId: number;
}

const ListActividadesEducator: React.FC<ActividadListProps> = ({
	lessonId,
	selectedColor,
	courseId,
	coverImageKey,
}) => {
	const [actividades, setActividades] = useState<ActividadModels[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const lessonIdString = lessonId ? lessonId.toString() : '';

	console.log('lessonId:', lessonId);
	console.log('lessonIdString:', lessonIdString);

	const getContrastYIQ = (hexcolor: string) => {
		hexcolor = hexcolor.replace('#', '');
		const r = parseInt(hexcolor.substr(0, 2), 16);
		const g = parseInt(hexcolor.substr(2, 2), 16);
		const b = parseInt(hexcolor.substr(4, 2), 16);
		const yiq = (r * 299 + g * 587 + b * 114) / 1000;
		return yiq >= 128 ? 'black' : 'white';
	};

	// Fetch de las lecciones cuando el courseId cambia
	useEffect(() => {
		if (lessonIdString) {
			const fetchLessons = async () => {
				setLoading(true);
				setError(null);
				try {
					const response = await fetch(
						`/api/educadores/actividades/actividadesByLesson?lessonId=${lessonIdString}`
					);

					if (!response.ok) {
						const errorData = (await response.json()) as { error?: string };
						throw new Error(
							errorData.error ?? 'Error al obtener las lecciones'
						);
					}

					const data = (await response.json()) as ActividadModels[];
					setActividades(data); // Setea las lecciones obtenidas
				} catch (error) {
					setError('Error al obtener las lecciones'); // Error general
					console.error('Error al obtener las lecciones:', error);
				} finally {
					setLoading(false);
				}
			};

			void fetchLessons();
		}
	}, [lessonIdString]); // Este efecto se ejecuta cada vez que el courseId cambia

	// Condicionales de renderizado: carga, error, lecciones vacías
	if (loading) {
		return <LoadingCourses />; // Componente de carga mientras obtenemos los datos
	}
	if (actividades.length === 0 || actividades === null) {
		return (
			<div className="mt-4 flex flex-col items-center justify-center rounded-lg bg-background py-10 text-center">
				<h2 className="mb-4 text-2xl font-bold">
					Lista de actividades creadas
				</h2>
				<p className="text-xl text-gray-600">
					No hay actividades creadas hasta el momento
				</p>
			</div>
		);
	}
	if (error) {
		return <div>Se presentó un error: {error}</div>;
	}

	// Renderizamos las lecciones si todo es correcto
	return (
		<>
			<h2 className="mb-4 mt-10 text-2xl font-bold">Lista de actividades:</h2>
			<div className="flex w-full flex-col">
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
					{actividades.map((actividad, index) => (
						<div key={index} className="group relative size-full">
							<div className="animate-gradient absolute -inset-0.5 rounded-xl bg-gradient-to-r from-[#3AF4EF] via-[#00BDD8] to-[#01142B] opacity-0 blur transition duration-500 group-hover:opacity-100"></div>
							<Card
								className="relative z-20 flex h-auto flex-col border-transparent bg-black hover:scale-100" // Añadir h-80 para altura fija
								style={{
									backgroundColor: selectedColor,
									color: getContrastYIQ(selectedColor),
								}}
							>
								<CardHeader>
									<Image
										src={
											coverImageKey
												? `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${coverImageKey}`
												: `/favicon.ico`
										}
										alt={actividad.name || 'Imagen del curso'}
										className={`relative mx-auto w-40 rounded-lg object-cover transition-opacity duration-500`}
										height={150}
										width={150}
										quality={75}
									/>
								</CardHeader>
								<CardContent
									className={`${
										selectedColor === '#FFFFFF' ? 'text-black' : 'text-white'
									}`}
								>
									<CardTitle className="text-lg">
										<div className="font-bold">
											Actividad: <p>{actividad.name}</p>
										</div>
									</CardTitle>
									<div className="my-2 flex flex-col space-y-2">
										<p className="flex flex-col text-sm font-bold">
											Clase:
											<Badge
												variant="outline"
												className="w-fit border-primary bg-background text-primary hover:bg-black/70"
											>
												{actividad.lessonsId.title}
											</Badge>
										</p>
										<p className="flex flex-col text-sm font-bold">
											Descripcion: <span>{actividad.description}</span>
										</p>
										<p className="flex flex-col text-sm font-bold">
											Tipo de actividad: <span> {actividad.type.name}</span>
										</p>
									</div>
								</CardContent>

								<CardFooter className="-mt-4 flex flex-col items-start justify-between">
									<Link
										href={`/dashboard/educadores/cursos/${courseId}/${lessonIdString}/actividades/${actividad.id}`}
										className={`group/button relative mx-auto inline-flex items-center justify-center overflow-hidden rounded-md border border-white/20 bg-yellow-500 p-2 text-white hover:border-yellow-600 hover:bg-yellow-500 active:scale-95`}
									>
										<p>Ver actividad</p>
										<ArrowRightIcon className="animate-bounce-right size-5" />
										<div className="absolute inset-0 flex w-full justify-center [transform:skew(-13deg)_translateX(-100%)] group-hover/button:duration-1000 group-hover/button:[transform:skew(-13deg)_translateX(100%)]">
											<div className="relative h-full w-10 bg-white/30"></div>
										</div>
									</Link>
								</CardFooter>
							</Card>
						</div>
					))}
				</div>
			</div>
		</>
	);
};

export default ListActividadesEducator;
