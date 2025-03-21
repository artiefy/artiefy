'use client';

import { useEffect, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import { ArrowRightIcon } from '@heroicons/react/24/solid';
import { ArrowUpFromLine } from 'lucide-react';

import { LoadingCourses } from '~/app/dashboard/educadores/(inicio)/cursos/page';
import { Badge } from '~/components/educators/ui/badge';
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from '~/components/educators/ui/card';

import ModalFormLessons from '../modals/ModalFormLessons';
import { Button } from '../ui/button';

// Interfaz para las lecciones
interface LessonsModels {
	id: number;
	title: string;
	coverImageKey: string | null;
	coverVideoKey: string | null;
	resourceKey: string | null;
	description: string;
	createdAt: string;
	duration: number;
	course: {
		id: number;
		title: string;
		description: string;
		instructor: string;
	};
}

// Propiedades del componente para la lista de lecciones
interface LessonsListProps {
	courseId: number;
	selectedColor: string;
}

const LessonsListEducator: React.FC<LessonsListProps> = ({
	courseId,
	selectedColor,
}) => {
	const [lessons, setLessons] = useState<LessonsModels[]>([]); // Estado para las lecciones
	const [loading, setLoading] = useState(true); // Estado para el estado de carga
	const [error, setError] = useState<string | null>(null); // Estado para el error
	const [isModalOpenLessons, setIsModalOpenLessons] = useState(false); // Estado para el modal de creación de lecciones

	// Convertimos el courseId a string
	const courseIdString = courseId.toString();

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
		if (courseId) {
			const fetchLessons = async () => {
				setLoading(true);
				setError(null);
				try {
					const response = await fetch(
						`/api/educadores/lessons?courseId=${courseIdString}`
					);

					if (!response.ok) {
						const errorData = (await response.json()) as { error?: string };
						throw new Error(
							errorData.error ?? 'Error al obtener las lecciones'
						);
					}

					const data = (await response.json()) as LessonsModels[];
					setLessons(data); // Setea las lecciones obtenidas
				} catch (error) {
					setError('Error al obtener las lecciones'); // Error general
					console.error('Error al obtener las lecciones:', error);
				} finally {
					setLoading(false);
				}
			};

			void fetchLessons();
		}
	}, [courseId, courseIdString]); // Este efecto se ejecuta cada vez que el courseId cambia

	// Condicionales de renderizado: carga, error, lecciones vacías
	if (loading) {
		return <LoadingCourses />; // Componente de carga mientras obtenemos los datos
	}
	if (lessons.length === 0 || lessons === null) {
		return (
			<div className="my-7 items-center justify-center gap-4 px-8 text-center lg:px-5">
				<h2 className={`mb-4 text-2xl font-bold text-primary`}>
					Lista de clases creadas
				</h2>
				<p className="text-xl text-gray-600">
					No hay clases creadas hasta el momento
				</p>
				<p className="my-2 text-gray-500">
					Comienza creando tu primer clase haciendo clic en el botón de abajo
					<br /> &quot;Crear Clase&quot;
				</p>
				<span>&#128071;&#128071;&#128071;</span>
				<div className="mt-3">
					<Button
						style={{ backgroundColor: selectedColor }}
						className={`cursor-pointer border-transparent font-semibold text-black ${
							selectedColor === '#FFFFFF' ? 'text-black' : 'text-white'
						}`}
						onClick={() => {
							setIsModalOpenLessons(true);
						}}
					>
						<ArrowUpFromLine />
						Crear nueva clase
					</Button>
				</div>
				<ModalFormLessons
					isOpen={isModalOpenLessons}
					onCloseAction={() => setIsModalOpenLessons(false)}
					courseId={courseId}
					uploading={false}
				/>
			</div>
		);
	}
	if (error) {
		return <div>Se presentó un error: {error}</div>;
	}

	// Renderizamos las lecciones si todo es correcto
	return (
		<>
			<h2 className={`mb-4 mt-10 text-2xl font-bold`}>Lista de clases:</h2>
			<div className="mb-5 flex w-full flex-col">
				<div className="grid grid-cols-1 gap-4 px-3 sm:grid-cols-2 lg:grid-cols-2 lg:px-1">
					{lessons.map((lesson, index) => (
						<div key={index} className="group relative">
							<div className="animate-gradient absolute -inset-0.5 rounded-xl bg-gradient-to-r from-[#3AF4EF] via-[#00BDD8] to-[#01142B] opacity-0 blur transition duration-500 group-hover:opacity-100" />
							<Card
								key={lesson.id}
								className="relative flex flex-col overflow-hidden border-0 border-transparent bg-white px-2 pt-2 text-black transition-transform duration-300 ease-in-out zoom-in hover:scale-[1.02]"
								style={{
									backgroundColor: selectedColor,
									color: getContrastYIQ(selectedColor),
								}}
							>
								<div className="relative grid grid-cols-1 p-5 lg:grid-cols-2">
									<CardHeader>
										<div className="relative size-full">
											<Image
												src={
													lesson.coverImageKey
														? `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${lesson.coverImageKey}`
														: `/favicon.ico`
												}
												alt={lesson.title}
												className="rounded-lg object-cover px-2 pt-2 transition-transform duration-300 hover:scale-105"
												width={350}
												height={100}
												quality={75}
											/>
										</div>
									</CardHeader>
									<CardContent
										className={`flex grow flex-col justify-between space-y-2 px-2 ${
											selectedColor === '#FFFFFF' ? 'text-black' : 'text-white'
										}`}
									>
										<CardTitle className="rounded-lg text-lg text-primary">
											Clase: {lesson.title}
										</CardTitle>
										<div className="mb-2 items-center">
											<p className="text-sm font-bold">
												Perteneciente al curso:
											</p>

											<Badge
												variant="outline"
												className="border-primary bg-background text-primary ml-1 hover:bg-black/70"
											>
												{lesson.course.title}
											</Badge>
										</div>
										<div className="mb-2 line-clamp-2 flex flex-col text-sm">
											<p>Descripción:</p>
											<p> {lesson.description}</p>
										</div>
										<p className="text-sm font-bold italic">
											Educador:{' '}
											<Badge
												variant="outline"
												className="ml-1 w-fit border-primary bg-background text-primary hover:bg-black/70"
											>
												{lesson.course.instructor}
											</Badge>
										</p>
										<p className="text-sm font-bold italic">
											Duración:{' '}
											<span className="font-bold italic">
												{lesson.duration} Minutos
											</span>
										</p>
									</CardContent>
								</div>
								<CardFooter className="-mt-6 flex flex-col items-start justify-between">
									<Button asChild className="mx-auto">
										<Link
											href={`/dashboard/educadores/cursos/${courseId}/${lesson.id}`}
											className={`group/button relative inline-flex items-center justify-center overflow-hidden rounded-md border border-white/20 bg-yellow-500 p-2 text-white hover:border-yellow-600 hover:bg-yellow-500 active:scale-95`}
										>
											<p>Ver clase</p>
											<ArrowRightIcon className="animate-bounce-right size-5" />
											<div className="absolute inset-0 flex w-full [transform:skew(-13deg)_translateX(-100%)] justify-center group-hover/button:[transform:skew(-13deg)_translateX(100%)] group-hover/button:duration-1000">
												<div className="relative h-full w-10 bg-white/30" />
											</div>
										</Link>
									</Button>
								</CardFooter>
							</Card>
						</div>
					))}
				</div>
				<div className="mx-auto my-4">
					<Button
						className={`mx-auto mt-6 cursor-pointer justify-center border-transparent bg-white font-semibold ${
							selectedColor === '#FFFFFF' ? 'text-black' : 'text-white'
						}`}
						style={{ backgroundColor: selectedColor }}
						onClick={() => {
							console.log('Botón Crear nueva clase clickeado');
							setIsModalOpenLessons(true);
							console.log('isModalOpenLessons:', isModalOpenLessons);
						}}
					>
						<ArrowUpFromLine />
						Crear nueva clase
					</Button>
				</div>
			</div>
			<ModalFormLessons
				isOpen={isModalOpenLessons}
				onCloseAction={() => setIsModalOpenLessons(false)}
				courseId={courseId}
				uploading={false}
			/>
		</>
	);
};

export default LessonsListEducator;
