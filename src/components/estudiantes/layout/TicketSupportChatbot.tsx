'use client';

import { useState, useRef, useEffect } from 'react';

import Image from 'next/image';
import { useRouter } from 'next/navigation';

import { useAuth, useUser } from '@clerk/nextjs';
import { BsPersonCircle } from 'react-icons/bs';
import { IoMdClose } from 'react-icons/io';
import { MdSupportAgent } from 'react-icons/md';
import { toast } from 'sonner';

import '~/styles/ticketSupportButton.css';

const TicketSupportChatbot = () => {
	const [isOpen, setIsOpen] = useState(false);
	const [messages, setMessages] = useState([
		{ id: 1, text: '¡Hola! ¿En qué puedo ayudarte?', sender: 'support' },
	]);
	const [inputText, setInputText] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const { isSignedIn } = useAuth();
	const { user } = useUser();
	const router = useRouter();

	useEffect(() => {
		if (isOpen && inputRef.current) {
			inputRef.current.focus();
		}
	}, [isOpen]);

	useEffect(() => {
		scrollToBottom();
	}, [messages]);

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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

	return (
		<>
			<button
				onClick={handleClick}
				className={`ticket-button ${!isSignedIn && 'cursor-not-allowed opacity-50'}`}
			>
				<MdSupportAgent className="ticket-button__icon" />
			</button>

			{/* Chatbot */}
			{isOpen && isSignedIn && (
				<div className="chat-container">
					<div className="support-chat">
						{/* Add close button */}
						<button
							onClick={() => setIsOpen(false)}
							className="absolute top-2 right-2 z-50 rounded-full p-1 transition-colors hover:bg-gray-100"
							aria-label="Cerrar chat"
						>
							<IoMdClose className="text-xl text-gray-500" />
						</button>

						<div className="support-chat-header">
							<div className="flex items-center space-x-2">
								<MdSupportAgent className="text-secondary text-2xl" />
								<h2 className="text-lg font-semibold text-gray-800">
									Soporte Técnico
								</h2>
							</div>
						</div>

						<div className="support-chat-messages">
							{messages.map((message) => (
								<div
									key={message.id}
									className={`flex ${
										message.sender === 'user' ? 'justify-end' : 'justify-start'
									} mb-4`}
								>
									<div
										className={`flex max-w-[80%] items-start space-x-2 ${
											message.sender === 'user'
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
											/>
										) : (
											<BsPersonCircle className="mt-2 text-xl text-gray-500" />
										)}
										<div
											className={`rounded-lg p-3 ${
												message.sender === 'user'
													? 'bg-secondary text-white'
													: 'bg-gray-100 text-gray-800'
											}`}
										>
											{message.text}
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

						<form onSubmit={handleSendMessage} className="support-chat-input">
							<input
								ref={inputRef}
								type="text"
								value={inputText}
								onChange={(e) => setInputText(e.target.value)}
								placeholder="Describe el problema..."
								className="text-background focus:ring-secondary flex-1 rounded-lg border p-2 focus:ring-2 focus:outline-none"
							/>
							<button
								type="submit"
								disabled={isLoading}
								className="bg-secondary rounded-lg px-4 py-2 text-white transition-colors hover:bg-[#00A5C0] disabled:bg-gray-300"
							>
								Enviar
							</button>
						</form>
					</div>
				</div>
			)}
		</>
	);
};

export default TicketSupportChatbot;
