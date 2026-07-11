import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

import { Prisma } from '../../generated/prisma/client';
import { ValidationException } from '../exceptions/validation.exception';
import {
  ApiErrorResponse,
} from '../interfaces/api-response.interface';

type NestExceptionResponse = {
  statusCode?: number;
  message?: string | string[];
  error?: string;
};

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();
    const path = request.originalUrl ?? request.url;

    const errorResponse = this.buildErrorResponse(exception, path);

    if (errorResponse.statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `${request.method} ${path}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response.status(errorResponse.statusCode).json(errorResponse);
  }

  private buildErrorResponse(
    exception: unknown,
    path: string,
  ): ApiErrorResponse {
    if (exception instanceof ValidationException) {
      return this.createErrorResponse(
        HttpStatus.BAD_REQUEST,
        'Validation failed',
        path,
        exception.validationErrors,
      );
    }

    if (exception instanceof HttpException) {
      return this.handleHttpException(exception, path);
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      return this.handlePrismaKnownError(exception, path);
    }

    if (exception instanceof Prisma.PrismaClientValidationError) {
      return this.createErrorResponse(
        HttpStatus.BAD_REQUEST,
        'Invalid database request',
        path,
      );
    }

    if (exception instanceof Prisma.PrismaClientInitializationError) {
      return this.createErrorResponse(
        HttpStatus.SERVICE_UNAVAILABLE,
        'Database service is unavailable',
        path,
      );
    }

    return this.createErrorResponse(
      HttpStatus.INTERNAL_SERVER_ERROR,
      'An unexpected internal server error occurred',
      path,
    );
  }

  private handleHttpException(
    exception: HttpException,
    path: string,
  ): ApiErrorResponse {
    const statusCode = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    if (typeof exceptionResponse === 'string') {
      return this.createErrorResponse(
        statusCode,
        exceptionResponse,
        path,
      );
    }

    const responseObject = exceptionResponse as NestExceptionResponse;
    const responseMessage = responseObject.message;

    if (Array.isArray(responseMessage)) {
      return this.createErrorResponse(
        statusCode,
        'Request validation failed',
        path,
        responseMessage,
      );
    }

    return this.createErrorResponse(
      statusCode,
      responseMessage ?? exception.message,
      path,
    );
  }

  private handlePrismaKnownError(
    exception: Prisma.PrismaClientKnownRequestError,
    path: string,
  ): ApiErrorResponse {
    switch (exception.code) {
      case 'P2002':
        return this.createErrorResponse(
          HttpStatus.CONFLICT,
          'A record with the same unique value already exists',
          path,
        );

      case 'P2003':
        return this.createErrorResponse(
          HttpStatus.BAD_REQUEST,
          'The request references a related record that does not exist',
          path,
        );

      case 'P2025':
        return this.createErrorResponse(
          HttpStatus.NOT_FOUND,
          'The requested record was not found',
          path,
        );

      default:
        return this.createErrorResponse(
          HttpStatus.INTERNAL_SERVER_ERROR,
          'A database operation failed',
          path,
        );
    }
  }

  private createErrorResponse(
    statusCode: number,
    message: string,
    path: string,
    errors?: ApiErrorResponse['errors'],
  ): ApiErrorResponse {
    return {
      success: false,
      statusCode,
      message,
      ...(errors && { errors }),
      timestamp: new Date().toISOString(),
      path,
    };
  }
}