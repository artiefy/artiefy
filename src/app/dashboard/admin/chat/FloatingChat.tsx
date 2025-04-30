'use client';

import { useEffect, useState } from 'react';
import { Send, X, MessageCircle } from 'lucide-react';
import socket from '~/lib/socket';
import { useAuth } from '@clerk/nextjs';

interface Message {
	id: number;
	senderId: string;
	message: string;
	createdAt: string;
	senderName?: string;
}

interface FloatingChatProps {
	chatId?: string | null;
	receiverId?: string | null; // nuevo
	userName?: string;
	onClose?: () => void;
}

export default function FloatingChat({
	chatId,
	userName,
	receiverId: propReceiverId,
	onClose,
}: FloatingChatProps) {
	const [messages, setMessages] = useState<Message[]>([]);
	const [newMessage, setNewMessage] = useState('');
	const [isExpanded, setIsExpanded] = useState(false);
	const [currentConversationId, setCurrentConversationId] = useState<
		string | null
	>(null);
	const [receiverId, setReceiverId] = useState<string | null>(null);
	const [hasNotification, setHasNotification] = useState(false);
	const { userId } = useAuth();

	useEffect(() => {
		if (chatId) {
			setCurrentConversationId(chatId);
			setIsExpanded(true);
			if (propReceiverId) {
				setReceiverId(propReceiverId);
			}
			void fetchConversationHistory(chatId);
		} else {
			setReceiverId(propReceiverId ?? null);
		}
	}, [chatId, propReceiverId]);

	useEffect(() => {
		const handleNewMessage = (data: any) => {
			if (data.conversationId === currentConversationId) {
				setMessages((prev) => [...prev, data]);
			} else {
				// Mensaje para otra conversación
				setHasNotification(true);
			}
		};

		const handleNotification = (data: any) => {
			console.log('📢 Notificación recibida:', data);
			setHasNotification(true);
		};

		socket.on('message', handleNewMessage);
		socket.on('notification', handleNotification);

		return () => {
			socket.off('message', handleNewMessage);
			socket.off('notification', handleNotification);
		};
	}, [currentConversationId]);

	const fetchConversationHistory = async (conversationId: string) => {
		try {
			const response = await fetch(
				`/api/admin/chat/messages/${conversationId}`
			);
			if (!response.ok) throw new Error('Error fetching messages');
			const data = await response.json();
			setMessages(data.messages || []);
		} catch (error) {
			console.error('Error fetching messages:', error);
		}
	};

	const handleSendMessage = async () => {
		if (!newMessage.trim() || !userId) return;

		try {
			const response = await fetch('/api/admin/chat/createMessage', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					conversationId: currentConversationId, // <--- este es clave
					receiverId: currentConversationId ? null : (receiverId ?? 'new'),
					message: newMessage,
				}),
			});

			const data = await response.json();

			// Solo setear si era nueva
			if (!currentConversationId && data.conversationId) {
				setCurrentConversationId(data.conversationId);
			}

			const newMsg = {
				id: data.messageId,
				senderId: userId,
				message: newMessage.trim(),
				createdAt: new Date().toISOString(),
			};

			setMessages((prev) => [...prev, newMsg]);
			setNewMessage('');

			console.log('📤 Emitiendo mensaje via socket:', {
				conversationId: data.conversationId,
				senderName: 'Tú',
				receiverId: receiverId,
			});

			// Si el servidor devolvió el receiverId (por ejemplo, al crear nueva conversación)
if (data.receiverId && !receiverId) {
	setReceiverId(data.receiverId);
}

			// Determinar el destinatario
			const targetReceiverId = receiverId || propReceiverId;
			if (!targetReceiverId) {
				console.warn(
					'⚠️ receiverId está vacío. No se podrá emitir correctamente.'
				);
			}

			socket.emit('message', {
				...newMsg,
				conversationId: data.conversationId,
				senderName: 'Tú',
				receiverId: targetReceiverId,
			});
		} catch (error) {
			console.error('❌ Error al enviar mensaje:', error);
		}
	};

	useEffect(() => {
		if (userId) {
			console.log('✅ Registrando userId en socket:', userId);
			socket.emit('user_connected', userId);
		}
	}, [userId]);

	const handleToggle = () => {
		setIsExpanded(!isExpanded);
		setHasNotification(false);
	};

	const handleClose = () => {
		setIsExpanded(false);
		setCurrentConversationId(null);
		setMessages([]);
		setHasNotification(false);
		onClose?.();
	};

	return (
		<>
			<button
				onClick={handleToggle}
				className="fixed relative right-4 bottom-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-blue-500 text-white shadow-lg hover:bg-blue-600"
			>
				<MessageCircle className="h-6 w-6" />
				{hasNotification && (
					<span className="absolute -top-1 -right-1 h-3 w-3 rounded-full border-2 border-white bg-red-500" />
				)}
			</button>

			{isExpanded && (
				<div className="fixed right-4 bottom-20 z-50 flex h-[500px] w-[350px] flex-col rounded-lg border border-gray-700 bg-gray-800 shadow-xl">
					<div className="flex items-center justify-between border-b border-gray-700 p-4">
						<h3 className="text-lg font-semibold text-white">
							{userName ? `Chat con ${userName}` : 'Nuevo Chat'}
						</h3>
						<button
							onClick={handleClose}
							className="text-gray-400 hover:text-white"
						>
							<X className="h-5 w-5" />
						</button>
					</div>

					<div className="flex-1 overflow-y-auto p-4">
						<div className="space-y-4">
							{messages.map((msg, idx) => (
								<div
									key={`${msg.id || idx}-${msg.createdAt}`}
									className={`flex ${msg.senderId === userId ? 'justify-end' : 'justify-start'}`}
								>
									<div
										className={`max-w-[80%] rounded-lg px-4 py-2 ${
											msg.senderId === userId
												? 'bg-blue-500 text-white'
												: 'bg-gray-700 text-gray-200'
										}`}
									>
										{msg.senderName && (
											<div className="mb-1 text-xs opacity-75">
												{msg.senderName}
											</div>
										)}
										{msg.message}
									</div>
								</div>
							))}
						</div>
					</div>

					<form
						onSubmit={(e) => {
							e.preventDefault();
							void handleSendMessage();
						}}
						className="flex-none border-t border-gray-700 p-4"
					>
						<div className="flex items-center gap-2">
							<input
								type="text"
								value={newMessage}
								onChange={(e) => setNewMessage(e.target.value)}
								placeholder="Escribir mensaje..."
								className="flex-1 rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
							/>
							<button
								type="submit"
								className="rounded-md bg-blue-500 p-2 text-white hover:bg-blue-600"
							>
								<Send className="h-5 w-5" />
							</button>
						</div>
					</form>
				</div>
			)}
		</>
	);
}
