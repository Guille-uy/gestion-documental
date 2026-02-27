import "express-async-errors";
import express, { Request, Response } from "express";
import cors from "cors";
import { config } from "./config.js";
import { logger } from "./utils/logger.js";
import { errorHandler } from "./middleware/error.js";

// Routes
import authRouter from "./routes/auth.js";
import documentsRouter from "./routes/documents.js";
import notificationsRouter from "./routes/notifications.js";
import auditRouter from "./routes/audit.js";
import configRouter from "./routes/config.js";

const app = express();

// Allowed origins: env var list + FRONTEND_URL + localhost + surge.sh deployments
const allowedOrigins = new Set<string>([
  ...(process.env.CORS_ORIGIN || "").split(",").filter(Boolean),
  ...(process.env.FRONTEND_URL || "").split(",").filter(Boolean),
  "http://localhost:5173",
  "http://localhost:3000",
]);

// Middleware
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (Postman, mobile apps, server-to-server)
      if (!origin) return callback(null, true);
      // Allow any surge.sh subdomain
      if (origin.endsWith(".surge.sh")) return callback(null, true);
      // Allow explicitly configured origins
      if (allowedOrigins.has(origin)) return callback(null, true);
      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Request logging
app.use((req, res, next) => {
  logger.debug(`${req.method} ${req.path}`);
  next();
});

// Routes
app.use("/api/auth", authRouter);
app.use("/api/documents", documentsRouter);
app.use("/api/notifications", notificationsRouter);
app.use("/api/audit", auditRouter);
app.use("/api/config", configRouter);

// Health checks
app.get("/health", (req: Request, res: Response) => {
  res.json({
    success: true,
    message: "API is running",
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: "Endpoint not found",
  });
});

// Error handler (must be last)
app.use(errorHandler);

// Start server
const PORT = config.PORT;

app.listen(PORT, () => {
  logger.info(`API server running on http://localhost:${PORT}`);
  logger.info(`Environment: ${config.NODE_ENV}`);
  logger.info(`API URL: ${config.API_URL}`);
});
