'use client';

// External libraries
import { useEffect, useState } from 'react';

// Interfaces and types
interface ChatListProps {
	onSelectChat: (chatId: string) => void;
}

interface Chat {
	id: string;
	messages: Message[];
}

interface Message {
	from: string;
	text: string;
	timestamp: string;
}

// Component
export default function ChatList({ onSelectChat }: ChatListProps) {
	const [chats, setChats] = useState<Chat[]>([]);

	useEffect(() => {
		const fetchChats = async () => {
			try {
				const response = await fetch('/api/admin/chat/chatList');
				if (!response.ok) throw new Error('Error fetching chats');
				const data = (await response.json()) as { chats: Chat[] };
				setChats(data.chats);
			} catch (error) {
				console.error('Error:', error);
			}
		};

		void fetchChats();
	}, []);

	return (
		<div className="rounded-lg border border-gray-700 bg-gray-800 p-4 text-white">
			<h2 className="mb-4 text-xl font-bold">Chats Disponibles</h2>
			<ul className="space-y-2">
				{chats.map((chat) => (
					<li key={chat.id}>
						<button
							onClick={() => onSelectChat(chat.id)}
							className="w-full rounded bg-gray-700 px-4 py-2 text-left hover:bg-gray-600"
						>
							Chat #{chat.id}
						</button>
					</li>
				))}
			</ul>
		</div>
	);
}
