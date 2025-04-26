import { io } from 'socket.io-client';

const socket = io({
  path: '/api/socketio',
  transports: ['websocket', 'polling'],
});

export default socket;
