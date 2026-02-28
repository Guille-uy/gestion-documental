export class AppError extends Error {
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
        this.message = message;
        this.name = "AppError";
    }
}
export class ValidationError extends AppError {
    constructor(message) {
        super(400, message);
        this.name = "ValidationError";
    }
}
export class AuthenticationError extends AppError {
    constructor(message = "Authentication failed") {
        super(401, message);
        this.name = "AuthenticationError";
    }
}
export class AuthorizationError extends AppError {
    constructor(message = "Access denied") {
        super(403, message);
        this.name = "AuthorizationError";
    }
}
export class NotFoundError extends AppError {
    constructor(message = "Resource not found") {
        super(404, message);
        this.name = "NotFoundError";
    }
}
export class ConflictError extends AppError {
    constructor(message = "Resource already exists") {
        super(409, message);
        this.name = "ConflictError";
    }
}
//# sourceMappingURL=errors.js.map