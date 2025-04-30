'use client';

import { useEffect, useState } from 'react';
import { MessageCircle } from 'lucide-react';

interface ChatListProps {
	onSelectChat: (chatId: string, receiverId: string) => void;
}

interface Conversation {
	id: string;
	senderId: string;
	receiverId: string;
	status: string;
	userName: string;
}

export default function ChatList({ onSelectChat }: ChatListProps) {
	const [conversations, setConversations] = useState<Conversation[]>([]);
	useEffect(() => {
		fetch('/api/socketio');
	}, []);
	
	useEffect(() => {
		const fetchConversations = async () => {
			try {
				const response = await fetch('/api/admin/chat/conversations');
				if (!response.ok) throw new Error('Error fetching conversations');
				const data = await response.json();
				setConversations(data.conversations);
			} catch (error) {
				console.error('Error:', error);
			}
		};

		void fetchConversations();
	}, []);

	return (
		<div className="rounded-lg border border-gray-700 bg-gray-800 p-4 text-white">
			<h2 className="mb-4 text-xl font-bold">Conversaciones Activas</h2>
			<div className="space-y-2">
				{conversations.map((conv) => (
					<div
						key={conv.id}
						className="flex items-center justify-between rounded-lg border border-gray-700 bg-gray-700/50 p-3 hover:bg-gray-700"
					>
						<div>
							<h3 className="font-medium">{conv.userName}</h3>
							<p className="text-sm text-gray-400">
								{conv.status === 'activo' ? 'Conversación activa' : 'Cerrado'}
							</p>
						</div>
						<button
							onClick={() =>onSelectChat(conv.id, conv.receiverId)							}
							className="rounded-full bg-blue-500 p-2 text-white hover:bg-blue-600"
							title="Iniciar chat"
						>
							<MessageCircle className="h-4 w-4" />
						</button>
					</div>
				))}
			</div>
		</div>
	);
}
