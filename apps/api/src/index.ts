import "express-async-errors";
import express, { Request, Response, NextFunction } from "express";
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

// Manual CORS middleware — allows any origin while supporting credentials
app.use((req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin as string | undefined;
  // Always reflect the Origin back (required when credentials: true)
  res.setHeader("Access-Control-Allow-Origin", origin || "*");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.setHeader("Vary", "Origin");
  // Handle preflight
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }
  next();
});

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
