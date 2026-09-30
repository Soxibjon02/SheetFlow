export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export type ApiErrorCode =
  | 'AUTH_REQUIRED'
  | 'INVALID_CREDENTIALS'
  | 'USER_ALREADY_EXISTS'
  | 'SHEET_NOT_FOUND'
  | 'SHEET_ACCESS_DENIED'
  | 'INVALID_SHEET_URL'
  | 'GOOGLE_OAUTH_FAILED'
  | 'GOOGLE_SYNC_FAILED'
  | 'CALCULATION_ERROR'
  | 'VALIDATION_ERROR'
  | 'RATE_LIMIT_EXCEEDED'
  | 'INTERNAL_SERVER_ERROR';

export function successResponse<T>(data: T): ApiResponse<T> {
  return {
    success: true,
    data,
  };
}

export function errorResponse(code: ApiErrorCode, message: string, details?: any): ApiResponse {
  return {
    success: false,
    error: {
      code,
      message,
      details,
    },
  };
}
