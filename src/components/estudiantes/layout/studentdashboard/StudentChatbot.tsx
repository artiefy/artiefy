'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useAuth, useUser } from '@clerk/nextjs';
import { ArrowRightCircleIcon } from '@heroicons/react/24/solid';
import { BsPersonCircle } from 'react-icons/bs';
import { IoMdClose } from 'react-icons/io';
import { ResizableBox } from 'react-resizable';
import { toast } from 'sonner';
import 'react-resizable/css/styles.css';

import '~/styles/chatmodal.css';
import SendIcon from 'public/send-svgrepo-com.svg';
import { Card } from '~/components/estudiantes/ui/card';

interface StudentChatbotProps {
	className?: string;
	initialSearchQuery?: string;
	isAlwaysVisible?: boolean;
	showChat?: boolean;
}

interface ResizeData {
	size: { width: number; height: number };
	handle: string;
}

interface ChatResponse {
	response: string;
	courses: { id: number; title: string }[];
}

const StudentChatbot: React.FC<StudentChatbotProps> = ({
	className,
	initialSearchQuery = '',
	isAlwaysVisible = false,
	showChat = false,
}) => {
	// Modify the static positions calculation to better fill space
	const [staticPositions, setStaticPositions] = useState(() =>
		Array.from({ length: 150 }, (_, i) => {
			// Aumentado a 150 íconos
			const row = Math.floor(i / 12);
			const col = i % 12;
			// Nuevos cálculos para mejor distribución
			const x = col * 10 - row * 2; // Más cercanos horizontalmente
			const y = row * 8; // Más cercanos verticalmente
			const rotation = 45 + (Math.random() * 20 - 10); // Rotación más variada
			const scale = 0.28 + Math.random() * 0.1; // Escalas más variadas y pequeñas
			return { x, y, rotation, scale };
		})
	);

	const generateNewLayout = useCallback(() => {
		setStaticPositions(
			Array.from({ length: 150 }, (_, i) => {
				const row = Math.floor(i / 12);
				const col = i % 12;
				const x = col * 10 - row * 2;
				const y = row * 8;
				const rotation = 45 + (Math.random() * 20 - 10);
				const scale = 0.28 + Math.random() * 0.1;
				return { x, y, rotation, scale };
			})
		);
	}, []);

	// Botón para generar nuevo layout (solo en desarrollo)
	const DevTools =
		process.env.NODE_ENV === 'development' ? (
			<button
				onClick={generateNewLayout}
				className="absolute top-2 right-2 z-[3] rounded bg-gray-200 px-2 py-1 text-xs"
			>
				Nuevo patrón
			</button>
		) : null;

	const [isOpen, setIsOpen] = useState(showChat);
	const [messages, setMessages] = useState([
		{ id: Date.now(), text: 'Hola ¿En qué puedo ayudarte hoy?', sender: 'bot' },
	]);
	const [inputText, setInputText] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [lastSearchQuery, setLastSearchQuery] = useState('');
	const [processingQuery, setProcessingQuery] = useState(false);
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const chatContainerRef = useRef<HTMLDivElement>(null);
	const searchRequestInProgress = useRef(false);

	const { isSignedIn } = useAuth();
	const { user } = useUser();
	const router = useRouter();

	// Add a new ref to track initial search
	const initialSearchDone = useRef(false);

	const handleBotResponse = useCallback(
		async (query: string) => {
			if (processingQuery) return;
			setProcessingQuery(true);
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
					data.response ??
					'Lo siento, no pude encontrar información relevante.';

				setMessages((prev) => [
					...prev,
					{
						id: Date.now() + Math.random(),
						text: messageText,
						sender: 'bot' as const,
					},
				]);
			} catch (error) {
				console.error('Error getting bot response:', error);
				setMessages((prev) => [
					...prev,
					{
						id: Date.now() + Math.random(),
						text: 'Lo siento, ocurrió un error al procesar tu solicitud.',
						sender: 'bot' as const,
					},
				]);
			} finally {
				setIsLoading(false);
				setProcessingQuery(false);
			}
		},
		[processingQuery]
	);

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
			// Add check for initialSearchDone
			if (
				!initialSearchQuery?.trim() ||
				!isSignedIn ||
				!showChat ||
				processingQuery ||
				searchRequestInProgress.current ||
				initialSearchQuery.trim() === lastSearchQuery ||
				initialSearchDone.current
			)
				return;

			initialSearchDone.current = true; // Mark initial search as done

			setMessages([
				{
					id: Date.now(),
					text: 'Hola ¿En qué puedo ayudarte hoy?',
					sender: 'bot',
				},
				{ id: Date.now() + 1, text: initialSearchQuery.trim(), sender: 'user' },
			]);

			setIsOpen(true);
			setLastSearchQuery(initialSearchQuery.trim());
			await handleBotResponse(initialSearchQuery.trim());
		};

		void handleInitialSearch();
	}, [
		initialSearchQuery,
		isSignedIn,
		showChat,
		handleBotResponse,
		lastSearchQuery,
		processingQuery,
	]);

	// Add cleanup effect for initial search flag
	useEffect(() => {
		return () => {
			initialSearchDone.current = false;
		};
	}, []);

	// Reset initial search flag when chat closes
	useEffect(() => {
		if (!showChat) {
			initialSearchDone.current = false;
		}
	}, [showChat]);

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
		if (!trimmedInput || searchRequestInProgress.current) return;

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
		// Regenerar posiciones al abrir el chat
		if (!isOpen) {
			generateNewLayout();
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
			// Split the message into parts and extract courses
			const parts = message.text.split('\n\n');
			const introText = parts[0];
			const courseTexts = parts.slice(1);

			// Parse all courses from the message with exact ID from API
			const courses = courseTexts
				.map((text) => {
					const match = /(\d+)\.\s+(.*?)\|(\d+)/.exec(text);
					if (!match) return null;
					const courseId = parseInt(match[3]); // Este es el ID del curso de la API
					return {
						number: parseInt(match[1]),
						title: match[2].trim(),
						id: courseId, // Usamos el ID exacto de la API
					};
				})
				.filter(
					(course): course is { number: number; title: string; id: number } =>
						Boolean(course)
				);

			return (
				<div className="flex flex-col space-y-4">
					<p className="font-medium text-gray-800">{introText}</p>
					{courses.length > 0 && (
						<div className="grid gap-4">
							{courses.map((course) => (
								<Card
									key={course.id}
									className="text-primary overflow-hidden bg-gray-800 transition-all hover:scale-[1.02]"
								>
									<div className="px-4">
										<h4 className="mb-3 font-bold">
											{course.number}. {course.title}
										</h4>
										<Link
											href={`/estudiantes/cursos/${course.id}`} // Corregida la ruta para usar cursos
											className="group/button bg-background text-primary relative inline-flex h-9 w-full items-center justify-center overflow-hidden rounded-md border border-white/20 p-2 active:scale-95"
										>
											<span className="font-bold">Ver Curso</span>
											<ArrowRightCircleIcon className="animate-bounce-right ml-2 h-5 w-5" />
											<div className="absolute inset-0 flex w-full [transform:skew(-13deg)_translateX(-100%)] justify-center group-hover/button:[transform:skew(-13deg)_translateX(100%)] group-hover/button:duration-1000">
												<div className="relative h-full w-10 bg-white/30" />
											</div>
										</Link>
									</div>
								</Card>
							))}
						</div>
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
						{Array.from('-ARTIE-IA').map((char, i) => (
							<span key={i} style={{ '--index': i } as React.CSSProperties}>
								{char}
							</span>
						))}
						{Array.from('-ARTIE-IA-ARTIE').map((char, i) => (
							<span
								key={i + 9}
								style={{ '--index': i + 9 } as React.CSSProperties}
							>
								{char}
							</span>
						))}
					</div>
					<div className="button__circle">
						<Image
							src="/icons/robot-face.png"
							alt="Robot"
							width={24}
							height={24}
							className="button__icon"
						/>
						<Image
							src="/icons/robot-face.png"
							alt="Robot"
							width={24}
							height={24}
							className="button__icon button__icon--copy"
						/>
					</div>
				</button>
			)}

			{isOpen && isSignedIn && (
				<div
					className="fixed right-24 bottom-32 z-[9999]"
					ref={chatContainerRef}
				>
					<ResizableBox
						width={400}
						height={500}
						minConstraints={[300, 400]}
						maxConstraints={[800, window.innerHeight - 160]}
						resizeHandles={['s', 'w', 'e', 'n', 'sw', 'nw', 'se', 'ne']}
						className="chat-resizable"
						onResize={handleResize}
					>
						<div className="relative flex h-full w-full flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl">
							{DevTools}
							{/* Logo background */}
							<div className="pointer-events-none absolute inset-0 z-[1] flex items-center justify-center opacity-5">
								<Image
									src="/artiefy-logo2.svg"
									alt="Artiefy Logo Background"
									width={300}
									height={100}
									className="w-4/5"
								/>
							</div>

							{/* Modified Circuit icons layer */}
							<div className="pointer-events-none absolute inset-0 z-[2] overflow-hidden">
								<div className="relative h-full w-full">
									{staticPositions.map((pos, i) => (
										<Image
											key={i}
											src="/icons/circuit.png"
											alt="Circuit"
											width={56}
											height={56}
											className="absolute size-14 opacity-40"
											style={{
												left: `${Math.min(Math.max(pos.x, -15), 110)}%`,
												top: `${Math.min(Math.max(pos.y, -15), 110)}%`,
												transform: `rotate(${pos.rotation}deg) scale(${pos.scale})`,
											}}
										/>
									))}
								</div>
							</div>

							{/* Header - Mayor z-index */}
							<div className="relative z-[5] flex flex-col border-b bg-white/95 p-3 backdrop-blur-sm">
								{/* Header container */}
								<div className="flex items-start justify-between">
									{/* Left side with robot icon */}
									<Image
										src="/icons/robot-face.png"
										alt="Robot"
										width={40}
										height={40}
										className="text-secondary mt-1"
									/>

									{/* Center content */}
									<div className="-ml-6 flex flex-1 flex-col items-center">
										<h2 className="mt-1 text-lg font-semibold text-gray-800">
											Artie IA
										</h2>
										<div className="flex items-center gap-2">
											<em className="text-sm font-semibold text-gray-600">
												{user?.fullName}
											</em>
											<div className="relative inline-flex">
												<div className="absolute top-1/2 left-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full bg-green-500/30" />
												<div className="relative h-2.5 w-2.5 rounded-full bg-green-500" />
											</div>
										</div>
									</div>

									{/* Close button */}
									<button
										onClick={() => setIsOpen(false)}
										className="rounded-full p-1.5 transition-colors hover:bg-gray-100"
									>
										<IoMdClose className="text-xl text-gray-500" />
									</button>
								</div>
							</div>

							{/* Messages container - z-index medio para estar sobre los circuitos */}
							<div className="relative z-[3] flex-1 space-y-4 overflow-y-auto p-4">
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
												<Image
													src="/icons/robot-face.png"
													alt="Robot"
													width={32}
													height={32}
													className="text-secondary mt-2"
												/>
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
										<div className="rounded-lg bg-gray-100 p-1">
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

							{/* Input form section */}
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
											<SendIcon
												className="size-6 transition-all duration-200 group-hover:scale-110 group-hover:rotate-12"
												style={{
													stroke: '#0095FF',
													fill: 'currentColor',
													'--tw-text-opacity': '1',
													color: 'rgb(255 255 255 / var(--tw-text-opacity))',
												}}
											/>
										</button>
									</div>
								</form>
							</div>
						</div>
					</ResizableBox>
				</div>
			)}
		</div>
	);
};

export default StudentChatbot;
