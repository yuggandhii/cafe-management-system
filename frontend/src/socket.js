import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000';

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  withCredentials: true,
});

export const connectSocket = () => { if (!socket.connected) socket.connect(); };
export const disconnectSocket = () => { if (socket.connected) socket.disconnect(); };
export const joinKitchen = (session_id) => socket.emit('join_kitchen', { session_id });
export const joinCustomerDisplay = (session_id) => socket.emit('join_customer_display', { session_id });
