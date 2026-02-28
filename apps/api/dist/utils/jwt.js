import jwt from "jsonwebtoken";
import { config } from "../config.js";
export function generateAccessToken(payload) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return jwt.sign(payload, config.JWT_SECRET, {
        expiresIn: config.JWT_EXPIRY,
    });
}
export function generateRefreshToken(payload) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return jwt.sign(payload, config.JWT_REFRESH_SECRET, {
        expiresIn: config.JWT_REFRESH_EXPIRY,
    });
}
export function verifyAccessToken(token) {
    try {
        return jwt.verify(token, config.JWT_SECRET);
    }
    catch {
        return null;
    }
}
export function verifyRefreshToken(token) {
    try {
        return jwt.verify(token, config.JWT_REFRESH_SECRET);
    }
    catch {
        return null;
    }
}
//# sourceMappingURL=jwt.js.map