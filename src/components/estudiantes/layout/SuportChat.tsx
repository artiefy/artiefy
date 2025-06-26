'use client';


import Image from 'next/image';
import { User } from "@clerk/nextjs/server"; // o "@clerk/nextjs/dist/api" si es necesario
import { BsPersonCircle } from 'react-icons/bs';

import { getOrCreateSuportChat } from '~/server/actions/estudiantes/chats/suportChatBot';

import { useState, useEffect, useRef } from 'react';

import { MdSupportAgent } from 'react-icons/md';


interface SuportChatProps {
    messages: {id: number, text: string, sender: string}[];
    setMessages: React.Dispatch<React.SetStateAction<{id: number, text: string, sender: string}[]>>;
    isOpen: boolean;
    setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
    isSignedIn?: boolean;
    handleSendMessage: (e: React.FormEvent<HTMLFormElement>) => void;
    isLoading: boolean;
    messagesEndRef: React.RefObject<HTMLDivElement>;
    inputText: string;
    setInputText: (text: string) => void;
    user: User;
    inputRef?: React.RefObject<HTMLInputElement>;
}


export const SuportChat: React.FC<SuportChatProps> = ({
    setMessages,
    messages,
    isLoading,
    messagesEndRef,
    inputText,
    setInputText,
    user,
    inputRef = useRef<HTMLInputElement>(null),
    handleSendMessage
}) => {

    useEffect(() => {
        const fetchInitialMessages = async () => {
            if (!user || !user.id) return;

            try {
                const ticket = await getOrCreateSuportChat({
                    creatorId: user.id,
                    email: user.emailAddresses?.[0]?.emailAddress ?? '',
                    description: ''
                });

                if (ticket) {
                    console.log('Ticket fetched:', ticket);
                    const initialMessages = [
                        {
                            id: Date.now(), // ID único para el primer mensaje
                            text: '¡Hola! ¿En qué puedo ayudarte?',
                            sender: 'support',
                        }
                        ,
                        ...ticket.messages.map((msg) => ({
                            id: msg.id,
                            text: msg.content,
                            sender: msg.sender === 'user' ? 'user' : 'support',
                        }))
                    ];

                    setMessages(initialMessages);
                }else{
                    console.warn('No se pudo obtener el ticket o no hay mensajes iniciales.');
                }
            } catch (error) {
                console.error('Error fetching initial messages:', error);
            }
        };

        fetchInitialMessages();
    }, []);


    return (
        <>
            
            {/* Messages*/}
            < div className="support-chat-messages" >
                {
                    messages.map((message) => (
                        <div key={message.id}>
                            <div
                                className={`flex ${message.sender === 'user'
                                    ? 'justify-end'
                                    : 'justify-start'
                                    } mb-4`}
                            >
                                <div
                                    className={`flex max-w-[80%] items-start space-x-2 ${message.sender === 'user'
                                        ? 'flex-row-reverse space-x-reverse'
                                        : 'flex-row'
                                        }`}
                                >
                                    {message.sender === 'support' ? (
                                        <MdSupportAgent className="text-secondary mt-2 text-xl" />
                                    ) : user?.imageUrl ? (
                                        <Image
                                            src={user.imageUrl}
                                            alt={user.fullName ?? 'User'}
                                            width={24}
                                            height={24}
                                            className="mt-2 rounded-full"
                                        // Removido el priority ya que estas imágenes se cargan dinámicamente
                                        />
                                    ) : (
                                        <BsPersonCircle className="mt-2 text-xl text-gray-500" />
                                    )}
                                    <div
                                        className={`rounded-lg p-3 ${message.sender === 'user'
                                            ? 'bg-secondary text-white'
                                            : 'bg-gray-100 text-gray-800'
                                            }`}
                                    >
                                        {message.text}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                }
                {
                    isLoading && (
                        <div className="flex justify-start">
                            <div className="rounded-lg bg-gray-100 p-3">
                                <div className="flex space-x-2">
                                    <div className="loading-dot" />
                                    <div className="loading-dot" />
                                    <div className="loading-dot" />
                                </div>
                            </div>
                        </div>
                    )
                }
                <div ref={messagesEndRef} />
            </div >

            {/* Input Form - Modificado para ser más compacto en móvil */}
            < form onSubmit={handleSendMessage} className="support-chat-input" >
                <input
                    ref={inputRef}
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Describe el problema..."
                    className="text-background focus:ring-secondary flex-1 rounded-lg border p-1 text-sm focus:ring-2 focus:outline-none sm:p-2 sm:text-base"
                />
                <button
                    type="submit"
                    disabled={isLoading}
                    className="bg-secondary rounded-lg px-3 py-1 text-sm text-white transition-colors hover:bg-[#00A5C0] disabled:bg-gray-300 sm:px-4 sm:py-2 sm:text-base"
                >
                    Enviar
                </button>
            </form >
            
        </>
    );
};

export default SuportChat;
