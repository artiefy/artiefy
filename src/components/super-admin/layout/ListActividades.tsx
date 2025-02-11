'use client';
import { useEffect, useState } from 'react';
import { ArrowRightIcon } from '@heroicons/react/24/solid';
import Image from 'next/image';
import Link from 'next/link';
import { LoadingCourses } from '~/app/dashboard/educadores/(inicio)/cursos/page';
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
	typeid: number;
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

	const lessonIdString = lessonId.toString();

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
		if (lessonId) {
			const fetchLessons = async () => {
				setLoading(true);
				setError(null);
				try {
					const response = await fetch(
						`/api/educadores/actividades?lessonId=${lessonIdString}`
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
	}, [lessonId]); // Este efecto se ejecuta cada vez que el courseId cambia

	// Condicionales de renderizado: carga, error, lecciones vacías
	if (loading) {
		return <LoadingCourses />; // Componente de carga mientras obtenemos los datos
	}
	if (actividades.length === 0 || actividades === null) {
		return (
			<div className="bg-background mt-4 flex flex-col items-center justify-center rounded-lg py-10 text-center">
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
			<h2 className="mt-10 mb-4 text-2xl font-bold">Lista de actividades:</h2>
			<div className="flex w-full flex-col">
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
					{actividades.map((actividad, index) => (
						<div key={index} className="group relative h-auto w-full">
							<div className="animate-gradient absolute -inset-0.5 rounded-xl bg-linear-to-r from-[#3AF4EF] via-[#00BDD8] to-[#01142B] opacity-0 blur-sm transition duration-500 group-hover:opacity-100"></div>
							<Card
								className="relative z-20 flex flex-col border-transparent bg-black hover:scale-100"
								style={{
									backgroundColor: selectedColor,
									color: getContrastYIQ(selectedColor),
								}}
							>
								<CardHeader>
									<Image
										src={`${process.env.NEXT_PUBLIC_AWS_S3_URL}/${coverImageKey}`}
										alt={actividad.name || 'Imagen del curso'}
										className={`relative mx-auto h-auto w-40 rounded-lg object-cover transition-opacity duration-500`}
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
										<div className="font-bold">Actividad: {actividad.name}</div>
									</CardTitle>
									<div className="my-2 flex flex-col space-y-2">
										<p className="text-sm font-bold">
											Clase: {actividad.lessonsId.title}
										</p>
										<p className="text-sm font-bold">
											Descripcion: {actividad.description}
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
										<div className="absolute inset-0 flex w-full [transform:skew(-13deg)_translateX(-100%)] justify-center group-hover/button:[transform:skew(-13deg)_translateX(100%)] group-hover/button:duration-1000">
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
