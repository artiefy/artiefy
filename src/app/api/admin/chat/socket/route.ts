import { NextResponse } from 'next/server';
import { Server } from 'socket.io';
import type { Server as NetServer } from 'http';
import type { NextApiResponseServerIO } from '~/types/socket';

export const dynamic = 'force-dynamic';

let io: Server | undefined;

export function GET(_: Request, res: NextApiResponseServerIO) {
	if (!res.socket.server.io) {
		console.log('🚀 Initializing Socket.IO server...');
		const httpServer = res.socket.server as unknown as NetServer;
		io = new Server(httpServer, {
			path: '/api/admin/chat/socketio',
			cors: {
				origin: '*',
				methods: ['GET', 'POST'],
			},
			transports: ['polling', 'websocket'],
		});

		res.socket.server.io = io;

		const connectedUsers = new Map();

		io.on('connection', (socket) => {
			console.log('👤 User connected:', socket.id);

			socket.on('user_connected', (userId) => {
				connectedUsers.set(userId, socket.id);
			});

			socket.on('message', (data) => {
				console.log('📩 Message received:', data);

				// Emitir a todos excepto al remitente
				socket.broadcast.emit('message', {
					...data,
					timestamp: new Date(),
				});

				// Emitir directamente al receptor si está conectado
				console.log('🎯 Buscando socket para receiverId:', data.receiverId);

				const receiverSocketId = connectedUsers.get(data.receiverId);
				console.log('🔌 Receiver socket ID:', receiverSocketId);
				if (receiverSocketId) {
					io?.to(receiverSocketId).emit('message', {
						...data,
						timestamp: new Date(),
					});

					io?.to(receiverSocketId).emit('notification', {
						type: 'new_message',
						from: data.senderName || 'Usuario',
						message: data.message,
						conversationId: data.conversationId,
					});
				}
			});

			socket.on('disconnect', () => {
				console.log('🔌 User disconnected:', socket.id);
				// Eliminar usuario de los conectados
				for (const [userId, socketId] of connectedUsers.entries()) {
					if (socketId === socket.id) {
						connectedUsers.delete(userId);
						break;
					}
				}
			});
		});
	} else {
		console.log('⚡ Socket.IO server already initialized');
	}

	return NextResponse.json({ success: true });
}
