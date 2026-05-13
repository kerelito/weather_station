import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env";
import { AppError } from "../utils/errors";

export function requireApiKey(request: Request, _response: Response, next: NextFunction) {
  const headerKey = request.header("x-api-key");
  const bearerKey = request.header("authorization")?.replace(/^Bearer\s+/i, "");
  const token = headerKey ?? bearerKey;

  if (!token) {
    return next(new AppError("Missing API key.", 401));
  }

  if (token !== env.API_KEY) {
    return next(new AppError("Invalid API key.", 403));
  }

  return next();
}
