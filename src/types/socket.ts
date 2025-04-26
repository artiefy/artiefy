import { Server as HTTPServer } from 'http';
import { Socket } from 'net';
import { Server as IOServer } from 'socket.io';

export type NextApiResponseServerIO = {
  socket: Socket & {
    server: HTTPServer & {
      io: IOServer;
    };
  };
};
