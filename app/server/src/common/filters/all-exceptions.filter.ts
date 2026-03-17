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

		const message = this.extractMessage(payload);

		if (!(exception instanceof HttpException)) {
			this.logger.error(exception);
		}

		response.status(status).json({
			statusCode: status,
			message,
			timestamp: new Date().toISOString(),
			path: request.url,
		});
	}

	private extractMessage(payload: string | object) {
		if (typeof payload === 'string') {
			return payload;
		}

		if ('message' in payload) {
			return payload.message;
		}

		return 'Unexpected error';
	}
}
