// components/ChatList.tsx
import { Button } from "@headlessui/react";
import { SlArrowDown } from "react-icons/sl";
import { useUser } from '@clerk/nextjs';
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import {getTicketByUser} from '~/server/actions/estudiantes/chats/suportChatBot';

// Database methods

import {getConversationByUserId} from '~/server/actions/estudiantes/chats/saveChat';

import React, { useEffect, useState } from "react";

interface ChatListProps {
    setChatMode: React.Dispatch<React.SetStateAction<{ idChat: number | null; status: boolean; curso_title: string }>>;
    setShowChatList: React.Dispatch<React.SetStateAction<boolean>>;
}

export const ChatList = ({ setChatMode, setShowChatList }: ChatListProps) => {

    const [chats, setChats] = useState<{ id: number; title: string; curso_id: number }[]>([]);
    const { user } = useUser();
    
    useEffect(() => {
        
        if (!user || !user.id) return;



        // Cambiamos el status a true en setChatMode para 
        setShowChatList(true);
        

        const fetchChats = async () => {
            try {
                const result = await getConversationByUserId(user.id);
                const ticketData = await getTicketByUser(user.id);

                console.log('Ticket:', ticketData);
                console.log('User id:', user.id);

                // Crear el objeto del ticket (solo si existe)
                const ticketItem = ticketData.ticket
                ? {
                    id: ticketData.ticket.id,
                    title: ticketData.ticket.description || "Ticket sin descripción",
                    curso_id: null, // o puedes usar `ticketData.ticket.curso_id` si lo tienes
                    tipo: "ticket", // extra opcional para diferenciarlo de las conversaciones
                    }
                : null;

                // Mapear las conversaciones
                const conversationItems = result.conversations.map((conv: any) => ({
                id: conv.id,
                title: conv.title || "Sin título",
                curso_id: conv.curso_id || null,
                tipo: "conversation", // opcional, si quieres diferenciarlos
                }));

                // Combinar ticket primero, luego las conversaciones
                const allChats = ticketItem ? [ticketItem, ...conversationItems] : conversationItems;

                // Setear en el estado
                setChats(allChats);

                console.log('Chats obtenidos:', allChats);

            } catch (error) {
                
                console.error("Error al traer chats:", error);
                setChats([]);
            }
        };

        fetchChats();

        
    }, [user]);

    

    return (
        <>
        <div className="w-full bg-white border-r border-gray-200 h-full flex flex-col">
            <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800 text-center">Chats Recientes</h2>
            </div>
            
            <ul className="flex-1 overflow-y-auto max-h-[calc(4*110px)] pr-2">
                {chats.map((chat) => (
                    
                    <li key={chat.id}>
                        <Button
                            onClick={() => { chat.curso_id ? setChatMode({idChat: chat.curso_id, status: true, curso_title: chat.title}) : window.dispatchEvent(new CustomEvent('support-open-chat', { detail: chat }));  }}
                            className="w-full px-4 py-3 bg-gray-50 border-b border-gray-100 text-left transition-transform duration-200 ease-in-out hover:scale-[1.02]"

                        >
                            <div className="font-medium text-gray-800 truncate">{chat.title}</div>
                            <div className="text-sm text-gray-500 truncate">{chat.curso_id ? "Ver curso" : "Ver Ticket"}</div>
                            <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            transition={{ type: "spring", stiffness: 300 }}
                            className= { chat.curso_id ? "flex items-center gap-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-2xl shadow-md text-sm w-27": "flex items-center gap-1 bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded-2xl shadow-md text-sm w-27" }
                            >
                            Ver más
                            <ChevronDown className="w-4 h-4" />
                            </motion.div>
                        </Button>
                    </li>
                ))}

                
            </ul>
            

        <div className="p-4 border-t border-gray-200 text-sm text-gray-500 text-center">
            <h2 className="text-lg font-semibold text-gray-800">Proyectos Inscritos</h2>
        </div>
        <ul className="flex-1 overflow-y-auto pr-2 scroll-mb-2 max-h-[50%] sm:max-h-[360px]">
            
            {/* Datos estáticos simulando proyectos inscritos */}
            <li>
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 transition-transform duration-200 ease-in-out hover:scale-[1.02]">
                    <div className="font-medium text-gray-800 truncate">Proyecto: App de Finanzas</div>
                    <div className="text-sm text-gray-500 truncate">Ver Proyecto</div>
                    <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            transition={{ type: "spring", stiffness: 300 }}
                            className= "flex items-center gap-1 bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded-2xl shadow-md text-sm w-27" 
                            >
                            Ver más
                            <ChevronDown className="w-4 h-4" />
                            </motion.div>
                </div>
            </li>
            <li>
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 transition-transform duration-200 ease-in-out hover:scale-[1.02]">
                    <div className="font-medium text-gray-800 truncate">Proyecto: Gestor de Tareas</div>
                    <div className="text-sm text-gray-500 truncate">Ver Proyecto</div>
                    <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            transition={{ type: "spring", stiffness: 300 }}
                            className= "flex items-center gap-1 bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded-2xl shadow-md text-sm w-27"
                            >
                            Ver más
                            <ChevronDown className="w-4 h-4" />
                            </motion.div>
                </div>
            </li>
            <li>
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 transition-transform duration-200 ease-in-out hover:scale-[1.02]">
                    <div className="font-medium text-gray-800 truncate">Proyecto: Gestor de Tareas</div>
                    <div className="text-sm text-gray-500 truncate">Ver Proyecto</div>
                    <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            transition={{ type: "spring", stiffness: 300 }}
                            className= "flex items-center gap-1 bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded-2xl shadow-md text-sm w-27"
                            >
                            Ver más
                            <ChevronDown className="w-4 h-4" />
                            </motion.div>
                </div>
            </li>
            <li>
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 transition-transform duration-200 ease-in-out hover:scale-[1.02]">
                    <div className="font-medium text-gray-800 truncate">Proyecto: Gestor de Tareas - PreUlt</div>
                    <div className="text-sm text-gray-500 truncate">Ver Proyecto</div>
                    <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            transition={{ type: "spring", stiffness: 300 }}
                            className= "flex items-center gap-1 bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded-2xl shadow-md text-sm w-27"
                            >
                            Ver más
                            <ChevronDown className="w-4 h-4" />
                            </motion.div>
                </div>
            </li>
            <li>
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 transition-transform duration-200 ease-in-out hover:scale-[1.02]">
                    <div className="font-medium text-gray-800 truncate">Proyecto: Gestor de Tareas - Ult</div>
                    <div className="text-sm text-gray-500 truncate">Ver Proyecto</div>
                    <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            transition={{ type: "spring", stiffness: 300 }}
                            className= "flex items-center gap-1 bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded-2xl shadow-md text-sm w-27"
                            >
                            Ver más
                            <ChevronDown className="w-4 h-4" />
                            </motion.div>
                </div>
            </li>

            <li className="d-none sm:none">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 transition-transform duration-200 ease-in-out hover:scale-[1.02]">
                    <div className="font-medium text-gray-800 truncate"></div>
                    <div className="text-sm text-gray-500 truncate"></div>
                    
                </div>
                {innerWidth <= 640 && (
                    <>
                        <br />
                        <br />
                        <br />
                    </>
                )}
            </li>
            
        </ul>

        
        
    </div>
    
    </>
)};
