import { config } from "../config.js";
export var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["DEBUG"] = 0] = "DEBUG";
    LogLevel[LogLevel["INFO"] = 1] = "INFO";
    LogLevel[LogLevel["WARN"] = 2] = "WARN";
    LogLevel[LogLevel["ERROR"] = 3] = "ERROR";
})(LogLevel || (LogLevel = {}));
const levelNames = {
    [LogLevel.DEBUG]: "DEBUG",
    [LogLevel.INFO]: "INFO",
    [LogLevel.WARN]: "WARN",
    [LogLevel.ERROR]: "ERROR",
};
const logLevelMap = {
    debug: LogLevel.DEBUG,
    info: LogLevel.INFO,
    warn: LogLevel.WARN,
    error: LogLevel.ERROR,
};
const currentLogLevel = logLevelMap[config.LOG_LEVEL] || LogLevel.DEBUG;
function log(level, message, context) {
    if (level < currentLogLevel)
        return;
    const timestamp = new Date().toISOString();
    const levelName = levelNames[level];
    const contextStr = context ? JSON.stringify(context) : "";
    console.log(`[${timestamp}] [${levelName}] ${message} ${contextStr}`.trim());
}
export const logger = {
    debug: (message, context) => log(LogLevel.DEBUG, message, context),
    info: (message, context) => log(LogLevel.INFO, message, context),
    warn: (message, context) => log(LogLevel.WARN, message, context),
    error: (message, context) => log(LogLevel.ERROR, message, context),
};
//# sourceMappingURL=logger.js.map