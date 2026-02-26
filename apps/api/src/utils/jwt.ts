import jwt from "jsonwebtoken";
import { config } from "../config.js";

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

export function generateAccessToken(payload: JwtPayload): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return jwt.sign(payload, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRY as any,
  });
}

export function generateRefreshToken(payload: JwtPayload): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return jwt.sign(payload, config.JWT_REFRESH_SECRET, {
    expiresIn: config.JWT_REFRESH_EXPIRY as any,
  });
}

export function verifyAccessToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, config.JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, config.JWT_REFRESH_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}
