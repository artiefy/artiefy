'use client';

import { useEffect, useState } from 'react';

interface ChatListProps {
  onSelectChat: (chatId: string) => void;
}

export default function ChatList({ onSelectChat }: ChatListProps) {
  const [chats, setChats] = useState<string[]>([]);

  useEffect(() => {
    const fetchChats = async () => {
      const res = await fetch('/api/admin/chat/chatList');
      const data = await res.json();
      setChats(data.chats || []);
    };
  
    fetchChats();
  }, []);
  
  return (
    <div className="rounded-lg border border-gray-700 bg-gray-800 p-4 text-white">
      <h2 className="mb-4 text-xl font-bold">Chats Disponibles</h2>
      <ul className="space-y-2">
        {chats.map((chatId) => (
          <li key={chatId}>
            <button
              onClick={() => onSelectChat(chatId)}
              className="w-full rounded bg-gray-700 px-4 py-2 text-left hover:bg-gray-600"
            >
              Chat #{chatId}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
