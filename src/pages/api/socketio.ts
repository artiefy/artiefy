// pages/api/socketio.ts

import { Server } from 'socket.io';
import type { Server as NetServer } from 'http';
import type { NextApiRequest, NextApiResponse } from 'next';
import type { Socket } from 'net';

interface CustomNextApiResponse extends NextApiResponse {
	socket: Socket & {
		server: NetServer & {
			io?: Server;
		};
	};
}

const handler = (_: NextApiRequest, res: CustomNextApiResponse) => {
	if (!res.socket.server.io) {
		console.log('🔌 Inicializando Socket.IO...');
		const io = new Server(res.socket.server, {
			path: '/api/socketio', // 👈 esta ruta debe coincidir con socket.ts
			addTrailingSlash: false,
			cors: {
				origin: '*',
				methods: ['GET', 'POST'],
			},
		});

		io.on('connection', (socket) => {
			console.log('✅ Cliente conectado:', socket.id);

			socket.on('user_connected', (userId) => {
				console.log(`🧍 Usuario conectado: ${userId}`);
			});

			socket.on('message', (data) => {
				console.log('📨 Mensaje recibido:', data);
				socket.broadcast.emit('message', data);
			});

			socket.on('disconnect', () => {
				console.log('❌ Cliente desconectado:', socket.id);
			});
		});

		res.socket.server.io = io;
	} else {
		console.log('⚡ Socket.IO ya estaba inicializado');
	}

	res.end();
};

export default handler;
