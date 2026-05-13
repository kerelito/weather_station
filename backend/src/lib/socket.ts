import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import { env } from "../config/env";

let io: Server | null = null;

const resolveOrigins = () => {
  if (!env.FRONTEND_URL) {
    return "*";
  }

  return env.FRONTEND_URL.split(",").map((origin) => origin.trim());
};

export function createSocketServer(server: HttpServer) {
  io = new Server(server, {
    cors: {
      origin: resolveOrigins(),
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    socket.emit("system:hello", {
      message: "Socket.IO connected",
      connectedAt: new Date().toISOString(),
    });
  });

  return io;
}

export function getIo() {
  if (!io) {
    throw new Error("Socket server is not initialized.");
  }

  return io;
}
