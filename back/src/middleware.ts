import { NextFunction, Request, Response } from 'express';
import { Injectable, Logger, NestMiddleware } from '@nestjs/common';

@Injectable()
export class AppLoggerMiddleware implements NestMiddleware {
  private logger = new Logger('HTTP');

  use(request: Request, response: Response, next: NextFunction): void {
    const { ip, method, baseUrl } = request;
    const userAgent = (request.get('user-agent') || '').replace(/[\r\n]/g, ' ').slice(0, 256);

    this.logger.log(`${method} ${baseUrl} - ${userAgent} ${ip}`);

    response.on('close', () => {
      const { statusCode } = response;
      const contentLength = response.get('content-length');

      this.logger.log(`${statusCode} ${contentLength}`);
    });

    next();
  }
}
