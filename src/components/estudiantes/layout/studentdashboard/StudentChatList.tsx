// components/ChatList.tsx
import { Button } from "@headlessui/react";
import { SlArrowDown } from "react-icons/sl";
import { useUser } from '@clerk/nextjs';

// Database methods

import {getConversationByUserId} from '~/server/actions/estudiantes/chats/saveChat';

import React, { useEffect, useState } from "react";

interface ChatListProps {
    setChatMode: (mode: { idChat: number | null; status: boolean }) => void;
}

export const ChatList = ({ setChatMode }: ChatListProps) => {
    const [chats, setChats] = useState<{ id: number; title: string; curso_id: number }[]>([]);
    const { user } = useUser();

    console.log('User id:', user?.id);

    useEffect(() => {
        
        if (!user || !user.id) return;

        const fetchChats = async () => {
            try {
                const result = await getConversationByUserId(user.id);
                setChats(result.conversations.map((conv: any) => ({
                    id: conv.id,
                    title: conv.title || "Sin título",
                    curso_id: conv.curso_id || null
                })));
                console.log('User id:', user.id);
            } catch (error) {
                
                console.error("Error al traer chats:", error);
                setChats([]);
            }
        };

        fetchChats();
    }, [user]);


    return (
        <div className="w-full bg-white border-r border-gray-200 h-full flex flex-col">
            <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800 text-center">Chats Recientes</h2>
            </div>

            <ul className="overflow-hidden flex-1">
                {chats.map((chat) => (
                    <li key={chat.id}>
                        <Button
                            onClick={() => { setChatMode({idChat: chat.curso_id,status: true}); }}
                            className="w-full px-4 py-3 bg-gray-50 border-b border-gray-100 text-left transition-transform duration-200 ease-in-out hover:scale-[1.02]"

                        >
                            <div className="font-medium text-gray-800 truncate">{chat.title}</div>
                            <div className="text-sm text-gray-500 truncate">Ver curso</div><SlArrowDown className="inline ml-1 text-gray-400" />
                        </Button>
                    </li>
                ))}

                
            </ul>

        <div className="p-4 border-t border-gray-200 text-sm text-gray-500 text-center">
            <h2 className="text-lg font-semibold text-gray-800">Proyectos Inscritos</h2>
        </div>
        <ul className="overflow-hidden flex-1">
            
            {/* Datos estáticos simulando proyectos inscritos */}
            <li>
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 transition-transform duration-200 ease-in-out hover:scale-[1.02]">
                    <div className="font-medium text-gray-800 truncate">Proyecto: App de Finanzas</div>
                    <div className="text-sm text-gray-500 truncate">Ver proyecto</div><SlArrowDown className="inline ml-1 text-gray-400" />
                </div>
            </li>
            <li>
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 transition-transform duration-200 ease-in-out hover:scale-[1.02]">
                    <div className="font-medium text-gray-800 truncate">Proyecto: Gestor de Tareas</div>
                    <div className="text-sm text-gray-500 truncate">Ver proyecto</div><SlArrowDown className="inline ml-1 text-gray-400" />
                </div>
            </li>
        </ul>
    </div>
)};
