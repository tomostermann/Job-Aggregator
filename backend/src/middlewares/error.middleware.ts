import { Request, Response, NextFunction } from "express";

export const errorMiddleware = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  const isProd = process.env.NODE_ENV === "production";

  res.status(500).json({
    message: isProd ? "Internal server error" : err.message,
  });
};
