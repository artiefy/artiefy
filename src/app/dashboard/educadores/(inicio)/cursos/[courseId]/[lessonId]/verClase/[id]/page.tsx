'use client';

import { useEffect, useState } from 'react';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

import { useUser } from '@clerk/nextjs';
import { ArrowRightIcon, ArrowLeftIcon } from '@heroicons/react/24/solid';
import { toast } from 'sonner';

import ListActividadesLookStudent from '~/components/educators/layout/ListActividadesByStudent';
import VerFileByStudent from '~/components/educators/layout/verFileBystudent';
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbSeparator,
} from '~/components/super-admin/ui/breadcrumb';
import { Button } from '~/components/educators/ui/button';

// Ver clase como vista estudiantes, consideraciones: Lo mismo que en course

// Definir la interfaz de la lección
interface Lessons {
	id: number;
	title: string;
	description: string;
	coverImageKey: string;
	coverVideoKey: string;
	resourceKey: string;
	resourceName: string;
	duration: number;
	order: number;
	course: {
		id: number;
		title: string;
		description: string;
		instructor: string;
		modalidadId: string;
		categoryId: string;
	};
	createdAt: string;
	updatedAt: string;
}

// const getContrastYIQ = (hexcolor: string) => {
// 	if (!hexcolor) return 'black'; // Manejar el caso de color indefinido
// 	hexcolor = hexcolor.replace('#', '');
// 	const r = parseInt(hexcolor.substr(0, 2), 16);
// 	const g = parseInt(hexcolor.substr(2, 2), 16);
// 	const b = parseInt(hexcolor.substr(4, 2), 16);
// 	const yiq = (r * 299 + g * 587 + b * 114) / 1000;
// 	return yiq >= 128 ? 'black' : 'white';
// };

