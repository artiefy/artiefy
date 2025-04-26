'use client';

import { useEffect, useState, useRef } from 'react';
import { Send, X, MessageSquare } from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { io, Socket } from 'socket.io-client';

interface Message {
	from: string;
	text: string;
}

interface Chat {
	userId: string;
	username: string;
	messages: Message[];
}

let socket: Socket | null = null;

interface FloatingChatProps {
	chatId?: string | null;
}

export default function FloatingChat({ chatId }: FloatingChatProps) {
	const { user } = useUser();
	const [message, setMessage] = useState('');
	const [chats, setChats] = useState<Chat[]>([]);
	const [activeChatId, setActiveChatId] = useState<string | null>(null);
	const chatRef = useRef<HTMLDivElement>(null);
	const [isOpen, setIsOpen] = useState(true); // chat comienza abierto

	useEffect(() => {
		if (!user || socket) return;

		socket = io({
			path: '/api/socketio',
		});

		socket.on('connect', () => {
			console.log('🔌 Conectado');
			socket?.emit('join', {
				userId: user.id,
				username: user.firstName || 'Anon',
			});
		});

		socket.on('message', (msg: Message) => {
			if (!user || msg.from === user.id) return; // ❌
			setChats((prevChats) => {
				const chatIndex = prevChats.findIndex(
					(chat) => chat.userId === msg.from
				);
				if (chatIndex !== -1) {
					const updatedChats = [...prevChats];
					updatedChats[chatIndex].messages.push(msg);
					return updatedChats;
				} else {
					return [
						...prevChats,
						{ userId: msg.from, username: msg.from, messages: [msg] },
					];
				}
			});
		});

		return () => {
			socket?.disconnect();
			socket = null;
		};
	}, [user]);

	useEffect(() => {
		if (chatId) {
			setActiveChatId(chatId);
		}
	}, [chatId]);

	const sendMessage = () => {
		if (!message.trim() || !user || !socket || !socket.connected) return;
		const msg = {
			from: user.id,
			to: activeChatId,
			text: message,
		};
		socket.emit('message', msg);

		
		setMessage('');
	};

	const scrollToBottom = () => {
		setTimeout(() => {
			if (chatRef.current) {
				chatRef.current.scrollTop = chatRef.current.scrollHeight;
			}
		}, 100);
	};

	useEffect(scrollToBottom, [chats, activeChatId]);

	const activeChat = chats.find((chat) => chat.userId === activeChatId);

	return (
		<div className="fixed right-4 bottom-4 z-50">
			{isOpen ? (
				<div className="flex h-[500px] w-80 flex-col rounded-lg border border-gray-700 bg-gray-900 shadow-lg">
					{/* Header */}
					<div className="flex items-center justify-between border-b border-gray-700 p-4">
						<h2 className="font-bold text-white">Chat</h2>
						<button
							onClick={() => setIsOpen(false)}
							className="text-gray-400 hover:text-white"
						>
							<X />
						</button>
					</div>

					{/* Lista de chats */}
					<div className="flex gap-2 overflow-x-auto border-b border-gray-700 p-2">
						{chats.map((chat) => (
							<button
								key={chat.userId}
								onClick={() => setActiveChatId(chat.userId)}
								className={`rounded-full px-3 py-1 text-sm ${
									activeChatId === chat.userId
										? 'bg-blue-600 text-white'
										: 'bg-gray-700 text-gray-300'
								}`}
							>
								{chat.username}
							</button>
						))}
					</div>

					{/* Mensajes */}
					<div ref={chatRef} className="flex-1 space-y-2 overflow-y-auto p-4">
						{activeChat?.messages.map((msg, idx) => (
							<div
								key={idx}
								className={`flex ${msg.from === 'Tú' ? 'justify-end' : 'justify-start'}`}
							>
								<div
									className={`rounded-2xl px-4 py-2 ${
										msg.from === 'Tú'
											? 'bg-blue-600 text-white'
											: 'bg-gray-700 text-white'
									}`}
								>
									<strong>{msg.from === user?.id ? 'Tú' : msg.from}:</strong>{' '}
									{msg.text}
								</div>
							</div>
						))}
					</div>

					{/* Input */}
					<div className="flex gap-2 border-t border-gray-700 p-2">
						<input
							value={message}
							onChange={(e) => setMessage(e.target.value)}
							onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
							className="flex-1 rounded-full bg-gray-800 px-4 py-2 text-white"
							placeholder={
								activeChatId
									? 'Escribe tu mensaje...'
									: 'Selecciona un chat o empieza uno nuevo...'
							}
						/>
						<button
							onClick={sendMessage}
							className="rounded-full bg-blue-600 p-2 text-white hover:bg-blue-700"
							disabled={!message.trim() || !activeChatId}
						>
							<Send />
						</button>
					</div>
				</div>
			) : (
				<button
					onClick={() => setIsOpen(true)}
					className="rounded-full bg-blue-600 p-4 text-white shadow-lg hover:bg-blue-700"
				>
					<MessageSquare />
				</button>
			)}
		</div>
	);
}
