import { Server, type Server as SocketIOServer } from 'socket.io';
import type { Server as NetServer } from 'http';
import type { Socket } from 'net';
import type { NextApiRequest, NextApiResponse } from 'next';
interface CustomNextApiResponse extends NextApiResponse {
	socket: Socket & {
		server: NetServer & {
			io?: SocketIOServer;
		};
	};
}

const handler = (req: NextApiRequest, res: CustomNextApiResponse): void => {
	if (!res.socket.server.io) {
		void req;
		const io = new Server(res.socket.server);
		res.socket.server.io = io;
	}
	res.end();
};

export default handler;
