'use client';


import Image from 'next/image';
import { User } from "@clerk/nextjs/server"; // o "@clerk/nextjs/dist/api" si es necesario
import { BsPersonCircle } from 'react-icons/bs';
import { HiMiniCpuChip } from 'react-icons/hi2';

import { getOrCreateConversation, getConversationWithMessages } from '~/server/actions/estudiantes/chats/saveChat';

import { useState, useEffect, useRef } from 'react';


// Props for the chat component
interface ChatProps {
    courseId?: number | null;
    courseTitle?: string;
    isEnrolled?: boolean;
    messages: {
    id: number;
    text: string;
    sender: string;
    buttons?: { label: string; action: string }[]; // <- Nuevo campo opcional
    }[];
    setMessages: React.Dispatch<React.SetStateAction<{ id: number; text: string; sender: string }[]>>;
    chatMode: {
        idChat: number | null;
        status: boolean;
    };
    setChatMode: React.Dispatch<React.SetStateAction<{ idChat: number | null; status: boolean }>>;
    inputText: string;
    setInputText: (text: string) => void;
    handleSendMessage: (e: React.FormEvent<HTMLFormElement>) => void;
    isLoading: boolean;
    user: User;
    messagesEndRef: React.RefObject<HTMLDivElement>;
    isSignedIn?: boolean;
    inputRef?: React.RefObject<HTMLInputElement>;
    renderMessage: (message: { id: number; text: string; sender: string }, idx: number) => React.ReactNode;

}

