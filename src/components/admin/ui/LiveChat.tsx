'use client';

import { useState, useEffect, useRef } from 'react';
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from '~/components/admin/ui/avatar';
import { Button } from '~/components/admin/ui/button';
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from '~/components/admin/ui/card';
import { Input } from '~/components/admin/ui/input';
import { ScrollArea } from '~/components/admin/ui/scroll-area';

interface Message {
	id: number;
	sender: 'user' | 'support';
	content: string;
	timestamp: Date;
}

export function LiveChat() {
	const [messages, setMessages] = useState<Message[]>([]);
	const [inputMessage, setInputMessage] = useState('');
	const [isTyping, setIsTyping] = useState(false);
	const scrollAreaRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		// Simular un mensaje de bienvenida del soporte
		setMessages([
			{
				id: 1,
				sender: 'support',
				content: '¡Hola! ¿En qué puedo ayudarte hoy?',
				timestamp: new Date(),
			},
		]);
	}, []);

	useEffect(() => {
		// Scroll to bottom when new messages are added
		if (scrollAreaRef.current) {
			scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
		}
	}, [messages]);

	const handleSendMessage = () => {
		if (inputMessage.trim() === '') return;

		const newMessage: Message = {
			id: messages.length + 1,
			sender: 'user',
			content: inputMessage,
			timestamp: new Date(),
		};

		setMessages([...messages, newMessage]);
		setInputMessage('');
		setIsTyping(true);

		// Simular respuesta del soporte
		setTimeout(() => {
			const supportMessage: Message = {
				id: messages.length + 2,
				sender: 'support',
				content:
					'Gracias por tu mensaje. Un agente de soporte te responderá pronto.',
				timestamp: new Date(),
			};
			setMessages((prevMessages) => [...prevMessages, supportMessage]);
			setIsTyping(false);
		}, 2000);
	};

	return (
		<Card className="mx-auto w-full max-w-md">
			<CardHeader>
				<CardTitle>Chat en Vivo</CardTitle>
			</CardHeader>
			<CardContent>
				<ScrollArea className="h-[400px] pr-4" ref={scrollAreaRef}>
					<div className="space-y-4">
						{messages.map((message) => (
							<div
								key={message.id}
								className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
							>
								{message.sender === 'support' && (
									<Avatar className="mr-2 size-8">
										<AvatarImage src="/support-avatar.png" alt="Support" />
										<AvatarFallback>SP</AvatarFallback>
									</Avatar>
								)}
								<div
									className={`max-w-[70%] rounded-lg p-2 ${message.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}
								>
									<p>{message.content}</p>
									<p className="mt-1 text-xs opacity-70">
										{message.timestamp.toLocaleTimeString()}
									</p>
								</div>
							</div>
						))}
					</div>
					{isTyping && (
						<div className="mt-4 flex justify-start">
							<div className="bg-secondary rounded-lg p-2">
								<p>El soporte está escribiendo...</p>
							</div>
						</div>
					)}
				</ScrollArea>
			</CardContent>
			<CardFooter>
				<form
					onSubmit={(e) => {
						e.preventDefault();
						handleSendMessage();
					}}
					className="flex w-full gap-2"
				>
					<Input
						value={inputMessage}
						onChange={(e) => setInputMessage(e.target.value)}
						placeholder="Escribe tu mensaje..."
						className="grow"
					/>
					<Button type="submit">Enviar</Button>
				</form>
			</CardFooter>
		</Card>
	);
}
