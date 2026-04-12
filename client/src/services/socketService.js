import { io } from 'socket.io-client';

let socket = null;

export const connectSocket = () => {
  if (socket?.connected) return socket;

  const token = localStorage.getItem('token');
  socket = io('/', {
    auth: { token },
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  return socket;
};

export const disconnectSocket = () => {
  socket?.disconnect();
  socket = null;
};

export const getSocket = () => socket;
