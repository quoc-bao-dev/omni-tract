import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

/**
 * Chuẩn hoá lỗi không lường (ARCHITECTURE §8): HttpException giữ nguyên, còn lại → 500
 * không lộ stack ra client. Lưu ý: lỗi per-URL nằm trong `results[].ok=false`, không tới đây.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    const isHttp = exception instanceof HttpException;
    const status = isHttp ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    if (!isHttp) {
      this.logger.error(`Unhandled: ${req.method} ${req.url}`, (exception as Error)?.stack);
    }

    const payload = isHttp
      ? exception.getResponse()
      : { statusCode: status, error: 'Internal Server Error' };

    res
      .status(status)
      .json(typeof payload === 'string' ? { statusCode: status, message: payload } : payload);
  }
}
