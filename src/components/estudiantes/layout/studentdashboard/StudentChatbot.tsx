'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useAuth, useUser } from '@clerk/nextjs';
import { ArrowRightCircleIcon } from '@heroicons/react/24/solid';
import { HiMiniCpuChip } from 'react-icons/hi2';
import { IoMdClose } from 'react-icons/io';
import { GoArrowLeft } from "react-icons/go";
import { BiMessageAltAdd } from "react-icons/bi";
import { ResizableBox } from 'react-resizable';
import { toast } from 'sonner';
import { usePathname } from 'next/navigation';

import '~/styles/chatmodal.css';
import { Card } from '~/components/estudiantes/ui/card';
import 'react-resizable/css/styles.css';

// Importar StudentChatList.tsx
import { ChatList } from './StudentChatList';
// Importar StudentChat
import { ChatMessages } from './StudentChat';

import { saveMessages } from '~/server/actions/estudiantes/chats/saveMessages';


interface StudentChatbotProps {
	className?: string;
	initialSearchQuery?: string;
	isAlwaysVisible?: boolean;
	showChat?: boolean;
	courseTitle?: string;
	onSearchComplete?: () => void;
	courseId?: number;
	isEnrolled?: boolean;
}

interface ChatResponse {
	response: string;
	courses: { id: number; title: string }[];
}

interface ResizeData {
	size: {
		width: number;
		height: number;
	};
	handle: string;
}

interface Curso {
	id: number;
	title: string;
}

