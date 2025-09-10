import fs from 'fs';
import path from 'path';

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  metadata?: any;
  service?: string;
  requestId?: string;
}

export class Logger {
  private logFilePath: string;
  private minLevel: LogLevel;
  private service: string;

  constructor(
    logFilePath: string = './logs/mcp-server.log',
    minLevel: LogLevel = 'INFO',
    service: string = 'mcp-server'
  ) {
    this.logFilePath = logFilePath;
    this.minLevel = minLevel;
    this.service = service;
    
    // Ensure logs directory exists
    const logDir = path.dirname(this.logFilePath);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  /**
   * Log an info message
   * @param message Message to log
   * @param metadata Additional metadata
   * @param requestId Request ID for tracing
   */
  public info(message: string, metadata?: any, requestId?: string): void {
    this.log('INFO', message, metadata, requestId);
  }

  /**
   * Log a warning message
   * @param message Message to log
   * @param metadata Additional metadata
   * @param requestId Request ID for tracing
   */
  public warn(message: string, metadata?: any, requestId?: string): void {
    this.log('WARN', message, metadata, requestId);
  }

  /**
   * Log an error message
   * @param message Message to log
   * @param metadata Additional metadata
   * @param requestId Request ID for tracing
   */
  public error(message: string, metadata?: any, requestId?: string): void {
    this.log('ERROR', message, metadata, requestId);
  }

  /**
   * Log a debug message
   * @param message Message to log
   * @param metadata Additional metadata
   * @param requestId Request ID for tracing
   */
  public debug(message: string, metadata?: any, requestId?: string): void {
    this.log('DEBUG', message, metadata, requestId);
  }

  /**
   * Write a log entry
   * @param level Log level
   * @param message Message to log
   * @param metadata Additional metadata
   * @param requestId Request ID for tracing
   */
  private log(level: LogLevel, message: string, metadata?: any, requestId?: string): void {
    // Check if we should log this level
    if (!this.shouldLog(level)) {
      return;
    }

    const timestamp = new Date().toISOString();
    const logEntry: LogEntry = {
      timestamp,
      level,
      message,
      metadata,
      service: this.service,
      requestId
    };

    // Log to console with color coding
    const consoleMessage = `[${timestamp}] [${this.service}] ${level}: ${message}`;
    switch (level) {
    case 'ERROR':
      console.error(consoleMessage, metadata || '');
      break;
    case 'WARN':
      console.warn(consoleMessage, metadata || '');
      break;
    case 'INFO':
      console.info(consoleMessage, metadata || '');
      break;
    case 'DEBUG':
      console.debug(consoleMessage, metadata || '');
      break;
    }

    // Log to file
    const logLine = JSON.stringify(logEntry) + '\n';
    fs.appendFileSync(this.logFilePath, logLine);
  }

  /**
   * Determine if a log level should be logged based on the minimum level
   * @param level The level to check
   * @returns True if the level should be logged
   */
  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['DEBUG', 'INFO', 'WARN', 'ERROR'];
    const minLevelIndex = levels.indexOf(this.minLevel);
    const levelIndex = levels.indexOf(level);
    
    return levelIndex >= minLevelIndex;
  }

  /**
   * Create a child logger with a specific service name
   * @param service Service name
   * @returns New Logger instance
   */
  public child(service: string): Logger {
    return new Logger(this.logFilePath, this.minLevel, service);
  }
}