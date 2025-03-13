'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import { useOnClickOutside } from '~/hooks/use-on-click-outside';
import { Button } from '~/components/admin/ui/button';
import { Card } from '~/components/admin/ui/card';
import { MessageCircle } from 'lucide-react';
import { ChatHeader } from '~/components/admin/ui/ChatHeader';
import { ChatContent } from './ChatContent';
import { ChatInput } from '~/components/admin/ui/ChatInput';
import type { Contacto, Conversacion, Mensaje } from '~/types/chat';

const ChatButton = () => {
	const [isOpen, setIsOpen] = useState(false);
	const [busqueda, setBusqueda] = useState('');
	const [conversacionActiva, setConversacionActiva] =
		useState<Conversacion | null>(null);
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
	const chatContainerRef = useRef<HTMLElement>(null);
	const { theme, setTheme } = useTheme();

	// Simulación de contactos y conversaciones (mantenido del código original)
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
			nombre: 'María',
			apellido: 'González',
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
			ticketsPendientes: 5,
		},
	];

	useEffect(() => {
		// Simulación de conversaciones iniciales
		setConversaciones([
			{
				contacto: contactos[0],
				mensajes: [
					{
						id: '1',
						texto: 'Hola, ¿cómo puedo ayudarte?',
						fecha: new Date(),
						emisorId: contactos[0].id,
						receptorId: 'usuario',
						leido: true,
						reacciones: [],
						editado: false,
					},
				],
			},
			{
				contacto: contactos[1],
				mensajes: [
					{
						id: '2',
						texto: 'Bienvenido al sistema de soporte',
						fecha: new Date(),
						emisorId: contactos[1].id,
						receptorId: 'usuario',
						leido: false,
						reacciones: [],
						editado: false,
					},
				],
			},
		]);
	}, []);

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

	const iniciarConversacion = (contacto: Contacto) => {
		const conversacionExistente = conversaciones.find(
			(c) => c.contacto.id === contacto.id
		);
		if (conversacionExistente) {
			setConversacionActiva(conversacionExistente);
		} else {
			const nuevaConversacion = {
				contacto,
				mensajes: [],
			};
			setConversaciones((prev) => [...prev, nuevaConversacion]);
			setConversacionActiva(nuevaConversacion);
		}
		setMostrarSeleccionContactos(false);
	};

	const enviarMensaje = (
		texto: string,
		imagen?: string,
		archivo?: { nombre: string; tipo: string; url: string },
		audio?: string
	) => {
		if (!conversacionActiva || !conversacionActiva.contacto) {
			console.error(
				'No hay una conversación activa o el contacto es indefinido'
			);
			// Optionally, you can show an error message to the user here
			return;
		}

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

		setConversacionActiva((prev) =>
			prev ? { ...prev, mensajes: [...prev.mensajes, nuevoMensaje] } : null
		);

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

			setConversacionActiva((prev) =>
				prev ? { ...prev, mensajes: [...prev.mensajes, respuesta] } : null
			);

			setEscribiendo(false);
		}, 2000);
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

	return (
		<AnimatePresence>
			{isOpen ? (
				<motion.div
					ref={chatContainerRef}
					initial={{ opacity: 0, scale: 0.8 }}
					animate={{ opacity: 1, scale: 1 }}
					exit={{ opacity: 0, scale: 0.95 }}
					transition={{ duration: 0.3 }}
					className="fixed bottom-4 right-4 z-50"
				>
					<Card className="flex h-[600px] w-[400px] flex-col overflow-hidden shadow-2xl">
						<ChatHeader
							conversacionActiva={conversacionActiva}
							setConversacionActiva={setConversacionActiva}
							setMostrarSeleccionContactos={setMostrarSeleccionContactos}
							setIsOpen={setIsOpen}
						/>
						<ChatContent
							conversacionActiva={conversacionActiva}
							mostrarSeleccionContactos={
								mostrarSeleccionContactos || !conversacionActiva
							}
							busqueda={busqueda}
							setBusqueda={setBusqueda}
							iniciarConversacion={iniciarConversacion}
							enviarMensaje={enviarMensaje}
							escribiendo={escribiendo}
							mensajeAResponder={mensajeAResponder}
							setMensajeAResponder={setMensajeAResponder}
							agregarReaccion={agregarReaccion}
							editarMensaje={editarMensaje}
							eliminarMensaje={eliminarMensaje}
							contactos={contactos}
							conversaciones={conversaciones}
							setConversacionActiva={setConversacionActiva}
						/>
						{conversacionActiva && (
							<ChatInput
								enviarMensajeAction={enviarMensaje}
								mensajeAResponder={mensajeAResponder}
								setMensajeAResponderAction={setMensajeAResponder}
							/>
						)}
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
						<MessageCircle className={`h-8 w-8 ${theme === "dark" ? "text-yellow-400" : "text-blue-500"}`} />
					</Button>
				</motion.div>
			)}
		</AnimatePresence>
	);
};

export default ChatButton;
