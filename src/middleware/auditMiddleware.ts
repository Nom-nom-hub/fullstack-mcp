import { Request, Response, NextFunction } from 'express';
import { Logger } from '../utils/Logger';

const logger = new Logger('./logs/audit.log');

export class AuditMiddleware {
  /**
   * Audit log middleware
   * @param req Request
   * @param res Response
   * @param next Next function
   */
  public static auditLog(req: Request, res: Response, next: NextFunction): void {
    const startTime = Date.now();
    
    // Log request
    logger.info('Request received', {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      sessionId: req.headers['x-session-id'] || 'unknown'
    });
    
    // Capture response
    const originalSend = res.send;
    res.send = function(body: any) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Log response
      logger.info('Response sent', {
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        sessionId: req.headers['x-session-id'] || 'unknown'
      });
      
      return originalSend.call(this, body);
    };
    
    next();
  }
}