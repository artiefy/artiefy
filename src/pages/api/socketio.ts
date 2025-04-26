import { Server } from 'socket.io';
import { NextApiRequest } from 'next';
import { NextApiResponseServerIO } from '~/types/socket';

export const config = {
	api: {
		bodyParser: false,
	},
};

export default function handler(
	req: NextApiRequest,
	res: NextApiResponseServerIO
) {
	if (!res.socket.server.io) {
		console.log('🔌 Iniciando servidor Socket.IO');

		const io = new Server(res.socket.server, {
			path: '/api/socketio',
			cors: {
				origin: '*',
				methods: ['GET', 'POST'],
			},
		});

		res.socket.server.io = io;

		io.on('connection', (socket) => {
			console.log('✅ Nuevo cliente conectado:', socket.id);

			socket.on('join', ({ userId, username }) => {
				socket.join(userId);
				socket.data.username = username;
				console.log(`👤 Usuario ${username} unido a la sala ${userId}`);
			});

			socket.on('message', ({ to, from, text }) => {
				const payload = { from, text };
				if (to) {
					io.to(to).emit('message', payload);
				} else {
					socket.broadcast.emit('message', payload);
				}
			});

			socket.on('disconnect', () => {
				console.log('❌ Cliente desconectado:', socket.id);
			});
		});
	}
	res.end();
}
