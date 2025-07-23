/**
 * Logger Module
 * 
 * This module provides logging functionality for the voting system,
 * including different log levels, formatting, and output options.
 */

const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Define console format (more readable for development)
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(
    info => `${info.timestamp} ${info.level}: ${info.message}${info.stack ? '\n' + info.stack : ''}`
  )
);

// Create the logger
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: logFormat,
  defaultMeta: { service: 'voting-system' },
  transports: [
    // Write all logs with level 'error' and below to error.log
    new winston.transports.File({ 
      filename: path.join(logsDir, 'error.log'), 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    // Write all logs with level 'info' and below to combined.log
    new winston.transports.File({ 
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

// If we're not in production, also log to the console
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat
  }));
}

/**
 * Log security-related events
 * @param {string} message - Log message
 * @param {Object} meta - Additional metadata
 */
logger.security = function(message, meta = {}) {
  this.warn(message, { ...meta, logType: 'SECURITY' });
  
  // Also log to a separate security log file
  const securityTransport = new winston.transports.File({ 
    filename: path.join(logsDir, 'security.log'),
    maxsize: 5242880, // 5MB
    maxFiles: 5
  });
  
  securityTransport.log({
    level: 'warn',
    message,
    ...meta,
    logType: 'SECURITY',
    timestamp: new Date().toISOString()
  });
};

/**
 * Log fraud detection events
 * @param {string} message - Log message
 * @param {Object} meta - Additional metadata
 */
logger.fraud = function(message, meta = {}) {
  this.warn(message, { ...meta, logType: 'FRAUD' });
  
  // Also log to a separate fraud log file
  const fraudTransport = new winston.transports.File({ 
    filename: path.join(logsDir, 'fraud.log'),
    maxsize: 5242880, // 5MB
    maxFiles: 5
  });
  
  fraudTransport.log({
    level: 'warn',
    message,
    ...meta,
    logType: 'FRAUD',
    timestamp: new Date().toISOString()
  });
};

/**
 * Log biometric verification events
 * @param {string} message - Log message
 * @param {Object} meta - Additional metadata
 */
logger.biometric = function(message, meta = {}) {
  this.info(message, { ...meta, logType: 'BIOMETRIC' });
  
  // Also log to a separate biometric log file
  const biometricTransport = new winston.transports.File({ 
    filename: path.join(logsDir, 'biometric.log'),
    maxsize: 5242880, // 5MB
    maxFiles: 5
  });
  
  biometricTransport.log({
    level: 'info',
    message,
    ...meta,
    logType: 'BIOMETRIC',
    timestamp: new Date().toISOString()
  });
};

/**
 * Log voting events
 * @param {string} message - Log message
 * @param {Object} meta - Additional metadata
 */
logger.vote = function(message, meta = {}) {
  this.info(message, { ...meta, logType: 'VOTE' });
  
  // Also log to a separate voting log file
  const voteTransport = new winston.transports.File({ 
    filename: path.join(logsDir, 'voting.log'),
    maxsize: 5242880, // 5MB
    maxFiles: 5
  });
  
  voteTransport.log({
    level: 'info',
    message,
    ...meta,
    logType: 'VOTE',
    timestamp: new Date().toISOString()
  });
};

/**
 * Log performance metrics
 * @param {string} message - Log message
 * @param {Object} meta - Additional metadata
 */
logger.performance = function(message, meta = {}) {
  this.debug(message, { ...meta, logType: 'PERFORMANCE' });
  
  // Also log to a separate performance log file
  const performanceTransport = new winston.transports.File({ 
    filename: path.join(logsDir, 'performance.log'),
    maxsize: 5242880, // 5MB
    maxFiles: 5
  });
  
  performanceTransport.log({
    level: 'debug',
    message,
    ...meta,
    logType: 'PERFORMANCE',
    timestamp: new Date().toISOString()
  });
};

module.exports = logger;