const Page: React.FC<{ selectedColor: string }> = ({ selectedColor }) => {
	const [selectedLessonId, setSelectedLessonId] = useState<number | null>(null); // Estado para almacenar el id de la lección seleccionada
	const { user } = useUser(); // Obtener el usuario actual
	const params = useParams(); // Obtener los parámetros de la URL
	const courseId = params?.courseId ?? null; // Obtener el id del curso de los parámetros
	const lessonId = params?.lessonId ?? null; // Obtener el id de la lección de los parámetros
	const [lessons, setLessons] = useState<Lessons | null>(null); // Estado para almacenar la lección
	const [loading, setLoading] = useState(true); // Estado para almacenar el estado de carga
	const [error, setError] = useState<string | null>(null); // Estado para almacenar errores
	const [color, setColor] = useState<string>(selectedColor || '#FFFFFF'); // Estado para almacenar el color de la lección
	const router = useRouter(); // Obtener el router

	// Convertir el id del curso a número
	const courseIdString = Array.isArray(courseId) ? courseId[0] : courseId;
	const courseIdNumber = courseIdString ? parseInt(courseIdString) : null;
	console.log(
		`courseIdString: ${courseIdString}, courseIdNumber: ${courseIdNumber}`
	);

	// Obtener el color de la lección guardado en el local storage
	useEffect(() => {
		const savedColor = localStorage.getItem(
			`selectedColor_${Array.isArray(courseId) ? courseId[0] : courseId}`
		);
		if (savedColor) {
			setColor(savedColor);
		}
		console.log(`Color guardado lessons: ${savedColor}`);
	}, [courseId]);

	// Obtener la lección
	useEffect(() => {
		if (!lessonId) {
			setError('lessonId is null or invalid');
			setLoading(false);
			return;
		}

		const lessonsId2 = Array.isArray(lessonId) ? lessonId[0] : (lessonId ?? '');
		const lessonsIdNumber = parseInt(lessonsId2 ?? '');
		if (isNaN(lessonsIdNumber) || lessonsIdNumber <= 0) {
			setError('lessonId is not a valid number');
			setLoading(false);
			return;
		}

		const fetchLessons = async () => {
			if (!user) return;
			try {
				setLoading(true);
				setError(null);
				const response = await fetch(
					`/api/educadores/lessons/${lessonsIdNumber}`
				);
				if (response.ok) {
					const data = (await response.json()) as Lessons;
					setLessons(data);
				} else {
					const errorData = (await response.json()) as { error?: string };
					const errorMessage = errorData.error ?? response.statusText;
					setError(`Error al cargar la leccion: ${errorMessage}`);
					toast('Error', {
						description: `No se pudo cargar la leccion: ${errorMessage}`,
					});
				}
			} catch (error) {
				const errorMessage =
					error instanceof Error ? error.message : 'Error desconocido';
				setError(`Error al cargar la leccion: ${errorMessage}`);
				toast('Error', {
					description: `No se pudo cargar la leccion: ${errorMessage}`,
				});
			} finally {
				setLoading(false);
			}
		};

		fetchLessons().catch((error) =>
			console.error('Error fetching lessons:', error)
		);
	}, [user, lessonId]);

	// Mostrar un mensaje de carga si la lección está cargando
	if (loading) {
		return (
			<main className="flex h-screen items-center justify-center">
				<div className="size-32 animate-spin rounded-full border-y-2 border-primary">
					<span className="sr-only" />
				</div>
				<span className="text-primary">Cargando...</span>
			</main>
		);
	}

	// Mostrar un mensaje de error si la lección no se pudo cargar
	if (error) return <div>Error: {error}</div>;
	// Mostrar un mensaje si no se encontró la lección
	if (!lessons) return <div>No se encontró la leccion.</div>;

	// Funcion para navegar entre las clases 'prev'' y ''next', no finalizado
	const handleNavigation = (direction: 'prev' | 'next', lessons: Lessons[]) => {
		const sortedLessons = [...(lessons ?? [])].sort(
			(a, b) => a.order - b.order
		);
		const currentIndex = sortedLessons.findIndex(
			(l) => l.id === selectedLessonId
		);

		if (direction === 'prev') {
			for (let i = currentIndex - 1; i >= 0; i--) {
				const prevLesson = sortedLessons[i];
				if (prevLesson) {
					setSelectedLessonId(prevLesson.id);
					router.push(
						`/dashboard/educadores/cursos/${courseIdNumber}/${prevLesson.id}/verClase/${prevLesson.id}`
					);
					return;
				}
			}
			toast('Información', {
				description: 'No hay más clases anteriores.',
			});
		} else if (direction === 'next') {
			for (let i = currentIndex + 1; i < sortedLessons.length; i++) {
				const nextLesson = sortedLessons[i];
				if (nextLesson) {
					setSelectedLessonId(nextLesson.id);
					router.push(
						`/dashboard/educadores/cursos/${courseIdNumber}/${nextLesson.id}/verClase/${nextLesson.id}`
					);
					return;
				}
			}
			toast('Información', {
				description: 'No hay más clases siguientes.',
			});
		}
	};

	// Renderizar la vista de la clase
	return (
		<>
			<div className="container">
				<Breadcrumb>
					<BreadcrumbList>
						<BreadcrumbItem>
							<BreadcrumbLink
								className="text-primary hover:text-gray-300"
								href="/dashboard/super-admin"
							>
								Inicio
							</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbLink
								className="text-primary hover:text-gray-300"
								href="/dashboard/super-admin/cursos"
							>
								Lista de cursos
							</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbLink
								className="text-primary hover:text-gray-300"
								href={`/dashboard/super-admin/cursos/${courseIdNumber}`}
							>
								Detalles curso
							</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbLink
								href={`#`}
								onClick={() => window.history.back()}
								className="text-primary hover:text-gray-300"
							>
								Detallados de la clase
							</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbLink className="text-primary hover:text-gray-300">
								Vista de la clase: {lessons.title}
							</BreadcrumbLink>
						</BreadcrumbItem>
					</BreadcrumbList>
				</Breadcrumb>
				<div className="mt-4 flex items-center justify-between">
					<Button onClick={() => handleNavigation('prev', [lessons])}>
						<ArrowLeftIcon className="animate-bounce-right size-5" />
						<div className="absolute inset-0 flex w-full [transform:skew(-13deg)_translateX(-100%)] justify-center group-hover/button:[transform:skew(-13deg)_translateX(100%)] group-hover/button:duration-1000">
							<div className="relative h-full w-10 bg-white/30" />
						</div>
						Clase Anterior
					</Button>
					<Button onClick={() => handleNavigation('next', [lessons])}>
						Siguiente Clase
						<ArrowRightIcon className="animate-bounce-right size-5" />
						<div className="absolute inset-0 flex w-full [transform:skew(-13deg)_translateX(-100%)] justify-center group-hover/button:[transform:skew(-13deg)_translateX(100%)] group-hover/button:duration-1000">
							<div className="relative h-full w-10 bg-white/30" />
						</div>
					</Button>
				</div>
				<div className="group relative h-auto w-full">
					<div className="animate-gradient absolute -inset-0.5 rounded-xl bg-gradient-to-r from-[#3AF4EF] via-[#00BDD8] to-[#01142B] opacity-0 blur transition duration-500 group-hover:opacity-100" />
					<div
						className="relative z-20 container mt-4 grid grid-cols-1 gap-5 rounded-lg bg-black p-5 md:grid-cols-2 lg:grid-cols-2"
						style={{ backgroundColor: color }}
					>
						{/* Columna derecha - Información */}
						<div>
							<h1 className="text-2xl font-bold">{lessons.title}</h1>
							<video
								className="mt-2 h-72 w-full rounded-lg object-contain"
								controls
							>
								<source
									src={`${process.env.NEXT_PUBLIC_AWS_S3_URL}/${lessons.coverVideoKey}`}
								/>
							</video>
							<div className="mt-4 rounded-lg bg-white p-4 text-black">
								<h2 className="text-2xl font-bold">Información de la clase</h2>
								<br />
								<div className="grid grid-cols-2">
									<div className="flex flex-col">
										<h2 className="text-lg font-semibold">Lección:</h2>
										<h1 className="mb-4 text-2xl font-bold">{lessons.title}</h1>
									</div>
									<div className="flex flex-col">
										<h2 className="text-lg font-semibold">Categoría:</h2>
										<p>{lessons.course?.categoryId}</p>
									</div>
								</div>
								<div className="mb-4">
									<h2 className="text-lg font-semibold">Descripción:</h2>
									<p className="text-justify">{lessons.description}</p>
								</div>
								<div className="grid grid-cols-2">
									<div className="flex flex-col">
										<h2 className="text-lg font-semibold">Educador:</h2>
										<p>{lessons.course?.instructor}</p>
									</div>
									<div className="flex flex-col">
										<h2 className="text-lg font-semibold">Modalidad:</h2>
										<p>{lessons.course?.modalidadId}</p>
									</div>
								</div>
							</div>
							<VerFileByStudent lessonId={lessons.id} selectedColor={color} />
						</div>
						<div>
							<ListActividadesLookStudent
								lessonId={lessons.id}
								courseId={courseIdNumber ?? 0}
								coverImageKey={lessons.coverImageKey}
								selectedColor={color}
							/>
						</div>
						<Link
							href={'#'}
							onClick={() => window.history.back()}
							className="group/button relative inline-flex w-1/2 items-center justify-center overflow-hidden rounded-lg border border-white/20 bg-blue-500 p-2 px-4 text-white hover:bg-blue-700 active:scale-95"
						>
							<ArrowLeftIcon className="animate-bounce-right size-5" />
							<p className="font-bold">Volver</p>
							<div className="absolute inset-0 flex w-full [transform:skew(-13deg)_translateX(-100%)] justify-center group-hover/button:[transform:skew(-13deg)_translateX(100%)] group-hover/button:duration-1000">
								<div className="relative h-full w-10 bg-white/30" />
							</div>
						</Link>
					</div>
				</div>
			</div>
		</>
	);
};

export default Page;
