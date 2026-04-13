import { randomUUID } from "node:crypto";
import { NextFunction, Request, Response } from "express";

export function correlationIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const headerValue = req.header("x-correlation-id");
  const requestId = headerValue?.trim() ? headerValue : randomUUID();
  (req as Request & { requestId?: string }).requestId = requestId;
  res.setHeader("x-correlation-id", requestId);
  next();
}

