'use client';
import { useEffect, useState } from 'react';
import { ArrowRightIcon } from '@heroicons/react/24/solid';
import Image from 'next/image';
import Link from 'next/link';
import { LoadingCourses } from '~/app/dashboard/educadores/(inicio)/cursos/page';
import { Button } from '~/components/educators/ui/button';
import { Card, CardContent, CardTitle } from '~/components/educators/ui/card';

// Interfaz para las actividades
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

// Propiedades del componente para la lista de actividades
interface ActividadListProps {
	lessonId: number;
	selectedColor: string;
	coverImageKey: string | null;
	courseId: number;
}

const ListActividadesLookStudent: React.FC<ActividadListProps> = ({
	lessonId,
	selectedColor,
	courseId,
	coverImageKey,
}) => {
	const [actividades, setActividades] = useState<ActividadModels[]>([]); // Estado para las actividades
	const [loading, setLoading] = useState(true); // Estado para el estado de carga
	const [error, setError] = useState<string | null>(null); // Estado para el error

	// Convertimos el lessonId a string
	const lessonIdString = lessonId.toString();

	// Función para obtener el contraste de un color
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
	}, [lessonId, lessonIdString]); // Este efecto se ejecuta cada vez que el courseId cambia

	// Condicionales de renderizado: carga, error, lecciones vacías
	if (loading) {
		return <LoadingCourses />; // Componente de carga mientras obtenemos los datos
	}
	if (error) {
		return <div>Se presentó un error: {error}</div>;
	}

	// Renderizamos las lecciones si todo es correcto
	return (
		<>
			<div className="flex flex-col gap-4">
				{actividades.map((actividad, index) => (
					<div
						key={index}
						className="group relative size-full border-black shadow-2xl"
					>
						{/* <div className="animate-gradient absolute -inset-0.5 rounded-xl bg-gradient-to-r from-[#3AF4EF] via-[#00BDD8] to-[#01142B] opacity-0 blur transition duration-500 group-hover:opacity-100"></div> */}
						<Card
							className="relative z-20 flex flex-wrap space-y-2 border-transparent bg-black p-2 py-1 hover:scale-100 md:grid-cols-2 lg:flex lg:grid-cols-2"
							style={{
								backgroundColor: selectedColor,
								color: getContrastYIQ(selectedColor),
							}}
						>
							<div>
								<Image
									src={`${process.env.NEXT_PUBLIC_AWS_S3_URL}/${coverImageKey}`}
									alt="Actividad"
									className="mx-auto mt-8 h-20 w-full items-center justify-center rounded-lg object-contain"
									width={300}
									height={200}
									quality={100}
								/>
							</div>
							<CardContent
								className={`p-2 ${
									selectedColor === '#FFFFFF' ? 'text-black' : 'text-white'
								}`}
							>
								<CardTitle className="text-lg">
									<div className="font-bold">Actividad: {actividad.name}</div>
								</CardTitle>
								<div className="flex flex-col space-y-2">
									<p className="text-sm font-bold">
										Clase: {actividad.lessonsId.title}
									</p>
									<p className="text-sm font-bold">
										Descripcion: {actividad.description}
									</p>
									<p className="text-sm font-bold">
										Tipo de actividad: {actividad.type.name}
									</p>
								</div>
								<Button className="mt-2 border-none p-0">
									<Link
										href={`/dashboard/educadores/cursos/${courseId}/${lessonIdString}/actividades/${actividad.id}`}
										className="group/button relative inline-flex w-full items-center justify-center overflow-hidden rounded-md border border-white/20 bg-orange-400 p-2 text-black active:scale-95"
									>
										<p className="font-bold">Ver actividad</p>
										<ArrowRightIcon className="animate-bounce-right size-5" />
										<div className="absolute inset-0 flex w-full justify-center [transform:skew(-13deg)_translateX(-100%)] group-hover/button:duration-1000 group-hover/button:[transform:skew(-13deg)_translateX(100%)]">
											<div className="relative h-full w-10 bg-white/30"></div>
										</div>
									</Link>
								</Button>
							</CardContent>
						</Card>
					</div>
				))}
			</div>
		</>
	);
};

export default ListActividadesLookStudent;
