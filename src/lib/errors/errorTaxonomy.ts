export type ErrorCode =
  | 'AUTH_REQUIRED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'CONNECTION_REQUIRED'
  | 'TOKEN_EXPIRED'
  | 'AI_PROVIDER_ERROR'
  | 'RATE_LIMITED'
  | 'TOOL_FAILED'
  | 'APPROVAL_REQUIRED'
  | 'APPROVAL_EXPIRED'
  | 'JOB_FAILED'
  | 'EXTERNAL_ACTION_UNCERTAIN'
  | 'STORAGE_ERROR'
  | 'CIRCUIT_OPEN'
  | 'UNKNOWN';

export interface AppErrorResponse {
  success: false;
  errorCode: ErrorCode;
  message: string;
  userActionMessage: string;
  retryable: boolean;
  correlationId?: string;
}

const USER_FRIENDLY_MESSAGES: Record<ErrorCode, string> = {
  AUTH_REQUIRED: 'Please log in to continue.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  NOT_FOUND: 'The requested item could not be found.',
  VALIDATION_ERROR: 'Please check your inputs and try again.',
  CONNECTION_REQUIRED: 'This action requires an active service connection. Please connect it in Settings.',
  TOKEN_EXPIRED: 'Your session or connection has expired. Please reconnect.',
  AI_PROVIDER_ERROR: 'The AI service is momentarily busy. Please try again in a few moments.',
  RATE_LIMITED: 'Action limit reached. Please wait a moment before trying again.',
  TOOL_FAILED: 'Could not complete the requested tool action safely.',
  APPROVAL_REQUIRED: 'This sensitive action requires your explicit approval.',
  APPROVAL_EXPIRED: 'This action approval request has expired. Please request again.',
  JOB_FAILED: 'Background task encountered an issue.',
  EXTERNAL_ACTION_UNCERTAIN: 'The external service did not confirm completion. Please check status before retrying.',
  STORAGE_ERROR: 'File operation could not be completed.',
  CIRCUIT_OPEN: 'Service is temporarily degraded for protection. Retrying shortly.',
  UNKNOWN: 'An unexpected issue occurred. Please try again.'
};

export class AppError extends Error {
  public errorCode: ErrorCode;
  public userActionMessage: string;
  public retryable: boolean;
  public statusCode: number;

  constructor(
    errorCode: ErrorCode,
    technicalMessage?: string,
    options?: { userMessage?: string; retryable?: boolean; statusCode?: number }
  ) {
    super(technicalMessage || USER_FRIENDLY_MESSAGES[errorCode]);
    this.name = 'AppError';
    this.errorCode = errorCode;
    this.userActionMessage = options?.userMessage || USER_FRIENDLY_MESSAGES[errorCode];
    this.retryable = options?.retryable ?? false;
    this.statusCode = options?.statusCode || (errorCode === 'AUTH_REQUIRED' ? 401 : errorCode === 'FORBIDDEN' ? 403 : errorCode === 'NOT_FOUND' ? 404 : errorCode === 'RATE_LIMITED' ? 429 : 500);
  }

  public toResponse(correlationId?: string): AppErrorResponse {
    return {
      success: false,
      errorCode: this.errorCode,
      message: this.userActionMessage,
      userActionMessage: this.userActionMessage,
      retryable: this.retryable,
      correlationId
    };
  }
}

/**
 * Converts any unknown error into a sanitized AppErrorResponse.
 */
export function formatErrorResponse(err: unknown, correlationId?: string): AppErrorResponse {
  if (err instanceof AppError) {
    return err.toResponse(correlationId);
  }

  const message = err instanceof Error ? err.message : String(err);
  
  // Detect common error patterns
  if (message.includes('auth') || message.includes('unauthorized') || message.includes('JWT')) {
    return new AppError('AUTH_REQUIRED', message).toResponse(correlationId);
  }
  if (message.includes('rate') || message.includes('429')) {
    return new AppError('RATE_LIMITED', message, { retryable: true, statusCode: 429 }).toResponse(correlationId);
  }
  if (message.includes('not found') || message.includes('PGRST116')) {
    return new AppError('NOT_FOUND', message, { statusCode: 404 }).toResponse(correlationId);
  }

  return new AppError('UNKNOWN', message).toResponse(correlationId);
}
