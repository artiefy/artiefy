'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import ListActividadesEducator from '~/components/educators/layout/ListActividades';
import ViewFiles from '~/components/educators/layout/ViewFiles';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from '~/components/educators/ui/alert-dialog';
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbSeparator,
} from '~/components/educators/ui/breadcrumb';
import { Button } from '~/components/educators/ui/button';
import { Card, CardHeader, CardTitle } from '~/components/educators/ui/card';
import { toast } from '~/hooks/use-toast';

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

const getContrastYIQ = (hexcolor: string) => {
	if (!hexcolor) return 'black'; // Manejar el caso de color indefinido
	hexcolor = hexcolor.replace('#', '');
	const r = parseInt(hexcolor.substr(0, 2), 16);
	const g = parseInt(hexcolor.substr(2, 2), 16);
	const b = parseInt(hexcolor.substr(4, 2), 16);
	const yiq = (r * 299 + g * 587 + b * 114) / 1000;
	return yiq >= 128 ? 'black' : 'white';
};

const Page: React.FC<{ selectedColor: string }> = ({ selectedColor }) => {
	const { user } = useUser();
	const router = useRouter();
	const params = useParams();
	const courseId = params?.courseId ?? null;
	const lessonId = params?.lessonId ?? null;
	const [lessons, setLessons] = useState<Lessons | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [color, setColor] = useState<string>(selectedColor || '#FFFFFF');

	const courseIdString = Array.isArray(courseId) ? courseId[0] : courseId;
	const courseIdNumber = courseIdString ? parseInt(courseIdString) : null;
	useEffect(() => {
		const savedColor = localStorage.getItem(
			`selectedColor_${Array.isArray(courseId) ? courseId[0] : courseId}`
		);
		if (savedColor) {
			setColor(savedColor);
		}
	}, [courseId]);

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
					toast({
						title: 'Error',
						description: `No se pudo cargar la leccion: ${errorMessage}`,
						variant: 'destructive',
					});
				}
			} catch (error) {
				const errorMessage =
					error instanceof Error ? error.message : 'Error desconocido';
				setError(`Error al cargar la leccion: ${errorMessage}`);
				toast({
					title: 'Error',
					description: `No se pudo cargar la leccion: ${errorMessage}`,
					variant: 'destructive',
				});
			} finally {
				setLoading(false);
			}
		};

		fetchLessons().catch((error) =>
			console.error('Error fetching lessons:', error)
		);
	}, [user, lessonId]);

	if (loading) return <div>Cargando leccion...</div>;
	if (error) return <div>Error: {error}</div>;
	if (!lessons) return <div>No se encontró la leccion.</div>;

	const handleDelete = async (id: string) => {
		try {
			const responseAwsImg = await fetch(
				`${process.env.NEXT_PUBLIC_AWS_S3_URL}/${lessons.coverVideoKey}`,
				{
					method: 'DELETE',
				}
			);
			const responseAwsVideo = await fetch(
				`${process.env.NEXT_PUBLIC_AWS_S3_URL}/${lessons.coverVideoKey}`,
				{
					method: 'DELETE',
				}
			);
			const responseAwsFiles = await fetch(
				`${process.env.NEXT_PUBLIC_AWS_S3_URL}/${lessons.resourceKey}`,
				{
					method: 'DELETE',
				}
			);

			const response = await fetch(`/api/educadores/lessons?lessonId=${id}`, {
				method: 'DELETE',
			});
			if (
				!response.ok &&
				!responseAwsImg &&
				!responseAwsVideo &&
				!responseAwsFiles
			)
				throw new Error('Error al eliminar la clase');
			toast({
				title: 'Clase eliminada',
				description: `La clase ${lessons.title} ha sido eliminada exitosamente.`,
				variant: 'default',
			});
			router.back(); // Redirige a la página anterior
		} catch (error) {
			console.error('Error:', error);
		}
	};

	return (
		<>
			<div className="container mx-auto mt-2 h-auto w-full rounded-lg bg-background">
				<Breadcrumb>
					<BreadcrumbList>
						<BreadcrumbItem>
							<BreadcrumbLink
								className="text-primary hover:text-gray-300"
								href="/dashboard/educadores"
							>
								Cursos
							</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbLink
								className="text-primary hover:text-gray-300"
								href="/dashboard/educadores/cursos"
							>
								Lista de cursos
							</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbLink
								className="text-primary hover:text-gray-300"
								href={`/dashboard/educadores/cursos/${courseIdNumber}`}
							>
								Detalles curso
							</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbLink
								href={``}
								className="text-primary hover:text-gray-300"
							>
								Detalles de la clase: {lessons.title}
							</BreadcrumbLink>
						</BreadcrumbItem>
					</BreadcrumbList>
				</Breadcrumb>
				<div className="group relative h-auto w-full">
					<div className="animate-gradient absolute -inset-0.5 rounded-xl bg-gradient-to-r from-[#3AF4EF] via-[#00BDD8] to-[#01142B] opacity-0 blur transition duration-500 group-hover:opacity-100"></div>
					<Card
						className={`relative z-20 mt-5 border-transparent bg-black p-5 ${color === '#FFFFFF' ? 'text-black' : 'text-white'}`}
						style={{
							backgroundColor: color,
							color: getContrastYIQ(color),
						}}
					>
						<CardHeader>
							<CardTitle
								className={`text-2xl font-bold ${color === '#FFFFFF' ? 'text-black' : 'text-white'}`}
							>
								Clase: {lessons.title}
							</CardTitle>
						</CardHeader>
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 lg:gap-6">
							{/* Columna izquierda - Imagen */}
							<div className="relative w-full">
								<Image
									src={`${process.env.NEXT_PUBLIC_AWS_S3_URL}/${lessons.coverImageKey}`}
									alt={lessons.title}
									width={300}
									height={100}
									className="mx-auto rounded-lg object-contain"
									priority
									quality={75}
								/>
							</div>
							{/* Columna derecha - Información */}
							<video className="h-72 w-full rounded-lg object-cover" controls>
								<source
									src={`${process.env.NEXT_PUBLIC_AWS_S3_URL}/${lessons.coverVideoKey}`}
								/>
							</video>
						</div>
						{/* Zona de los files */}
						<div>
							<ViewFiles lessonId={lessons.id} selectedColor={color} />
						</div>
						<div className="flex justify-evenly lg:px-3 lg:py-6">
							<Button
								className={`border-transparent bg-green-400 text-white hover:bg-green-500`}
							>
								<Link href={`./${lessons.id}/verClase/${lessons.id}`}>
									Ver clase
								</Link>
							</Button>
							<Button className="border-yellow-500 bg-yellow-500 text-white hover:bg-yellow-600">
								Editar clase
							</Button>

							<AlertDialog>
								<AlertDialogTrigger asChild>
									<Button className="border-red-600 bg-red-600 text-white hover:border-red-600 hover:bg-white hover:text-red-600">
										Eliminar
									</Button>
								</AlertDialogTrigger>
								<AlertDialogContent>
									<AlertDialogHeader>
										<AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
										<AlertDialogDescription>
											Esta acción no se puede deshacer. Se eliminará
											permanentemente la clase
											<span className="font-bold"> {lessons.title}</span> y
											todos los datos asociados a este.
										</AlertDialogDescription>
									</AlertDialogHeader>
									<AlertDialogFooter>
										<AlertDialogCancel>Cancelar</AlertDialogCancel>
										<AlertDialogAction
											onClick={() => handleDelete(lessons.id.toString())}
											className="border-red-600 bg-red-600 text-white hover:border-red-700 hover:bg-transparent hover:text-red-700"
										>
											Eliminar
										</AlertDialogAction>
									</AlertDialogFooter>
								</AlertDialogContent>
							</AlertDialog>
						</div>
						<div>
							<div
								className={`pb-6 ${color === '#FFFFFF' ? 'text-black' : 'text-white'}`}
							>
								<h2 className="text-2xl font-bold">Información de la clase</h2>
								<br />
								<div className="grid grid-cols-2">
									<div className="flex flex-col">
										<h2 className="text-lg font-semibold">Lesion:</h2>
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
						</div>

						<div className="flex w-full justify-center">
							<Link
								href={`./${lessons.id}/actividades?lessonId=${lessons.id}`}
								className="cursor-pointer justify-center rounded-lg border-transparent bg-green-400 p-2 text-white hover:bg-green-500"
							>
								Crear actividad
							</Link>
						</div>
					</Card>
				</div>
				<div>
					<ListActividadesEducator
						lessonId={lessons.id}
						courseId={courseIdNumber ?? 0}
						coverImageKey={lessons.coverImageKey}
						selectedColor={color}
					/>
				</div>
			</div>
		</>
	);
};

export default Page;
