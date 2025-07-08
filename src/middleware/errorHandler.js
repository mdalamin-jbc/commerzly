/**
 * Global error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Default error response
  let statusCode = 500;
  let error = 'server_error';
  let errorDescription = 'Internal server error';

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    error = 'invalid_request';
    errorDescription = err.message;
  } else if (err.name === 'UnauthorizedError') {
    statusCode = 401;
    error = 'invalid_token';
    errorDescription = 'Invalid or expired token';
  } else if (err.name === 'ForbiddenError') {
    statusCode = 403;
    error = 'access_denied';
    errorDescription = err.message;
  } else if (err.name === 'NotFoundError') {
    statusCode = 404;
    error = 'not_found';
    errorDescription = err.message;
  } else if (err.name === 'RateLimitError') {
    statusCode = 429;
    error = 'rate_limit_exceeded';
    errorDescription = 'Too many requests';
  }

  // OAuth 2.0 error response format
  const response = {
    error,
    error_description: errorDescription
  };

  // Add additional info in development
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
    response.path = req.path;
    response.method = req.method;
  }

  res.status(statusCode).json(response);
};

/**
 * Custom error classes
 */
class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
  }
}

class UnauthorizedError extends Error {
  constructor(message = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

class ForbiddenError extends Error {
  constructor(message = 'Access denied') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

class NotFoundError extends Error {
  constructor(message = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

class RateLimitError extends Error {
  constructor(message = 'Rate limit exceeded') {
    super(message);
    this.name = 'RateLimitError';
  }
}

module.exports = {
  errorHandler,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  RateLimitError
}; 