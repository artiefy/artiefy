'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '~/components/admin/ui/button';
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from '~/components/admin/ui/card';
import { Input } from '~/components/admin/ui/input';
import { ScrollArea } from '~/components/admin/ui/scroll-area';
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from '~/components/admin/ui/tabs';
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from '~/components/admin/ui/avatar';
import { Badge } from '~/components/admin/ui/badge';
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '~/components/admin/ui/popover';
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '~/components/admin/ui/tooltip';
import {
	X,
	Search,
	Send,
	ChevronLeft,
	MoreVertical,
	Phone,
	Video,
	Check,
	CheckCheck,
	ImageIcon,
	Smile,
	Mic,
	FileIcon,
	Calendar,
	Edit,
	Trash2,
	Reply,
	MessageCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import { useOnClickOutside } from '~/hooks/use-on-click-outside';

interface Contacto {
	id: string;
	nombre: string;
	apellido: string;
	rol: 'Estudiante' | 'Admin' | 'Técnico';
	estado: 'en_linea' | 'ausente' | 'ocupado' | 'desconectado';
	avatar?: string;
	ticketsPendientes?: number;
}

interface Reaccion {
	emoji: string;
	count: number;
	usuarios: string[];
}

interface Mensaje {
	id: string;
	texto: string;
	fecha: Date;
	emisorId: string;
	receptorId: string;
	leido: boolean;
	imagen?: string;
	archivo?: {
		nombre: string;
		tipo: string;
		url: string;
	};
	audio?: string;
	reacciones: Reaccion[];
	editado: boolean;
	respuestaA?: string;
}

interface Conversacion {
	contacto: Contacto;
	mensajes: Mensaje[];
}

const emojis = ['👍', '❤️', '😂', '😮', '😢', '😡'];

export const ChatButton = () => {
	const [isOpen, setIsOpen] = useState(false);
	const [busqueda, setBusqueda] = useState('');
	const [conversacionActiva, setConversacionActiva] =
		useState<Conversacion | null>(null);
	const [inputValue, setInputValue] = useState('');
	const [conversaciones, setConversaciones] = useState<Conversacion[]>([]);
	const [escribiendo, setEscribiendo] = useState(false);
	const [mensajeAResponder, setMensajeAResponder] = useState<Mensaje | null>(
		null
	);
	const [mensajeProgramado, setMensajeProgramado] = useState<{
		texto: string;
		fecha: Date;
	} | null>(null);
	const [mostrarSeleccionContactos, setMostrarSeleccionContactos] =
		useState(false);
	const scrollRef = useRef<HTMLDivElement>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const audioInputRef = useRef<HTMLInputElement>(null);
	const chatContainerRef = useRef<HTMLDivElement>(null);
	const { theme, setTheme } = useTheme();

	// Simulación de contactos
	const contactos: Contacto[] = [
		{
			id: '1',
			nombre: 'Juan',
			apellido: 'Pérez',
			rol: 'Estudiante',
			estado: 'en_linea',
			avatar: '/placeholder.svg',
			ticketsPendientes: 2,
		},
		{
			id: '2',
			nombre: 'Ana',
			apellido: 'García',
			rol: 'Admin',
			estado: 'ausente',
			avatar: '/placeholder.svg',
			ticketsPendientes: 0,
		},
		{
			id: '3',
			nombre: 'Carlos',
			apellido: 'Rodríguez',
			rol: 'Técnico',
			estado: 'ocupado',
			avatar: '/placeholder.svg',
			ticketsPendientes: 1,
		},
		{
			id: '4',
			nombre: 'María',
			apellido: 'López',
			rol: 'Estudiante',
			estado: 'en_linea',
			avatar: '/placeholder.svg',
			ticketsPendientes: 0,
		},
	];

	// Mensajes estáticos de ejemplo
	const mensajesEstaticos: Mensaje[] = [
		{
			id: '1',
			texto: 'Hola, ¿cómo puedo ayudarte hoy?',
			fecha: new Date(2023, 5, 1, 10, 30),
			emisorId: '2',
			receptorId: 'usuario',
			leido: true,
			reacciones: [],
			editado: false,
		},
		{
			id: '2',
			texto: 'Tengo un problema con mi cuenta, no puedo acceder.',
			fecha: new Date(2023, 5, 1, 10, 32),
			emisorId: 'usuario',
			receptorId: '2',
			leido: true,
			reacciones: [],
			editado: false,
		},
		{
			id: '3',
			texto:
				'Entiendo, vamos a revisar eso. ¿Puedes proporcionarme tu nombre de usuario?',
			fecha: new Date(2023, 5, 1, 10, 33),
			emisorId: '2',
			receptorId: 'usuario',
			leido: true,
			reacciones: [],
			editado: false,
		},
	];

	useEffect(() => {
		// Inicializar conversaciones con mensajes estáticos
		if (conversaciones.length === 0) {
			const conversacionInicial: Conversacion = {
				contacto: contactos[1], // Ana García
				mensajes: mensajesEstaticos,
			};
			setConversaciones([conversacionInicial]);
			setConversacionActiva(conversacionInicial);
		}
	}, [conversaciones.length]); // Removed mensajesEstaticos from dependencies

	useEffect(() => {
		if (scrollRef.current && conversacionActiva) {
			scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
		}
	}, [conversacionActiva?.mensajes]);

	useEffect(() => {
		if (isOpen) {
			document.title = 'Chat de Soporte';
		} else {
			document.title = 'Sistema de Soporte de Tickets';
		}
	}, [isOpen]);

	useOnClickOutside(chatContainerRef, () => {
		if (isOpen) {
			setIsOpen(false);
		}
	});

	const getEstadoColor = (estado: Contacto['estado']) => {
		switch (estado) {
			case 'en_linea':
				return 'bg-green-500';
			case 'ausente':
				return 'bg-yellow-500';
			case 'ocupado':
				return 'bg-red-500';
			case 'desconectado':
				return 'bg-gray-500';
		}
	};

	const getEstadoTexto = (estado: Contacto['estado']) => {
		switch (estado) {
			case 'en_linea':
				return 'En línea';
			case 'ausente':
				return 'Ausente';
			case 'ocupado':
				return 'Ocupado';
			case 'desconectado':
				return 'Desconectado';
		}
	};

	const iniciarConversacion = (contacto: Contacto) => {
		setConversaciones((prevConversaciones) => {
			let conversacion = prevConversaciones.find(
				(c) => c.contacto.id === contacto.id
			);
			if (!conversacion) {
				conversacion = {
					contacto,
					mensajes: [],
				};
				return [...prevConversaciones, conversacion];
			}
			return prevConversaciones;
		});
		setConversacionActiva((prevConversacionActiva) =>
			prevConversacionActiva?.contacto.id === contacto.id
				? prevConversacionActiva
				: conversaciones.find((c) => c.contacto.id === contacto.id) || null
		);
		setMostrarSeleccionContactos(false); // Cerrar vista de selección de contactos
	};

	const enviarMensaje = (
		texto: string,
		imagen?: string,
		archivo?: { nombre: string; tipo: string; url: string },
		audio?: string
	) => {
		if ((texto.trim() || imagen || archivo || audio) && conversacionActiva) {
			const nuevoMensaje: Mensaje = {
				id: Date.now().toString(),
				texto: texto.trim(),
				fecha: new Date(),
				emisorId: 'usuario',
				receptorId: conversacionActiva.contacto.id,
				leido: false,
				imagen,
				archivo,
				audio,
				reacciones: [],
				editado: false,
				respuestaA: mensajeAResponder?.id,
			};

			setConversaciones((prevConversaciones) =>
				prevConversaciones.map((conv) =>
					conv.contacto.id === conversacionActiva.contacto.id
						? {
								...conv,
								mensajes: [...conv.mensajes, nuevoMensaje],
							}
						: conv
				)
			);

			setInputValue('');
			setMensajeAResponder(null);

			// Simular respuesta
			setEscribiendo(true);
			setTimeout(() => {
				const respuesta: Mensaje = {
					id: Date.now().toString(),
					texto: `Respuesta automática de ${conversacionActiva.contacto.nombre}`,
					fecha: new Date(),
					emisorId: conversacionActiva.contacto.id,
					receptorId: 'usuario',
					leido: false,
					reacciones: [],
					editado: false,
				};

				setConversaciones((prevConversaciones) =>
					prevConversaciones.map((conv) =>
						conv.contacto.id === conversacionActiva.contacto.id
							? {
									...conv,
									mensajes: [...conv.mensajes, respuesta],
								}
							: conv
					)
				);
				setEscribiendo(false);
				setIsOpen(false); // Cerrar el chat después de enviar el mensaje
			}, 2000);
		}
	};

	const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (file) {
			const reader = new FileReader();
			reader.onloadend = () => {
				if (file.type.startsWith('image/')) {
					enviarMensaje('', reader.result as string);
				} else {
					enviarMensaje('', undefined, {
						nombre: file.name,
						tipo: file.type,
						url: URL.createObjectURL(file),
					});
				}
			};
			reader.readAsDataURL(file);
		}
	};

	const handleAudioUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (file) {
			const reader = new FileReader();
			reader.onloadend = () => {
				enviarMensaje('', undefined, undefined, reader.result as string);
			};
			reader.readAsDataURL(file);
		}
	};

	const agregarReaccion = (mensajeId: string, emoji: string) => {
		if (conversacionActiva) {
			const nuevasConversaciones = conversaciones.map((conv) => {
				if (conv.contacto.id === conversacionActiva.contacto.id) {
					const nuevosMensajes = conv.mensajes.map((mensaje) => {
						if (mensaje.id === mensajeId) {
							const reaccionExistente = mensaje.reacciones.find(
								(r) => r.emoji === emoji
							);
							if (reaccionExistente) {
								return {
									...mensaje,
									reacciones: mensaje.reacciones.map((r) =>
										r.emoji === emoji
											? {
													...r,
													count: r.count + 1,
													usuarios: [...r.usuarios, 'usuario'],
												}
											: r
									),
								};
							} else {
								return {
									...mensaje,
									reacciones: [
										...mensaje.reacciones,
										{ emoji, count: 1, usuarios: ['usuario'] },
									],
								};
							}
						}
						return mensaje;
					});
					return { ...conv, mensajes: nuevosMensajes };
				}
				return conv;
			});
			setConversaciones(nuevasConversaciones);
		}
	};

	const editarMensaje = (mensajeId: string, nuevoTexto: string) => {
		if (conversacionActiva) {
			const nuevasConversaciones = conversaciones.map((conv) => {
				if (conv.contacto.id === conversacionActiva.contacto.id) {
					const nuevosMensajes = conv.mensajes.map((mensaje) => {
						if (mensaje.id === mensajeId) {
							return { ...mensaje, texto: nuevoTexto, editado: true };
						}
						return mensaje;
					});
					return { ...conv, mensajes: nuevosMensajes };
				}
				return conv;
			});
			setConversaciones(nuevasConversaciones);
		}
	};

	const eliminarMensaje = (mensajeId: string) => {
		if (conversacionActiva) {
			const nuevasConversaciones = conversaciones.map((conv) => {
				if (conv.contacto.id === conversacionActiva.contacto.id) {
					const nuevosMensajes = conv.mensajes.filter(
						(mensaje) => mensaje.id !== mensajeId
					);
					return { ...conv, mensajes: nuevosMensajes };
				}
				return conv;
			});
			setConversaciones(nuevasConversaciones);
		}
	};

	const programarMensaje = (texto: string, fecha: Date) => {
		setMensajeProgramado({ texto, fecha });
		const tiempoRestante = fecha.getTime() - new Date().getTime();
		setTimeout(() => {
			enviarMensaje(texto);
			setMensajeProgramado(null);
		}, tiempoRestante);
	};

	const buscarMensajes = (terminoBusqueda: string) => {
		if (conversacionActiva) {
			return conversacionActiva.mensajes.filter((mensaje) =>
				mensaje.texto.toLowerCase().includes(terminoBusqueda.toLowerCase())
			);
		}
		return [];
	};

	const contactosFiltrados = contactos.filter(
		(contacto) =>
			contacto.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
			contacto.apellido.toLowerCase().includes(busqueda.toLowerCase())
	);

	const formatearFecha = (fecha: Date) => {
		const hoy = new Date();
		const ayer = new Date(hoy);
		ayer.setDate(ayer.getDate() - 1);

		if (fecha.toDateString() === hoy.toDateString()) {
			return fecha.toLocaleTimeString([], {
				hour: '2-digit',
				minute: '2-digit',
			});
		} else if (fecha.toDateString() === ayer.toDateString()) {
			return 'Ayer';
		} else {
			return fecha.toLocaleDateString();
		}
	};

	return (
		<AnimatePresence>
			{isOpen ? (
				<motion.div
					ref={chatContainerRef}
					initial={{ opacity: 0, scale: 0.8 }}
					animate={{ opacity: 1, scale: 1 }}
					exit={{ opacity: 0, scale: 0.95 }}
					transition={{ duration: 0.3 }}
					className="fixed bottom-20 right-4 z-50 rounded-lg bg-white shadow-lg"
				>
					<Card className="relative flex h-[650px] w-[380px] flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg divide-y divide-gray-200">
						<CardHeader className="flex w-full items-center justify-between gap-2 border-b bg-gray-50 p-4 border-gray-200 rounded-t-lg sticky top-0 z-10">
							<div className="flex w-full justify-between gap-8 px-10  bg-white rounded-lg border border-gray-200 shadow-sm focus-within:ring-1 focus-within:ring-primary focus-within:ring-opacity-50">
								{conversacionActiva ? (
									<Button
										variant="ghost"
										size="icon"
										onClick={() => setConversacionActiva(null)}
									>
										<ChevronLeft className="h-5 w-5" />
									</Button>
								) : (
									<div className="flex items-center gap-2">
										<CardTitle className="text-lg font-semibold">
											Chat
										</CardTitle>
										<Button
											variant="outline"
											size="sm"
											onClick={() => setMostrarSeleccionContactos(true)}
										>
											Nuevo chat
										</Button>
									</div>
								)}
								<div className="flex items-center gap-2 flex-1">
									{conversacionActiva && (
										<>
											<Button variant="ghost" size="icon">
												<Phone className="h-4 w-4" />
											</Button>
											<Button variant="ghost" size="icon">
												<Video className="h-4 w-4" />
											</Button>
											<Button variant="ghost" size="icon">
												<MoreVertical className="h-4 w-4" />
											</Button>
										</>
									)}
									<Button
										variant="ghost"
										size="icon"
										onClick={() => setIsOpen(false)}
									>
										<X className="h-4 w-4" />
									</Button>
								</div>
							</div>
							{conversacionActiva && (
								<div className="mt-2 flex items-center gap-3">
									<Avatar className="h-10 w-10">
										<AvatarImage src={conversacionActiva.contacto.avatar} />
										<AvatarFallback>
											{conversacionActiva.contacto.nombre.charAt(0)}
											{conversacionActiva.contacto.apellido.charAt(0)}
										</AvatarFallback>
									</Avatar>
									<div>
										<h3 className="font-semibold">
											{conversacionActiva.contacto.nombre}{' '}
											{conversacionActiva.contacto.apellido}
										</h3>
										<div className="flex items-center gap-2">
											<span
												className={`h-2 w-2 rounded-full ${getEstadoColor(conversacionActiva.contacto.estado)}`}
											/>
											<span className="text-sm text-muted-foreground">
												{getEstadoTexto(conversacionActiva.contacto.estado)}
											</span>
										</div>
									</div>
								</div>
							)}
						</CardHeader>

						<CardContent className="flex-1 p-0">
							{conversacionActiva ? (
								<>
									<ScrollArea className="h-[440px] flex-1 p-4" ref={scrollRef}>
										<div className="space-y-4">
											{conversacionActiva.mensajes.map((mensaje, index) => {
												const esNuevaFecha =
													index === 0 ||
													new Date(mensaje.fecha).toDateString() !==
														new Date(
															conversacionActiva.mensajes[index - 1].fecha
														).toDateString();

												return (
													<div key={mensaje.id}>
														{esNuevaFecha && (
															<div className="my-2 flex justify-center">
																<Badge variant="outline" className="text-xs">
																	{formatearFecha(new Date(mensaje.fecha))}
																</Badge>
															</div>
														)}
														<div
															className={`flex ${mensaje.emisorId === 'usuario' ? 'justify-end' : 'justify-start'}`}
														>
															<div
																className={`max-w-[70%] rounded-lg px-4 py-2 ${
																	mensaje.emisorId === 'usuario'
																		? 'bg-primary text-primary-foreground'
																		: 'bg-muted'
																}`}
															>
																{mensaje.respuestaA && (
																	<div className="mb-1 text-xs text-muted-foreground">
																		Respondiendo a:{' '}
																		{conversacionActiva.mensajes
																			.find((m) => m.id === mensaje.respuestaA)
																			?.texto.slice(0, 20)}
																		...
																	</div>
																)}
																{mensaje.imagen && (
																	<img
																		src={mensaje.imagen || '/placeholder.svg'}
																		alt="Imagen adjunta"
																		className="mb-2 h-auto max-w-full rounded-lg"
																	/>
																)}
																{mensaje.archivo && (
																	<div className="mb-2 flex items-center gap-2">
																		<FileIcon className="h-4 w-4" />
																		<a
																			href={mensaje.archivo.url}
																			download={mensaje.archivo.nombre}
																			className="text-sm underline"
																		>
																			{mensaje.archivo.nombre}
																		</a>
																	</div>
																)}
																{mensaje.audio && (
																	<audio controls className="mb-2 w-full">
																		<source
																			src={mensaje.audio}
																			type="audio/mpeg"
																		/>
																		Tu navegador no soporta el elemento de
																		audio.
																	</audio>
																)}
																{mensaje.texto && (
																	<p className="text-sm">{mensaje.texto}</p>
																)}
																<div className="mt-1 flex items-center justify-end gap-1">
																	<p className="text-xs opacity-70">
																		{new Date(mensaje.fecha).toLocaleTimeString(
																			[],
																			{
																				hour: '2-digit',
																				minute: '2-digit',
																			}
																		)}
																	</p>
																	{mensaje.editado && (
																		<span className="text-xs opacity-70">
																			(editado)
																		</span>
																	)}
																	{mensaje.emisorId === 'usuario' &&
																		(mensaje.leido ? (
																			<CheckCheck className="h-3 w-3 text-blue-500" />
																		) : (
																			<Check className="h-3 w-3" />
																		))}
																</div>
																{mensaje.reacciones.length > 0 && (
																	<div className="mt-1 flex gap-1">
																		{mensaje.reacciones.map(
																			(reaccion, index) => (
																				<Badge
																					key={index}
																					variant="secondary"
																					className="text-xs"
																				>
																					{reaccion.emoji} {reaccion.count}
																				</Badge>
																			)
																		)}
																	</div>
																)}
															</div>
															<div className="ml-2 flex flex-col">
																<Popover>
																	<PopoverTrigger asChild>
																		<Button
																			variant="ghost"
																			size="sm"
																			className="h-8 w-8 rounded-full p-0"
																		>
																			<Smile className="h-4 w-4" />
																		</Button>
																	</PopoverTrigger>
																	<PopoverContent className="w-auto p-1">
																		<div className="flex gap-1">
																			{emojis.map((emoji) => (
																				<Button
																					key={emoji}
																					variant="ghost"
																					size="sm"
																					className="h-8 w-8 p-0"
																					onClick={() =>
																						agregarReaccion(mensaje.id, emoji)
																					}
																				>
																					{emoji}
																				</Button>
																			))}
																		</div>
																	</PopoverContent>
																</Popover>
																<Button
																	variant="ghost"
																	size="sm"
																	className="h-8 w-8 rounded-full p-0"
																	onClick={() => setMensajeAResponder(mensaje)}
																>
																	<Reply className="h-4 w-4" />
																</Button>
																{mensaje.emisorId === 'usuario' && (
																	<>
																		<Button
																			variant="ghost"
																			size="sm"
																			className="h-8 w-8 rounded-full p-0"
																			onClick={() => {
																				const nuevoTexto = prompt(
																					'Editar mensaje',
																					mensaje.texto
																				);
																				if (nuevoTexto)
																					editarMensaje(mensaje.id, nuevoTexto);
																			}}
																		>
																			<Edit className="h-4 w-4" />
																		</Button>
																		<Button
																			variant="ghost"
																			size="sm"
																			className="h-8 w-8 rounded-full p-0"
																			onClick={() => {
																				if (
																					confirm(
																						'¿Estás seguro de que quieres eliminar este mensaje?'
																					)
																				) {
																					eliminarMensaje(mensaje.id);
																				}
																			}}
																		>
																			<Trash2 className="h-4 w-4" />
																		</Button>
																	</>
																)}
															</div>
														</div>
													</div>
												);
											})}
										</div>
										{escribiendo && (
											<div className="mt-2 flex items-center gap-2">
												<div className="flex animate-pulse space-x-1">
													<div className="h-2 w-2 rounded-full bg-gray-500"></div>
													<div className="h-2 w-2 rounded-full bg-gray-500"></div>
													<div className="h-2 w-2 rounded-full bg-gray-500"></div>
												</div>
												<span className="text-sm text-muted-foreground">
													Escribiendo...
												</span>
											</div>
										)}
									</ScrollArea>
									<div className="border-t p-4">
										{mensajeAResponder && (
											<div className="bg-muted mb-2 flex items-center justify-between rounded-md p-2">
												<p className="truncate text-sm">
													Respondiendo a: {mensajeAResponder.texto.slice(0, 30)}
													...
												</p>
												<Button
													variant="ghost"
													size="sm"
													onClick={() => setMensajeAResponder(null)}
												>
													<X className="h-4 w-4" />
												</Button>
											</div>
										)}
										<div className="flex items-center gap-2">
											<Input
												value={inputValue}
												onChange={(e) => setInputValue(e.target.value)}
												placeholder="Escriba su mensaje..."
												onKeyPress={(e) =>
													e.key === 'Enter' && enviarMensaje(inputValue)
												}
											/>
											<TooltipProvider>
												<Tooltip>
													<TooltipTrigger asChild>
														<Button
															size="icon"
															variant="ghost"
															onClick={() => fileInputRef.current?.click()}
														>
															<ImageIcon className="h-4 w-4" />
														</Button>
													</TooltipTrigger>
													<TooltipContent>
														<p>Enviar archivo</p>
													</TooltipContent>
												</Tooltip>
											</TooltipProvider>
											<input
												type="file"
												ref={fileInputRef}
												onChange={handleFileUpload}
												accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
												className="hidden"
											/>
											<TooltipProvider>
												<Tooltip>
													<TooltipTrigger asChild>
														<Button
															size="icon"
															variant="ghost"
															onClick={() => audioInputRef.current?.click()}
														>
															<Mic className="h-4 w-4" />
														</Button>
													</TooltipTrigger>
													<TooltipContent>
														<p>Enviar nota de voz</p>
													</TooltipContent>
												</Tooltip>
											</TooltipProvider>
											<input
												type="file"
												ref={audioInputRef}
												onChange={handleAudioUpload}
												accept="audio/*"
												className="hidden"
											/>
											<TooltipProvider>
												<Tooltip>
													<TooltipTrigger asChild>
														<Button
															size="icon"
															variant="ghost"
															onClick={() => {
																const fecha = prompt(
																	'Ingrese la fecha y hora para enviar el mensaje (YYYY-MM-DD HH:MM)'
																);
																if (fecha) {
																	const fechaProgramada = new Date(fecha);
																	if (!isNaN(fechaProgramada.getTime())) {
																		programarMensaje(
																			inputValue,
																			fechaProgramada
																		);
																	} else {
																		alert('Fecha inválida');
																	}
																}
															}}
														>
															<Calendar className="h-4 w-4" />
														</Button>
													</TooltipTrigger>
													<TooltipContent>
														<p>Programar mensaje</p>
													</TooltipContent>
												</Tooltip>
											</TooltipProvider>
											<Button
												size="icon"
												onClick={() => enviarMensaje(inputValue)}
											>
												<Send className="h-4 w-4" />
											</Button>
										</div>
									</div>
								</>
							) : mostrarSeleccionContactos ? (
								<ScrollArea className="h-[520px]">
									<div className="p-4">
										<h3 className="mb-4 text-lg font-semibold">
											Seleccionar contacto
										</h3>
										<div className="space-y-2">
											{contactos.map((contacto) => (
												<Button
													key={contacto.id}
													variant="outline"
													className="w-full justify-start"
													onClick={() => iniciarConversacion(contacto)}
												>
													<Avatar className="mr-2 h-8 w-8">
														<AvatarImage src={contacto.avatar} />
														<AvatarFallback>
															{contacto.nombre.charAt(0)}
															{contacto.apellido.charAt(0)}
														</AvatarFallback>
													</Avatar>
													<div className="flex-1 text-left">
														<p className="font-medium">
															{contacto.nombre} {contacto.apellido}
														</p>
														<p className="text-sm text-muted-foreground">
															{contacto.rol}
														</p>
													</div>
													<Badge variant="secondary" className="ml-2">
														{getEstadoTexto(contacto.estado)}
													</Badge>
												</Button>
											))}
										</div>
									</div>
								</ScrollArea>
							) : (
								<>
									<div className="border-b p-4">
										<div className="relative">
											<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
											<Input
												placeholder="Buscar contactos..."
												value={busqueda}
												onChange={(e) => setBusqueda(e.target.value)}
												className="pl-9"
											/>
										</div>
									</div>
									<Tabs defaultValue="todos" className="w-full">
										<TabsList className="h-auto w-full justify-start gap-2 px-4 py-2">
											<TabsTrigger value="todos" className="text-xs">
												Todos
											</TabsTrigger>
											<TabsTrigger value="estudiantes" className="text-xs">
												Estudiantes
											</TabsTrigger>
											<TabsTrigger value="admins" className="text-xs">
												Administradores
											</TabsTrigger>
										</TabsList>
										<ScrollArea className="h-[440px]">
											<TabsContent value="todos" className="m-0">
												<div className="divide-y">
													{contactosFiltrados.map((contacto) => (
														<button
															key={contacto.id}
															className="hover:bg-muted/50 flex w-full items-center gap-3 p-4 transition-colors"
															onClick={() => iniciarConversacion(contacto)}
														>
															<Avatar className="h-10 w-10">
																<AvatarImage src={contacto.avatar} />
																<AvatarFallback>
																	{contacto.nombre.charAt(0)}
																	{contacto.apellido.charAt(0)}
																</AvatarFallback>
															</Avatar>
															<div className="flex-1 text-left">
																<div className="flex items-center justify-between">
																	<p className="font-semibold">
																		{contacto.nombre} {contacto.apellido}
																	</p>
																	<Badge variant="outline" className="text-xs">
																		{contacto.rol}
																	</Badge>
																</div>
																<div className="flex items-center gap-2">
																	<span
																		className={`h-2 w-2 rounded-full ${getEstadoColor(contacto.estado)}`}
																	/>
																	<span className="text-sm text-muted-foreground">
																		{getEstadoTexto(contacto.estado)}
																	</span>
																</div>
															</div>
															{contacto.ticketsPendientes &&
																contacto.ticketsPendientes > 0 && (
																	<Badge variant="destructive">
																		{contacto.ticketsPendientes}
																	</Badge>
																)}
														</button>
													))}
												</div>
											</TabsContent>
											<TabsContent value="estudiantes" className="m-0">
												<div className="divide-y">
													{contactosFiltrados
														.filter((c) => c.rol === 'Estudiante')
														.map((contacto) => (
															<button
																key={contacto.id}
																className="hover:bg-muted/50 flex w-full items-center gap-3 p-4 transition-colors"
																onClick={() => iniciarConversacion(contacto)}
															>
																<Avatar className="h-10 w-10">
																	<AvatarImage src={contacto.avatar} />
																	<AvatarFallback>
																		{contacto.nombre.charAt(0)}
																		{contacto.apellido.charAt(0)}
																	</AvatarFallback>
																</Avatar>
																<div className="flex-1 text-left">
																	<div className="flex items-center justify-between">
																		<p className="font-semibold">
																			{contacto.nombre} {contacto.apellido}
																		</p>
																		<Badge
																			variant="outline"
																			className="text-xs"
																		>
																			{contacto.rol}
																		</Badge>
																	</div>
																	<div className="flex items-center gap-2">
																		<span
																			className={`h-2 w-2 rounded-full ${getEstadoColor(contacto.estado)}`}
																		/>
																		<span className="text-sm text-muted-foreground">
																			{getEstadoTexto(contacto.estado)}
																		</span>
																	</div>
																</div>
																{contacto.ticketsPendientes &&
																	contacto.ticketsPendientes > 0 && (
																		<Badge variant="destructive">
																			{contacto.ticketsPendientes}
																		</Badge>
																	)}
															</button>
														))}
												</div>
											</TabsContent>
											<TabsContent value="admins" className="m-0">
												<div className="divide-y">
													{contactosFiltrados
														.filter((c) => c.rol === 'Admin')
														.map((contacto) => (
															<button
																key={contacto.id}
																className="hover:bg-muted/50 transitioncolors flex w-full items-center gap-3 p-4"
																onClick={() => iniciarConversacion(contacto)}
															>
																<Avatar className="h-10 w-10">
																	<AvatarImage src={contacto.avatar} />
																	<AvatarFallback>
																		{contacto.nombre.charAt(0)}
																		{contacto.apellido.charAt(0)}
																	</AvatarFallback>
																</Avatar>
																<div className="flex-1 text-left">
																	<div className="flex items-center justify-between">
																		<p className="font-semibold">
																			{contacto.nombre} {contacto.apellido}
																		</p>
																		<Badge
																			variant="outline"
																			className="text-xs"
																		>
																			{contacto.rol}
																		</Badge>
																	</div>
																	<div className="flex items-center gap-2">
																		<span
																			className={`h-2 w-2 rounded-full ${getEstadoColor(contacto.estado)}`}
																		/>
																		<span className="text-sm text-muted-foreground">
																			{getEstadoTexto(contacto.estado)}
																		</span>
																	</div>
																</div>
																{contacto.ticketsPendientes &&
																	contacto.ticketsPendientes > 0 && (
																		<Badge variant="destructive">
																			{contacto.ticketsPendientes}
																		</Badge>
																	)}
															</button>
														))}
												</div>
											</TabsContent>
										</ScrollArea>
									</Tabs>
								</>
							)}
						</CardContent>
					</Card>
				</motion.div>
			) : (
				<motion.div
					initial={{ opacity: 0, scale: 0.8 }}
					animate={{ opacity: 1, scale: 1 }}
					exit={{ opacity: 0, scale: 0.8 }}
					transition={{ duration: 0.3 }}
					className="fixed bottom-4 right-4 z-50"
				>
					<Button
						onClick={() => {
							setIsOpen(true);
							setMostrarSeleccionContactos(true);
						}}
						className="flex h-16 w-16 items-center justify-center rounded-full bg-primary shadow-lg transition-all duration-300 hover:bg-primary/90 hover:shadow-xl"
					>
						<MessageCircle className="h-8 w-8 text-primary-foreground" />
					</Button>
				</motion.div>
			)}
		</AnimatePresence>
	);
};
