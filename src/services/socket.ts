import { io } from "socket.io-client";

const SOCKET_URL =
  "https://api-gateway-971g.onrender.com";

export const createSocket = (accessToken: string) => {
  console.log(
    "🔑 Creating socket with token:",
    !!accessToken
  );

  const socket = io(SOCKET_URL, {
    transports: ["polling", "websocket"],
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    auth: {
      token: accessToken,
    },
  });

  socket.on("connect", () => {
    console.log(
      "🟢 Socket connected:",
      socket.id
    );
  });

  socket.on("connect_error", (error) => {
    console.error(
      "❌ Socket connection error:",
      error.message
    );
  });

  socket.on("disconnect", (reason) => {
    console.log(
      "🟡 Socket disconnected:",
      reason
    );
  });

  socket.connect();

  return socket;
};
