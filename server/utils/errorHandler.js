/**
 * Error Handler Module
 * 
 * This module provides centralized error handling for the voting system,
 * including custom error classes, logging, and appropriate responses.
 */

const logger = require('./logger');

/**
 * Base error class for application-specific errors
 */
class AppError extends Error {
  constructor(message, statusCode, errorCode) {
    super(message);
    this.statusCode = statusCode || 500;
    this.errorCode = errorCode || 'INTERNAL_ERROR';
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Authentication error class
 */
class AuthenticationError extends AppError {
  constructor(message) {
    super(message || 'Authentication failed', 401, 'AUTH_FAILED');
  }
}

/**
 * Authorization error class
 */
class AuthorizationError extends AppError {
  constructor(message) {
    super(message || 'Not authorized to access this resource', 403, 'ACCESS_DENIED');
  }
}

/**
 * Validation error class
 */
class ValidationError extends AppError {
  constructor(message, validationErrors) {
    super(message || 'Validation failed', 400, 'VALIDATION_FAILED');
    this.validationErrors = validationErrors || [];
  }
}

/**
 * Biometric verification error class
 */
class BiometricVerificationError extends AppError {
  constructor(message, details) {
    super(message || 'Biometric verification failed', 400, 'BIOMETRIC_FAILED');
    this.details = details || {};
  }
}

/**
 * Fraud detection error class
 */
class FraudDetectionError extends AppError {
  constructor(message, details) {
    super(message || 'Potential fraud detected', 403, 'FRAUD_DETECTED');
    this.details = details || {};
  }
}

/**
 * Global error handler middleware for Express
 * @param {Error} err - The error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function globalErrorHandler(err, req, res, next) {
  // Default status code and error message
  let statusCode = err.statusCode || 500;
  let errorCode = err.errorCode || 'INTERNAL_ERROR';
  let message = err.message || 'Something went wrong';
  let details = err.details || {};
  
  // Log the error
  if (statusCode >= 500) {
    logger.error(`[${errorCode}] ${message}`, {
      error: err.stack,
      path: req.path,
      method: req.method,
      ip: req.ip,
      userId: req.user ? req.user.id : 'unauthenticated'
    });
  } else {
    logger.warn(`[${errorCode}] ${message}`, {
      path: req.path,
      method: req.method,
      ip: req.ip,
      userId: req.user ? req.user.id : 'unauthenticated'
    });
  }
  
  // Handle validation errors
  if (err instanceof ValidationError) {
    details = {
      validationErrors: err.validationErrors
    };
  }
  
  // Handle biometric errors
  if (err instanceof BiometricVerificationError) {
    // Add specific handling for biometric errors
    details = {
      ...details,
      biometricType: details.biometricType || 'unknown',
      retryAllowed: details.retryAllowed !== false
    };
  }
  
  // Handle fraud detection errors
  if (err instanceof FraudDetectionError) {
    // Add specific handling for fraud detection errors
    details = {
      ...details,
      fraudType: details.fraudType || 'unknown',
      riskLevel: details.riskLevel || 'high',
      actionRequired: details.actionRequired || 'review'
    };
  }
  
  // Send response
  res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message: message,
      details: details
    }
  });
}

/**
 * Async error handler wrapper for Express route handlers
 * @param {Function} fn - The async route handler function
 * @returns {Function} - Wrapped function that catches async errors
 */
function catchAsync(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Handle specific types of errors with appropriate responses
 * @param {Error} err - The error object
 * @returns {Object} - Formatted error response
 */
function handleSpecificErrors(err) {
  // Handle specific error types
  if (err.name === 'JsonWebTokenError') {
    return new AuthenticationError('Invalid token. Please log in again.');
  }
  
  if (err.name === 'TokenExpiredError') {
    return new AuthenticationError('Your token has expired. Please log in again.');
  }
  
  if (err.code === 11000) {
    // MongoDB duplicate key error
    const field = Object.keys(err.keyValue)[0];
    return new ValidationError(`Duplicate field value: ${field}. Please use another value.`);
  }
  
  if (err.name === 'ValidationError') {
    // Mongoose validation error
    const errors = Object.values(err.errors).map(val => val.message);
    return new ValidationError('Invalid input data.', errors);
  }
  
  return err;
}

/**
 * Create a standardized error response
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @param {string} errorCode - Application-specific error code
 * @param {Object} details - Additional error details
 * @returns {Object} - Formatted error response
 */
function createErrorResponse(message, statusCode = 500, errorCode = 'INTERNAL_ERROR', details = {}) {
  return {
    success: false,
    error: {
      code: errorCode,
      message: message,
      details: details
    }
  };
}

module.exports = {
  AppError,
  AuthenticationError,
  AuthorizationError,
  ValidationError,
  BiometricVerificationError,
  FraudDetectionError,
  globalErrorHandler,
  catchAsync,
  handleSpecificErrors,
  createErrorResponse
};