export const ChatMessages: React.FC<ChatProps> = ({
    courseId,
    courseTitle,
    isEnrolled,
    messages,
    setMessages,
    chatMode,
    setChatMode,
    inputText,
    setInputText,
    handleSendMessage,
    isLoading,
    user,
    messagesEndRef,
    isSignedIn = false,
    inputRef = useRef<HTMLInputElement>(null),
    renderMessage = (message, idx) => (
        <div key={idx} className="text-sm">
            {message.text}
        </div>
    ),


}) => {

    const [conversation] = useState<{ id: number }>({ id: (chatMode.idChat ?? courseId ?? 0) });
    console.log('Chat mode:', chatMode);

    function handleBotButtonClick(action: string) {
    switch (action) {
        case 'show_toc':
        console.log('Mostrar temario');
        break;
        case 'go_forum':
        console.log('Ir al foro');
        break;
        case 'contact_support':
            window.dispatchEvent(new CustomEvent('support-open-chat'));
        break;
        default:
        console.log('Acción no reconocida:', action);
    }
    }

    
    useEffect(() => {
        console.log(conversation);
        console.log('Problems');
        if (!conversation) return;

        const fetchMessages = async () => {
            let chats: { messages: { id: number; message: string; sender: string }[] } = { messages: [] };
            try {
                
                if (conversation.id !== null) {
                    chats = await getConversationWithMessages(conversation.id);
                }
                
                console.log('Datos: ' + conversation.id + ' ' + conversation.id);
                console.log('Chats:', chats);

                if(chats && chats.messages.length > 0 ) {
                    console.log('Cargando mensajes de la conversación existente');
                        const loadedMessages = chats.messages.map((msg: { id: number; message: string; sender: string }) => ({
                        id: msg.id,
                        text: msg.message,
                        sender: msg.sender
                    }));


                    const botMessage = {
                        id: -1,
                        text: isEnrolled == true ?  '¡Hola! soy Artie 🤖 tú chatbot para resolver tus dudas, Bienvenid@ al curso ' + courseTitle + ' , Si tienes alguna duda sobre el curso u otra, ¡Puedes hacermela! 😎' : '¡Hola! soy Artie 🤖 tú chatbot para resolver tus dudas, ¿En qué puedo ayudarte hoy? 😎',
                        sender: 'bot',
                        buttons: [
                        { label: '📚 Crear Proyecto', action: 'show_toc' },
                        { label: '💬 Nueva Idea', action: 'go_forum' },
                        { label: '🛠 Soporte Técnico', action: 'contact_support' },
                        ],
                    };

                    const alreadyHasBot = loadedMessages.some(msg => msg.sender === 'bot' && msg.text === botMessage.text);


                    setMessages(alreadyHasBot ? loadedMessages : [botMessage, ...loadedMessages]);

                }
                // Creamos una conversación si no existe, luego de 2 mensajes enviados por el usuario
                else{
                    console.log('No hay mensajes en la conversación, creando una nueva conversación');
                    if (chats.messages.length === 0) {
                        /*
                        const botMessage = {
                            id: -1,
                            text: isEnrolled == true ?  '¡Hola! soy Artie 🤖 tú chatbot para resolver tus dudas, Bienvenid@ al curso ' + courseTitle + ' , Si tienes alguna duda sobre el curso u otra, ¡Puedes hacermela! 😎' : '¡Hola! soy Artie 🤖 tú chatbot para resolver tus dudas, ¿En qué puedo ayudarte hoy? 😎',
                            sender: 'bot'
                        };
                        
                        setMessages([botMessage, ...messages]);
                        */

                        if (courseId != null) {
                            void getOrCreateConversation({
                                senderId: user.id,
                                cursoId: courseId,
                                title: 'Curso - ' + (courseTitle ? (courseTitle.length > 12 ? courseTitle.slice(0, 35) + '...' : courseTitle) : 'Sin título'),
                            });

                            setChatMode({
                                idChat: courseId,
                                status: true
                            });
                        }
                    }else{
                        console.log('Pero no entra para el if de crear conversación');
                    }


                }

            } catch (error) {
                console.error('Error al obtener los mensajes:', error);
            }
        };

        fetchMessages();
    }, [conversation]);


    console.log('Mensaje', messages);
    return (
        <>
            {/* Messages */}
            <div className="relative z-[3] flex-1 space-y-4 overflow-y-auto p-4">

                {messages.map((message, idx) => (
                    <div
                        key={message.id}
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
                            {message.sender === 'bot' ? (
                                <HiMiniCpuChip className="mt-2 text-3xl text-blue-500" />
                            ) : user?.imageUrl ? (
                                <Image
                                    src={user.imageUrl ?? '/default-avatar.png'}
                                    alt={user.fullName ?? 'User'}
                                    width={24}
                                    height={24}
                                    className="mt-2 rounded-full"
                                    priority
                                />
                            ) : (
                                <BsPersonCircle className="mt-2 text-xl text-gray-500" />
                            )}
                            <div
                                className={`rounded-lg p-3 ${message.sender === 'user'
                                    ? 'bg-secondary text-white'
                                    : 'bg-gray-300 text-gray-800'
                                    }`}
                            >
                                {renderMessage(message, idx)}
                                {/* Renderizar botones si existen */}
                                {message.sender === 'bot' && message.buttons && (
                                    <div className="mt-3 flex flex-wrap gap-2">
                                    {message.buttons.map((btn, index) => (
                                        <button
                                        key={index}
                                        onClick={() => handleBotButtonClick(btn.action)}
                                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition-all"
                                        >
                                        {btn.label}
                                        </button>
                                    ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="rounded-lg bg-gray-100 p-3">
                            <div className="loader">
                                <div className="circle">
                                    <div className="dot" />
                                    <div className="outline" />
                                </div>
                                <div className="circle">
                                    <div className="dot" />
                                    <div className="outline" />
                                </div>
                                <div className="circle">
                                    <div className="dot" />
                                    <div className="outline" />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="relative z-[5] border-t bg-white/95 p-4 backdrop-blur-sm">
                <form onSubmit={handleSendMessage}>
                    <div className="flex gap-2">
                        <input
                            ref={inputRef}
                            type="text"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder={
                                isSignedIn
                                    ? 'Escribe tu mensaje...'
                                    : 'Inicia sesión para chatear'
                            }
                            className="text-background focus:ring-secondary flex-1 rounded-lg border p-2 focus:ring-2 focus:outline-none"
                            disabled={!isSignedIn || isLoading}
                        />
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="bg-secondary group relative flex h-10 w-14 items-center justify-center rounded-lg transition-all hover:bg-[#00A5C0] active:scale-90 disabled:bg-gray-300"
                        >
                            <Image
                                src="/send-svgrepo-com.svg"
                                alt="Send message"
                                width={24}
                                height={24}
                                className="size-6 transition-all duration-200 group-hover:scale-110 group-hover:rotate-12"
                                priority
                            />
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}