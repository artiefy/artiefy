'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useAuth } from '@clerk/nextjs';
import { BsPersonCircle } from 'react-icons/bs';
import { FaRobot } from 'react-icons/fa';
import { FiSend } from 'react-icons/fi';
import { IoMdClose } from 'react-icons/io';
import { toast } from 'sonner';

import '~/styles/chatmodal.css';

interface StudentChatbotProps {
	className?: string;
	initialSearchQuery?: string;
}

interface ChatResponse {
	response: string;
}

interface CourseItem {
	title: string;
	id: string;
}

const formatCourseList = (text: string): CourseItem[] => {
	const coursesMatch = text.match(/\d+\.\s+([^:?\n]+)/g);
	return (
		coursesMatch?.map((course) => {
			const [, title] = /\d+\.\s+(.+)/.exec(course) ?? [];
			return {
				title: title ?? '',
				id: (title ?? '').toLowerCase().replace(/\s+/g, '-'),
			};
		}) ?? []
	);
};

const StudentChatbot: React.FC<StudentChatbotProps> = ({
	className,
	initialSearchQuery,
}) => {
	const [isOpen, setIsOpen] = useState(false);
	const [messages, setMessages] = useState([
		{ id: Date.now(), text: 'Hola ¿En qué puedo ayudarte hoy?', sender: 'bot' },
	]);
	const [inputText, setInputText] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	const { isSignedIn } = useAuth();
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
	}, [isOpen]);

	useEffect(() => {
		scrollToBottom();
	}, [messages]);

	useEffect(() => {
		if (initialSearchQuery && isSignedIn) {
			setIsOpen(true);
			setMessages([
				{
					id: Date.now(),
					text: 'Hola ¿En qué puedo ayudarte hoy?',
					sender: 'bot',
				},
			]);
			const searchMessage = {
				id: Date.now() + 1,
				text: initialSearchQuery,
				sender: 'user' as const,
			};

			setMessages((prev) => [...prev, searchMessage]);
			void handleBotResponse(initialSearchQuery);
		}
	}, [initialSearchQuery, isSignedIn, handleBotResponse]);

	const scrollToBottom = () => {
		void messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	};

	const handleSendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!isSignedIn) {
			toast.error('Debes iniciar sesión para usar el chat', {
				description: 'Por favor, inicia sesión para acceder al chat.',
				action: {
					label: 'Iniciar sesión',
					onClick: () => router.push('/sign-in'),
				},
			});
			return;
		}
		if (!inputText.trim()) return;

		const newUserMessage = {
			id: Date.now(),
			text: inputText,
			sender: 'user' as const,
		};

		setMessages((prev) => [...prev, newUserMessage]);
		setInputText('');
		await handleBotResponse(inputText);
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

	const renderMessage = (message: {
		id: number;
		text: string;
		sender: string;
	}) => {
		if (message.sender === 'bot') {
			const courses = formatCourseList(message.text);
			const introText = message.text.split('\n\n')[0];
			const outroText = message.text.split('\n\n').slice(-1)[0];

			return (
				<div className="flex flex-col space-y-4">
					<p>{introText}</p>
					{courses.length > 0 && (
						<ul className="list-disc space-y-2 pl-4">
							{courses.map((course, index) => (
								<li key={index} className="flex flex-col space-y-2">
									<span>{course.title}</span>
									<Link
										href={`/estudiantes/cursos/${course.id}`}
										className="self-start rounded-md bg-secondary px-3 py-1 text-sm text-white hover:bg-secondary/80"
									>
										Ir al curso
									</Link>
								</li>
							))}
						</ul>
					)}
					{outroText !== introText && <p>{outroText}</p>}
				</div>
			);
		}
		return message.text;
	};

	return (
		<>
			<div className={className}>
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

				{isOpen && isSignedIn && (
					<div className="animate-in zoom-in-50 slide-in-from-right fixed right-24 bottom-32 z-50 w-[400px] duration-300 ease-in-out">
						<div className="flex h-[600px] flex-col rounded-lg border border-gray-200 bg-white shadow-xl">
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
										className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} mb-4`}
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
					</div>
				)}
			</div>
		</>
	);
};

export default StudentChatbot;
