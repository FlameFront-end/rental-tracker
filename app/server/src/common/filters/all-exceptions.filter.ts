import {
  ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const http = host.switchToHttp();
    const response = http.getResponse<Response>();
    const request = http.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const payload =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';
    const responsePayload = this.buildResponsePayload(payload);

    if (!(exception instanceof HttpException)) {
      this.logger.error(exception);
    }

    response.status(status).json({
      ...responsePayload,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }

  private buildResponsePayload(payload: string | object) {
    if (typeof payload === 'string') {
      return {
        message: payload,
      };
    }

    if ('message' in payload) {
      return payload;
    }

    return {
      message: 'Unexpected error',
    };
  }
}
