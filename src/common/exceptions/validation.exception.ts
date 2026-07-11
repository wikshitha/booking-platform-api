import { BadRequestException } from '@nestjs/common';

import { ApiErrorDetail } from '../interfaces/api-response.interface';

export class ValidationException extends BadRequestException {
  constructor(public readonly validationErrors: ApiErrorDetail[]) {
    super('Validation failed');
  }
}