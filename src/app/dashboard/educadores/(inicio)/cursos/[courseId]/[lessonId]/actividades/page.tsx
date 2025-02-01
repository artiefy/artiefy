'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams, useParams } from 'next/navigation'; // Cambiar la importación de useRouter

import TypeActDropdown from '~/components/educators/layout/TypesActDropdown';
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
import { Input } from '~/components/educators/ui/input';
import { Label } from '~/components/educators/ui/label';
import { Progress } from '~/components/educators/ui/progress';
import { toast } from '~/hooks/use-toast';

const getContrastYIQ = (hexcolor: string) => {
	if (!hexcolor) return 'black'; // Manejar el caso de color indefinido
	hexcolor = hexcolor.replace('#', '');
	const r = parseInt(hexcolor.substr(0, 2), 16);
	const g = parseInt(hexcolor.substr(2, 2), 16);
	const b = parseInt(hexcolor.substr(4, 2), 16);
	const yiq = (r * 299 + g * 587 + b * 114) / 1000;
	return yiq >= 128 ? 'black' : 'white';
};

const Page: React.FC = () => {
	const params = useParams();
	const cursoIdUrl = params?.courseId;
	const searchParams = useSearchParams();
	const lessonsId = searchParams?.get('lessonId');
	const [modalidadesid, setModalidadesid] = useState(0);
	const [isUploading, setIsUploading] = useState(false);
	const [errors, setErrors] = useState({
		name: false,
		description: false,
		type: false,
	});
	const [uploadProgress, setUploadProgress] = useState(0);
	const [formData, setFormData] = useState({
		name: '',
		description: '',
		type: '',
	});
	const router = useRouter(); // Usar useRouter de next/navigation
	const [color, setColor] = useState<string>('#FFFFFF');

	const cursoIdString = Array.isArray(cursoIdUrl) ? cursoIdUrl[0] : cursoIdUrl;
	const courseIdNumber = cursoIdString ? parseInt(cursoIdString) : null;
	const cursoIdNumber = cursoIdString ? parseInt(cursoIdString) : null;
	console.log(
		`cursoIdString: ${cursoIdString}, courseIdNumber: ${courseIdNumber}`
	);

	if (!lessonsId || !cursoIdNumber) {
		return <p>Cargando parametros...</p>;
	}

	useEffect(() => {
		const savedColor = localStorage.getItem(`selectedColor_${courseIdNumber}`);
		if (savedColor) {
			setColor(savedColor);
		}
		console.log(`Color guardado actividad: ${savedColor}`);
	}, [courseIdNumber]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsUploading(true);
		try {
			// Validar campos después de establecer las claves de los archivos
			const newErrors = {
				name: !formData.name,
				description: !formData.description,
				type: !formData.type,
			};

			if (Object.values(newErrors).some((error) => error) || !lessonsId) {
				setErrors(newErrors);
				toast({
					title: 'Error',
					description: 'Por favor completa los campos obligatorios.',
					variant: 'destructive',
				});
				setIsUploading(false);
				return;
			}

			const response = await fetch('/api/educadores/actividades', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: formData.name,
					description: formData.description,
					typeid: parseInt(formData.type, 10), // Asegurarse de que typeid sea un entero
					lessonsId: parseInt(lessonsId, 10), // Asegurarse de que lessonsId sea un entero
				}),
			});

			if (response.ok) {
				const responseData = (await response.json()) as { id: number };
				const actividadId = responseData.id; // Suponiendo que el backend devuelve el ID de la actividad creada
				console.log(`Datos enviados al backend ${JSON.stringify(formData)}`);
				toast({
					title: 'Actividad creada',
					description: 'La actividad se creó con éxito.',
				});
				router.push(
					`/dashboard/educadores/cursos/${cursoIdNumber}/${lessonsId}/actividades/${actividadId}`
				);
			} else {
				const errorData = (await response.json()) as { error?: string };
				toast({
					title: 'Error',
					description: errorData.error ?? 'Error al crear la actividad.',
					variant: 'destructive',
				});
			}
		} catch (e) {
			if ((e as Error).name === 'AbortError') {
				console.log('Upload cancelled');
				return; // Salir de la función si se cancela la carga
			} else {
				toast({
					title: 'Error',
					description: `Error al procesar la solicitud: ${String(e)}`,
					variant: 'destructive',
				});
			}
		} finally {
			setIsUploading(false);
		}
	};

	useEffect(() => {
		if (isUploading) {
			setUploadProgress(0);
			const interval = setInterval(() => {
				setUploadProgress((prev) => {
					if (prev >= 100) {
						clearInterval(interval);
						return 100;
					}
					return prev + 10; // Incrementar de 10 en 10
				});
			}, 500);

			return () => clearInterval(interval);
		}
	}, [isUploading]);

	return (
		<>
			<Breadcrumb>
				<BreadcrumbList className="flex space-x-2 text-lg">
					<BreadcrumbItem>
						<BreadcrumbLink
							className="hover:text-gray-300"
							href="/dashboard/educadores"
						>
							Inicio
						</BreadcrumbLink>
					</BreadcrumbItem>
					<BreadcrumbSeparator />
					<BreadcrumbItem>
						<BreadcrumbLink
							className="hover:text-gray-300"
							href="/dashboard/educadores/cursos"
						>
							Lista de cursos
						</BreadcrumbLink>
					</BreadcrumbItem>
					<BreadcrumbSeparator />
					<BreadcrumbItem>
						<BreadcrumbLink
							className="hover:text-gray-300"
							href={`/dashboard/educadores/cursos/${courseIdNumber}`}
						>
							Detalles curso
						</BreadcrumbLink>
					</BreadcrumbItem>
					<BreadcrumbSeparator />
					<BreadcrumbItem>
						<BreadcrumbLink
							href="#"
							onClick={() => window.history.back()}
							className="hover:text-gray-300"
						>
							Lession:
						</BreadcrumbLink>
					</BreadcrumbItem>
					<BreadcrumbSeparator />
					<BreadcrumbItem>
						<BreadcrumbLink className="hover:text-gray-300">
							Creacion de actividad:
						</BreadcrumbLink>
					</BreadcrumbItem>
					<BreadcrumbSeparator />
				</BreadcrumbList>
			</Breadcrumb>
			<div className="group relative mx-auto h-auto w-full md:w-3/5 lg:w-3/5">
				<div className="animate-gradient absolute -inset-0.5 rounded-xl bg-gradient-to-r from-[#3AF4EF] via-[#00BDD8] to-[#01142B] opacity-0 blur transition duration-500 group-hover:opacity-100"></div>
				<div className="relative z-20 mt-5 h-auto w-full justify-center">
					<form
						className="mx-auto w-full justify-center rounded-lg bg-white p-4"
						onSubmit={handleSubmit}
						style={{ backgroundColor: color, color: getContrastYIQ(color) }}
					>
						<div className="mb-2 flex">
							<Image
								src="/favicon.ico"
								alt="Artiefy logo"
								width={70}
								height={70}
							/>
							<h2 className="mt-5 text-center text-3xl font-semibold">
								Creacion de actividad
							</h2>
						</div>
						<Label
							className={`mb-2 text-xl text-black ${color === '#FFFFFF' ? 'text-black' : 'text-white'}`}
						>
							Titulo
						</Label>
						<Input
							className={`border-slate-200 ${color === '#FFFFFF' ? 'text-black' : 'text-white'}`}
							type="text"
							value={formData.name}
							placeholder="Nombre de la actividad"
							onChange={(e) =>
								setFormData({ ...formData, name: e.target.value })
							}
						/>
						<div className="my-4 flex flex-col">
							<Label
								className={`mb-2 text-xl ${color === '#FFFFFF' ? 'text-black' : 'text-white'}`}
							>
								Descripcion actividad:
							</Label>
							<textarea
								className={`rounded-lg border border-slate-200 bg-transparent p-2 outline-none ${color === '#FFFFFF' ? 'text-black' : 'text-white'}`}
								value={formData.description}
								placeholder="Descripcion de la actividad"
								onChange={(e) =>
									setFormData({ ...formData, description: e.target.value })
								}
							/>
						</div>
						<TypeActDropdown
							typeActi={modalidadesid}
							setTypeActividad={(id) => {
								setModalidadesid(id);
								setFormData({ ...formData, type: id.toString() });
							}}
							selectedColor={color}
							errors={errors}
						/>
						{isUploading && (
							<div className="my-1">
								<Progress value={uploadProgress} className="w-full" />
								<p className="mt-2 text-center text-sm text-gray-500">
									{uploadProgress}% Completado
								</p>
							</div>
						)}
						<div className="mt-4 flex justify-evenly">
							<AlertDialog>
								<AlertDialogTrigger asChild>
									<Button className="mx-auto w-1/6 border-red-600 bg-red-600 text-white hover:border-red-600 hover:bg-white hover:text-red-600">
										Cancelar
									</Button>
								</AlertDialogTrigger>
								<AlertDialogContent>
									<AlertDialogHeader>
										<AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
										<AlertDialogDescription>
											Esta accion va a ser que te devuelvas a la pagina anterior
										</AlertDialogDescription>
									</AlertDialogHeader>
									<AlertDialogFooter>
										<AlertDialogCancel>Cancelar</AlertDialogCancel>
										<AlertDialogAction
											className="border-red-600 bg-red-600 text-white hover:border-red-700 hover:bg-transparent hover:text-red-700"
											onClick={() => window.history.back()}
										>
											volver
										</AlertDialogAction>
									</AlertDialogFooter>
								</AlertDialogContent>
							</AlertDialog>
							<Input
								type="submit"
								className="w-1/2 cursor-pointer border-green-600 bg-green-600 text-white hover:border-green-600 hover:bg-white hover:text-green-600"
								value="Crear"
							/>
						</div>
					</form>
				</div>
			</div>
		</>
	);
};

export default Page;
