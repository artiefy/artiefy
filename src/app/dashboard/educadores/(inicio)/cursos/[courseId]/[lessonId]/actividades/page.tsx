'use client';
import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import Image from 'next/image';
import { useRouter, useSearchParams, useParams } from 'next/navigation'; // Cambiar la importación de useRouter
import { toast } from 'sonner';
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

// Crear actividad

// Función para obtener el contraste de un color
const getContrastYIQ = (hexcolor: string) => {
	if (!hexcolor) return 'black'; // Manejar el caso de color indefinido
	hexcolor = hexcolor.replace('#', '');
	const r = parseInt(hexcolor.substr(0, 2), 16);
	const g = parseInt(hexcolor.substr(2, 2), 16);
	const b = parseInt(hexcolor.substr(4, 2), 16);
	const yiq = (r * 299 + g * 587 + b * 114) / 1000;
	return yiq >= 128 ? 'black' : 'white';
};

// Definir las interfaces de los datos
interface Course {
	id: number;
	title: string;
	description: string;
	categoryid: string;
	nivelid: string;
	modalidadesid: string;
	instructor: string;
	coverImageKey: string;
	creatorId: string;
	createdAt: string;
	updatedAt: string;
	totalParametros: number;
}

// Definir la interfaz de los parámetros
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
	const { user } = useUser(); // Usar useUser de Clerk
	const params = useParams(); // Usar useParams de next/navigation
	const cursoIdUrl = params?.courseId; // Obtener el ID del curso de los parámetros
	const searchParams = useSearchParams(); // Usar useSearchParams de next/navigation
	const lessonsId = searchParams?.get('lessonId'); // Obtener el ID de la lección de los parámetros
	const [isUploading, setIsUploading] = useState(false); // Definir isUploading
	const [uploadProgress, setUploadProgress] = useState(0); // Definir uploadProgress
	const [course, setCourse] = useState<Course | null>(null); // Definir course
	const [formData, setFormData] = useState({
		id: 0,
		name: '',
		description: '',
		type: '',
		porcentaje: 0,
		revisada: false,
		parametro: 0,
		fechaMaximaEntrega: null as string | null,
	}); // Definir formData
	const cursoIdString = Array.isArray(cursoIdUrl) ? cursoIdUrl[0] : cursoIdUrl; // Obtener el ID del curso como string
	const courseIdNumber = cursoIdString ? parseInt(cursoIdString) : null; // Convertir el ID del curso a número
	const router = useRouter(); // Usar useRouter de next/navigation
	const [color, setColor] = useState<string>('#FFFFFF'); // Definir color
	const [isActive, setIsActive] = useState(false); // Definir isActive
	const [fechaMaxima, setFechaMaxima] = useState(false); // Definir fechaMaxima
	const [showLongevidadForm, setShowLongevidadForm] = useState(false); // Definir showLongevidadForm
	const [parametros, setParametros] = useState<Parametros[]>([]); // Definir setParametros
	console.log(parametros);

	// Obtener los parámetros
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
				const actividadesData = (await actividadesResponse.json()) as {
					parametroId: number;
				}[];

				// Obtener los IDs de parámetros que ya están siendo usados
				const parametrosUsados = actividadesData
					.filter((actividad: { parametroId: number }) => actividad.parametroId)
					.map((actividad: { parametroId: number }) => actividad.parametroId);

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
				toast('Error', {
					description: 'Error al cargar los parámetros',
				});
			}
		};

		if (courseIdNumber) {
			void fetchParametros();
		}
	}, [courseIdNumber]);

	// Obtener el color guardado
	useEffect(() => {
		if (!lessonsId || !courseIdNumber) {
			return;
		}
		const savedColor = localStorage.getItem(`selectedColor_${courseIdNumber}`);
		if (savedColor) {
			setColor(savedColor);
		}
	}, [lessonsId, courseIdNumber]);

	// Guardar el color seleccionado y actualizar el color
	useEffect(() => {
		const fetchCourse = async () => {
			if (!user) return;
			if (courseIdNumber !== null) {
				try {
					const response = await fetch(
						`/api/educadores/courses/${courseIdNumber}`
					);

					if (response.ok) {
						const data = (await response.json()) as Course;
						setCourse(data);
					}
				} catch (error: unknown) {
					const errorMessage =
						error instanceof Error ? error.message : 'Error desconocido';
					toast('Error', {
						description: `No se pudo cargar el curso: ${errorMessage}`,
					});
				}
			}
		};
		void fetchCourse();
	}, [user, courseIdNumber]);

	// Función para manejar el cambio de color y guardarlo
	const handleToggle = () => {
		setIsActive((prevIsActive) => {
			const newIsActive = !prevIsActive;
			setFormData((prevFormData) => ({
				...prevFormData,
				revisada: newIsActive,
				...(!newIsActive && {
					name: '',
					description: '',
					porcentaje: 0,
					parametro: 0,
				}),
			}));

			if (!newIsActive) {
				setShowLongevidadForm(false);
			}
			return newIsActive;
		});
	};

	// Función para manejar el cambio de la fecha máxima de entrega
	const handleToggleFechaMaxima = () => {
		setFechaMaxima((prevFechaMaxima) => !prevFechaMaxima);
		setFormData((prevFormData) => ({
			...prevFormData,
			fechaMaximaEntrega: fechaMaxima ? new Date().toISOString() : null,
		}));
	};

	// Función para manejar el click en el botón de asignar parámetro
	const handleLongevidadClick = () => {
		setShowLongevidadForm(true);
	};

	// Función para validar el porcentaje de la actividad
	const validarPorcentaje = async (
		parametroId: number,
		nuevoPorcentaje: number
	) => {
		try {
			const response = await fetch(
				'/api/educadores/actividades/actividadesByLesson',
				{
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ parametroId, porcentaje: nuevoPorcentaje }),
				}
			);

			const data = (await response.json()) as {
				totalActual: number;
				disponible: number;
				detalles?: { name: string; porcentaje: number }[];
			};

			if (!response.ok) {
				toast.error('Error de porcentaje', {
					description: 'Error desconocido',
				});
				return false;
			}

			// Mostrar información detallada
			toast('Información del parámetro', {
				description: `
					Porcentaje total actual: ${data.totalActual}%
					Porcentaje disponible: ${data.disponible}%
					${data.detalles?.length ? '\nActividades asignadas:' : ''}
					${data.detalles?.map((act) => `\n- ${act.name}: ${act.porcentaje}%`).join('') ?? ''}
				`,
			});

			return nuevoPorcentaje <= data.disponible;
		} catch (error) {
			console.error('Error al validar porcentaje:', error);
			toast('Error', {
				description: 'Error al validar el porcentaje',
			});
			return false;
		}
	};

	// Función para manejar el cambio del porcentaje
	const handlePorcentajeChange = (value: string) => {
		const nuevoPorcentaje = parseFloat(value) || 0;

		// Primero actualizamos el estado sin validar
		setFormData({
			...formData,
			porcentaje: nuevoPorcentaje,
		});
	};

	// Función para manejar el cambio del parámetro y seleccionar el porcentaje para la actividad
	const handleParametroChange = (parametroId: number) => {
		setFormData({
			...formData,
			parametro: parametroId,
			porcentaje: 0, // Resetear el porcentaje cuando cambia el parámetro
		});
	};

	// Función para manejar el envío del formulario
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		// Validaciones específicas con mensajes de error
		if (!formData.name) {
			toast('Error', {
				description: 'El nombre de la actividad es requerido',
			});
			return;
		}

		if (!formData.description) {
			toast('Error', {
				description: 'La descripción de la actividad es requerida',
			});
			return;
		}

		if (!formData.type) {
			toast('Error', {
				description: 'Debe seleccionar un tipo de actividad',
			});
			return;
		}

		// Validaciones específicas para actividades revisadas
		if (formData.revisada) {
			if (
				formData.parametro &&
				(!formData.porcentaje || formData.porcentaje <= 0)
			) {
				toast('Error', {
					description:
						'Debe asignar un porcentaje mayor a 0 para actividades revisadas con parámetro',
				});
				return;
			}
		}

		// Validaciones finales
		const newErrors = {
			name: !formData.name,
			description: !formData.description,
			type: !formData.type,
			parametro: false,
			porcentaje: !!(
				formData.revisada &&
				formData.parametro &&
				(!formData.porcentaje || formData.porcentaje <= 0)
			),
		};

		if (Object.values(newErrors).some((error) => error)) {
			return;
		}

		// Validación final del porcentaje antes de crear la actividad
		if (formData.revisada && formData.parametro) {
			const porcentajeValido = await validarPorcentaje(
				formData.parametro,
				formData.porcentaje || 0
			);

			if (!porcentajeValido) {
				toast('Error', {
					description: 'El porcentaje asignado excede el disponible',
				});
				return;
			}
		}

		setIsUploading(true);

		try {
			// Asegurarnos de que el porcentaje sea un número
			const porcentaje = formData.revisada ? formData.porcentaje || 0 : 0;

			const actividadResponse = await fetch('/api/educadores/actividades', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: formData.name,
					description: formData.description,
					typeid: parseInt(formData.type, 10),
					lessonsId: lessonsId ? parseInt(lessonsId, 10) : 0,
					revisada: formData.revisada,
					parametroId: formData.parametro || null,
					porcentaje: porcentaje,
					fechaMaximaEntrega: formData.fechaMaximaEntrega
						? new Date(formData.fechaMaximaEntrega).toISOString()
						: null,
				}),
			});

			if (!actividadResponse.ok) {
				const errorData = (await actividadResponse.json()) as {
					error?: string;
				};
				throw new Error(errorData.error ?? 'Error al crear la actividad');
			}

			const actividadData = (await actividadResponse.json()) as { id: number };
			const actividadId = actividadData.id;

			// Mostrar mensaje de éxito
			toast('Éxito', {
				description: 'Actividad creada correctamente',
			});

			router.push(
				`/dashboard/super-admin/cursos/${courseIdNumber}/${lessonsId}/actividades/${actividadId}`
			);
		} catch (error) {
			console.error('Error detallado:', error);
			toast('Error', {
				description:
					error instanceof Error ? error.message : 'Error desconocido',
			});
		} finally {
			setIsUploading(false);
		}
	};

	// Barra de carga al crear la actividad
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

	// Renderizar el formulario
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
							Lession
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
				<div className="relative mt-5 h-auto w-full justify-center">
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
						<div className="grid grid-cols-1 lg:grid-cols-2">
							<div className="flex flex-col">
								<div className="flex flex-col">
									<p>¿La actividad es calificable?:</p>
									<div className="flex">
										<label
											htmlFor="toggle"
											className="relative inline-block h-8 w-16"
										>
											<input
												type="checkbox"
												id="toggle"
												checked={isActive}
												onChange={handleToggle}
												className="absolute size-0"
											/>
											<span
												className={`size-1/2 cursor-pointer rounded-full transition-all duration-300 ${isActive ? 'bg-gray-300' : 'bg-red-500'}`}
											>
												<span
													className={`absolute top-1 left-1 size-6 rounded-full bg-primary transition-all duration-300 ${isActive ? 'translate-x-8' : 'translate-x-0'}`}
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
										<div className="my-1">
											<Button
												type="button"
												onClick={(e) => {
													e.preventDefault();
													handleLongevidadClick();
												}}
												className="border-none bg-blue-500 text-white hover:bg-blue-500/90"
											>
												Asignar un parametro de evaluacion
											</Button>
										</div>
										{showLongevidadForm && (
											<div className="my-4">
												<div>
													<SelectParametro
														courseId={courseIdNumber}
														parametro={formData.parametro ?? 0}
														onParametroChange={handleParametroChange}
														selectedColor={color}
													/>
													<Label
														htmlFor="porcentaje"
														className={`mb-2 ${color === '#FFFFFF' ? 'text-black' : 'text-white'}`}
													>
														Peso actividad en el parametro (0-100 en
														porcentaje%):
													</Label>
													<div>
														<Input
															value={formData.porcentaje || ''}
															className={`rounded-lg border border-slate-200 bg-transparent p-2 outline-none ${color === '#FFFFFF' ? 'text-black' : 'text-white'}`}
															type="number"
															id="percentage"
															name="porcentaje"
															min="0"
															max="100"
															step="1"
															placeholder="0-100"
															onChange={(e) =>
																handlePorcentajeChange(e.target.value)
															}
														/>
													</div>
												</div>
											</div>
										)}
									</>
								)}
							</div>
							<div className="flex flex-col">
								<div className="flex flex-col">
									<p>¿La actividad tiene fecha de entrega?</p>
									<div className="flex space-x-2">
										<label
											htmlFor="toggleFechaMaxima"
											className="relative inline-block h-8 w-16"
										>
											<input
												type="checkbox"
												id="toggleFechaMaxima"
												checked={fechaMaxima}
												onChange={handleToggleFechaMaxima}
												className="absolute size-0"
											/>
											<span
												className={`size-1/2 cursor-pointer rounded-full transition-all duration-300 ${fechaMaxima ? 'bg-gray-300' : 'bg-red-500'}`}
											>
												<span
													className={`absolute top-1 left-1 size-6 rounded-full bg-primary transition-all duration-300 ${fechaMaxima ? 'translate-x-8' : 'translate-x-0'}`}
												></span>
											</span>
										</label>
										<span className="mt-1 text-sm text-gray-400">
											{fechaMaxima ? 'Si' : 'No'}
										</span>
									</div>
								</div>
								{fechaMaxima && (
									<>
										<span
											className={`text-xl font-medium ${color === '#FFFFFF' ? 'text-black' : 'text-white'}`}
										>
											Fecha maxima de entrega:
										</span>
										<input
											type="datetime-local"
											className={`w-full rounded-lg border border-slate-200 bg-white p-2 text-black outline-none`}
											onChange={(e) =>
												setFormData({
													...formData,
													fechaMaximaEntrega: e.target.value,
												})
											}
										/>
									</>
								)}
							</div>
						</div>
						<Label
							className={`mb-2 text-xl ${color === '#FFFFFF' ? 'text-black' : 'text-white'}`}
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
							selectedColor={color}
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
