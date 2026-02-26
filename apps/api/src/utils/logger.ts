import { config } from "../config.js";

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

const levelNames = {
  [LogLevel.DEBUG]: "DEBUG",
  [LogLevel.INFO]: "INFO",
  [LogLevel.WARN]: "WARN",
  [LogLevel.ERROR]: "ERROR",
};

const logLevelMap: Record<string, LogLevel> = {
  debug: LogLevel.DEBUG,
  info: LogLevel.INFO,
  warn: LogLevel.WARN,
  error: LogLevel.ERROR,
};

const currentLogLevel = logLevelMap[config.LOG_LEVEL] || LogLevel.DEBUG;

function log(level: LogLevel, message: string, context?: Record<string, any>) {
  if (level < currentLogLevel) return;

  const timestamp = new Date().toISOString();
  const levelName = levelNames[level];
  const contextStr = context ? JSON.stringify(context) : "";

  console.log(
    `[${timestamp}] [${levelName}] ${message} ${contextStr}`.trim()
  );
}

export const logger = {
  debug: (message: string, context?: Record<string, any>) =>
    log(LogLevel.DEBUG, message, context),
  info: (message: string, context?: Record<string, any>) =>
    log(LogLevel.INFO, message, context),
  warn: (message: string, context?: Record<string, any>) =>
    log(LogLevel.WARN, message, context),
  error: (message: string, context?: Record<string, any>) =>
    log(LogLevel.ERROR, message, context),
};
