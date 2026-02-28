import { Request, Response, NextFunction } from "express";
export interface AuthenticatedRequest extends Request {
    user?: {
        userId: string;
        email: string;
        role: string;
        area?: string | null;
    };
}
export declare function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): void;
export declare function authorizationMiddleware(allowedRoles: string[]): (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
//# sourceMappingURL=auth.d.ts.map