import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus
} from "@nestjs/common";
import { Request, Response } from "express";

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request & { requestId?: string }>();
    const timestamp = new Date().toISOString();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      const message =
        typeof exceptionResponse === "string"
          ? exceptionResponse
          : (exceptionResponse as { message?: string | string[] }).message ??
            exception.message;
      const details =
        typeof exceptionResponse === "object"
          ? (exceptionResponse as Record<string, unknown>)
          : undefined;

      response.status(status).json({
        error: {
          code: status,
          message,
          details
        },
        meta: {
          requestId: request.requestId,
          timestamp,
          path: request.url
        }
      });
      return;
    }

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      error: {
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        message: "Internal server error"
      },
      meta: {
        requestId: request.requestId,
        timestamp,
        path: request.url
      }
    });
  }
}

