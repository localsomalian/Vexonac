/**
 * API response wrapper interface
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: Date;
}

/**
 * Pagination interface
 */
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

/**
 * Paginated response interface
 */
export interface PaginatedResponse<T = unknown> extends ApiResponse<T[]> {
  pagination: Pagination;
}

/**
 * Environment types
 */
export enum Environment {
  DEVELOPMENT = "development",
  STAGING = "staging",
  PRODUCTION = "production",
}

/**
 * Log levels
 */
export enum LogLevel {
  DEBUG = "debug",
  INFO = "info",
  WARN = "warn",
  ERROR = "error",
}

/**
 * Generic error interface
 */
export interface AppError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  stack?: string;
}
