/**
 * Centralized Error Handling for RepostAI
 *
 * Provides consistent error handling, logging, and user-friendly
 * error messages across the application.
 */

import { NextResponse } from "next/server";

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 400, "VALIDATION_ERROR", details);
    this.name = "ValidationError";
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = "Authentication required") {
    super(message, 401, "AUTH_ERROR");
    this.name = "AuthenticationError";
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = "Rate limit exceeded", details?: unknown) {
    super(message, 429, "RATE_LIMIT_ERROR", details);
    this.name = "RateLimitError";
  }
}

export class QuotaExceededError extends AppError {
  constructor(message: string = "Usage quota exceeded", details?: unknown) {
    super(message, 403, "QUOTA_EXCEEDED", details);
    this.name = "QuotaExceededError";
  }
}

export class AIServiceError extends AppError {
  constructor(message: string = "AI service error", details?: unknown) {
    super(message, 503, "AI_SERVICE_ERROR", details);
    this.name = "AIServiceError";
  }
}

/**
 * Format error for API response
 */
export function formatErrorResponse(error: unknown) {
  if (error instanceof AppError) {
    return {
      error: error.message,
      code: error.code,
      details: error.details,
      statusCode: error.statusCode,
    };
  }

  if (error instanceof Error) {
    // Generic error - don't expose internal details in production
    const isProduction = process.env.NODE_ENV === "production";

    return {
      error: isProduction ? "Internal server error" : error.message,
      code: "INTERNAL_ERROR",
      statusCode: 500,
    };
  }

  return {
    error: "Unknown error occurred",
    code: "UNKNOWN_ERROR",
    statusCode: 500,
  };
}

/**
 * Create NextResponse from error
 */
export function createErrorResponse(error: unknown) {
  const formatted = formatErrorResponse(error);

  return NextResponse.json(
    {
      error: formatted.error,
      code: formatted.code,
      ...(formatted.details && { details: formatted.details }),
    },
    { status: formatted.statusCode }
  );
}

/**
 * Log error with context
 */
export function logError(error: unknown, context?: Record<string, unknown>) {
  const timestamp = new Date().toISOString();

  if (error instanceof AppError) {
    console.error(
      `[${timestamp}] [${error.name}] ${error.message}`,
      {
        code: error.code,
        statusCode: error.statusCode,
        details: error.details,
        ...context,
      }
    );
  } else if (error instanceof Error) {
    console.error(
      `[${timestamp}] [Error] ${error.message}`,
      {
        stack: error.stack,
        ...context,
      }
    );
  } else {
    console.error(
      `[${timestamp}] [Unknown Error]`,
      { error, ...context }
    );
  }
}

/**
 * Async error wrapper for API routes
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<NextResponse>>(
  handler: T
): T {
  return (async (...args: any[]) => {
    try {
      return await handler(...args);
    } catch (error) {
      logError(error, {
        handler: handler.name,
        args: args.length,
      });

      return createErrorResponse(error);
    }
  }) as T;
}

/**
 * Validate required fields
 */
export function validateRequired(
  data: Record<string, unknown>,
  requiredFields: string[]
): void {
  const missing = requiredFields.filter((field) => !data[field]);

  if (missing.length > 0) {
    throw new ValidationError(
      `Missing required fields: ${missing.join(", ")}`,
      { missingFields: missing }
    );
  }
}

/**
 * Validate string length
 */
export function validateLength(
  value: string,
  minLength: number,
  maxLength: number,
  fieldName: string = "field"
): void {
  if (value.length < minLength) {
    throw new ValidationError(
      `${fieldName} must be at least ${minLength} characters`,
      { fieldName, actualLength: value.length, minLength }
    );
  }

  if (value.length > maxLength) {
    throw new ValidationError(
      `${fieldName} must be at most ${maxLength} characters`,
      { fieldName, actualLength: value.length, maxLength }
    );
  }
}

/**
 * Safely parse JSON
 */
export function safeJSONParse<T = unknown>(
  json: string,
  fallback: T
): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}
