import { Request, Response, NextFunction } from "express";
export declare function errorHandler(error: Error, req: Request, res: Response, next: NextFunction): Response<any, Record<string, any>> | undefined;
export declare function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>): (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=error.d.ts.map