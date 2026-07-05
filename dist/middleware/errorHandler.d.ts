import { Request, Response, NextFunction } from 'express';
interface BodyParseError extends Error {
    type?: string;
    status?: number;
}
export declare function errorHandler(err: BodyParseError, req: Request, res: Response, next: NextFunction): void;
export {};
//# sourceMappingURL=errorHandler.d.ts.map