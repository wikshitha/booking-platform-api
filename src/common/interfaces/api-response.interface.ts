export interface ApiSuccessResponse<T> {
  success: true;
  message: string;
  data: T;
  timestamp: string;
  path: string;
}

export interface ApiErrorDetail {
  field?: string;
  message: string;
}

export interface ApiErrorResponse {
  success: false;
  statusCode: number;
  message: string;
  errors?: ApiErrorDetail[] | string[];
  timestamp: string;
  path: string;
}