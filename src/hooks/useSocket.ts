import { useEffect, useState } from 'react';
import socketIOClient from 'socket.io-client';
import type { Socket } from 'socket.io-client';

const SOCKET_URL =
	process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:4000';

export const useSocket = () => {
	const [socket, setSocket] = useState<typeof Socket | null>(null);

	useEffect(() => {
		const newSocket: typeof Socket = socketIOClient(SOCKET_URL);
		setSocket(newSocket);

		return () => {
			newSocket.disconnect();
		};
	}, []);

	return socket;
};
