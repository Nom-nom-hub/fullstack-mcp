import { Request, Response, NextFunction } from 'express';
import { policyEngine } from '../index';
import { PolicyEvaluationContext } from '../models/Policy';

/**
 * Rate limiting middleware
 * @param req Request
 * @param res Response
 * @param next Next function
 */
export function rateLimitMiddleware(req: Request, res: Response, next: NextFunction): void {
  const context: PolicyEvaluationContext = {
    sessionId: req.headers['x-session-id'] as string || 'unknown',
    ipAddress: req.ip || 'unknown',
    resource: req.path,
    action: 'rateLimit',
    timestamp: new Date()
  };

  if (policyEngine.isActionAllowed(context)) {
    next();
  } else {
    res.status(429).json({ 
      error: 'Rate limit exceeded',
      message: 'Too many requests, please try again later'
    });
  }
}