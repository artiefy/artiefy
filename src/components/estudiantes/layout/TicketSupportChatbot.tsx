'use client';
import { useExtras } from '~/app/estudiantes/StudentContext';
import { useState, useRef, useEffect } from 'react';

import { useRouter } from 'next/navigation';

import { useAuth, useUser } from '@clerk/nextjs';
import { IoMdClose } from 'react-icons/io';
import { MdSupportAgent } from 'react-icons/md';
import { toast } from 'sonner';
import { getTicketWithMessages } from '~/server/actions/estudiantes/chats/suportChatBot';
import {SuportChat} from './SuportChat';
import { SaveTicketMessage } from '~/server/actions/estudiantes/chats/suportChatBot';

import '~/styles/ticketSupportButton.css';



const TicketSupportChatbot = () => {
	const { showExtras } = useExtras();

	const [isDesktop, setIsDesktop] = useState(false);

	const [isOpen, setIsOpen] = useState(false);
	const [messages, setMessages] = useState([
		{ id: 1, text: '¡Hola! ¿En qué puedo ayudarte?', sender: 'support' },
	]);
	const [inputText, setInputText] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [hideButton, setHideButton] = useState(false);
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const { isSignedIn } = useAuth();
	const { user } = useUser();
	const router = useRouter();

	useEffect(() => {
			// Solo se ejecuta en el cliente
			setIsDesktop(window.innerWidth > 768);
		
			// Si quieres que se actualice al redimensionar:
			const handleResize = () => setIsDesktop(window.innerWidth > 768);
			window.addEventListener('resize', handleResize);
			return () => window.removeEventListener('resize', handleResize);
	}, []);

	useEffect(() => {
		if (isOpen && inputRef.current) {
			inputRef.current.focus();
		}
	}, [isOpen]);

	useEffect(() => {
		const handleChatOpen = (e: CustomEvent) => {

			
			const fetchMessages = async () => {
            let chats: { ticket: { id: number; content: string; sender: string }[] } = { ticket: [] };

		
			console.log(chats)
            try {
                if (e.detail !== null || user?.id) {
					
					const ticketData = await getTicketWithMessages(e.detail.id, user?.id);
				
					if (ticketData && ticketData.ticket) {
						// Si tienes un array de mensajes, usa ese array aquí
						// Aquí se asume que los mensajes están en ticketData.ticket.messages
						console.log('Entro al ticketData.ticket');
						console.log('Mensajes del ticket:', ticketData);
						chats.ticket = ticketData.messages.map((msg: any) => ({
							id: msg.id,
							content: msg.content || msg.description || '',
							sender: msg.sender || 'user'
							}));
					}
                }

				const botMessage = { id: 1, text: '¡Hola! ¿En qué puedo ayudarte?', sender: 'support' }

                // Mapear mensajes del ticket
				const loadedMessages = chats.ticket.map((msg: { id: number; content: string; sender: string }) => ({
					id: msg.id,
					text: msg.content,
					sender: msg.sender
				}));

                // Si el primer mensaje NO es el del bot, lo agregamos al inicio
                if (loadedMessages.length === 0 || loadedMessages[0].sender !== 'bot') {
                    setMessages([botMessage, ...loadedMessages]);
                } else {
                    setMessages(loadedMessages);
                }

				console.log('Mensajes: ', messages);

            } catch (error) {
                console.error('Error al obtener los mensajes:', error);
            }
        };
        fetchMessages();
        setIsOpen(true);

		};

		// 👇 Ojo con el tipo de evento
		window.addEventListener('support-open-chat', handleChatOpen as EventListener);

		return () => {
			window.removeEventListener('support-open-chat', handleChatOpen as EventListener);
		};
	}, []);

	useEffect(() => {
		scrollToBottom();
	}, [messages]);

	useEffect(() => {
		const handleOpen = () => setHideButton(true);
		const handleClose = () => setHideButton(false);
		window.addEventListener('student-chat-open', handleOpen);
		window.addEventListener('student-chat-close', handleClose);
		return () => {
			window.removeEventListener('student-chat-open', handleOpen);
			window.removeEventListener('student-chat-close', handleClose);
		};
	}, []);

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	};


	const saveUserMessage = (trimmedInput: string, sender: string) => {
		
			
			if (isOpen && isSignedIn && user?.id) {
				console.log('Guardando mensaje del usuario:', trimmedInput);
				void SaveTicketMessage(
					user.id,
					trimmedInput,
					sender
				);
			}else{
				console.log('No está entrando al chat para guardar el mensaje del usuario');
			}
		};

	const handleSendMessage = (e: React.FormEvent) => {
		e.preventDefault();
		if (!isSignedIn) {
			toast.error('Debes iniciar sesión para enviar tickets');
			return;
		}

		if (!inputText.trim()) return;

		const newUserMessage = {
			id: messages.length + 1,
			text: inputText,
			sender: 'user' as const,
		};

		setMessages((prev) => [...prev, newUserMessage]);
		setInputText('');
		saveUserMessage(inputText.trim(), 'user');
		setIsLoading(true);

		try {
			// Aquí iría la lógica para enviar el ticket al backend
			setTimeout(() => {
				setMessages((prev) => [
					...prev,
					{
						id: prev.length + 1,
						text: 'Gracias por reportar el problema. Un administrador revisará tu ticket pronto.',
						sender: 'support' as const,
					},
				]);
				setIsLoading(false);
				saveUserMessage(
					'Gracias por reportar el problema. Un administrador revisará tu ticket pronto.',
					'support'
				);
			}, 1000);
		} catch (error) {
			console.error('Error al enviar el ticket:', error);
			toast.error('Error al enviar el ticket');
			setIsLoading(false);
		}
	};

	const handleClick = () => {
		if (!isSignedIn) {
			const currentUrl = encodeURIComponent(window.location.href);
			toast.error('Acceso restringido', {
				description: 'Debes iniciar sesión para enviar tickets de soporte.',
				action: {
					label: 'Iniciar sesión',
					onClick: () => router.push(`/sign-in?redirect_url=${currentUrl}`),
				},
				duration: 5000,
			});
			return;
		}
		const button = document.querySelector('.ticket-button');
		button?.classList.add('clicked');
		setTimeout(() => {
			button?.classList.remove('clicked');
			setIsOpen(!isOpen);
		}, 300);
	};

	if (!showExtras && isDesktop) return null; // Solo se muestra si showExtras es true

	return (
		<>
			{!hideButton && (
				<>
					<div className="fixed bottom-24 sm:bottom-40 right-25 sm:right-10 translate-x-1/2 sm:translate-x-0 z-50">
					<button
						onClick={handleClick}
						className={`relative px-5 py-2 rounded-full border border-blue-400 text-white bg-gradient-to-r from-blue-500 to-cyan-600 
						hover:from-cyan-500 hover:to-blue-600 transition-all duration-300 ease-in-out 
						shadow-md hover:shadow-[0_0_20px_#38bdf8] hover:scale-105 flex items-center gap-2
						${!isSignedIn && 'cursor-not-allowed opacity-50'}`}
					>
						<MdSupportAgent className="text-xl text-white opacity-90" />
						<span className="hidden sm:inline font-medium tracking-wide">Soporte técnico</span>

						{/* Triángulo tipo burbuja */}
						<span className="absolute bottom-[-9px] left-1/2 transform translate-x-15 w-0 h-0 
						border-l-[6px] border-r-[6px] border-t-[8px] 
						border-l-transparent border-r-transparent border-t-blue-500 hidden sm:inline" />
					</button>
					</div>


				</>


			)}

			{/* Chatbot */}
			{isOpen && isSignedIn && (
				<div className="fixed z-50 bg-white border border-gray-200 shadow-lg rounded-lg overflow-hidden
				w-[350px] h-[500px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
				sm:top-auto sm:left-auto sm:translate-x-0 sm:translate-y-0 sm:bottom-0 sm:right-0 sm:w-[400px] md:w-[500px] sm:h-[100vh]"

				>
					<div className="support-chat">
						{/* Header */}
						<div className="support-chat-header">
							<div className="flex items-center space-x-2">
								<MdSupportAgent className="text-secondary text-2xl" />
								<h2 className="text-lg font-semibold text-gray-800">
									Soporte Técnico
								</h2>
							</div>
							<button
								onClick={() => setIsOpen(false)}
								className="rounded-full p-1.5 transition-colors hover:bg-gray-100"
							>
								<IoMdClose className="text-xl text-gray-500" />
							</button>
						</div>

						<SuportChat 
							messages={messages}
							setMessages={setMessages}
							isOpen={isOpen}
							setIsOpen={setIsOpen}
							isSignedIn={isSignedIn}
							handleSendMessage={handleSendMessage}
							isLoading={isLoading}
							messagesEndRef={messagesEndRef as React.RefObject<HTMLDivElement>}
							inputText={inputText}
							setInputText={setInputText}
							user={user as any}
							inputRef={inputRef as React.RefObject<HTMLInputElement>}
						/>

						{/* Messages
						<div className="support-chat-messages">
							{messages.map((message) => (
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
							))}
							{isLoading && (
								<div className="flex justify-start">
									<div className="rounded-lg bg-gray-100 p-3">
										<div className="flex space-x-2">
											<div className="loading-dot" />
											<div className="loading-dot" />
											<div className="loading-dot" />
										</div>
									</div>
								</div>
							)}
							<div ref={messagesEndRef} />
						</div>

						{/* Input Form - Modificado para ser más compacto en móvil
						<form onSubmit={handleSendMessage} className="support-chat-input">
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
						</form>
						*/}
					</div>
				</div>
			)}
		</>
	);
};

export default TicketSupportChatbot;