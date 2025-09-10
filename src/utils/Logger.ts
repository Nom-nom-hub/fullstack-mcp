import fs from 'fs';
import path from 'path';

export class Logger {
  private logFilePath: string;

  constructor(logFilePath: string = './logs/mcp-server.log') {
    this.logFilePath = logFilePath;
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
   */
  public info(message: string, metadata?: any): void {
    this.log('INFO', message, metadata);
  }

  /**
   * Log a warning message
   * @param message Message to log
   * @param metadata Additional metadata
   */
  public warn(message: string, metadata?: any): void {
    this.log('WARN', message, metadata);
  }

  /**
   * Log an error message
   * @param message Message to log
   * @param metadata Additional metadata
   */
  public error(message: string, metadata?: any): void {
    this.log('ERROR', message, metadata);
  }

  /**
   * Log a debug message
   * @param message Message to log
   * @param metadata Additional metadata
   */
  public debug(message: string, metadata?: any): void {
    this.log('DEBUG', message, metadata);
  }

  /**
   * Write a log entry
   * @param level Log level
   * @param message Message to log
   * @param metadata Additional metadata
   */
  private log(level: string, message: string, metadata?: any): void {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      metadata
    };

    // Log to console
    console.log(`[${timestamp}] ${level}: ${message}`, metadata || '');

    // Log to file
    const logLine = JSON.stringify(logEntry) + '\n';
    fs.appendFileSync(this.logFilePath, logLine);
  }
}