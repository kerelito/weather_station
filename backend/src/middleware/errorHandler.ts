import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../utils/errors";

export function notFoundHandler(request: Request, _response: Response, next: NextFunction) {
  next(new AppError(`Route ${request.method} ${request.originalUrl} was not found.`, 404));
}

export function errorHandler(error: unknown, _request: Request, response: Response, _next: NextFunction) {
  if (error instanceof ZodError) {
    return response.status(400).json({
      error: "ValidationError",
      message: "Request validation failed.",
      details: error.flatten(),
    });
  }

  if (error instanceof AppError) {
    return response.status(error.statusCode).json({
      error: error.name,
      message: error.message,
      details: error.details ?? null,
    });
  }

  console.error(error);

  return response.status(500).json({
    error: "InternalServerError",
    message: "Unexpected server error.",
  });
}