const StudentChatbot: React.FC<StudentChatbotProps> = ({
	className,
	initialSearchQuery = '',
	isAlwaysVisible = false,
	showChat = false,
	onSearchComplete,
	courseTitle,
	courseId,
	isEnrolled, // Añadido para manejar el estado de inscripción
}) => {
	const [isOpen, setIsOpen] = useState(showChat);
	const [messages, setMessages] = useState([
		{ id: Date.now(), text: '¡Hola! soy Artie 🤖 tú chatbot para resolver tus dudas, ¿En qué puedo ayudarte hoy? 😎', sender: 'bot' }
	]);
	const [inputText, setInputText] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [processingQuery, setProcessingQuery] = useState(false);
	const [dimensions, setDimensions] = useState({
		width: 400,
		height: 500,
	});
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null); // <-- Soluciona el error inputRef
	const chatContainerRef = useRef<HTMLDivElement>(null);
	const searchRequestInProgress = useRef(false);

	const { isSignedIn } = useAuth();
	const { user } = useUser();
	const router = useRouter();

	const initialSearchDone = useRef(false);

	// Pruebas para varios chats
	const [chatMode, setChatMode] = useState<{ idChat: number | null; status: boolean }>({ idChat: null, status: true });

	// Saber si el chatlist esta abierto

	const [showChatList, setShowChatList] = useState(false);

	const chatModeRef = useRef(chatMode);

	const [idea, setIdea] = useState<{ selected: boolean; idea: string }>({
		selected: false,
		idea: '',
	})

	const ideaRef = useRef(idea);

	useEffect(() => {
		ideaRef.current = idea;
	}, [idea]);

	useEffect(() => {
		const handleNewIdea = () => {
		
			setIdea({ selected: true, idea: '' });
		};

		window.addEventListener('new-idea', handleNewIdea);

		return () => {
			window.removeEventListener('new-idea', handleNewIdea);
		};
	}, []);

	useEffect(() => {
		chatModeRef.current = chatMode;
	}, [chatMode]);

	const pathname = usePathname();
	const isChatPage = pathname === '/'


	const saveBotMessage = (trimmedInput: string) => {
		const currentChatId = chatModeRef.current.idChat;
		console.log('Mensaje bot prueba con ref' + chatModeRef.current.idChat);
		console.log('Mensaje bot prueba chatId' + chatMode.idChat);
		if (currentChatId) {
			console.log('Guardando mensaje del bot:', trimmedInput, 'en chat ID:', currentChatId);
			void saveMessages(
				'bot', // senderId
				currentChatId, // cursoId
				[
					{
						text: trimmedInput,
						sender: 'bot',
						sender_id: 'bot',
					},
				]
			);
		} else {
			console.log('No está entrando al chat ', currentChatId);
		}
	};

	const handleBotResponse = useCallback(

		async (query: string) => {

			if (processingQuery || searchRequestInProgress.current) return;



			searchRequestInProgress.current = true;
			setProcessingQuery(true);
			setIsLoading(true);

		

			// Url para la petición según si hay courseTitle
			const urlDefault = { url: 'http://3.131.99.140:5000/root_courses', body: { prompt: query } };
			const urlCourses = { url: 'http://3.131.99.140:5000/root_courses', body: { user_id: user?.id, curso: courseTitle, user_message: query } };
			const fetchConfig = courseTitle ? urlCourses : urlDefault;

			try {
				const result = await fetch(fetchConfig.url, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify(fetchConfig.body),
				});

				const data = (await result.json());

				console.log('respuesta del bot:', data.result);

				const cursos: Curso[] = data.result;

				const cursosTexto = cursos
					.map((curso, index) => `${index + 1}. ${curso.title} | ${curso.id}`)
					.join('\n\n');

				const introText = cursosTexto.length !== 0 ? 'Aquí tienes algunos cursos recomendados:': 'No se encontraron cursos recomendados. Intenta con otra consulta.';

				setMessages((prev) => [
					...prev,
					{
						id: Date.now() + Math.random(),
						text: `${introText}\n\n${cursosTexto}`,
						sender: 'bot' as const,
					},
				]);

				saveBotMessage(data.result); // Guarda la respuesta real del bot

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

				saveBotMessage('Lo siento, ocurrió un error al procesar tu solicitud.'); // Guarda el error como mensaje del bot
			} finally {

				setIsLoading(false);
				setProcessingQuery(false);
				searchRequestInProgress.current = false;
				onSearchComplete?.();

			}
		},
		[processingQuery, onSearchComplete, courseTitle]
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
			if (
				!initialSearchQuery?.trim() ||
				!isSignedIn ||
				!showChat ||
				processingQuery || // This is used in the dependency check
				searchRequestInProgress.current ||
				initialSearchDone.current
			)
				return;

			initialSearchDone.current = true;
			setIsOpen(true);

			// Add user message first
			setMessages((prev) => [
				...prev,
				{
					id: Date.now() + 1,
					text: initialSearchQuery.trim(),
					sender: 'user',
				},
			]);

			// Then process the bot response
			await handleBotResponse(initialSearchQuery.trim());
		};

		void handleInitialSearch();
	}, [
		initialSearchQuery,
		isSignedIn,
		showChat,
		handleBotResponse,
		processingQuery,
	]); // Added processingQuery

	useEffect(() => {
		return () => {
			initialSearchDone.current = false;
		};
	}, []);

	useEffect(() => {
		if (!showChat) {
			initialSearchDone.current = false;
			setProcessingQuery(false);
		}
	}, [showChat, processingQuery]);

	useEffect(() => {
		setIsOpen(showChat);
	}, [showChat]);

	useEffect(() => {
		// Set initial dimensions based on window size
		const initialDimensions = {
			width:
				typeof window !== 'undefined' && window.innerWidth < 768 ? 350 : 500,
			height:
				typeof window !== 'undefined' && window.innerWidth < 768 ? 500 : window.innerHeight,
		};
		setDimensions(initialDimensions);

		// Add resize handler
		const handleResize = () => {
			setDimensions({
				width: window.innerWidth < 768 ? 200 : 400,
				height: window.innerWidth < 768 ? 400 : 500,
			});
		};

		if (typeof window !== 'undefined') {
			window.addEventListener('resize', handleResize);
			return () => window.removeEventListener('resize', handleResize);
		}
	}, []);

	const scrollToBottom = () => {
		void messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	};

	const saveUserMessage = (trimmedInput: string, sender: string) => {
		const currentChatId = chatMode.idChat;
		console.log('Mensaje usuario prueba con ref' + chatModeRef.current.idChat);
		console.log('Mensaje usuario prueba chatId' + chatMode.idChat);
		if (currentChatId) {
		
			void saveMessages(
				user?.id ?? '', // senderId
				currentChatId, // cursoId
				[
					{
						text: trimmedInput,
						sender: sender,
						sender_id: user?.id ?? '',
					}
				]
			);
		} else {
			console.log('No está entrando al chat para guardar el mensaje del usuario');
		}
	};

	const handleSendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!isSignedIn && pathname !== '/') {
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

		// Lógica para almacenar el mensaje del usuario en la base de datos
		saveUserMessage(trimmedInput, 'user');

		setMessages((prev) => [...prev, newUserMessage]);
		setInputText('');



		if (ideaRef.current.selected) {
			// Si se está esperando una idea, se guarda el mensaje del usuario como idea
			setIdea({ selected: false, idea: trimmedInput });


		}
		await handleBotResponse(trimmedInput);
	};

	const handleClose = () => {
		setIsOpen(false);
		setMessages([
			{
				id: Date.now(),
				text: 'Hola ¿En qué puedo ayudarte hoy?',
				sender: 'bot',
			},
		]);
		setInputText('');
		initialSearchDone.current = false;
		setProcessingQuery(false);
		onSearchComplete?.();
	};

	const handleClick = () => {
		if (!isSignedIn && pathname !== '/') {
			const currentUrl = encodeURIComponent(window.location.href);
			toast.error('Acceso restringido', {
				description: 'Debes iniciar sesión para usar el chatbot.',
				action: {
					label: 'Iniciar sesión',
					onClick: () => router.push(`/sign-in?redirect_url=${currentUrl}`),
				},
				duration: 5000,
			});
			return;
		}
		if (isOpen) {
			handleClose();
		} else {
			setIsOpen(true);
		}
	};

	const handleResize = useCallback(
		(_e: React.SyntheticEvent, data: ResizeData) => {
			setDimensions(data.size);
		},
		[]
	);

	const renderMessage = (message: {
		id: number;
		text: string;
		sender: string;
	}) => {
		if (message.sender === 'bot') {
			console.log('Mensaje del bot:', message);

			const parts = message.text.split('\n\n');
			const introText = parts[0];
			const courseTexts = parts.slice(1);

			console.log('Texto intro:', introText);
			console.log('Cursos en texto:', courseTexts);

			const courses = courseTexts
				.map((text) => {
					const match = text.match(/^(\d+)\.\s+(.*?)\s+\|\s+(\d+)$/);
					if (!match) {
						console.warn('No match para curso:', text);
						return null;
					}
					return {
						number: parseInt(match[1]),
						title: match[2].trim(),
						id: parseInt(match[3]),
					};
				})
				.filter(
					(course): course is { number: number; title: string; id: number } =>
						Boolean(course)
				);

				console.log('Cursos procesados:', courses);

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
									<div className="px-4 py-3">
									<h4 className="mb-3 font-bold text-white text-base tracking-wide">
										{course.number}. {course.title}
									</h4>
									<Link
										href={`/estudiantes/cursos/${course.id}`}
										className="group/button relative inline-flex items-center justify-between w-full h-11 px-4 rounded-lg border border-cyan-400 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-400/20 transition-all duration-300 ease-in-out shadow-md backdrop-blur-sm"
									>
										<span className="font-semibold tracking-wide">Ver Curso</span>
										<ArrowRightCircleIcon className="ml-2 h-5 w-5 text-cyan-300 group-hover/button:translate-x-1 transition-transform duration-300 ease-in-out" />
									</Link>
									</div>
								</Card>
							))}
							<button
							className="group relative mt-3 w-full overflow-hidden rounded-lg border border-cyan-500 bg-gradient-to-br from-cyan-600 via-cyan-500 to-cyan-400 text-white py-2 text-sm font-semibold shadow-md transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-cyan-500/50"
							onClick={() => {
								// lógica del proyecto
							}}
							>
							<span className="relative z-10">+ Agregar proyecto</span>
							<span className="absolute inset-0 bg-cyan-400/10 blur-md group-hover:blur-lg transition-all duration-500 ease-in-out" />
							<span className="absolute left-0 top-0 h-full w-1 bg-cyan-500 animate-pulse" />
							</button>
						</div> 
					)}
				</div>
			);
		}

		return <p>{message.text}</p>;
	};


	// Emitir eventos globales para ocultar/mostrar el botón de soporte
	useEffect(() => {
		if (isOpen) {
			window.dispatchEvent(new CustomEvent('student-chat-open'));
		} else {
			window.dispatchEvent(new CustomEvent('student-chat-close'));
		}
	}, [isOpen]);

	return (
		<div className={`${className} fixed`} style={{ zIndex: 99999 }}>
			{isAlwaysVisible && (
				<button
					onClick={handleClick}
					className={`button-circular ${!isSignedIn && pathname !== '/' && 'cursor-not-allowed opacity-50'} ${isOpen ? 'minimized' : ''
						}`}
					aria-label={
						isSignedIn
							? 'Abrir chat'
							: 'Chat disponible solo para usuarios registrados'
					}
				>
					<div className="button-circular__text">
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
					<div className="button-circular__inner">
						<HiMiniCpuChip className="button-circular__icon fill-blue-500 text-2xl" />
						<HiMiniCpuChip className="button-circular__icon button-circular__icon--copy fill-blue-500 text-2xl" />
					</div>
				</button>
			)}

			{/* Mostrar el chat solo cuando isOpen es true */}
			{isOpen && (isSignedIn || pathname === '/') && (
				<div
					className="fixed right-2 bottom-28 sm:right-0 sm:bottom-0" // Modificado bottom-28 para móviles
					ref={chatContainerRef}
					style={{ zIndex: 110000 }} // Aumenta el z-index para que esté por encima del botón de soporte
				>
					<ResizableBox
						width={dimensions.width}
						height={dimensions.height}
						onResize={handleResize}
						minConstraints={[400, window.innerHeight]} // Smaller minimum size for mobile
						maxConstraints={[
							Math.min((window.innerWidth), window.innerWidth - 20),
							window.innerHeight,
						]}
						resizeHandles={
							window.innerWidth < 768 ? [] : ['sw'] // Solo permite redimensionar hacia la izquierda abajo en escritorio
						}
						className="chat-resizable"
					>
						<div className="relative flex h-full w-full flex-col overflow-hidden rounded-lg border border-gray-200 bg-white">
							{/* Logo background */}

							<div className="pointer-events-none absolute inset-0 z-[1] flex items-center justify-center opacity-5">
								<Image
									src="/artiefy-logo2.svg"
									alt="Artiefy Logo Background"
									width={300}
									height={100}
									className="w-4/5"
									priority
								/>
							</div>

							{/* Header */}
							<div className="relative z-[5] flex flex-col border-b bg-white/95 p-3 backdrop-blur-sm">
								<div className="flex items-start justify-between">
									<HiMiniCpuChip className="mt-1 text-4xl text-blue-500" />

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

									<div className="flex">
										<button

											className="rounded-full p-1.5 ml-2 transition-colors hover:bg-gray-100"
											aria-label="Minimizar chatbot"
										>
											{!isChatPage && (
												chatMode.status ? (
													<GoArrowLeft
														className="text-xl text-gray-500"
														onClick={() => setChatMode({ idChat: null, status: showChatList ? true : false })}
													/>
												) : showChatList ? (
													<BiMessageAltAdd
														className="text-xl text-gray-500"
														onClick={() => setChatMode({ idChat: null, status: true })}
													/>
												) : null
											)}
										</button>
										<button
											onClick={() => setIsOpen(false)}
											className="rounded-full p-1.5 transition-colors hover:bg-gray-100"
											aria-label="Cerrar chatbot"
										>
											<IoMdClose className="text-xl text-gray-500" />
										</button>

									</div>
								</div>
							</div>

							{chatMode.status ? (
								<ChatMessages
									idea={idea}
									setIdea={setIdea}
									setShowChatList={setShowChatList}
									courseId={courseId}
									isEnrolled={isEnrolled}
									courseTitle={courseTitle}
									messages={messages}
									setMessages={setMessages}
									chatMode={chatMode}
									setChatMode={setChatMode}
									inputText={inputText}
									setInputText={setInputText}
									handleSendMessage={handleSendMessage}
									isLoading={isLoading}
									user={user as any}
									messagesEndRef={messagesEndRef as React.RefObject<HTMLDivElement>}
									isSignedIn={isSignedIn}
									inputRef={inputRef as React.RefObject<HTMLInputElement>}
									renderMessage={renderMessage}
								/>
							) : (
								<ChatList setChatMode={setChatMode} setShowChatList={setShowChatList} />
							)}


							{/* Messages */}
							{/*
							<div className="relative z-[3] flex-1 space-y-4 overflow-y-auto p-4">
								
								{messages.map((message, idx) => (
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
												<HiMiniCpuChip className="mt-2 text-3xl text-blue-500" />
											) : user?.imageUrl ? (
												<Image
													src={user.imageUrl}
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
												className={`rounded-lg p-3 ${
													message.sender === 'user'
														? 'bg-secondary text-white'
														: 'bg-gray-300 text-gray-800'
												}`}
											>
												{renderMessage(message, idx)}
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

							{/* Input 
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
							*/}
						</div>
					</ResizableBox>
				</div>
			)}
		</div>
	);
};

export default StudentChatbot;
