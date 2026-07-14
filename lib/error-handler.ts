/**
 * Utility to normalize errors into user-friendly English messages.
 * This ensures that obscure database/API errors are not shown directly to users.
 */

interface SupabaseError extends Error {
  code?: string;
  details?: string;
  hint?: string;
}

export function parseError(err: unknown, fallbackMessage = 'Something went wrong. Please try again later.'): string {
  if (!err) return fallbackMessage;

  // Handle standard JS Errors or Supabase Errors
  if (err instanceof Error || (typeof err === 'object' && err !== null && 'message' in err)) {
    const error = err as SupabaseError;
    const message = error.message.toLowerCase();

    // 1. Network / Connection Errors
    if (message.includes('fetch failed') || message.includes('network error') || message.includes('load failed')) {
      return 'Network connection is unstable. Please check your internet and try again.';
    }

    // 2. Supabase / PostgreSQL specific codes
    if (error.code) {
      switch (error.code) {
        case '23505': // unique_violation
          return 'This record already exists. Please try a different one.';
        case '23503': // foreign_key_violation
          return 'Action failed because the related record no longer exists or your session expired.';
        case '23502': // not_null_violation
          return 'Please fill in all the required fields.';
        case '42501': // insufficient_privilege (RLS)
          return 'You do not have permission to perform this action. You might be signed out.';
        case '23514': // check_violation
          return 'The information provided is invalid.';
      }
    }

    // 3. Auth Errors
    if (message.includes('jwt expired') || message.includes('not authenticated') || message.includes('unauthorized')) {
      return 'Your session has expired. Please refresh the page or log in again.';
    }
    if (message.includes('invalid login credentials')) {
      return 'Invalid email or password. Please try again.';
    }

    // 4. File Upload Edge Cases
    if (message.includes('body size limit exceeded') || message.includes('payload too large')) {
      return 'The file is too large. Please upload a smaller image.';
    }
    if (message.includes('mime type not supported')) {
      return 'This file type is not supported. Please upload a valid image (JPEG, PNG).';
    }

    // Default to the original message if it's somewhat safe, otherwise fallback
    // We can choose to return error.message directly if we assume some are safe,
    // but to be extremely fault tolerant and friendly, we return a generic message
    // unless it's a known safe custom error thrown by our app.
    if (
      message.includes('comment cannot be empty') || 
      message.includes('entry not found') ||
      message.includes('unauthorized') ||
      message.includes('image violates') ||
      message.includes('could not upload image')
    ) {
      return error.message; // Let our custom app errors pass through
    }

    return fallbackMessage;
  }

  // Handle strings
  if (typeof err === 'string') {
    return err;
  }

  return fallbackMessage;
}
