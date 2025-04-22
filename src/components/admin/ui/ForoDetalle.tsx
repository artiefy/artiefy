'use client';

import { useState } from 'react';
import { ThumbsUp, MessageSquare, ImageIcon, Send } from 'lucide-react';
import Image from 'next/image';
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from '~/components/admin/ui/avatar';
import { Button } from '~/components/admin/ui/button';
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from '~/components/admin/ui/card';
import { Textarea } from '~/components/admin/ui/textarea';

interface Foro {
	id: number;
	titulo: string;
	descripcion: string;
	mensajes: number;
	ultimaActividad: string;
}

interface Mensaje {
	id: number;
	autor: string;
	contenido: string;
	fecha: string;
	likes: number;
	respuestas: number;
	imagen?: string;
}

interface ForoDetalleProps {
	foro: Foro;
	onVolverAction: () => void;
}

const mensajesIniciales: Mensaje[] = [
	{
		id: 1,
		autor: 'Ana García',
		contenido:
			'¡Hola a todos! ¿Alguien más está teniendo problemas con el último ejercicio del módulo 3?',
		fecha: '2023-06-15 10:30',
		likes: 5,
		respuestas: 2,
	},
	{
		id: 2,
		autor: 'Carlos Rodríguez',
		contenido:
			'Sí, yo también tuve dificultades. Aquí hay una captura de pantalla que muestra cómo lo resolví.',
		fecha: '2023-06-15 11:15',
		likes: 8,
		respuestas: 1,
		imagen: 'https://picsum.photos/seed/picsum/300/200',
	},
];

interface ForoDetalleProps {
	foro: Foro;

	onVolver: () => void;
}

export function ForoDetalle({ foro, onVolverAction }: ForoDetalleProps) {
	const [mensajes, setMensajes] = useState<Mensaje[]>(mensajesIniciales);
	const [nuevoMensaje, setNuevoMensaje] = useState('');
	const [imagenSeleccionada, setImagenSeleccionada] = useState<File | null>(
		null
	);

	const handleEnviarMensaje = () => {
		if (nuevoMensaje.trim() === '' && !imagenSeleccionada) return;

		const nuevoMensajeObj: Mensaje = {
			id: mensajes.length + 1,
			autor: 'Usuario Actual',
			contenido: nuevoMensaje,
			fecha: new Date().toLocaleString(),
			likes: 0,
			respuestas: 0,
			imagen: imagenSeleccionada
				? URL.createObjectURL(imagenSeleccionada)
				: undefined,
		};

		setMensajes([...mensajes, nuevoMensajeObj]);
		setNuevoMensaje('');
		setImagenSeleccionada(null);
	};

	const handleLike = (mensajeId: number) => {
		setMensajes(
			mensajes.map((mensaje) =>
				mensaje.id === mensajeId
					? { ...mensaje, likes: mensaje.likes + 1 }
					: mensaje
			)
		);
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center justify-between">
					<span>{foro.titulo}</span>
					<Button onClick={onVolverAction} variant="outline">
						Volver a la lista
					</Button>
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="space-y-6">
					{mensajes.map((mensaje) => (
						<Card key={mensaje.id}>
							<CardContent className="pt-6">
								<div className="flex items-start space-x-4">
									<Avatar>
										<AvatarImage
											src={`https://api.dicebear.com/6.x/initials/svg?seed=${mensaje.autor}`}
										/>
										<AvatarFallback>
											{mensaje.autor
												.split(' ')
												.map((n) => n[0])
												.join('')}
										</AvatarFallback>
									</Avatar>
									<div className="grow">
										<div className="mb-2 flex items-center justify-between">
											<span className="font-semibold">{mensaje.autor}</span>
											<span className="text-sm text-gray-500">
												{mensaje.fecha}
											</span>
										</div>
										<p className="mb-2 text-sm">{mensaje.contenido}</p>
										{mensaje.imagen && (
											<Image
												src={mensaje.imagen}
												alt="Imagen adjunta"
												className="mb-2 h-auto max-w-full rounded-lg"
												width={300}
												height={200}
											/>
										)}
										<div className="flex space-x-4">
											<Button
												variant="ghost"
												size="sm"
												onClick={() => handleLike(mensaje.id)}
											>
												<ThumbsUp className="mr-2 size-4" />
												{mensaje.likes}
											</Button>
											<Button variant="ghost" size="sm">
												<MessageSquare className="mr-2 size-4" />
												{mensaje.respuestas}
											</Button>
										</div>
									</div>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
				<div className="mt-6">
					<Textarea
						placeholder="Escribe tu mensaje..."
						value={nuevoMensaje}
						onChange={(e) => setNuevoMensaje(e.target.value)}
						className="mb-2"
					/>
					<div className="flex items-center justify-between">
						<div>
							<input
								type="file"
								id="imagen"
								className="hidden"
								accept="image/*"
								onChange={(e) =>
									setImagenSeleccionada(e.target.files?.[0] ?? null)
								}
							/>
							<label htmlFor="imagen">
								<Button variant="outline" size="sm">
									<ImageIcon className="mr-2 size-4" />
									Adjuntar imagen
								</Button>
							</label>
							{imagenSeleccionada && (
								<span className="ml-2 text-sm text-gray-500">
									{imagenSeleccionada.name}
								</span>
							)}
						</div>
						<Button onClick={handleEnviarMensaje}>
							<Send className="mr-2 size-4" />
							Enviar
						</Button>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
