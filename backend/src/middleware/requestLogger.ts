import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const startTime = Date.now();

  res.on('finish', () => {
    const durationMs = Date.now() - startTime;
    // Log path only — req.originalUrl includes the query string, which can
    // leak tokens or PHI if a caller ever passes them as query params.
    logger.request(req.method, req.path, res.statusCode, durationMs);
  });

  next();
};
