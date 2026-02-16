import { Request, Response, NextFunction } from 'express';

export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const start = Date.now();

  // Log after response is sent
  res.on('finish', () => {
    const duration = Date.now() - start;
    const { method, originalUrl, ip } = req;
    const { statusCode } = res;

    console.log(
      `[${new Date().toISOString()}] ${method} ${originalUrl} ${statusCode} - ${duration}ms - ${ip}`
    );
  });

  next();
};
