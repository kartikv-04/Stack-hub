import type { Request, Response, NextFunction, RequestHandler } from "express";

type AsyncHandlerFn = (req: Request, res: Response, next: NextFunction) => Promise<any>;


export const asyncHandler = (fn: AsyncHandlerFn): RequestHandler => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};
