import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt.js";
import { AuthenticationError } from "../utils/errors.js";
import { logger } from "../utils/logger.js";

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

export function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    logger.warn("Missing or invalid authorization header");
    throw new AuthenticationError("Missing or invalid authorization header");
  }

  const token = authHeader.substring(7);
  const payload = verifyAccessToken(token);

  if (!payload) {
    logger.warn("Invalid token", { token: token.substring(0, 10) });
    throw new AuthenticationError("Invalid or expired token");
  }

  req.user = payload;
  next();
}

export function authorizationMiddleware(allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AuthenticationError("User not authenticated");
    }

    if (!allowedRoles.includes(req.user.role)) {
      logger.warn("Unauthorized access attempt", {
        userId: req.user.userId,
        role: req.user.role,
        allowedRoles,
      });
      throw new AuthenticationError("Insufficient permissions");
    }

    next();
  };
}
