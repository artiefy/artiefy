'use client';
import { useState, useEffect } from 'react';

import Image from 'next/image';
import { useRouter, useSearchParams, useParams } from 'next/navigation'; // Cambiar la importación de useRouter

import TypeActDropdown from '~/components/educators/layout/TypesActDropdown';
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbSeparator,
} from '~/components/educators/ui/breadcrumb';
import { Input } from '~/components/educators/ui/input';
import { Label } from '~/components/educators/ui/label';
import { Progress } from '~/components/educators/ui/progress';
import { toast } from '~/hooks/use-toast';

const Page: React.FC = () => {
	const params = useParams();
	const cursoIdUrl = params?.courseId;
	const searchParams = useSearchParams();
	const lessonsId = searchParams?.get('lessonId');
	const courseId = searchParams?.get('courseId'); // Obtener courseId de los parámetros de búsqueda
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

	const cursoIdString = Array.isArray(cursoIdUrl) ? cursoIdUrl[0] : cursoIdUrl;
	const cursoIdNumber = cursoIdString ? parseInt(cursoIdString) : null;

	console.log(`LessonsId activity ${lessonsId}`);

	if (!lessonsId || !cursoIdNumber) {
		return <p>Cargando parametros...</p>;
	}

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
							href="/dashboard/educadores/cursos"
						>
							Cursos
						</BreadcrumbLink>
					</BreadcrumbItem>
					<BreadcrumbSeparator />
					<BreadcrumbItem>
						<BreadcrumbLink
							className="hover:text-gray-300"
							href={`/dashboard/educadores/cursos/${courseId}`}
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
			<div className="mt-5 h-auto w-full justify-center">
				<form
					className="mx-auto w-96 justify-center rounded-lg bg-white p-4 md:w-1/2 lg:w-1/2"
					onSubmit={handleSubmit}
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
					{/* <p className="mb-2 text-2xl">Lección ID: {lessonTitle}</p> */}
					<p className="mb-2 text-2xl">Lección ID: {lessonsId}</p>
					<Label className="mb-2 text-xl text-black">Titulo</Label>
					<Input
						className="text-black"
						type="text"
						value={formData.name}
						placeholder="Nombre de la actividad"
						onChange={(e) => setFormData({ ...formData, name: e.target.value })}
					/>
					<div className="my-4 flex flex-col">
						<Label className="mb-2 text-xl text-black">
							Descripcion actividad:
						</Label>
						<textarea
							className="rounded-lg border border-slate-200 p-2 text-black outline-hidden"
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
					<Input
						type="submit"
						className="mx-auto w-1/2 cursor-pointer text-black hover:bg-slate-50"
						value="Crear"
					/>
				</form>
			</div>
		</>
	);
};

export default Page;
