import { AppError } from "../utils/errors.js";
import { logger } from "../utils/logger.js";
import { ZodError } from "zod";
export function errorHandler(error, req, res, next) {
    logger.error("Error occurred", {
        error: error.message,
        path: req.path,
        method: req.method,
    });
    if (error instanceof AppError) {
        return res.status(error.statusCode).json({
            success: false,
            error: error.message,
        });
    }
    if (error instanceof ZodError) {
        return res.status(400).json({
            success: false,
            error: "Validation failed",
            details: error.errors,
        });
    }
    if (error instanceof SyntaxError) {
        return res.status(400).json({
            success: false,
            error: "Invalid JSON",
        });
    }
    // Default error
    res.status(500).json({
        success: false,
        error: "Internal server error",
    });
}
export function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}
//# sourceMappingURL=error.js.map