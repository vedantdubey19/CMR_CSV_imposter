import { Request, Response, NextFunction } from "express";
import multer from "multer";
import { logger } from "../utils/logger";

/**
 * Custom operational HTTP Error.
 */
export class HttpError extends Error {
  public status: number;
  
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Express error-handling middleware.
 */
export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  logger.error("Error encountered in request lifecycle:", err.message || err);

  // Handle Multer limits and configurations
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ error: "File size exceeds the 200MB limit" });
    }
    return res.status(400).json({ error: `Upload error: ${err.code} - ${err.message}` });
  }

  // Handle custom upload filter errors
  if (err.message === "Only CSV files are allowed") {
    return res.status(400).json({ error: err.message });
  }

  // Handle custom HTTP operational errors
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message });
  }

  // Handle unexpected generic server exceptions
  const status = err.status || 500;
  const message = status === 500 
    ? "An unexpected internal server error occurred" 
    : err.message;

  return res.status(status).json({ error: message });
}
