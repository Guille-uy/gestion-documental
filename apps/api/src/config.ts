import dotenv from "dotenv";

dotenv.config();

export const config = {
  // Server
  PORT: parseInt(process.env.PORT || "3001"),
  NODE_ENV: process.env.NODE_ENV || "development",
  API_URL: process.env.API_URL || "http://localhost:3001",

  // Database
  DATABASE_URL: process.env.DATABASE_URL || "",

  // JWT
  JWT_SECRET: process.env.JWT_SECRET || "dev-secret-key",
  JWT_EXPIRY: process.env.JWT_EXPIRY || "24h",
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || "dev-refresh-secret",
  JWT_REFRESH_EXPIRY: process.env.JWT_REFRESH_EXPIRY || "7d",

  // Google Drive
  GOOGLE_APPLICATION_CREDENTIALS:
    process.env.GOOGLE_APPLICATION_CREDENTIALS || "./credentials-sa.json",
  GOOGLE_DRIVE_FOLDER_ID: process.env.GOOGLE_DRIVE_FOLDER_ID || "",

  // CORS — acepta CORS_ORIGIN (lista separada por comas) o FRONTEND_URL como fallback
  CORS_ORIGIN: (process.env.CORS_ORIGIN || process.env.FRONTEND_URL || "http://localhost:5173").split(","),

  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || "debug",

  // Email (Optional)
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: parseInt(process.env.SMTP_PORT || "587"),
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASSWORD: process.env.SMTP_PASSWORD,
  SMTP_FROM: process.env.NOTIFICATION_EMAIL_FROM || "noreply@dms.local",
};

export default config;
