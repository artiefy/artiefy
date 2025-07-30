'use client';

import { useEffect, useState } from 'react';

import { useAuth } from '@clerk/nextjs';
import EmojiPicker, { Theme } from 'emoji-picker-react';
import { MessageCircle,Send, X } from 'lucide-react';

import socket from '~/lib/socket';

interface Message {
	id: number;
	senderId: string;
	message: string;
	createdAt: string;
	senderName?: string;
}
interface FloatingChatProps {
	chatId?: string | null;
	receiverId?: string | null;
	userName?: string;
	onClose?: () => void;
	unreadConversations: string[];
	setUnreadConversations: React.Dispatch<React.SetStateAction<string[]>>;
}

export default function FloatingChat({
	chatId,
	userName,
	receiverId: propReceiverId,
	onClose,
	unreadConversations,
	setUnreadConversations,
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
	const [showEmojiPicker, setShowEmojiPicker] = useState(false);

	useEffect(() => {
		if (chatId) {
			setCurrentConversationId(chatId);
			setIsExpanded(true);
			if (propReceiverId) {
				setReceiverId(propReceiverId);
			}
			void fetchConversationHistory(chatId);

			if (unreadConversations && setUnreadConversations) {
				const updated = unreadConversations.filter((id) => id !== chatId);
				setUnreadConversations(updated);
			}
		} else {
			setReceiverId(propReceiverId ?? null);
		}
	}, [chatId, propReceiverId, unreadConversations, setUnreadConversations]);

	useEffect(() => {
		const handleNewMessage = (data: Message & { conversationId: string }) => {
			if (data.conversationId === currentConversationId) {
				setMessages((prev) => [...prev, data]);
			} else {
				setHasNotification(true);
				setUnreadConversations((prev) =>
					prev.includes(data.conversationId)
						? prev
						: [...prev, data.conversationId]
				);
			}
		};

		const handleNotification = (data: { conversationId: string }) => {
			if (data.conversationId) {
				setUnreadConversations((prev) => {
					if (!prev.includes(data.conversationId)) {
						return [...prev, data.conversationId];
					}
					return prev;
				});
			}
		};

		socket.on('message', handleNewMessage);
		socket.on('notification', handleNotification);

		return () => {
			socket.off('message', handleNewMessage);
			socket.off('notification', handleNotification);
		};
	}, [currentConversationId, setUnreadConversations]);

	const fetchConversationHistory = async (conversationId: string) => {
		try {
			const response = await fetch(
				`/api/admin/chat/messages/${conversationId}`
			);
			if (!response.ok) throw new Error('Error fetching messages');
			const data = (await response.json()) as { messages: Message[] };
			setMessages(data.messages ?? []);
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

			const data = (await response.json()) as {
				conversationId: string;
				messageId: number;
				receiverId?: string;
			};

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
			const targetReceiverId = receiverId ?? propReceiverId;
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

		// Si hay mensajes no leídos, abrir el más reciente
		if (unreadConversations.length > 0 && !currentConversationId) {
			const latestUnreadId =
				unreadConversations[unreadConversations.length - 1];
			setCurrentConversationId(latestUnreadId);
			setUnreadConversations([]);
			void fetchConversationHistory(latestUnreadId);
		}
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
				className="fixed right-4 bottom-4 z-[9999] flex h-12 w-12 items-center justify-center rounded-full bg-blue-500 text-white shadow-lg hover:bg-blue-600"
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
						<div className="relative flex items-center gap-2">
							<button
								type="button"
								onClick={() => setShowEmojiPicker(!showEmojiPicker)}
								className="px-2 text-2xl text-white hover:text-yellow-400"
								title="Agregar emoji"
							>
								😊
							</button>

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

							{showEmojiPicker && (
								<div className="absolute right-0 bottom-14 z-50">
									<EmojiPicker
										onEmojiClick={(emojiData) =>
											setNewMessage((prev) => prev + emojiData.emoji)
										}
										theme={Theme.DARK}
									/>
								</div>
							)}
						</div>
					</form>
				</div>
			)}
		</>
	);
}
