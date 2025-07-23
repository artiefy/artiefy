'use client';

import { useEffect, useState } from 'react';

import { MessageCircle } from 'lucide-react';

interface ChatListProps {
	onSelectChat: (chatId: string, receiverId: string) => void;
	unreadConversationIds?: string[];
}

interface Conversation {
	id: string;
	senderId: string;
	receiverId: string;
	status: string;
	userName: string;
}

interface ApiResponse {
	conversations: Conversation[];
}

const ITEMS_PER_PAGE = 10;

export default function ChatList({
	onSelectChat,
	unreadConversationIds,
}: ChatListProps) {
	const [conversations, setConversations] = useState<Conversation[]>([]);
	const [currentPage, setCurrentPage] = useState(1);

	useEffect(() => {
		void fetch('/api/socketio');
	}, []);

	useEffect(() => {
		const fetchConversations = async () => {
			try {
				const response = await fetch('/api/admin/chat/conversations');
				if (!response.ok) throw new Error('Error fetching conversations');

				const data = (await response.json()) as ApiResponse;

				const sorted = data.conversations.sort(
					(a, b) => Number(b.id) - Number(a.id)
				);

				setConversations(sorted);
			} catch (error) {
				console.error('Error:', error);
			}
		};

		void fetchConversations();
	}, []);

	const totalPages = Math.ceil(conversations.length / ITEMS_PER_PAGE);
	const paginatedConversations = conversations.slice(
		(currentPage - 1) * ITEMS_PER_PAGE,
		currentPage * ITEMS_PER_PAGE
	);

	const handlePrev = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
	const handleNext = () =>
		setCurrentPage((prev) => Math.min(prev + 1, totalPages));

	return (
		<div className="rounded-lg border border-gray-700 bg-gray-800 p-4 text-white">
			<h2 className="mb-4 text-xl font-bold">Conversaciones Activas</h2>

			<div className="space-y-2">
				{paginatedConversations.map((conv) => (
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
						<div className="relative">
							<button
onClick={() => onSelectChat(conv.id, conv.senderId)}
								className="rounded-full bg-blue-500 p-2 text-white hover:bg-blue-600"
								title="Iniciar chat"
							>
								<MessageCircle className="h-4 w-4" />
							</button>
							{unreadConversationIds?.includes(conv.id) && (
								<span className="absolute -top-1 -right-1 h-3 w-3 rounded-full border-2 border-white bg-red-500" />
							)}
						</div>
					</div>
				))}
			</div>

			{totalPages > 1 && (
				<div className="mt-4 flex justify-center gap-4">
					<button
						onClick={handlePrev}
						disabled={currentPage === 1}
						className="rounded bg-gray-700 px-3 py-1 text-sm hover:bg-gray-600 disabled:opacity-50"
					>
						← Anterior
					</button>
					<span className="text-sm">
						Página {currentPage} de {totalPages}
					</span>
					<button
						onClick={handleNext}
						disabled={currentPage === totalPages}
						className="rounded bg-gray-700 px-3 py-1 text-sm hover:bg-gray-600 disabled:opacity-50"
					>
						Siguiente →
					</button>
				</div>
			)}
		</div>
	);
}
