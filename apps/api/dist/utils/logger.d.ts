export declare enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3
}
export declare const logger: {
    debug: (message: string, context?: Record<string, any>) => void;
    info: (message: string, context?: Record<string, any>) => void;
    warn: (message: string, context?: Record<string, any>) => void;
    error: (message: string, context?: Record<string, any>) => void;
};
//# sourceMappingURL=logger.d.ts.map