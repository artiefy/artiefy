'use client';
import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import Image from 'next/image';
import { useRouter, useSearchParams, useParams } from 'next/navigation'; // Cambiar la importación de useRouter
import SelectParametro from '~/components/educators/layout/SelectParametro';
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

interface Course {
	id: number;
	title: string;
	description: string;
	categoryid: string;
	dificultadid: string;
	modalidadesid: string;
	instructor: string;
	coverImageKey: string;
	creatorId: string;
	createdAt: string;
	updatedAt: string;
	requerimientos: string;
	totalParametros: number;
}

interface Parametros {
	id: number;
	name: string;
	description: string;
	entrega: number;
	porcentaje: number;
	courseId: number;
	typeid: number;
	isUsed?: boolean;
}

const Page: React.FC = () => {
	const { user } = useUser();
	const params = useParams();
	const cursoIdUrl = params?.courseId;
	const searchParams = useSearchParams();
	const lessonsId = searchParams?.get('lessonId');
	const [isUploading, setIsUploading] = useState(false);
	const [errors, setErrors] = useState({
		name: false,
		description: false,
		type: false,
		pesoNota: false,
		parametro: false,
	});
	const [uploadProgress, setUploadProgress] = useState(0);
	const [course, setCourse] = useState<Course | null>(null);
	const [formData, setFormData] = useState({
		id: 0,
		name: '',
		description: '',
		type: '',
		pesoNota: 0,
		revisada: false,
		parametro: 0,
	});
	const cursoIdString = Array.isArray(cursoIdUrl) ? cursoIdUrl[0] : cursoIdUrl;
	const courseIdNumber = cursoIdString ? parseInt(cursoIdString) : null;
	const cursoIdNumber = cursoIdString ? parseInt(cursoIdString) : null;
	const [parametros, setParametros] = useState<Parametros[]>([]);
	const router = useRouter(); // Usar useRouter de next/navigation
	const [color, setColor] = useState<string>('#FFFFFF');
	const [isActive, setIsActive] = useState(false);
	const [showLongevidadForm, setShowLongevidadForm] = useState(false);
	const [showErrors, setShowErrors] = useState(false);
	const [usedParametros, setUsedParametros] = useState<number[]>([]);

	useEffect(() => {
		const fetchParametros = async () => {
			try {
				// Obtener parámetros
				const parametrosResponse = await fetch(
					`/api/educadores/parametros?courseId=${courseIdNumber}`
				);
				if (!parametrosResponse.ok) {
					throw new Error('Error al obtener los parámetros');
				}
				const parametrosData =
					(await parametrosResponse.json()) as Parametros[];

				// Obtener actividades para verificar parámetros en uso
				const actividadesResponse = await fetch(
					`/api/educadores/actividades?courseId=${courseIdNumber}`
				);
				if (!actividadesResponse.ok) {
					throw new Error('Error al obtener las actividades');
				}
				const actividadesData = await actividadesResponse.json();

				// Obtener los IDs de parámetros que ya están siendo usados
				const parametrosUsados = actividadesData
					.filter((actividad: any) => actividad.parametroId)
					.map((actividad: any) => actividad.parametroId);

				setUsedParametros(parametrosUsados);

				// Actualizar los parámetros marcando cuáles están en uso
				const parametrosActualizados = parametrosData.map((parametro) => ({
					...parametro,
					isUsed: parametrosUsados.includes(parametro.id),
					entrega: parametro.entrega,
					porcentaje: parametro.porcentaje,
					description: parametro.description,
				}));

				setParametros(parametrosActualizados);
			} catch (error) {
				console.error('Error:', error);
				toast({
					title: 'Error',
					description: 'Error al cargar los parámetros',
					variant: 'destructive',
				});
			}
		};

		if (courseIdNumber) {
			fetchParametros();
		}
	}, [courseIdNumber]);

	const handleParametroChange = async (parametroId: number) => {
		try {
			// Verificar en el backend si el parámetro ya está en uso
			const response = await fetch(
				`/api/educadores/actividades/check-parametro?parametroId=${parametroId}`
			);

			if (!response.ok) {
				throw new Error('Error al verificar el parámetro');
			}

			const { isUsed } = await response.json();

			if (isUsed) {
				toast({
					title: 'Error',
					description:
						'Este parámetro ya está siendo utilizado en otra actividad',
					variant: 'destructive',
				});
				return;
			}

			const selectedParametro = parametros.find(
				(param: Parametros) => param.id === parametroId
			);

			if (selectedParametro) {
				setFormData((prevFormData) => ({
					...prevFormData,
					parametro: selectedParametro.id,
					name: selectedParametro.name,
					description: selectedParametro.description,
					pesoNota: selectedParametro.porcentaje,
				}));
			}
		} catch (error) {
			console.error('Error:', error);
			toast({
				title: 'Error',
				description: 'Error al verificar el parámetro',
				variant: 'destructive',
			});
		}
	};

	const handleToggle = () => {
		setIsActive((prevIsActive) => {
			const newIsActive = !prevIsActive;
			setFormData((prevFormData) => ({
				...prevFormData,
				revisada: newIsActive,
				...(!newIsActive && {
					name: '',
					description: '',
					pesoNota: 0,
					parametro: 0,
				}),
			}));

			if (!newIsActive) {
				setShowLongevidadForm(false);
			}
			return newIsActive;
		});
	};

	const handleLongevidadClick = () => {
		setShowLongevidadForm(true);
	};

	if (!lessonsId || !cursoIdNumber) {
		return <p>Cargando parametros...</p>;
	}

	useEffect(() => {
		const savedColor = localStorage.getItem(`selectedColor_${courseIdNumber}`);
		if (savedColor) {
			setColor(savedColor);
		}
	}, [courseIdNumber]);

	const fetchCourse = useCallback(async () => {
		if (!user) return;
		if (courseIdNumber !== null) {
			try {
				const response = await fetch(
					`/api/educadores/courses/${courseIdNumber}`
				);

				if (response.ok) {
					const data = (await response.json()) as Course;
					setCourse(data);
				} else {
					const errorData = (await response.json()) as { error?: string };
					const errorMessage = errorData.error ?? response.statusText;
					toast({
						title: 'Error',
						description: `No se pudo cargar el curso: ${errorMessage}`,
						variant: 'destructive',
					});
				}
			} catch (error: unknown) {
				const errorMessage =
					error instanceof Error ? error.message : 'Error desconocido';
				toast({
					title: 'Error',
					description: `No se pudo cargar el curso: ${errorMessage}`,
					variant: 'destructive',
				});
			}
		}
	}, [user, courseIdNumber]);

	useEffect(() => {
		fetchCourse().catch((error) =>
			console.error('Error fetching course:', error)
		);
	}, [fetchCourse]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsUploading(true);
		setShowErrors(true);

		try {
			const newErrors = {
				name: !formData.name,
				description: !formData.description,
				type: !formData.type,
				parametro: formData.revisada && !formData.parametro,
			};
			if (Object.values(newErrors).some((error) => error) || !lessonsId) {
				setErrors({
					...newErrors,
					pesoNota: false,
				});
				toast({
					title: 'Error',
					description: 'Por favor completa los campos obligatorios.',
					variant: 'destructive',
				});
				setIsUploading(false);
				return;
			}

			// Verificar si el parámetro está en uso antes de crear la actividad
			if (formData.revisada && formData.parametro) {
				const checkResponse = await fetch(
					`/api/educadores/actividades/check-parametro?parametroId=${formData.parametro}`
				);

				if (!checkResponse.ok) {
					throw new Error('Error al verificar el parámetro');
				}

				const { isUsed } = await checkResponse.json();
				if (isUsed) {
					toast({
						title: 'Error',
						description:
							'Este parámetro ya está siendo utilizado en otra actividad',
						variant: 'destructive',
					});
					setIsUploading(false);
					return;
				}
			}

			const actividadResponse = await fetch('/api/educadores/actividades', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: formData.name,
					description: formData.description,
					typeid: parseInt(formData.type, 10),
					lessonsId: parseInt(lessonsId, 10),
					revisada: formData.revisada,
					parametroId: formData.revisada ? formData.parametro : null,
				}),
			});

			if (!actividadResponse.ok) {
				const errorData = await actividadResponse.json();
				throw new Error(errorData.error || 'Error al crear la actividad');
			}

			const actividadData = await actividadResponse.json();
			const actividadId = actividadData.id;

			// Si la actividad es revisada y tiene un parámetro seleccionado, actualizar el parámetro
			if (formData.revisada && formData.parametro) {
				const parametroResponse = await fetch(
					`/api/educadores/parametros/${formData.parametro}`,
					{
						method: 'PUT',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({
							name: formData.name,
							description: formData.description,
							porcentaje: formData.pesoNota,
							courseId: courseIdNumber,
						}),
					}
				);

				if (!parametroResponse.ok) {
					throw new Error('Error al actualizar el parámetro');
				}

				toast({
					title: 'Éxito',
					description: 'Actividad creada y parámetro actualizado correctamente',
				});
			} else {
				toast({
					title: 'Éxito',
					description: 'Actividad creada correctamente',
				});
			}

			// Redireccionar
			router.push(
				`/dashboard/educadores/cursos/${cursoIdNumber}/${lessonsId}/actividades/${actividadId}`
			);
		} catch (error) {
			console.error('Error detallado:', error);
			toast({
				title: 'Error',
				description:
					error instanceof Error ? error.message : 'Error desconocido',
				variant: 'destructive',
			});
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
				<BreadcrumbList>
					<BreadcrumbItem>
						<BreadcrumbLink
							className="text-primary hover:text-gray-300"
							href="/dashboard/educadores"
						>
							Inicio
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
							href="#"
							onClick={() => window.history.back()}
							className="text-primary hover:text-gray-300"
						>
							Lession:
						</BreadcrumbLink>
					</BreadcrumbItem>
					<BreadcrumbSeparator />
					<BreadcrumbItem>
						<BreadcrumbLink className="text-primary hover:text-gray-300">
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
							<h2 className="mt-5 flex flex-col text-start text-3xl font-semibold">
								Creacion de actividad
								<p className="text-sm">Del curso: {course?.title}</p>
							</h2>
						</div>
						<div className="flex flex-col">
							<p>¿La actividad es revisada?:</p>
							<div className="flex space-x-2">
								<label
									htmlFor="toggle"
									className="relative inline-block h-8 w-16"
								>
									<input
										type="checkbox"
										id="toggle"
										checked={isActive}
										onChange={handleToggle} // Eliminar el atributo value
										className="absolute size-0"
									/>
									<span
										className={`size-1/2 cursor-pointer rounded-full transition-all duration-300 ${isActive ? 'bg-gray-300' : 'bg-red-500'}`}
									>
										<span
											className={`absolute left-1 top-1 size-6 rounded-full bg-primary transition-all duration-300 ${isActive ? 'translate-x-8' : 'translate-x-0'}`}
										></span>
									</span>
								</label>
								<span className="mt-1 text-sm text-gray-400">
									{isActive ? 'Si' : 'No'}
								</span>
							</div>
						</div>
						{isActive && (
							<>
								<div className="my-4">
									<Button
										onClick={handleLongevidadClick}
										className="border-none bg-blue-500 text-white hover:bg-blue-500/90"
									>
										Asignar un parametro de evaluacion
									</Button>
								</div>
								{showLongevidadForm && (
									<div className="my-4">
										<div className="flex flex-col">
											<SelectParametro
												courseId={cursoIdNumber}
												parametro={formData.parametro ?? 0}
												setParametro={handleParametroChange}
												errors={errors}
												selectedColor={color}
											/>
											<Label
												htmlFor="pesoNota"
												className={`mb-2 text-xl ${color === '#FFFFFF' ? 'text-black' : 'text-white'}`}
											>
												Peso de la nota en el curso (0-100 en porcentaje %):
											</Label>
											<div>
												<Input
													value={formData.pesoNota}
													className={`rounded-lg border border-slate-200 bg-transparent p-2 outline-none ${color === '#FFFFFF' ? 'text-black' : 'text-white'}`}
													type="number"
													id="percentage"
													name="pesoNota"
													min="0"
													max="100"
													step="1"
													placeholder="0-100"
													onChange={(e) =>
														setFormData({
															...formData,
															pesoNota: parseFloat(e.target.value),
														})
													}
												/>
											</div>
											{showErrors && errors.pesoNota && (
												<p className="mt-1 text-sm text-red-500">
													El porcentaje de actividad es requerido.
												</p>
											)}
										</div>
									</div>
								)}
							</>
						)}
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
						{showErrors && errors.name && (
							<p className="mt-1 text-sm text-red-500">
								El titulo es requerido.
							</p>
						)}
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
							{showErrors && errors.description && (
								<p className="mt-1 text-sm text-red-500">
									La descripcion es requerida
								</p>
							)}
						</div>
						<Label
							className={`mb-2 text-xl ${color == '#FFFFFF' ? 'text-black' : 'text-white'}`}
						>
							Tipo de Actividad
						</Label>
						<TypeActDropdown
							typeActi={parseInt(formData.type, 10)}
							setTypeActividad={(type: number) =>
								setFormData({ ...formData, type: type.toString() })
							}
							errors={errors}
							selectedColor={color}
						/>
						{showErrors && errors.type && (
							<p className="mt-1 text-sm text-red-500">
								El tipo de actividad es requerido.
							</p>
						)}
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
