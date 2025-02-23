import { Button } from '~/components/admin/ui/button';
import { CardHeader, CardTitle } from '~/components/admin/ui/card';
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from '~/components/admin/ui/avatar';
import { ChevronLeft, MoreVertical, X } from 'lucide-react';
import type { Conversacion } from '~/types/chat';

interface ChatHeaderProps {
	conversacionActiva: Conversacion | null;
	setConversacionActiva: (conversacion: Conversacion | null) => void;
	setMostrarSeleccionContactos: (mostrar: boolean) => void;
	setIsOpen: (isOpen: boolean) => void;
}

export const ChatHeader = ({
	conversacionActiva,
	setConversacionActiva,
	setMostrarSeleccionContactos,
	setIsOpen,
}: ChatHeaderProps) => {
	const getEstadoColor = (estado: string) => {
		switch (estado) {
			case 'en_linea':
				return 'bg-green-500';
			case 'ausente':
				return 'bg-yellow-500';
			case 'ocupado':
				return 'bg-red-500';
			case 'desconectado':
				return 'bg-gray-500';
			default:
				return 'bg-gray-500';
		}
	};

	const getEstadoTexto = (estado: string) => {
		switch (estado) {
			case 'en_linea':
				return 'En línea';
			case 'ausente':
				return 'Ausente';
			case 'ocupado':
				return 'Ocupado';
			case 'desconectado':
				return 'Desconectado';
			default:
				return 'Desconocido';
		}
	};

	return (
		<CardHeader className="border-b bg-gradient-to-r from-white to-black p-4">
			<div className="flex items-center justify-between">
				{conversacionActiva ? (
					<Button
						variant="ghost"
						size="icon"
						onClick={() => setConversacionActiva(null)}
						className="text-black"
					>
						<ChevronLeft className="h-5 w-5" />
					</Button>
				) : (
					<div className="flex items-center gap-2">
						<CardTitle className="text-lg font-semibold text-black">
							Chat
						</CardTitle>
						<Button
							variant="secondary"
							size="sm"
							onClick={() => setMostrarSeleccionContactos(true)}
							className="bg-white text-black hover:bg-gray-100"
						>
							Nuevo chat
						</Button>
					</div>
				)}
				<div className="flex items-center gap-2">
					{conversacionActiva && (
						<Button variant="ghost" size="icon" className="text-black">
							<MoreVertical className="h-4 w-4" />
						</Button>
					)}
					<Button
						variant="ghost"
						size="icon"
						onClick={() => setIsOpen(false)}
						className="text-black"
					>
						<X className="h-4 w-4" />
					</Button>
				</div>
			</div>
			{conversacionActiva && conversacionActiva.contacto && (
				<div className="mt-2 flex items-center gap-3">
					<Avatar className="h-10 w-10 border-2 border-white">
						<AvatarImage
							src={conversacionActiva.contacto.avatar || '/placeholder.svg'}
						/>
						<AvatarFallback className="bg-primary-dark text-white">
							{conversacionActiva.contacto.nombre.charAt(0)}
							{conversacionActiva.contacto.apellido.charAt(0)}
						</AvatarFallback>
					</Avatar>
					<div>
						<h3 className="font-semibold text-white">
							{conversacionActiva.contacto.nombre}{' '}
							{conversacionActiva.contacto.apellido}
						</h3>
						<div className="flex items-center gap-2">
							<span
								className={`h-2 w-2 rounded-full ${getEstadoColor(conversacionActiva.contacto.estado)}`}
							/>
							<span className="text-sm text-white opacity-80">
								{getEstadoTexto(conversacionActiva.contacto.estado)}
							</span>
						</div>
					</div>
				</div>
			)}
		</CardHeader>
	);
};
