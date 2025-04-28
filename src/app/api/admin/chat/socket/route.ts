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

		io.on('connection', (socket) => {
			console.log('👤 User connected:', socket.id);

			socket.on('message', (data) => {
				console.log('📩 Message received:', data);
				socket.broadcast.emit('message', data);
			});

			socket.on('disconnect', () => {
				console.log('🔌 User disconnected:', socket.id);
			});
		});
	} else {
		console.log('⚡ Socket.IO server already initialized');
	}

	return NextResponse.json({ success: true });
}
