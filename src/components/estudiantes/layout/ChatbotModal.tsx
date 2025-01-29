'use client';

import { useState, useRef, useEffect } from 'react';
import { BsPersonCircle } from 'react-icons/bs';
import { FaRobot } from 'react-icons/fa';
import { FiSend } from 'react-icons/fi';
import { IoMdClose } from 'react-icons/io';
import '~/styles/chatmodal.css';

const ChatbotModal = () => {
	const [isOpen, setIsOpen] = useState(false);
	const [messages, setMessages] = useState([
		{ id: 1, text: '¡Hola! ¿En qué puedo ayudarte hoy?', sender: 'bot' },
	]);
	const [inputText, setInputText] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);

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

	const handleSendMessage = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!inputText.trim()) return;

		const newUserMessage = {
			id: messages.length + 1,
			text: inputText,
			sender: 'user' as const,
		};

		setMessages((prev) => [...prev, newUserMessage]);
		setInputText('');
		setIsLoading(true);

		setTimeout(() => {
			const botResponse = {
				id: messages.length + 2,
				text: 'Gracias por tu mensaje. Estoy procesando tu solicitud.',
				sender: 'bot' as const,
			};
			setMessages((prev) => [...prev, botResponse]);
			setIsLoading(false);
		}, 1000);
	};

	return (
		<>
			<button
				onClick={() => setIsOpen(true)}
				className="button"
				style={{ display: isOpen ? 'none' : 'flex' }}
				aria-label="Abrir chat"
			>
				<div className="button__text">
					{Array.from('-ARTI-IA-ARTI-IA').map((char, i) => (
						<span key={i} style={{ '--index': i } as React.CSSProperties}>
							{char}
						</span>
					))}
				</div>
				<div className="button__circle">
					<FaRobot className="button__icon" aria-hidden="true" />
					<FaRobot
						className="button__icon button__icon--copy"
						aria-hidden="true"
					/>
				</div>
			</button>

			{isOpen && (
				<div className="chat-modal">
					<div
						className="chat-container"
						role="dialog"
						aria-modal="true"
						aria-labelledby="modal-title"
					>
						<div className="chat-header">
							<div className="flex items-center space-x-2">
								<FaRobot className="text-2xl text-secondary" />
								<h2
									id="modal-title"
									className="text-lg font-semibold text-gray-800"
								>
									Arti IA
								</h2>
							</div>
							<button
								onClick={() => setIsOpen(false)}
								className="rounded-full p-2 transition-colors hover:bg-gray-100"
								aria-label="Cerrar chat"
							>
								<IoMdClose className="text-xl text-gray-500" />
							</button>
						</div>

						<div className="messages-container">
							{messages.map((message) => (
								<div
									key={message.id}
									className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} mb-4`}
								>
									<div
										className={`flex max-w-[80%] items-start space-x-2 ${
											message.sender === 'user'
												? 'flex-row-reverse'
												: 'flex-row'
										}`}
									>
										{message.sender === 'bot' ? (
											<FaRobot className="mt-2 text-xl text-secondary" />
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
											<div className="loading-dot"></div>
											<div className="loading-dot"></div>
											<div className="loading-dot"></div>
										</div>
									</div>
								</div>
							)}
							<div ref={messagesEndRef} />
						</div>

						<form onSubmit={handleSendMessage} className="input-container">
							<div className="flex space-x-2">
								<input
									ref={inputRef}
									type="text"
									value={inputText}
									onChange={(e) => setInputText(e.target.value)}
									placeholder="Escribe tu mensaje..."
									className="flex-1 rounded-lg border border-gray-300 p-2 text-background focus:outline-none focus:ring-2 focus:ring-secondary"
									disabled={isLoading}
								/>
								<button
									type="submit"
									disabled={isLoading}
									className="rounded-lg bg-secondary p-2 text-white transition-colors hover:bg-[#00A5C0] disabled:bg-gray-300"
									aria-label="Enviar mensaje"
								>
									<FiSend className="text-xl" />
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</>
	);
};

export default ChatbotModal;
