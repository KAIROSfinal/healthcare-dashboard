import { io } from "socket.io-client";

export const socket = io("https://api-gateway-971g.onrender.com", {
  transports: ["websocket"],
  autoConnect: true,
});