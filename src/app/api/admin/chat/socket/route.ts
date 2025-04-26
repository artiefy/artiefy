import { Server } from 'socket.io';
import { NextResponse } from 'next/server';
import { Server as NetServer } from 'http';
import { NextApiResponseServerIO } from '~/types/socket';

export const dynamic = 'force-dynamic';

let io: Server | undefined;

export async function GET(req: Request, res: NextApiResponseServerIO) {
	if (!res.socket.server.io) {
		console.log('🚀 Initializing Socket.IO server...');
		const httpServer: NetServer = res.socket.server as any;
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

			// AQUÍ ES DONDE FALTABA
			socket.on('message', (data) => {
				console.log('📩 Message received:', data);
				socket.broadcast.emit('message', data); // SOLO a los demás
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
