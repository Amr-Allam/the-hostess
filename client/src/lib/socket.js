import { io } from "socket.io-client";

// Opens a Socket.io connection to the API server. Pass the staff JWT for
// kitchen/owner connections; omit it for a customer connection.
export function createSocket(token) {
  return io(import.meta.env.VITE_API_URL, { auth: token ? { token } : {} });
}
