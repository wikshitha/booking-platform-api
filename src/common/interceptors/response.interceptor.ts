import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Request } from 'express';
import { Observable, map } from 'rxjs';

import { ApiSuccessResponse } from '../interfaces/api-response.interface';

type ServiceResponse<T> = {
  message?: string;
  data?: T;
};

@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T | ServiceResponse<T>, ApiSuccessResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler<T | ServiceResponse<T>>,
  ): Observable<ApiSuccessResponse<T>> {
    const request = context.switchToHttp().getRequest<Request>();

    return next.handle().pipe(
      map((response) => {
        const isStructuredResponse =
          response !== null &&
          typeof response === 'object' &&
          ('message' in response || 'data' in response);

        const structuredResponse = isStructuredResponse
          ? (response as ServiceResponse<T>)
          : undefined;

        return {
          success: true,
          message:
            structuredResponse?.message ??
            'Request completed successfully',
          data:
            structuredResponse && 'data' in structuredResponse
              ? (structuredResponse.data as T)
              : (response as T),
          timestamp: new Date().toISOString(),
          path: request.originalUrl ?? request.url,
        };
      }),
    );
  }
}