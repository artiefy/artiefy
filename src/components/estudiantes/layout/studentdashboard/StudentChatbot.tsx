'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useAuth, useUser } from '@clerk/nextjs';
import { BsPersonCircle } from 'react-icons/bs';
import { FaRobot } from 'react-icons/fa';
import { FiSend } from 'react-icons/fi';
import { IoMdClose } from 'react-icons/io';
import { ResizableBox } from 'react-resizable';
import { toast } from 'sonner';
import 'react-resizable/css/styles.css';

import '~/styles/chatmodal.css';

interface StudentChatbotProps {
	className?: string;
	initialSearchQuery?: string;
	isAlwaysVisible?: boolean;
	showChat?: boolean;
}

interface ChatResponse {
	response: string;
	courses?: { id: number; title: string }[];
}

interface ResizeData {
	size: { width: number; height: number };
	handle: string;
}

const StudentChatbot: React.FC<StudentChatbotProps> = ({
	className,
	initialSearchQuery = '',
	isAlwaysVisible = false,
	showChat = false,
}) => {
	const [isOpen, setIsOpen] = useState(showChat);
	const [messages, setMessages] = useState([
		{ id: Date.now(), text: 'Hola ¿En qué puedo ayudarte hoy?', sender: 'bot' },
	]);
	const [inputText, setInputText] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [lastSearchQuery, setLastSearchQuery] = useState('');
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const chatContainerRef = useRef<HTMLDivElement>(null);

	const { isSignedIn } = useAuth();
	const { user } = useUser();
	const router = useRouter();

	const handleBotResponse = useCallback(async (query: string) => {
		setIsLoading(true);
		try {
			const response = await fetch('/api/iahome', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ prompt: query }),
			});

			const data = (await response.json()) as ChatResponse;
			const messageText =
				data.response ?? 'Lo siento, no pude encontrar información relevante.';

			const botResponse = {
				id: Date.now() + Math.random(),
				text: messageText,
				sender: 'bot' as const,
			};

			setMessages((prev) => [...prev, botResponse]);
		} catch (error) {
			console.error('Error getting bot response:', error);
			const errorMessage = {
				id: Date.now() + Math.random(),
				text: 'Lo siento, ocurrió un error al procesar tu solicitud.',
				sender: 'bot' as const,
			};
			setMessages((prev) => [...prev, errorMessage]);
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		if (isOpen && inputRef.current) {
			inputRef.current.focus();
		}
	}, [isOpen, initialSearchQuery]);

	useEffect(() => {
		scrollToBottom();
	}, [messages]);

	useEffect(() => {
		const handleInitialSearch = async () => {
			if (!initialSearchQuery?.trim() || !isSignedIn || !showChat) return;

			// Evitar búsquedas duplicadas comparando con la última búsqueda
			if (initialSearchQuery.trim() === lastSearchQuery) return;

			setIsOpen(true);
			setLastSearchQuery(initialSearchQuery.trim());

			setMessages([
				{
					id: Date.now(),
					text: 'Hola ¿En qué puedo ayudarte hoy?',
					sender: 'bot',
				},
				{ id: Date.now() + 1, text: initialSearchQuery.trim(), sender: 'user' },
			]);

			await handleBotResponse(initialSearchQuery.trim());
		};

		void handleInitialSearch();
	}, [
		initialSearchQuery,
		isSignedIn,
		showChat,
		handleBotResponse,
		lastSearchQuery,
	]);

	useEffect(() => {
		setIsOpen(showChat);
	}, [showChat]);

	const scrollToBottom = () => {
		void messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	};

	const handleSendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!isSignedIn) {
			toast.error('Debes iniciar sesión para usar el chat');
			return;
		}

		const trimmedInput = inputText.trim();
		if (!trimmedInput) return;

		const newUserMessage = {
			id: Date.now(),
			text: trimmedInput,
			sender: 'user' as const,
		};

		setMessages((prev) => [...prev, newUserMessage]);
		setInputText('');
		await handleBotResponse(trimmedInput);
	};

	const handleClick = () => {
		if (!isSignedIn) {
			toast.error('Acceso restringido', {
				description: 'Debes iniciar sesión para usar el chatbot.',
				action: {
					label: 'Iniciar sesión',
					onClick: () => router.push('/sign-in'),
				},
				duration: 5000,
			});
			return;
		}
		setIsOpen(!isOpen);
	};

	const handleResize = useCallback(
		(_e: React.SyntheticEvent, data: ResizeData) => {
			const windowHeight = window.innerHeight;
			const chatPosition = chatContainerRef.current?.getBoundingClientRect();

			if (!chatPosition) return;

			// Calcular el límite superior mínimo (80px desde el tope de la ventana)
			const minTopMargin = 80;
			const maxHeight = windowHeight - chatPosition.top - 20;

			// Si el chat se está expandiendo hacia arriba
			if (data.handle.includes('n')) {
				const newTop =
					chatPosition.top - (data.size.height - chatPosition.height);
				if (newTop < minTopMargin) {
					// Ajustar la altura para mantener el margen superior mínimo
					data.size.height =
						chatPosition.height + (chatPosition.top - minTopMargin);
					return;
				}
			}

			// Si la nueva altura excede el espacio disponible
			if (data.size.height > maxHeight) {
				data.size.height = maxHeight;
				return;
			}

			// Ajustar scroll si es necesario
			if (chatPosition.top < minTopMargin) {
				window.scrollTo({
					top: window.scrollY - (minTopMargin - chatPosition.top),
					behavior: 'smooth',
				});
			}
		},
		[]
	);

	const renderMessage = (message: {
		id: number;
		text: string;
		sender: string;
	}) => {
		if (message.sender === 'bot') {
			const courseMatches =
				message.text.match(/\d+\.\s+(.*?)\|(\d+)(?=\n\n|\n|$)/g) ?? [];
			const uniqueCourses = [...new Set(courseMatches)]
				.map((course) => {
					const match = /\d+\.\s+(.*?)\|(\d+)/.exec(course);
					if (!match || match.length < 3) return null;

					const [, title, courseId] = match;
					return {
						id: Number(courseId),
						title: title.trim(),
					};
				})
				.filter((course): course is { id: number; title: string } =>
					Boolean(course && !isNaN(course.id))
				);

			const introText = message.text.split('\n\n')[0];

			return (
				<div className="flex flex-col space-y-4">
					<p className="font-medium text-gray-800">{introText}</p>
					{uniqueCourses.length > 0 && (
						<ul className="space-y-4">
							{uniqueCourses.map((course) => (
								<li
									key={course.id}
									className="flex flex-col space-y-2 rounded-lg bg-background p-4 shadow-sm"
								>
									<h4 className="font-semibold text-primary">{course.title}</h4>
									<Link
										href={`/estudiantes/cursos/${course.id}`} // Changed to use database ID directly
										className="self-start rounded-md bg-secondary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-secondary/90"
									>
										Ir al curso
									</Link>
								</li>
							))}
						</ul>
					)}
				</div>
			);
		}
		return message.text;
	};

	return (
		<div className={className}>
			{isAlwaysVisible && (
				<button
					onClick={handleClick}
					className={`button ${!isSignedIn && 'cursor-not-allowed opacity-50'}`}
					aria-label={
						isSignedIn
							? 'Abrir chat'
							: 'Chat disponible solo para usuarios registrados'
					}
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
			)}

			{isOpen && isSignedIn && (
				<div className="fixed right-24 bottom-32 z-50" ref={chatContainerRef}>
					<ResizableBox
						width={400}
						height={500}
						minConstraints={[300, 400]}
						maxConstraints={[800, window.innerHeight - 160]} // 160px total de margen (80px arriba y abajo)
						resizeHandles={['s', 'w', 'e', 'n', 'sw', 'nw', 'se', 'ne']}
						className="chat-resizable"
						onResize={handleResize}
					>
						<div className="flex h-full w-full flex-col rounded-lg border border-gray-200 bg-white shadow-xl">
							<div className="flex items-center justify-between border-b p-4">
								<div className="flex items-center space-x-2">
									<FaRobot className="text-2xl text-secondary" />
									<h2 className="text-lg font-semibold text-gray-800">
										Artie IA
									</h2>
								</div>
								<button
									onClick={() => setIsOpen(false)}
									className="rounded-full p-2 transition-colors hover:bg-gray-100"
								>
									<IoMdClose className="text-xl text-gray-500" />
								</button>
							</div>

							<div className="flex-1 space-y-4 overflow-y-auto p-4">
								{messages.map((message) => (
									<div
										key={message.id}
										className={`flex ${
											message.sender === 'user'
												? 'justify-end'
												: 'justify-start'
										} mb-4`}
									>
										<div
											className={`flex max-w-[80%] items-start space-x-2 ${
												message.sender === 'user'
													? 'flex-row-reverse space-x-reverse'
													: 'flex-row'
											}`}
										>
											{message.sender === 'bot' ? (
												<FaRobot className="mt-2 text-xl text-secondary" />
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
												{renderMessage(message)}
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

							<form onSubmit={handleSendMessage} className="border-t p-4">
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
										className="flex-1 rounded-lg border p-2 text-background focus:ring-2 focus:ring-secondary focus:outline-none"
										disabled={!isSignedIn || isLoading}
									/>
									<button
										type="submit"
										disabled={isLoading}
										className="rounded-lg bg-secondary px-4 py-2 text-white transition-all hover:bg-[#00A5C0] disabled:bg-gray-300"
									>
										<FiSend className="text-xl" />
									</button>
								</div>
							</form>
						</div>
					</ResizableBox>
				</div>
			)}
		</div>
	);
};

export default StudentChatbot;
