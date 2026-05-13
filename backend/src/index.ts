import { createServer } from "node:http";
import path from "node:path";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env";
import { createSocketServer, getIo } from "./lib/socket";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { apiRouter } from "./routes";
import { sensorService } from "./services/sensor.service";

const app = express();
const server = createServer(app);

const allowedOrigins = env.FRONTEND_URL?.split(",").map((origin) => origin.trim()) ?? "*";

app.use(
  helmet({
    contentSecurityPolicy: false,
  }),
);
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);
app.use(express.json({ limit: "1mb" }));
app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));

createSocketServer(server);

app.use("/api", apiRouter);

const frontendDistPath = path.resolve(process.cwd(), "../frontend/dist");
app.use(express.static(frontendDistPath));
app.use((request, response, next) => {
  if (request.path.startsWith("/api") || request.path.startsWith("/socket.io")) {
    return next();
  }

  return response.sendFile(path.join(frontendDistPath, "index.html"), (error) => {
    if (error) {
      next();
    }
  });
});

app.use(notFoundHandler);
app.use(errorHandler);

const offlineCheckIntervalMs = 60 * 1000;
setInterval(async () => {
  const staleSensors = await sensorService.markOffline(
    new Date(Date.now() - env.SENSOR_OFFLINE_AFTER_MINUTES * 60 * 1000),
  );

  if (staleSensors.length === 0) {
    return;
  }

  getIo().emit(
    "sensor:status",
    staleSensors.map((sensor) => ({
      sensorId: sensor.id,
      isOnline: false,
      lastSeenAt: sensor.lastSeenAt?.toISOString() ?? null,
    })),
  );
}, offlineCheckIntervalMs);

server.listen(env.PORT, () => {
  console.log(`Weather backend listening on http://localhost:${env.PORT}`);
});
