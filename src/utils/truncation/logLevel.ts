
/**
 * Log level configuration for truncation detection
 */
export enum LogLevel {
  NONE = 0,
  ERROR = 1,
  WARN = 2,
  INFO = 3,
  DEBUG = 4
}

// Current log level - can be adjusted at runtime
let currentLogLevel = LogLevel.WARN;

/**
 * Set the log level for truncation detection
 * @param level The log level to set
 */
export const setTruncationLogLevel = (level: LogLevel) => {
  currentLogLevel = level;
};

/**
 * Get the current log level for truncation detection
 * @returns The current log level
 */
export const getTruncationLogLevel = (): LogLevel => {
  return currentLogLevel;
};

/**
 * Internal logging function for truncation detection
 * @param level Log level
 * @param message Message to log
 * @param details Additional details for debugging
 */
export const logTruncation = (level: LogLevel, message: string, details?: any) => {
  if (level <= currentLogLevel) {
    const prefix = `[TruncationDetect ${LogLevel[level]}]`;
    
    if (details) {
      console.log(prefix, message, details);
    } else {
      console.log(prefix, message);
    }
  }
};
