export interface JwtPayload {
    userId: string;
    email: string;
    role: string;
    area?: string | null;
}
export declare function generateAccessToken(payload: JwtPayload): string;
export declare function generateRefreshToken(payload: JwtPayload): string;
export declare function verifyAccessToken(token: string): JwtPayload | null;
export declare function verifyRefreshToken(token: string): JwtPayload | null;
//# sourceMappingURL=jwt.d.ts.map